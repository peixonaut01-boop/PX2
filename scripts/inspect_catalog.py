import polars as pl
import pandas as pd
from pathlib import Path

# Define the path to the new CNT Excel file
file_path = Path(__file__).parent.parent / "data" / "raw" / "IBGE catalog" / "cnt.xlsx"

def inspect_examples(path: Path):
    """
    Reads the first 15 rows of the new CNT catalog file to understand its structure.
    """
    try:
        pd_df = pd.read_excel(path, nrows=15, sheet_name=0)
        df = pl.from_pandas(pd_df)

        print("File read successfully!")
        print("\n--- Analyzing New CNT Catalog File ---")

        # Print the DataFrame in a way that's less likely to crash terminals
        for row in df.to_dicts():
            print("-" * 50)
            for key, value in row.items():
                # Encode to utf-8 and ignore errors for safer printing
                printable_value = str(value).encode('utf-8', 'ignore').decode('utf-8')
                print(f"{key}: {printable_value}")

    except FileNotFoundError:
        print(f"Error: File not found at {path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    inspect_examples(file_path)
