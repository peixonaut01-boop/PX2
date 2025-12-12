import json
import os
import glob
from datetime import datetime
import sys

# Define proper paths relative to script execution (root or scripts/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '../frontend/public/data')
FLASH_REPORT_PATH = os.path.join(DATA_DIR, 'flash_reports.json')

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, 'r') as f:
        return json.load(f)

def format_value(val):
    if val is None:
        return ""
    return f"{val:.2f}".replace('.', ',')

def get_month_name(date_str):
    # date_str: YYYY-MM-DD
    months = {
        '01': 'janeiro', '02': 'fevereiro', '03': 'março', '04': 'abril',
        '05': 'maio', '06': 'junho', '07': 'julho', '08': 'agosto',
        '09': 'setembro', '10': 'outubro', '11': 'novembro', '12': 'dezembro'
    }
    _, month, year = date_str.split('-')
    return f"{months.get(month, '')} de {year}"

def generate_ipca_report(data):
    if not data or 'mom' not in data:
        return None
    
    # Get latest entry
    latest = data['mom'][-1]
    date = latest['data_date']
    
    # Create report object
    report = {
        "id": f"ipca-{date}",
        "indicator": "IPCA",
        "reference_date": date,
        "headline": f"IPCA variou {format_value(latest.get('IPCA'))}% em {get_month_name(date)}",
        "metrics": {
            "mom": latest.get('IPCA'),
            "yoy": data['a12'][-1]['IPCA'] if 'a12' in data else None,
            "servicos": latest.get('Serviços'),
            "alimentacao": latest.get('Alimentação no domicílio'),
            "administrados": latest.get('Administrados')
        },
        "analysis": f"O IPCA de {get_month_name(date)} registrou variação de {format_value(latest.get('IPCA'))}%. Na composição, os preços administrados variaram {format_value(latest.get('Administrados'))}% e serviços {format_value(latest.get('Serviços'))}%.",
        "chart_data": [], # We will fill simplified chart data
        "link": "/indicators/ipca",
        "source_title": "Dados oficiais do IBGE (SIDRA)",
        "source_url": "https://sidra.ibge.gov.br/home/ipca",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Fill last 12 months for chart
    for item in data['mom'][-12:]:
        # Format date as 'mmm/yy'
        d = datetime.strptime(item['data_date'], '%Y-%m-%d')
        report['chart_data'].append({
            "date": d.strftime('%b/%y').lower(),
            "value": item['IPCA']
        })
        
    return report

def generate_pmc_report(data):
    if not data or 'mom' not in data:
        return None
        
    latest = data['mom'][-1]
    date = latest['data_date']
    
    # Check yoy if exists matching date
    yoy_val = None
    if 'yoy' in data:
        for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('PMC NSA')
                break

    report = {
        "id": f"pmc-{date}",
        "indicator": "PMC",
        "reference_date": date,
        "headline": f"Varejo (PMC) variou {format_value(latest.get('PMC SA'))}% em {get_month_name(date)}",
        "metrics": {
            "mom": latest.get('PMC SA'),
            "mom_ampliado": latest.get('PMCA SA'),
            "yoy": yoy_val
        },
        "analysis": f"O volume de vendas do varejo variou {format_value(latest.get('PMC SA'))}% em {get_month_name(date)}. O varejo ampliado registrou {format_value(latest.get('PMCA SA'))}%.",
        "chart_data": [],
        "link": "/indicators/pmc",
        "source_title": "Dados oficiais do IBGE (SIDRA)",
        "source_url": "https://sidra.ibge.gov.br/home/pmc",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    for item in data['mom'][-12:]:
         d = datetime.strptime(item['data_date'], '%Y-%m-%d')
         report['chart_data'].append({
            "date": d.strftime('%b/%y').lower(),
            "value": item['PMC SA']
        })
         
    return report

def generate_pms_report(data):
    if not data or 'mom' not in data:
        return None
        
    latest = data['mom'][-1]
    date = latest['data_date']
    
    yoy_val = None
    if 'yoy' in data:
        for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('Total')
                break

    report = {
        "id": f"pms-{date}",
        "indicator": "PMS",
        "reference_date": date,
        "headline": f"Setor de Serviços variou {format_value(latest.get('Total'))}% em {get_month_name(date)}",
        "metrics": {
            "mom": latest.get('Total'),
            "yoy": yoy_val,
            "familias": latest.get('1. Serviços prestados às famílias')
        },
        "analysis": f"O volume de serviços variou {format_value(latest.get('Total'))}% em {get_month_name(date)}. Os serviços prestados às famílias registraram {format_value(latest.get('1. Serviços prestados às famílias'))}%.",
        "chart_data": [],
        "link": "/indicators/pms",
        "source_title": "Dados oficiais do IBGE (SIDRA)",
        "source_url": "https://sidra.ibge.gov.br/home/pms",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    for item in data['mom'][-12:]:
         d = datetime.strptime(item['data_date'], '%Y-%m-%d')
         report['chart_data'].append({
            "date": d.strftime('%b/%y').lower(),
            "value": item['Total']
        })
         
    return report

def generate_pim_report(data):
    if not data or 'mom' not in data:
        return None
        
    latest = data['mom'][-1]
    date = latest['data_date']
    
    yoy_val = None
    if 'yoy' in data:
         for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('1 Indústria geral')
                break

    report = {
        "id": f"pim-{date}",
        "indicator": "PIM",
        "reference_date": date,
        "headline": f"Produção Industrial variou {format_value(latest.get('1 Indústria geral'))}% em {get_month_name(date)}",
        "metrics": {
            "mom": latest.get('1 Indústria geral'),
            "yoy": yoy_val,
            "extrativas": latest.get('2 Indústrias extrativas'),
            "transformacao": latest.get('3 Indústrias de transformação')
        },
         "analysis": f"A produção industrial variou {format_value(latest.get('1 Indústria geral'))}% em {get_month_name(date)}. A indústria extrativa variou {format_value(latest.get('2 Indústrias extrativas'))}%, enquanto a de transformação registrou {format_value(latest.get('3 Indústrias de transformação'))}%.",
        "chart_data": [],
        "link": "/indicators/pim",
        "source_title": "Dados oficiais do IBGE (SIDRA)",
        "source_url": "https://sidra.ibge.gov.br/home/pim",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    for item in data['mom'][-12:]:
         d = datetime.strptime(item['data_date'], '%Y-%m-%d')
         report['chart_data'].append({
            "date": d.strftime('%b/%y').lower(),
            "value": item['1 Indústria geral']
        })
         
    return report

def update_flash_reports():
    print("Generating Flash Reports...")
    
    # Load existing to keep history or just rebuild headers? 
    # Current file has a list. We should update/replace the entry for the indicator.
    
    if os.path.exists(FLASH_REPORT_PATH):
        with open(FLASH_REPORT_PATH, 'r') as f:
            current_data = json.load(f)
    else:
        current_data = {"metadata": {}, "reports": []}
        
    reports_map = {r['indicator']: r for r in current_data.get('reports', [])}
    
    # Process each indicator
    ipca = load_json('ipca.json')
    if ipca:
        rep = generate_ipca_report(ipca)
        if rep: reports_map['IPCA'] = rep
        
    pmc = load_json('pmc.json')
    if pmc:
        rep = generate_pmc_report(pmc)
        if rep: reports_map['PMC'] = rep
        
    pms = load_json('pms.json')
    if pms:
         rep = generate_pms_report(pms)
         if rep: reports_map['PMS'] = rep

    pim = load_json('pim.json')
    if pim:
        rep = generate_pim_report(pim)
        if rep: reports_map['PIM'] = rep
        
    # Reconstruct list
    final_reports = list(reports_map.values())
    
    # Sort by reference date descending
    final_reports.sort(key=lambda x: x['reference_date'], reverse=True)
    
    output = {
        "metadata": {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "report_count": len(final_reports)
        },
        "reports": final_reports
    }
    
    with open(FLASH_REPORT_PATH, 'w') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        
    print(f"Flash reports updated at {FLASH_REPORT_PATH}")

if __name__ == "__main__":
    update_flash_reports()
