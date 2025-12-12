import polars as pl
import pandas as pd
from pathlib import Path
import re
import unicodedata

# --- Configuration ---
INPUT_FILE = Path(__file__).parent.parent / "data" / "raw" / "IBGE catalog" / "IBGE_series_catalog.xlsx"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "processed" / "final_ibge_catalog.parquet"

# --- "Smart" Alias Generation Rules ---
# This dictionary contains the logic for parsing the series descriptions.
# We can easily add more rules here to make the generator even smarter.

ALIAS_RULES = {
    # 1. Core Economic Indicators (The main subject)
    "indicator": [
        'inpc', 'ipca', 'ipca-15', 'ipca-e', 'snipc',
        'pib', 'produto interno bruto',
        'pim-pf', 'producao industrial',
        'pmc', 'pesquisa mensal de comercio',
        'pms', 'pesquisa mensal de servicos',
        'pnad', 'pnad continua',
        'sinapi',
    ],
    
    # 2. Transformations (The nature of the data)
    "transform": {
        'mom': r'variação mensal',
        '3m': r'acumulada em 3 meses',
        '6m': r'acumulada em 6 meses',
        '12m': r'acumulada em 12 meses',
        'yoy': r'variação interanual',
        'ytd': r'acumulada no ano',
        'index': r'número-índice',
        'sa': r'com ajuste sazonal',
        'value': r'valor',
        'weight': r'peso mensal',
    },

    # 3. Locations (Brazilian states, regions, and major cities)
    "location": [
        'acre', 'alagoas', 'amapa', 'amazonas', 'bahia', 'ceara', 'distrito federal', 'espirito santo', 'goias', 'maranhao', 'mato grosso do sul', 'mato grosso', 'minas gerais', 'para', 'paraiba', 'parana', 'pernambuco', 'piaui', 'rio de janeiro', 'rio grande do norte', 'rio grande do sul', 'rondonia', 'roraima', 'santa catarina', 'sao paulo', 'sergipe', 'tocantins',
        'regiao norte', 'regiao nordeste', 'regiao sudeste', 'regiao sul', 'regiao centro-oeste',
        'belem', 'belo horizonte', 'brasilia', 'campo grande', 'curitiba', 'fortaleza', 'goiania', 'porto alegre', 'recife', 'rio branco', 'salvador', 'vitoria', 'brasil'
    ]
}

def slugify(text: str) -> str:
    """
    Normalizes a string, converting it to a URL-friendly "slug".
    Example: "São Paulo" -> "sao_paulo"
    """
    if not text:
        return ""
    text = normalize_text(text)
    text = re.sub(r'\s+', '_', text).strip('_')
    return text

def normalize_text(text: str) -> str:
    """
    Cleans text by lowercasing, removing accents, and stripping non-alphanumeric chars.
    """
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Remove accents
    nfkd_form = unicodedata.normalize('NFKD', str(text))
    text = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Keep only letters, numbers, and spaces
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return text

def generate_smart_alias(row: dict) -> str:
    """
    The core function that generates a descriptive alias by parsing the series' text.
    It follows a multi-stage process to extract and assemble components.
    """
    # If an alias already exists (from the user's manual input), keep it.
    if row.get('alias') and pd.notna(row.get('alias')):
        return row['alias']

    # Combine text fields for a comprehensive search context
    text_to_search = f"{row.get('label', '')} {row.get('general_name', '')}"
    normalized_text = normalize_text(text_to_search)

    # --- Component Extraction ---
    
    # 1. Extract Indicator
    indicator = ""
    # Search for the longest matching indicator first to avoid partial matches (e.g., "ipca-15" before "ipca")
    for ind in sorted(ALIAS_RULES["indicator"], key=len, reverse=True):
        if ind in normalized_text:
            indicator = slugify(ind)
            break

    # 2. Extract Transformation
    transform = ""
    for key, pattern in ALIAS_RULES["transform"].items():
        if re.search(pattern, normalized_text):
            transform = key
            break
            
    # 3. Extract Location
    location = ""
    for loc in sorted(ALIAS_RULES["location"], key=len, reverse=True):
        if loc in normalized_text:
            location = slugify(loc)
            break
            
    # 4. Extract Sub-item (This is often the most complex part)
    item = ""
    # Pattern: Look for a multi-digit number followed by a dot or hyphen, then capture the text.
    # This is a common pattern for sub-items in the IBGE data.
    match = re.search(r'\b\d{4,}[\.\-]\s*([a-z].*)', normalized_text)
    if match:
        # Clean up the captured item text
        item_text = match.group(1).strip()
        # Remove common boilerplate that might be left over
        item_text = re.sub(r'\s*casas decimais.*', '', item_text)
        item = slugify(item_text)

    # --- Alias Assembly ---
    alias_parts = [part for part in [indicator, transform, item, location] if part]
    
    if not alias_parts:
        return "UNCATEGORIZED"

    return "_".join(alias_parts)


def process_catalog():
    """
    Main function to read, classify, and save the IBGE series catalog.
    """
    print("Starting Smart Alias generation for IBGE series...")
    
    try:
        # Read the full Excel file
        print(f"Reading data from: {INPUT_FILE}")
        pd_df = pd.read_excel(INPUT_FILE, sheet_name=0)
        df = pl.from_pandas(pd_df)
        print(f"Successfully read {df.shape[0]} series.")

        # Generate aliases
        print("Generating aliases... (This will take a few minutes for the full dataset)")
        rows = df.to_dicts()
        aliases = [generate_smart_alias(row) for row in rows]
        
        # Replace the old 'alias' column with our newly generated ones
        df = df.with_columns(pl.Series("alias", aliases))

        # Reorder columns to have 'alias' first for easy review
        final_columns = ["alias"] + [col for col in df.columns if col != "alias"]
        df = df.select(final_columns)

        # Save the result to a new, efficient Parquet file
        print(f"Saving final catalog to: {OUTPUT_FILE}")
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        df.write_parquet(OUTPUT_FILE)
        
        print("\nAlias generation complete!")
        print(f"Processed {df.shape[0]} series.")
        
        # Display a sample of the generated aliases for review
        print("\n--- Sample of Generated Aliases ---")
        sample_df = df.filter(pl.col('alias') != "UNCATEGORIZED").sample(15)
        for row in sample_df.to_dicts():
            print(f"  - {row['alias']}")
        
        print("\n--- Summary of Transformations Found ---")
        print(df.filter(pl.col('alias') != "UNCATEGORIZED")['alias'].str.split('_').list.get(1).value_counts().head(10))

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    process_catalog()
