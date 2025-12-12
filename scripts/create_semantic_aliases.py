import polars as pl
import pandas as pd
from pathlib import Path
import re
import unicodedata

# --- Configuration ---
INPUT_FILE = Path(__file__).parent.parent / "data" / "raw" / "IBGE catalog" / "IBGE_series_catalog.xlsx"
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "processed" / "semantic_aliased_catalog.parquet"

# --- Semantic Parsing Rules ---
# These rules are designed to parse the structure of IBGE's 'general_name' column.
# The script will try to extract each component in a structured way.
SEMANTIC_RULES = {
    "indicator": [
        'INPC', 'IPCA', 'IPCA-15', 'IPCA-E', 'SNIPC',
        'PIB', 'Produto Interno Bruto',
        'PIM-PF', 'PIM', 'Produção Industrial',
        'PMC', 'Pesquisa Mensal de Comércio',
        'PMS', 'Pesquisa Mensal de Serviços',
        'PNAD', 'PNAD Contínua',
        'SINAPI',
    ],
    "metric": {
        'mom': r'Variação mensal',
        '3m': r'Variação acumulada em 3 meses',
        '6m': r'Variação acumulada em 6 meses',
        '12m': r'Variação acumulada em 12 meses',
        'yoy': r'Variação interanual',
        'ytd': r'Variação acumulada no ano',
        'index': r'Número-índice',
        'value': r'(?<!de )Valor(?!es)', # Avoids "Valores correntes"
        'weight': r'Peso mensal',
    },
    "seasonality": {
        'sa': r'com ajuste sazonal',
    },
    "location": [
        'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso do Sul', 'Mato Grosso', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins',
        'Região Norte', 'Região Nordeste', 'Região Sudeste', 'Região Sul', 'Região Centro-Oeste',
        'Belém', 'Belo Horizonte', 'Brasília', 'Campo Grande', 'Curitiba', 'Fortaleza', 'Goiânia', 'Porto Alegre', 'Recife', 'Rio Branco', 'Salvador', 'Vitória', 'Brasil'
    ]
}

def slugify(text: str) -> str:
    """Normalizes a string to a URL-friendly 'slug'."""
    if not text: return ""
    # First, normalize accents and case
    text = str(text).lower()
    nfkd_form = unicodedata.normalize('NFKD', text)
    text = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Replace spaces and special characters with underscores
    text = re.sub(r'[\s\W-]+', '_', text).strip('_')
    return text

def parse_general_name(name: str) -> dict:
    """
    Parses the 'general_name' string to extract semantic components.
    """
    if not isinstance(name, str):
        return {}

    components = {}
    remaining_text = name

    # --- Extraction Pipeline ---

    # 1. Indicator (case-sensitive for acronyms)
    # Sort by length to match longer names first (e.g., 'IPCA-15' before 'IPCA')
    for indicator_pattern in sorted(SEMANTIC_RULES["indicator"], key=len, reverse=True):
        if indicator_pattern in remaining_text:
            components['indicator'] = slugify(indicator_pattern)
            # Remove the found indicator to avoid re-matching
            remaining_text = remaining_text.replace(indicator_pattern, '', 1)
            break

    # 2. Metric
    for key, metric_pattern in SEMANTIC_RULES["metric"].items():
        match = re.search(metric_pattern, remaining_text, re.IGNORECASE)
        if match:
            components['metric'] = key
            remaining_text = remaining_text.replace(match.group(0), '', 1)
            break
    
    # 3. Seasonality
    for key, sa_pattern in SEMANTIC_RULES["seasonality"].items():
        match = re.search(sa_pattern, remaining_text, re.IGNORECASE)
        if match:
            components['seasonality'] = key
            remaining_text = remaining_text.replace(match.group(0), '', 1)
            break

    # 4. Location
    for loc_pattern in sorted(SEMANTIC_RULES["location"], key=len, reverse=True):
        if loc_pattern in remaining_text:
            components['location'] = slugify(loc_pattern)
            remaining_text = remaining_text.replace(loc_pattern, '', 1)
            break
            
    # 5. Sub-Item (what's left after removing everything else)
    # The sub-item is often what follows the '|' separator or a numerical code.
    # We clean the remaining text to get the item.
    item_text = remaining_text.split('|')[-1] # Take text after the last '|'
    item_text = re.sub(r'\b\d{4,}[\.\-]\s*', '', item_text) # Remove codes
    item_text = re.sub(r'\[.*?\]', '', item_text) # Remove date ranges in brackets
    item_text = re.sub(r'\(.*?\)', '', item_text) # Remove content in parentheses
    item_text = item_text.strip(' -')
    
    if item_text and len(item_text) > 2:
        components['item'] = slugify(item_text)
        
    return components


def create_alias_from_components(components: dict) -> str:
    """
    Assembles the final alias from the extracted components in a defined order.
    """
    # Define the desired order of components in the final alias
    order = ['indicator', 'metric', 'item', 'location', 'seasonality']
    
    alias_parts = [components.get(key) for key in order if components.get(key)]
    
    if not alias_parts:
        return "UNCATEGORIZED"
        
    return "_".join(alias_parts)

def process_catalog():
    """Main function to run the entire alias generation process."""
    print("Starting Semantic Alias generation...")
    
    try:
        pd_df = pd.read_excel(INPUT_FILE, sheet_name=0)
        df = pl.from_pandas(pd_df)
        print(f"Read {df.shape[0]} series from {INPUT_FILE}")

        new_aliases = []
        for row in df.to_dicts():
            # If the user already provided an alias, keep it.
            if row.get('alias') and pd.notna(row.get('alias')):
                new_aliases.append(row['alias'])
            else:
                # Otherwise, generate one from the 'general_name'.
                components = parse_general_name(row.get('general_name'))
                alias = create_alias_from_components(components)
                new_aliases.append(alias)
        
        # Replace the old alias column with the new, complete list of aliases
        df = df.with_columns(pl.Series("alias", new_aliases))

        # Save the result
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        df.write_parquet(OUTPUT_FILE)
        print(f"Processing complete. Saved new catalog to {OUTPUT_FILE}")

        # --- Display a meaningful sample for review ---
        print("\n--- Review of Generated Aliases ---")
        print("This sample shows the 'general_name' and the new alias created from it.\n")
        
        sample_to_review = df.filter(
            (pl.col('alias') != "UNCATEGORIZED") & 
            (pl.col('alias').str.contains('item')) # Focus on more complex aliases
        ).sample(n=10, seed=1).select(["general_name", "alias"])
        
        for row in sample_to_review.to_dicts():
            print(f"Original: {row['general_name']}")
            print(f"   Alias: {row['alias']}\n")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_catalog()
