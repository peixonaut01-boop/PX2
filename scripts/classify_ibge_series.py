import polars as pl
import pandas as pd
from pathlib import Path
import re
import unicodedata

# --- Configuration ---
INPUT_FILE = Path(__file__).parent.parent / "data" / "raw" / "IBGE catalog" / "IBGE_series_catalog.xlsx"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "processed" / "classified_ibge_catalog.parquet"

# --- Keyword Dictionary for Classification ---
# We can expand this dictionary to make the classification more granular.
# The keys are the components of our alias, and the values are lists of regex patterns to search for.
ECONOMIC_KEYWORDS = {
    # Category: General Economic Area
    "INFLATION": [r'IPCA', r'INPC', r'preços', r'inflação'],
    "LABOR": [r'desocupada', r'desemprego', r'ocupada', r'emprego', r'rendimento', r'massa salarial', r'força de trabalho'],
    "ACTIVITY": [r'PIB', r'Produto Interno Bruto', r'produção', r'industrial', r'indústria', r'serviços', r'comércio', r'vendas', r'veículos'],
    "AGRICULTURE": [r'agrícola', r'agropecuária', r'safra', r'colheita', r'pecuária', r'lavoura'],
    "EXTERNAL": [r'exportação', r'importação', r'balança comercial', r'câmbio'],
    "FINANCIAL": [r'juros', r'crédito', r'financiamento', r'taxa de juros'],
    
    # Modifiers: Specifics within a category
    "HOUSING": [r'habitação', r'aluguel', r'imóveis'],
    "FOOD": [r'alimentos', r'bebidas'],
    "TRANSPORT": [r'transporte', r'combustíveis', r'gasolina'],
    "MANUFACTURING": [r'transformação'],
    "RETAIL": [r'varejista'],
    "SERVICES": [r'serviços'],
}

def normalize_text(text: str) -> str:
    """
    Cleans and normalizes text for keyword matching.
    - Converts to lowercase.
    - Removes accents.
    - Removes special characters.
    """
    if not isinstance(text, str):
        return ""
    # Remove accents
    nfkd_form = unicodedata.normalize('NFKD', text)
    text = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Lowercase and remove special characters
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return text

def generate_alias(row: dict) -> str:
    """
    Generates an 'economic_alias' based on keywords found in the series' text fields.
    """
    # Combine relevant text fields for a comprehensive search
    text_to_search = " ".join([
        str(row.get('label', '')),
        str(row.get('general_name', '')),
        str(row.get('dataset', ''))
    ])
    
    normalized_text = normalize_text(text_to_search)
    
    found_keywords = []
    
    # Search for each keyword in our dictionary
    for alias_part, patterns in ECONOMIC_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, normalized_text, re.IGNORECASE):
                found_keywords.append(alias_part)
                break # Move to the next alias part once one pattern is found
                
    if not found_keywords:
        return "UNCATEGORIZED"
        
    return "_".join(sorted(list(set(found_keywords))))

def process_catalog():
    """
    Main function to read, classify, and save the IBGE series catalog.
    """
    print("Starting IBGE series classification...")
    
    try:
        # Step 1: Read the Excel file robustly using pandas
        print(f"Reading Excel file from: {INPUT_FILE}")
        pd_df = pd.read_excel(INPUT_FILE, sheet_name=0)
        
        # Convert to Polars DataFrame
        df = pl.from_pandas(pd_df)
        print(f"Successfully read {df.shape[0]} rows and {df.shape[1]} columns.")

        # Step 2: Generate the economic alias for each row
        print("Generating economic aliases... (This may take a few minutes)")
        
        # Convert DataFrame to a list of dictionaries for row-by-row processing
        rows = df.to_dicts()
        aliases = [generate_alias(row) for row in rows]
        
        # Add the new aliases as a column in the DataFrame
        df = df.with_columns(pl.Series("economic_alias", aliases))

        # Step 3: Reorder columns to have the new alias first
        final_columns = ["economic_alias"] + [col for col in df.columns if col != "economic_alias"]
        df = df.select(final_columns)

        # Step 4: Save the result to a Parquet file
        print(f"Saving classified data to: {OUTPUT_FILE}")
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        df.write_parquet(OUTPUT_FILE)
        
        print("\nClassification complete!")
        print(f"Processed {df.shape[0]} series.")
        
        # Display a summary of the new categories
        print("\nTop 20 generated alias categories:")
        print(df['economic_alias'].value_counts().head(20))
        
    except FileNotFoundError:
        print(f"Error: Input file not found at {INPUT_FILE}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    process_catalog()
