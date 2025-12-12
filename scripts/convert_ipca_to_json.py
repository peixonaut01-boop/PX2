"""
Script para converter dados do IPCA de Excel para JSON
Usado pelo frontend Next.js para visualizações
"""

import pandas as pd
import json
import os
import math
from datetime import datetime

# Paths
INPUT_PATH = r"C:\Users\Lucas\Desktop\reports PX\all data\IPCA\nucleos_ipca_completo.xlsx"
DIFUSAO_PATH = r"C:\Users\Lucas\Desktop\reports PX\all data\IPCA\difusao_IPCA.xlsx"
OUTPUT_DIR = r"C:\Users\Lucas\Desktop\PX2\frontend\public\data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ipca.json")


def clean_nan(obj):
    """Recursively replace NaN/Inf with None in nested structures"""
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(item) for item in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def format_date(date_val):
    """Convert date to ISO format string"""
    if pd.isna(date_val):
        return None
    if isinstance(date_val, str):
        return date_val
    try:
        return pd.Timestamp(date_val).strftime("%Y-%m-%d")
    except:
        return str(date_val)


def convert_excel_to_json():
    print(f"Converting {INPUT_PATH}...")
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Read all sheets
    xls = pd.ExcelFile(INPUT_PATH)
    
    output_data = {}
    
    sheet_mapping = {
        "mom": "MoM",
        "a12": "Acumulado_12m",
        "pesos": "Pesos"
    }
    
    for json_key, sheet_name in sheet_mapping.items():
        if sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            # Format date column
            if 'data_date' in df.columns:
                df['data_date'] = df['data_date'].apply(format_date)
            
            records = df.to_dict(orient='records')
            output_data[json_key] = records
            print(f"  - {sheet_name}: {len(records)} rows, {len(df.columns)} columns")
        else:
            print(f"  Warning: Sheet '{sheet_name}' not found")
    
    # Read diffusion data
    print(f"\nConverting diffusion data from {DIFUSAO_PATH}...")
    try:
        xls_difusao = pd.ExcelFile(DIFUSAO_PATH)
        
        # Difusão Bruta
        if 'Difusao_Bruta' in xls_difusao.sheet_names:
            df_bruta = pd.read_excel(xls_difusao, sheet_name='Difusao_Bruta')
            df_bruta['data_date'] = df_bruta['Data'].apply(format_date)
            df_bruta = df_bruta.drop(columns=['Data'])
            output_data['difusao_bruta'] = df_bruta.to_dict(orient='records')
            print(f"  - Difusao_Bruta: {len(df_bruta)} rows")
        
        # Difusão Dessazonalizada
        if 'Difusao_Dessazonalizada' in xls_difusao.sheet_names:
            df_dessaz = pd.read_excel(xls_difusao, sheet_name='Difusao_Dessazonalizada')
            df_dessaz['data_date'] = df_dessaz['Data'].apply(format_date)
            df_dessaz = df_dessaz.drop(columns=['Data'])
            output_data['difusao_dessaz'] = df_dessaz.to_dict(orient='records')
            print(f"  - Difusao_Dessazonalizada: {len(df_dessaz)} rows")
    except Exception as e:
        print(f"  Warning: Could not read diffusion data: {e}")
    
    # Add metadata
    output_data['metadata'] = {
        'indicator': 'IPCA',
        'description': 'Índice Nacional de Preços ao Consumidor Amplo - Inflação oficial do Brasil',
        'source': 'IBGE/Sidra',
        'last_updated': datetime.now().isoformat(),
        'frequency': 'monthly'
    }
    
    # Clean NaN values
    output_data = clean_nan(output_data)
    
    # Save JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Saved to {OUTPUT_FILE}")
    
    # Print summary
    if 'mom' in output_data and output_data['mom']:
        latest = output_data['mom'][-1]
        print(f"\nÚltimo dado: {latest.get('data_date', 'N/A')}")
        print(f"IPCA MoM: {latest.get('IPCA', 'N/A')}%")


if __name__ == "__main__":
    convert_excel_to_json()

