import asyncio
import aiohttp
import pandas as pd
import polars as pl
from pathlib import Path
from datetime import datetime, timedelta
from tqdm import tqdm
import logging
import json

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Script Configuration ---
SERIES_RANGE = range(1, 100001)
CONCURRENT_REQUESTS = 50
REQUEST_TIMEOUT = 15
BATCH_SIZE = 2000  # Process in smaller chunks
MAX_RETRIES = 2
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "bcb_series_catalog.parquet"
PROGRESS_FILE = OUTPUT_DIR / "temp_bcb_discovery_progress.json"

# --- BCB URL Configuration ---
API_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados"
METADATA_BASE_URL = "https://www3.bcb.gov.br/sgspub/consultarmetadados/consultarMetadadosSeries.do?method=consultarMetadadosSeriesInternet&hdOidSerieSelecionada={}"

# --- Activeness Logic ---
ACTIVENESS_THRESHOLDS = {
    'Diária': 15, 'Semanal': 30, 'Mensal': 60,
    'Trimestral': 120, 'Anual': 400,
}
DEFAULT_THRESHOLD = 365 * 2

def generate_px_code(series_id):
    return f"PX_BCB_{series_id}"

async def ping_series_with_retry(session, series_id):
    """Robustly checks if a series ID is valid with retries."""
    url = API_BASE_URL.format(series_id) + "/ultimos/1?formato=json"
    for attempt in range(MAX_RETRIES + 1):
        try:
            async with session.get(url, timeout=5) as response:
                if response.status == 200:
                    return series_id, 'standard'
                if response.status == 404:
                    return series_id, 'not_found'
                if response.status == 400:
                    error_text = await response.text()
                    if "periodicidade diária" in error_text:
                        return series_id, 'daily'
                # For other statuses (e.g., 503 Service Unavailable), we retry
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(1 + attempt) # Exponential backoff
                    continue
                return series_id, f'error_{response.status}'

        except (asyncio.TimeoutError, aiohttp.ClientError):
            if attempt < MAX_RETRIES:
                await asyncio.sleep(1 + attempt)
                continue
            return series_id, 'error_timeout'
    return series_id, 'not_found' # Default after all retries fail


async def process_series(session, series_id, series_type):
    """
    Scrapes metadata using a two-step iframe-aware process, 
    checks activeness, and returns a full record.
    """
    # 1. Fetch Metadata using a two-step process for iframes
    metadata = {}
    try:
        # Step 1: Hit the container URL to initialize the session for the series ID
        container_url = METADATA_BASE_URL.format(series_id)
        async with session.get(container_url) as response:
            if response.status != 200:
                logging.warning(f"[{series_id}] Failed to initialize session at container URL. Status: {response.status}")
                return None

        # Step 2: Hit the iframe content URL using the same session
        iframe_url = "https://www3.bcb.gov.br/sgspub/JSP/consultarmetadados/cmiDadosBasicos.jsp"
        async with session.get(iframe_url) as response:
            if response.status != 200:
                logging.warning(f"[{series_id}] Failed to fetch iframe content. Status: {response.status}")
                return None
            
            html_content = await response.text()
            tables = pd.read_html(html_content)
            # Heuristic to find the correct table: it's the one with two columns.
            metadata_df = next((tbl for tbl in tables if tbl.shape[1] == 2 and tbl[0].astype(str).str.contains('Periodicidade').any()), None)
            
            if metadata_df is None:
                logging.warning(f"[{series_id}] Could not find a valid metadata table in iframe content.")
                return None

            metadata = {k.replace(':', '').strip(): v for k, v in zip(metadata_df[0], metadata_df[1])}
            
    except Exception as e:
        logging.error(f"[{series_id}] Exception during metadata parsing: {e}")
        return None

    # 2. Check Activeness (this logic should now work with correct metadata)
    last_date = None
    try:
        api_url = ""
        if series_type == 'standard':
            api_url = API_BASE_URL.format(series_id) + "/ultimos/1?formato=json"
            async with session.get(api_url) as response:
                data = await response.json()
                if data: last_date = pd.to_datetime(data[0]['data'], dayfirst=True)
        
        elif series_type == 'daily':
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            api_url = API_BASE_URL.format(series_id) + f"?formato=json&dataInicial={start_date.strftime('%d/%m/%Y')}&dataFinal={end_date.strftime('%d/%m/%Y')}"
            async with session.get(api_url) as response:
                data = await response.json()
                if data: last_date = pd.to_datetime(data[-1]['data'], dayfirst=True)

        if last_date is None: return None

        periodicity = metadata.get('Periodicidade')
        threshold = ACTIVENESS_THRESHOLDS.get(periodicity, DEFAULT_THRESHOLD)
        if (datetime.now() - last_date).days > threshold: return None

    except Exception:
        return None

    # 3. Construct the final record
    return {
        'series_id': series_id, 'px_code': generate_px_code(series_id),
        'name': metadata.get('Nome'), 'periodicity': periodicity,
        'unit': metadata.get('Unidade'), 'source': metadata.get('Fonte'),
        'description': metadata.get('Comentário'),
        'last_update': last_date.strftime('%Y-%m-%d'),
        'api_url': API_BASE_URL.format(series_id) + "?formato=json",
    }


def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_progress(data):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(data, f)

async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # --- Phase 1: Robust Discovery in Batches ---
    all_valid_series = load_progress()
    found_ids = {s['id'] for s in all_valid_series}
    logging.info(f"Loaded {len(all_valid_series)} valid series from previous run.")

    series_to_check = [i for i in SERIES_RANGE if i not in found_ids]
    
    if not series_to_check:
        logging.info("All series have been checked previously.")
    else:
        logging.info(f"--- Starting Phase 1: Discovering {len(series_to_check)} new series IDs ---")
        
        connector = aiohttp.TCPConnector(limit=CONCURRENT_REQUESTS)
        async with aiohttp.ClientSession(connector=connector) as session:
            for i in tqdm(range(0, len(series_to_check), BATCH_SIZE), desc="Pinging Batches"):
                batch_ids = series_to_check[i:i+BATCH_SIZE]
                tasks = [ping_series_with_retry(session, series_id) for series_id in batch_ids]
                results = await asyncio.gather(*tasks)
                
                for series_id, status in results:
                    if status in ['standard', 'daily']:
                        all_valid_series.append({'id': series_id, 'type': status})
                
                save_progress(all_valid_series)
                logging.info(f"Batch complete. Total valid series found so far: {len(all_valid_series)}")

    if not all_valid_series:
        logging.error("No valid series found after robust discovery. Exiting.")
        return

    # --- Phase 2: Process Metadata ---
    logging.info(f"--- Starting Phase 2: Processing metadata for {len(all_valid_series)} series ---")
    active_series_records = []
    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=CONCURRENT_REQUESTS)) as session:
        tasks = [process_series(session, s['id'], s['type']) for s in all_valid_series]
        results = []
        for task in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Processing Series"):
            results.append(await task)
        
        active_series_records = [r for r in results if r is not None]

    if not active_series_records:
        logging.error("No active series found after processing. Exiting.")
    else:
        logging.info(f"--- Phase 2 Complete: Found {len(active_series_records)} active series. ---")
        logging.info(f"Saving {len(active_series_records)} active series records to {OUTPUT_FILE}")
        final_df = pl.DataFrame(active_series_records)
        final_df.write_parquet(OUTPUT_FILE)
        logging.info("--- BCB Catalog Build Complete! ---")
    
    # Clean up progress file
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Script interrupted by user. Progress has been saved.")
