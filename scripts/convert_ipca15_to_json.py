"""
Script para converter dados do IPCA-15 de Excel para JSON
Usado pelo frontend Next.js para visualizações
"""

import pandas as pd
import json
import os
import math
from datetime import datetime

# Paths
INPUT_PATH = r"C:\Users\Lucas\Desktop\reports PX\all data\IPCA 15\IPCA15_nucleos.xlsx"
DIFUSAO_PATH = r"C:\Users\Lucas\Desktop\reports PX\all data\IPCA 15\IPCA15_Difusao.xlsx"
OUTPUT_DIR = r"C:\Users\Lucas\Desktop\PX2\frontend\public\data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ipca15.json")


def clean_nan(obj):
    """Recursively replace NaN/Inf with None in nested structures"""
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan(item) for item in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj


def parse_date(date_str):
    """Convert 'novembro 2025' to ISO date format"""
    months_pt = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4,
        'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
        'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    }
    
    try:
        parts = str(date_str).strip().lower().split()
        if len(parts) == 2:
            month_name, year = parts
            month = months_pt.get(month_name)
            if month:
                return f"{year}-{month:02d}-15"  # Day 15 for IPCA-15
    except:
        pass
    return str(date_str)


def convert_excel_to_json():
    print(f"Converting {INPUT_PATH}...")
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Read all sheets
    xls = pd.ExcelFile(INPUT_PATH)
    
    output_data = {}
    
    sheet_mapping = {
        "mom": "MoM_nucleos",
        "a12": "A12_nucleos",
        "pesos": "Pesos_nucleos"
    }
    
    for json_key, sheet_name in sheet_mapping.items():
        if sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            # Rename 'data' column to 'data_date' for consistency
            if 'data' in df.columns:
                df['data_date'] = df['data'].apply(parse_date)
                df = df.drop(columns=['data'])
                # Move data_date to first position
                cols = ['data_date'] + [c for c in df.columns if c != 'data_date']
                df = df[cols]
            
            # Rename 'IPCA 15' to 'IPCA15' for easier JS access
            df.columns = [c.replace('IPCA 15', 'IPCA15') for c in df.columns]
            
            records = df.to_dict(orient='records')
            output_data[json_key] = records
            print(f"  - {sheet_name}: {len(records)} rows, {len(df.columns)} columns")
        else:
            print(f"  Warning: Sheet '{sheet_name}' not found")
    
    # Read diffusion data
    print(f"\nConverting diffusion data from {DIFUSAO_PATH}...")
    try:
        df_difusao = pd.read_excel(DIFUSAO_PATH)
        
        # Format date
        def format_date_iso(date_val):
            if pd.isna(date_val):
                return None
            try:
                return pd.Timestamp(date_val).strftime("%Y-%m-%d")
            except:
                return str(date_val)
        
        df_difusao['data_date'] = df_difusao['Data'].apply(format_date_iso)
        df_difusao = df_difusao.drop(columns=['Data'])
        
        # Rename columns for consistency
        df_difusao = df_difusao.rename(columns={
            'Difusao': 'Difusao_Mensal',
            'Media_Historica': 'Media_Historica'
        })
        
        output_data['difusao'] = df_difusao.to_dict(orient='records')
        print(f"  - Difusao: {len(df_difusao)} rows")
    except Exception as e:
        print(f"  Warning: Could not read diffusion data: {e}")
    
    # Add metadata
    output_data['metadata'] = {
        'indicator': 'IPCA-15',
        'description': 'Índice Nacional de Preços ao Consumidor Amplo 15 - Prévia da inflação',
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
        print(f"IPCA-15 MoM: {latest.get('IPCA15', 'N/A')}%")


if __name__ == "__main__":
    convert_excel_to_json()

