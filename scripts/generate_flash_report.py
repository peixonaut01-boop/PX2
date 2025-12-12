import json
import os
import glob
from datetime import datetime
import sys
import urllib.request
import urllib.error
import math

# Define proper paths relative to script execution (root or scripts/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '../frontend/public/data')
FLASH_REPORT_PATH = os.path.join(DATA_DIR, 'flash_reports.json')

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, 'r') as f:
        return json.load(f)

def format_value(val):
    if val is None: return ""
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

def clean_float(val):
    if val is None or val == "": return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f): return None
        return f
    except:
        return None

# ==================================================================================
# LLM GENERATION
# ==================================================================================

def call_groq_llm(indicator, context_str):
    """
    Calls Groq API to generate headline and analysis.
    Returns dict: {'headline': str, 'analysis': str} or None on failure.
    """
    if not GROQ_API_KEY:
        print("Warning: GROQ_API_KEY not found. Using template fallback.")
        return None

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    system_prompt = (
        "Você é um Economista Sênior (Senior Market Analyst) da PX Economics. "
        "Sua função é escrever relatórios 'Flash' curtos e impactantes sobre indicadores econômicos do Brasil. "
        "O tone deve ser profissional, direto e analítico (estilo Bloomberg/Valor Econômico). "
        "EVITE: clichês, robótica, ou excesso de adjetivos. Foque nos números e no 'driver' do resultado."
    )
    
    user_prompt = f"""
    Dados do indicador: {indicator}
    
    CONTEXTO DOS DADOS (JSON):
    {context_str}
    
    TAREFA:
    Gere um JSON com dois campos:
    1. "headline": Um título curto (max 10 palavras) e impactante. Ex: "Varejo recua 0,5% puxado por hipermercados".
    2. "analysis": Um parágrafo único (max 3 frases) analisando o resultado. Cite os principais ofensores/contribuidores.
    
    Responda APENAS o JSON válido.
    """
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 300,
        "response_format": {"type": "json_object"}
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
        )
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            content = result['choices'][0]['message']['content']
            return json.loads(content)
            
    except Exception as e:
        print(f"LLM Generation Failed for {indicator}: {e}")
        return None

# ==================================================================================
# REPORT GENERATORS
# ==================================================================================

def generate_ipca_report(data):
    if not data or 'mom' not in data: return None
    latest = data['mom'][-1]
    date = latest['data_date']
    
    # Context for LLM
    context = {
        "date": date,
        "indicator": "IPCA",
        "monthly_change": latest.get('IPCA'),
        "yoy_change": data['a12'][-1]['IPCA'] if 'a12' in data else None,
        "groups": {
            "Alimentação": latest.get('Alimentação no domicílio'),
            "Industrializados": latest.get('Industrializados'),
            "Serviços": latest.get('Serviços'),
            "Administrados": latest.get('Administrados'),
            "Livres": latest.get('Livres')
        },
        "nucleos": {
            "EX3": latest.get('EX3'),
            "MS": latest.get('MS')
        }
    }
    
    llm_result = call_groq_llm("IPCA", json.dumps(context, ensure_ascii=False))
    
    # Fallback Strings
    headline = f"IPCA variou {format_value(latest.get('IPCA'))}% em {get_month_name(date)}"
    analysis = f"O IPCA de {get_month_name(date)} registrou variação de {format_value(latest.get('IPCA'))}%. Na composição, os preços administrados variaram {format_value(latest.get('Administrados'))}% e serviços {format_value(latest.get('Serviços'))}%."
    
    if llm_result:
        headline = llm_result.get('headline', headline)
        analysis = llm_result.get('analysis', analysis)
    
    report = {
        "id": f"ipca-{date}",
        "indicator": "IPCA",
        "reference_date": date,
        "headline": headline,
        "metrics": {
            "mom": clean_float(latest.get('IPCA')),
            "yoy": clean_float(data['a12'][-1]['IPCA']) if 'a12' in data else None,
            "servicos": clean_float(latest.get('Serviços')),
            "alimentacao": clean_float(latest.get('Alimentação no domicílio')),
            "ex3": clean_float(latest.get('EX3')),
            "administrados": clean_float(latest.get('Administrados'))
        },
        "analysis": analysis,
        "chart_data": [],
        "link": "/indicators/ipca",
        "source_title": "Dados oficiais do IBGE (SIDRA)",
        "source_url": "https://sidra.ibge.gov.br/home/ipca",
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
    
    for item in data['mom'][-12:]:
        d = datetime.strptime(item['data_date'], '%Y-%m-%d')
        report['chart_data'].append({
            "date": d.strftime('%b/%y').lower(),
            "value": clean_float(item['IPCA'])
        })
    return report

def generate_pmc_report(data):
    if not data or 'mom' not in data: return None
    latest = data['mom'][-1]
    date = latest['data_date']
    
    yoy_val = None
    if 'yoy' in data:
        for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('PMC NSA')
                break

    # Context for LLM
    context = {
        "date": date,
        "indicator": "Varejo (PMC)",
        "monthly_restricted": latest.get('PMC SA'),
        "monthly_expanded": latest.get('PMCA SA'),
        "sectors": {
            "Supermercados": latest.get('Hipermercados, supermercados, produtos alimentícios, bebidas e fumo'),
            "Moveis_Eletro": latest.get('Móveis e eletrodomésticos'),
            "Combustiveis": latest.get('Combustíveis e lubrificantes'),
            "Vestuario": latest.get('Tecidos, vestuário e calçados'),
            "Veiculos": latest.get('Veículos, motocicletas, partes e peças')
        }
    }
    
    llm_result = call_groq_llm("PMC (Varejo)", json.dumps(context, ensure_ascii=False))

    headline = f"Varejo (PMC) variou {format_value(latest.get('PMC SA'))}% em {get_month_name(date)}"
    analysis = f"O volume de vendas do varejo variou {format_value(latest.get('PMC SA'))}% em {get_month_name(date)}. O varejo ampliado registrou {format_value(latest.get('PMCA SA'))}%."

    if llm_result:
        headline = llm_result.get('headline', headline)
        analysis = llm_result.get('analysis', analysis)

    report = {
        "id": f"pmc-{date}",
        "indicator": "PMC",
        "reference_date": date,
        "headline": headline,
        "metrics": {
            "mom": clean_float(latest.get('PMC SA')),
            "mom_ampliado": clean_float(latest.get('PMCA SA')),
            "yoy": clean_float(yoy_val)
        },
        "analysis": analysis,
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
            "value": clean_float(item['PMC SA'])
        })
    return report

