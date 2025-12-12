import pandas as pd
from seriesbr import bcb
import logging
from pathlib import Path
from tqdm import tqdm

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Output Configuration ---
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "bcb_catalog_from_api.parquet"

def search_and_build_catalog():
    """
    Uses the seriesbr library to search for all available BCB series and builds a catalog.
    """
    logging.info("Starting to build BCB series catalog using the 'seriesbr' API wrapper.")
    
    # The 'seriesbr' library does not have a "list all" function.
    # The most effective way to discover series is to search for them.
    # We can search for series that have a name containing a space, which is a proxy for "almost all series".
    # This is a documented way to get a large list of available series.
    try:
        logging.info("Searching for all series... this may take a moment.")
        # The search function returns a pandas DataFrame with metadata.
        all_series_df = bcb.search_series(' ')
        
        if all_series_df.empty:
            logging.error("The search returned no series. There might be an issue with the API or the library.")
            return

        logging.info(f"Successfully found {len(all_series_df)} series.")
        
        # The DataFrame columns are already well-named by the library.
        # Let's inspect them.
        logging.info(f"Columns returned by API: {all_series_df.columns.tolist()}")

        # Rename columns to a more standard format if needed, but the defaults are good.
        # Example: 'Código' -> 'series_id', 'Nome' -> 'name'
        all_series_df.rename(columns={
            'Código': 'series_id',
            'Nome': 'name',
            'Unidade de medida': 'unit',
            'Periodicidade': 'periodicity',
            'Data de início': 'start_date',
            'Data de fim': 'end_date',
            'Fonte': 'source'
        }, inplace=True)
        
        logging.info(f"Renamed columns to: {all_series_df.columns.tolist()}")

        # Save the catalog to a Parquet file
        OUTPUT_DIR.mkdir(exist_ok=True)
        all_series_df.to_parquet(OUTPUT_FILE, index=False)
        
        logging.info(f"BCB catalog successfully saved to {OUTPUT_FILE}")

    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        logging.error("This could be due to a change in the BCB API or a temporary network issue.")

if __name__ == "__main__":
    search_and_build_catalog()
