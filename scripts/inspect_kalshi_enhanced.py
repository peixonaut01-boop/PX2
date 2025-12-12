"""
Enhanced script to inspect Kalshi prediction market pages.
Extracts structured data and attempts to find API endpoints.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
from typing import Dict, Optional, List


def fetch_kalshi_page(url: str) -> Optional[str]:
    """Fetch the HTML content of a Kalshi page."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching page: {e}")
        return None


def extract_structured_data(html: str) -> Dict:
    """Extract structured data from Kalshi HTML (hydrationData, market info)."""
    soup = BeautifulSoup(html, 'html.parser')
    
    market_info = {
        'ticker': None,
        'series_ticker': None,
        'title': None,
        'category': None,
        'target_datetime': None,
        'settlement_details': None,
        'contracts': []
    }
    
    # Look for hydrationData in script tags - it's in escaped JSON format
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string and 'hydrationData' in script.string:
            content = script.string
            
            # The data is in escaped JSON format, try to extract it
            # Pattern: "ticker":"KXGDP-26JAN30" (may be escaped as \"ticker\":\"...\")
            # Try multiple patterns to handle escaping
            
            # Try to extract the hydrationData JSON block
            # Look for the pattern: "hydrationData":{...}
            hydration_match = re.search(r'"hydrationData"\s*:\s*({.+?})(?=\s*}\s*\]\s*\)\s*\)|$)', content, re.DOTALL)
            
            if hydration_match:
                # Try to parse the JSON-like structure
                json_str = hydration_match.group(1)
                # The data might be double-escaped, try to unescape
                try:
                    # Try direct JSON parsing first
                    json_data = json.loads(json_str)
                    if 'market' in json_data and 'events' in json_data['market']:
                        events = json_data['market']['events']
                        if events and len(events) > 0:
                            event = events[0]
                            market_info['ticker'] = event.get('ticker')
                            market_info['series_ticker'] = event.get('series_ticker')
                            market_info['title'] = event.get('title')
                            market_info['category'] = event.get('category')
                            market_info['target_datetime'] = event.get('target_datetime')
                            market_info['settlement_details'] = event.get('settle_details')
                except:
                    # If direct parsing fails, use regex extraction
                    patterns = [
                        (r'"ticker"\s*:\s*"([^"]+)"', 'ticker'),
                        (r'\\"ticker\\"\s*:\s*\\"([^"]+)\\"', 'ticker'),
                        (r'"series_ticker"\s*:\s*"([^"]+)"', 'series_ticker'),
                        (r'\\"series_ticker\\"\s*:\s*\\"([^"]+)\\"', 'series_ticker'),
                        (r'"title"\s*:\s*"([^"]+)"', 'title'),
                        (r'\\"title\\"\s*:\s*\\"([^"]+)\\"', 'title'),
                        (r'"category"\s*:\s*"([^"]+)"', 'category'),
                        (r'\\"category\\"\s*:\s*\\"([^"]+)\\"', 'category'),
                        (r'"target_datetime"\s*:\s*"([^"]+)"', 'target_datetime'),
                        (r'\\"target_datetime\\"\s*:\s*\\"([^"]+)\\"', 'target_datetime'),
                        (r'"settle_details"\s*:\s*"([^"]+)"', 'settlement_details'),
                        (r'\\"settle_details\\"\s*:\s*\\"([^"]+)\\"', 'settlement_details'),
                    ]
                    
                    for pattern, key in patterns:
                        match = re.search(pattern, content)
                        if match and not market_info.get(key):
                            value = match.group(1)
                            # Clean up escaped characters
                            value = value.replace('\\"', '"').replace('\\\\', '\\')
                            market_info[key] = value
            else:
                # Fallback: use regex patterns directly on content
                patterns = [
                    (r'"ticker"\s*:\s*"([^"]+)"', 'ticker'),
                    (r'\\"ticker\\"\s*:\s*\\"([^"]+)\\"', 'ticker'),
                    (r'"series_ticker"\s*:\s*"([^"]+)"', 'series_ticker'),
                    (r'\\"series_ticker\\"\s*:\s*\\"([^"]+)\\"', 'series_ticker'),
                    (r'"title"\s*:\s*"([^"]+)"', 'title'),
                    (r'\\"title\\"\s*:\s*\\"([^"]+)\\"', 'title'),
                    (r'"category"\s*:\s*"([^"]+)"', 'category'),
                    (r'\\"category\\"\s*:\s*\\"([^"]+)\\"', 'category'),
                    (r'"target_datetime"\s*:\s*"([^"]+)"', 'target_datetime'),
                    (r'\\"target_datetime\\"\s*:\s*\\"([^"]+)\\"', 'target_datetime'),
                    (r'"settle_details"\s*:\s*"([^"]+)"', 'settlement_details'),
                    (r'\\"settle_details\\"\s*:\s*\\"([^"]+)\\"', 'settlement_details'),
                ]
                
                for pattern, key in patterns:
                    match = re.search(pattern, content)
                    if match and not market_info.get(key):
                        value = match.group(1)
                        # Clean up escaped characters
                        value = value.replace('\\"', '"').replace('\\\\', '\\')
                        market_info[key] = value
    
    # Extract title from meta tags
    title_tag = soup.find('title')
    if title_tag:
        title_text = title_tag.get_text(strip=True)
        # Remove "| Trade on Kalshi" suffix if present
        if '| Trade on Kalshi' in title_text:
            title_text = title_text.split('| Trade on Kalshi')[0].strip()
        if not market_info['title']:
            market_info['title'] = title_text
    
    # Extract description
    desc_tag = soup.find('meta', {'name': 'description'})
    description = desc_tag.get('content') if desc_tag else None
    
    return {
        'market_info': market_info,
        'description': description,
        'url': None  # Will be set by caller
    }


