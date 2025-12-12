import json
import datetime
import sys
import os
from urllib.request import urlopen, Request
from datetime import timedelta, timezone

# Define Brazil Timezone (UTC-3)
BRT = timezone(timedelta(hours=-3))

def get_brazil_date():
    return datetime.datetime.now(BRT).strftime("%Y-%m-%d")

def check_ibge_calendar_v2():
    today = get_brazil_date()
    # Check explicitly for today
    url = f"https://servicodados.ibge.gov.br/api/v3/calendario/?de={today}&ate={today}"
    
    output_path = os.environ.get("GITHUB_OUTPUT")
    
    try:
        # User-Agent header to avoid 403 blocks often used by govt APIs
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(req) as response:
            data = json.loads(response.read().decode())
            
        # Core indicators we want to track
        # PIM has "Brasil" and "Regional". We only want "Brasil" (or the main one).
        # PMC/PMS are usually just "Pesquisa Mensal de ...".
        # IPCA is "Índice Nacional...".
        
        target_indicators = [
            "Índice Nacional de Preços ao Consumidor Amplo", 
            "Pesquisa Industrial Mensal", 
            "Pesquisa Mensal de Comércio", 
            "Pesquisa Mensal de Serviços"
        ]
        
        # Terms to EXCLUDE to avoid false positives
        exclude_terms = [
            "Regional",
            "Anual",
            "Relatórios",
            "Metodológicos"
        ]

        items = data.get("items", [])
        should_run = False
        
        print(f"Checking IBGE releases for {today} (Sanitized)...")
        
        for item in items:
            title = item.get("titulo", "")
            
            # Check if it matches any target
            is_target = any(indicator in title for indicator in target_indicators)
            
            # Check if it contains any excluded terms
            is_excluded = any(term in title for term in exclude_terms)
            
            if is_target and not is_excluded:
                print(f"MATCH FOUND: {title}")
                should_run = True
            elif is_target and is_excluded:
                print(f"IGNORED (Excluded): {title}")
        
        # Write output
        if output_path:
            with open(output_path, "a") as f:
                f.write(f"should_run={str(should_run).lower()}\n")
        else:
             print(f"Local output: should_run={str(should_run).lower()}")

    except Exception as e:
        print(f"Error checking calendar: {e}")
        # FAIL-SAFE: If the API fails, we ASSUME we should run to be safe.
        # Better false positive (checking for data that isn't there) than false negative.
        print("FAIL-SAFE ACTIVATED: Triggering update.")
        if output_path:
             with open(output_path, "a") as f:
                f.write("should_run=true\n")
        else:
             print("Local output (FAIL-SAFE): should_run=true")

if __name__ == "__main__":
    check_ibge_calendar_v2()
