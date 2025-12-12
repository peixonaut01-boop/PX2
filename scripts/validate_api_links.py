import polars as pl
from pathlib import Path
import requests

# --- Configuration ---
MASTER_CATALOG_FILE = Path(__file__).parent.parent / "data" / "processed" / "master_series_catalog.parquet"
NUM_LINKS_TO_TEST = 5

def validate_links():
    """
    Reads the master catalog, finds some CNT series, and tests their generated API URLs.
    """
    print("--- Starting API Link Validation Process ---")
    
    try:
        # 1. Load the master catalog
        if not MASTER_CATALOG_FILE.exists():
            print(f"Error: Master catalog not found at {MASTER_CATALOG_FILE}")
            return
            
        df = pl.read_parquet(MASTER_CATALOG_FILE)
        print(f"Loaded {df.shape[0]} series from the master catalog.")

        # 2. Filter for CNT series that have an API URL
        cnt_df = df.filter(
            (pl.col("branch") == "CNT") & 
            (pl.col("api_url").is_not_null())
        )
        
        if cnt_df.height == 0:
            print("No CNT series with API URLs found in the catalog to test.")
            return

        # 3. Get a random sample of links to test
        sample_to_test = cnt_df.sample(n=min(NUM_LINKS_TO_TEST, cnt_df.height), seed=1)
        print(f"Found {cnt_df.height} CNT series. Testing {sample_to_test.height} random links...")

        # 4. Test each link
        for row in sample_to_test.to_dicts():
            alias = row['alias']
            url = row['api_url']
            
            print(f"\n--> Testing Alias: {alias}")
            print(f"    URL: {url}")
            
            try:
                # Add parameters to limit the data returned for a quick test
                test_url = f"{url}?periodo=ultimos(1)"
                response = requests.get(test_url, timeout=10)
                
                # Check the result
                if response.status_code == 200:
                    data = response.json()
                    if data and isinstance(data, list):
                        print(f"    Status: SUCCESS ({response.status_code})")
                        print(f"    Data Received: {len(data)} records. Sample: {data[0]}")
                    else:
                        print(f"    Status: SUCCESS but empty or invalid data returned.")
                else:
                    print(f"    Status: FAILED with status code {response.status_code}")
                    print(f"    Response: {response.text[:100]}")

            except requests.exceptions.RequestException as e:
                print(f"    Status: FAILED with connection error: {e}")

        print("\n--- Validation Complete ---")

    except Exception as e:
        print(f"An unexpected error occurred during validation: {e}")

if __name__ == "__main__":
    validate_links()