def try_kalshi_api(ticker: str) -> Optional[Dict]:
    """
    Try to access Kalshi API endpoints.
    Note: Kalshi may require authentication for API access.
    """
    api_endpoints = [
        f"https://api.kalshi.com/trade-api/v2/events/{ticker}",
        f"https://api.kalshi.com/trade-api/v2/events/{ticker}/series",
        f"https://api.kalshi.com/trade-api/v2/portfolio/positions",
    ]
    
    results = {}
    for endpoint in api_endpoints:
        try:
            # Most APIs require authentication, so this will likely fail
            response = requests.get(endpoint, timeout=5)
            if response.status_code == 200:
                results[endpoint] = response.json()
            else:
                results[endpoint] = f"Status: {response.status_code}"
        except Exception as e:
            results[endpoint] = f"Error: {str(e)}"
    
    return results if results else None


def print_summary(data: Dict, api_results: Optional[Dict] = None):
    """Print a formatted summary of the inspection."""
    print("=" * 80)
    print("KALSHI MARKET INSPECTION SUMMARY")
    print("=" * 80)
    
    market = data.get('market_info', {})
    
    print(f"\nMARKET INFORMATION:")
    print(f"  Title: {market.get('title', 'N/A')}")
    print(f"  Ticker: {market.get('ticker', 'N/A')}")
    print(f"  Series Ticker: {market.get('series_ticker', 'N/A')}")
    print(f"  Category: {market.get('category', 'N/A')}")
    print(f"  Target Date/Time: {market.get('target_datetime', 'N/A')}")
    
    if market.get('settlement_details'):
        settle = market['settlement_details'][:200]  # Truncate long text
        print(f"  Settlement Details: {settle}...")
    
    if data.get('description'):
        print(f"\nDESCRIPTION:")
        print(f"  {data['description']}")
    
    print(f"\nURL:")
    print(f"  {data.get('url', 'N/A')}")
    
    if api_results:
        print(f"\nAPI ENDPOINT TESTS:")
        for endpoint, result in api_results.items():
            print(f"  {endpoint}:")
            if isinstance(result, dict):
                print(f"    [OK] Success - Data available")
            else:
                print(f"    [FAIL] {result}")
    
    print("\n" + "=" * 80)
    print("NOTE: Market prices and contract details are loaded dynamically")
    print("via JavaScript after page load. To get live data, you would need:")
    print("1. Browser automation (Selenium/Playwright)")
    print("2. Kalshi API access (requires authentication)")
    print("3. Or inspect network requests in browser DevTools")
    print("=" * 80)


def main():
    """Main function to inspect Kalshi page."""
    url = "https://kalshi.com/markets/kxgdp/us-gdp-growth/kxgdp-26jan30"
    
    print(f"Inspecting Kalshi page: {url}\n")
    
    html = fetch_kalshi_page(url)
    if not html:
        print("[ERROR] Failed to fetch the page.")
        return
    
    print(f"[OK] Page fetched successfully ({len(html):,} characters)\n")
    print("Extracting structured data...\n")
    
    data = extract_structured_data(html)
    data['url'] = url
    
    # Try API endpoints if we have a ticker
    api_results = None
    ticker = data.get('market_info', {}).get('ticker')
    if ticker:
        print(f"Testing API endpoints for ticker: {ticker}...\n")
        api_results = try_kalshi_api(ticker)
    
    print_summary(data, api_results)
    
    # Save structured data
    output_file = "kalshi_market_summary.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            **data,
            'api_results': api_results,
            'scraped_at': datetime.now().isoformat()
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Structured data saved to: {output_file}")


if __name__ == "__main__":
    main()