def generate_pms_report(data):
    if not data or 'mom' not in data: return None
    latest = data['mom'][-1]
    date = latest['data_date']
    
    yoy_val = None
    if 'yoy' in data:
        for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('Total')
                break

    context = {
        "date": date,
        "indicator": "Serviços (PMS)",
        "monthly_total": latest.get('Total'),
        "sectors": {
            "Familias": latest.get('1. Serviços prestados às famílias'),
            "Informacao": latest.get('2. Serviços de informação e comunicação'),
            "Profissionais": latest.get('3. Serviços profissionais, administrativos e complementares'),
            "Transportes": latest.get('4. Transportes, serviços auxiliares aos transportes e correio'),
            "Outros": latest.get('5. Outros serviços')
        }
    }
    
    llm_result = call_groq_llm("PMS (Serviços)", json.dumps(context, ensure_ascii=False))

    headline = f"Setor de Serviços variou {format_value(latest.get('Total'))}% em {get_month_name(date)}"
    analysis = f"O volume de serviços variou {format_value(latest.get('Total'))}% em {get_month_name(date)}. Os serviços prestados às famílias registraram {format_value(latest.get('1. Serviços prestados às famílias'))}%."

    if llm_result:
        headline = llm_result.get('headline', headline)
        analysis = llm_result.get('analysis', analysis)

    report = {
        "id": f"pms-{date}",
        "indicator": "PMS",
        "reference_date": date,
        "headline": headline,
        "metrics": {
            "mom": clean_float(latest.get('Total')),
            "yoy": clean_float(yoy_val),
            "familias": clean_float(latest.get('1. Serviços prestados às famílias'))
        },
        "analysis": analysis,
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
            "value": clean_float(item['Total'])
        })
    return report

def generate_pim_report(data):
    if not data or 'mom' not in data: return None
    latest = data['mom'][-1]
    date = latest['data_date']
    
    yoy_val = None
    if 'yoy' in data:
         for y in data['yoy']:
            if y['data_date'] == date:
                yoy_val = y.get('1 Indústria geral')
                break

    context = {
        "date": date,
        "indicator": "PIM (Indústria)",
        "monthly_total": latest.get('1 Indústria geral'),
        "sectors": {
            "Extrativa": latest.get('2 Indústrias extrativas'),
            "Transformacao": latest.get('3 Indústrias de transformação'),
            "Bens_Capital": latest.get('Bens de capital'),
            "Bens_Intermediarios": latest.get('Bens intermediários'),
            "Bens_Consumo": latest.get('Bens de consumo')
        }
    }
    
    llm_result = call_groq_llm("PIM (Indústria)", json.dumps(context, ensure_ascii=False))

    headline = f"Produção Industrial variou {format_value(latest.get('1 Indústria geral'))}% em {get_month_name(date)}"
    analysis = f"A produção industrial variou {format_value(latest.get('1 Indústria geral'))}% em {get_month_name(date)}. A indústria extrativa variou {format_value(latest.get('2 Indústrias extrativas'))}%, enquanto a de transformação registrou {format_value(latest.get('3 Indústrias de transformação'))}%."

    if llm_result:
        headline = llm_result.get('headline', headline)
        analysis = llm_result.get('analysis', analysis)

    report = {
        "id": f"pim-{date}",
        "indicator": "PIM",
        "reference_date": date,
        "headline": headline,
        "metrics": {
            "mom": clean_float(latest.get('1 Indústria geral')),
            "yoy": clean_float(yoy_val),
            "extrativas": clean_float(latest.get('2 Indústrias extrativas')),
            "transformacao": clean_float(latest.get('3 Indústrias de transformação'))
        },
         "analysis": analysis,
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
            "value": clean_float(item['1 Indústria geral'])
        })
    return report

def update_flash_reports():
    print("Generating Flash Reports with AI Enhanced Analysis...")
    
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
