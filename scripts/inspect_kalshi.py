"""
Script to inspect Kalshi prediction market pages and extract market data.
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import Dict, List, Optional
import re


def fetch_kalshi_page(url: str) -> Optional[str]:
    """
    Fetch the HTML content of a Kalshi page.
    
    Args:
        url: The Kalshi market page URL
        
    Returns:
        HTML content as string, or None if failed
    """
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


def extract_market_data(html: str, url: str) -> Dict:
    """
    Extract market data from Kalshi HTML page.
    
    Args:
        html: HTML content of the page
        url: Original URL for reference
        
    Returns:
        Dictionary with extracted market data
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    market_data = {
        'url': url,
        'scraped_at': datetime.now().isoformat(),
        'title': None,
        'event_description': None,
        'settlement_date': None,
        'contracts': [],
        'raw_html_snippets': {}
    }
    
    # Extract title
    title_tag = soup.find('title')
    if title_tag:
        market_data['title'] = title_tag.get_text(strip=True)
    
    # Try to find h1 or main heading
    h1_tag = soup.find('h1')
    if h1_tag:
        market_data['event_description'] = h1_tag.get_text(strip=True)
    
    # Look for JSON-LD structured data (common in modern websites)
    json_ld_scripts = soup.find_all('script', type='application/ld+json')
    for script in json_ld_scripts:
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                market_data['raw_html_snippets']['json_ld'] = data
        except:
            pass
    
    # Look for any script tags that might contain market data
    scripts = soup.find_all('script')
    for script in scripts:
        if script.string:
            # Look for common patterns in JavaScript data
            content = script.string
            # Check for React/Vue component data
            if '__NEXT_DATA__' in content or 'window.__INITIAL_STATE__' in content:
                try:
                    # Try to extract JSON from script
                    json_match = re.search(r'({.*})', content, re.DOTALL)
                    if json_match:
                        market_data['raw_html_snippets']['app_data'] = json_match.group(1)[:2000]  # Limit size
                except:
                    pass
    
    # Extract text content for manual inspection
    main_content = soup.find('main') or soup.find('div', class_=re.compile('main|content|market'))
    if main_content:
        market_data['raw_html_snippets']['main_content_preview'] = main_content.get_text(strip=True)[:1000]
    
    # Look for price/contract information
    # Common patterns: prices, percentages, contract names
    price_elements = soup.find_all(text=re.compile(r'\$?\d+\.?\d*'))
    market_data['raw_html_snippets']['price_like_texts'] = list(set([t.strip() for t in price_elements if t.strip()]))[:50]
    
    return market_data


def print_market_summary(data: Dict):
    """
    Print a formatted summary of the market data.
    
    Args:
        data: Market data dictionary
    """
    print("=" * 80)
    print("KALSHI MARKET INSPECTION REPORT")
    print("=" * 80)
    print(f"\nURL: {data['url']}")
    print(f"Scraped at: {data['scraped_at']}")
    
    if data['title']:
        print(f"\nTitle: {data['title']}")
    
    if data['event_description']:
        print(f"Event: {data['event_description']}")
    
    if data['settlement_date']:
        print(f"Settlement Date: {data['settlement_date']}")
    
    print("\n" + "-" * 80)
    print("RAW HTML SNIPPETS (for manual inspection):")
    print("-" * 80)
    
    for key, value in data['raw_html_snippets'].items():
        print(f"\n{key.upper()}:")
        if isinstance(value, str):
            print(value[:500] + ("..." if len(value) > 500 else ""))
        elif isinstance(value, dict):
            print(json.dumps(value, indent=2)[:500])
        elif isinstance(value, list):
            print("\n".join(str(v)[:200] for v in value[:10]))
    
    print("\n" + "=" * 80)
    print("FULL DATA (JSON):")
    print("=" * 80)
    print(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    """Main function to inspect Kalshi page."""
    url = "https://kalshi.com/markets/kxgdp/us-gdp-growth/kxgdp-26jan30"
    
    print(f"Fetching Kalshi page: {url}\n")
    
    html = fetch_kalshi_page(url)
    if not html:
        print("Failed to fetch the page.")
        return
    
    print(f"Page fetched successfully ({len(html)} characters)\n")
    print("Extracting market data...\n")
    
    market_data = extract_market_data(html, url)
    
    print_market_summary(market_data)
    
    # Save to file
    output_file = "kalshi_inspection.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(market_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n\nFull data saved to: {output_file}")


if __name__ == "__main__":
    main()


