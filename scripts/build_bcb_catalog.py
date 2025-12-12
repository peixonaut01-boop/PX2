import asyncio
import aiohttp
import pandas as pd
import polars as pl
from pathlib import Path
from datetime import datetime, timedelta
from tqdm.asyncio import tqdm_asyncio
import hashlib
import logging

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Script Configuration ---
SERIES_RANGE = range(1, 100001)  # Full range 1 to 100,000
CONCURRENT_REQUESTS = 50
REQUEST_TIMEOUT = 30
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "bcb_series_catalog.parquet"
TEMP_VALID_IDS_FILE = OUTPUT_DIR / "temp_valid_bcb_ids.csv"

# --- BCB URL Configuration ---
API_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados"
METADATA_BASE_URL = "https://www3.bcb.gov.br/sgspub/consultarmetadados/consultarMetadadosSeries.do?method=consultarMetadadosSeriesInternet&hdOidSerieSelecionada={}"

# --- Activeness Logic ---
# How many days back from today can the last data point be for a series to be "active"
ACTIVENESS_THRESHOLDS = {
    'Diária': 15,
    'Semanal': 30,
    'Mensal': 60,
    'Trimestral': 120,
    'Anual': 400,
}
DEFAULT_THRESHOLD = 365 * 2  # Default for unknown/special periodicities


def generate_px_code(series_id):
    """Generates a consistent px_code for a BCB series."""
    return f"PX_BCB_{series_id}"


async def ping_series(session, series_id):
    """Phase 1: Quickly checks if a series ID is valid."""
    url = API_BASE_URL.format(series_id) + "/ultimos/1?formato=json"
    try:
        async with session.get(url, timeout=5) as response:
            if response.status == 200:
                return series_id, 'standard'
            if response.status == 400:
                # This error indicates a daily series which requires a date range
                error_text = await response.text()
                if "periodicidade diária" in error_text:
                    return series_id, 'daily'
            return series_id, 'not_found'
    except (asyncio.TimeoutError, aiohttp.ClientError):
        return series_id, 'error'


async def process_series(session, series_id, series_type):
    """Phase 2: Scrapes metadata, checks activeness, and returns a full record."""
    # 1. Fetch Metadata
    metadata_url = METADATA_BASE_URL.format(series_id)
    try:
        async with session.get(metadata_url) as response:
            if response.status != 200:
                return None
            html_content = await response.text()
            # Use pandas to find tables in the HTML
            tables = pd.read_html(html_content)
            # Find the correct table (heuristic: look for the one with "Periodicidade")
            metadata_df = None
            for table in tables:
                if table[0].astype(str).str.contains('Periodicidade').any():
                    metadata_df = table
                    break
            
            if metadata_df is None:
                return None # Could not find the metadata table

            # Convert the key-value table into a dictionary
            metadata = dict(zip(metadata_df[0], metadata_df[1]))
            # Clean up keys by removing ':'
            metadata = {k.replace(':', '').strip(): v for k, v in metadata.items()}

    except Exception:
        return None # Failed to fetch or parse metadata

    # 2. Check Activeness
    last_date = None
    try:
        if series_type == 'standard':
            api_url = API_BASE_URL.format(series_id) + "/ultimos/1?formato=json"
            async with session.get(api_url) as response:
                data = await response.json()
                if data:
                    last_date = pd.to_datetime(data[0]['data'], dayfirst=True)
        
        elif series_type == 'daily':
            # Fetch last 30 days for daily series to find the last entry
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            api_url = API_BASE_URL.format(series_id) + f"?formato=json&dataInicial={start_date.strftime('%d/%m/%Y')}&dataFinal={end_date.strftime('%d/%m/%Y')}"
            async with session.get(api_url) as response:
                data = await response.json()
                if data:
                    last_date = pd.to_datetime(data[-1]['data'], dayfirst=True)

        if last_date is None:
            return None # No recent data found

        # Apply the activeness threshold
        periodicity = metadata.get('Periodicidade')
        threshold = ACTIVENESS_THRESHOLDS.get(periodicity, DEFAULT_THRESHOLD)
        if (datetime.now() - last_date).days > threshold:
            return None # Series is inactive

    except Exception:
        return None # Failed to fetch data to check activeness

    # 3. Construct the final record if active
    return {
        'series_id': series_id,
        'px_code': generate_px_code(series_id),
        'name': metadata.get('Nome'),
        'periodicity': periodicity,
        'unit': metadata.get('Unidade'),
        'source': metadata.get('Fonte'),
        'description': metadata.get('Comentário'),
        'last_update': last_date.strftime('%Y-%m-%d'),
        'api_url': API_BASE_URL.format(series_id) + "?formato=json",
    }


async def main():
    """Main orchestration function."""
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # --- Phase 1: Discover all valid series IDs ---
    logging.info(f"--- Starting Phase 1: Discovering valid series IDs in range {SERIES_RANGE.start}-{SERIES_RANGE.stop-1} ---")
    valid_series = []
    
    connector = aiohttp.TCPConnector(limit=CONCURRENT_REQUESTS)
    async with aiohttp.ClientSession(connector=connector) as session:
        pinger_tasks = [ping_series(session, i) for i in SERIES_RANGE]
        results = await tqdm_asyncio.gather(*pinger_tasks, desc="Pinging Series IDs")
        
        for series_id, status in results:
            if status in ['standard', 'daily']:
                valid_series.append({'id': series_id, 'type': status})

    if not valid_series:
        logging.error("No valid series found. Exiting.")
        return
        
    logging.info(f"--- Phase 1 Complete: Found {len(valid_series)} potentially valid series IDs. ---")

    # --- Phase 2: Process metadata and check activeness for valid series ---
    logging.info(f"--- Starting Phase 2: Fetching metadata and checking activeness for {len(valid_series)} series ---")
    active_series_records = []
    async with aiohttp.ClientSession(connector=connector) as session:
        processor_tasks = [process_series(session, s['id'], s['type']) for s in valid_series]
        results = await tqdm_asyncio.gather(*processor_tasks, desc="Processing Series")

        active_series_records = [r for r in results if r is not None]

    if not active_series_records:
        logging.error("No active series found after processing. Exiting.")
        return

    logging.info(f"--- Phase 2 Complete: Found {len(active_series_records)} active series. ---")

    # --- Final Step: Save to Parquet ---
    logging.info(f"Saving {len(active_series_records)} active series records to {OUTPUT_FILE}")
    final_df = pl.DataFrame(active_series_records)
    final_df.write_parquet(OUTPUT_FILE)
    logging.info("--- BCB Catalog Build Complete! ---")


if __name__ == "__main__":
    asyncio.run(main())
