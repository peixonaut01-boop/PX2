"""
Kalshi GDP Market Data Collector

Collects historical probability distributions for GDP markets from Kalshi.
This data can be used for comparing nowcasting techniques with prediction market data.

Author: PX Economics
Purpose: Academic research on nowcasting vs prediction markets
"""

import requests
import pandas as pd
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time
import os

# Kalshi API base URL (public, no auth required for market data)
BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"

# GDP series tickers (old format and new format)
GDP_SERIES = ["GDP", "KXGDP"]

# Target events from 2021 to 2025 Q3
TARGET_EVENTS = [
    # 2021
    "GDP-21JUN30",  # Q2 2021
    "GDP-21SEP30",  # Q3 2021
    "GDP-21DEC31",  # Q4 2021
    # 2022
    "GDP-22MAR31",  # Q1 2022
    "GDP-22JUN30",  # Q2 2022
    "GDP-22SEP30",  # Q3 2022
    "GDP-232022 Q4",  # Q4 2022 (unusual ticker format)
    # 2023
    "GDP-23APR27",  # Q1 2023
    "GDP-23JUL27",  # Q2 2023
    "GDP-23OCT26",  # Q3 2023
    "GDP-24JAN26",  # Q4 2023
    # 2024
    "GDP-24APR25",  # Q1 2024
    "GDP-24JUL25",  # Q2 2024
    "GDP-24OCT30",  # Q3 2024
    "KXGDP-25JAN31",  # Q4 2024
    # 2025
    "KXGDP-25APR30",  # Q1 2025
    "KXGDP-25JUL30",  # Q2 2025
    "KXGDP-25OCT30",  # Q3 2025
]


def get_headers() -> Dict[str, str]:
    """Return headers for API requests."""
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def fetch_series(series_ticker: str) -> Optional[Dict]:
    """Fetch series information."""
    url = f"{BASE_URL}/series/{series_ticker}"
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[WARN] Series {series_ticker}: Status {response.status_code}")
            return None
    except Exception as e:
        print(f"[ERROR] Series {series_ticker}: {e}")
        return None


def fetch_events_for_series(series_ticker: str, status: str = None) -> List[Dict]:
    """Fetch all events for a series."""
    url = f"{BASE_URL}/events"
    params = {"series_ticker": series_ticker}
    if status:
        params["status"] = status
    
    all_events = []
    cursor = None
    
    while True:
        if cursor:
            params["cursor"] = cursor
        
        try:
            response = requests.get(url, headers=get_headers(), params=params, timeout=10)
            if response.status_code != 200:
                print(f"[WARN] Events for {series_ticker}: Status {response.status_code}")
                break
            
            data = response.json()
            events = data.get("events", [])
            all_events.extend(events)
            
            cursor = data.get("cursor")
            if not cursor:
                break
                
        except Exception as e:
            print(f"[ERROR] Events for {series_ticker}: {e}")
            break
    
    return all_events


def fetch_markets_for_event(event_ticker: str) -> List[Dict]:
    """Fetch all markets (contracts) for an event."""
    url = f"{BASE_URL}/markets"
    params = {"event_ticker": event_ticker}
    
    all_markets = []
    cursor = None
    
    while True:
        if cursor:
            params["cursor"] = cursor
        
        try:
            response = requests.get(url, headers=get_headers(), params=params, timeout=10)
            if response.status_code != 200:
                print(f"[WARN] Markets for {event_ticker}: Status {response.status_code}")
                break
            
            data = response.json()
            markets = data.get("markets", [])
            all_markets.extend(markets)
            
            cursor = data.get("cursor")
            if not cursor:
                break
                
        except Exception as e:
            print(f"[ERROR] Markets for {event_ticker}: {e}")
            break
    
    return all_markets


def fetch_market_history(market_ticker: str, min_ts: int = None, max_ts: int = None) -> List[Dict]:
    """
    Fetch historical candlestick data for a market.
    
    This gives us price history which represents probability over time.
    Price in cents / 100 = implied probability.
    """
    url = f"{BASE_URL}/markets/{market_ticker}/candlesticks"
    params = {
        "period_interval": 1440,  # 1 day in minutes (daily candles)
    }
    
    if min_ts:
        params["start_ts"] = min_ts
    if max_ts:
        params["end_ts"] = max_ts
    
    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        if response.status_code != 200:
            print(f"[WARN] History for {market_ticker}: Status {response.status_code}")
            # Try alternative approach
            return fetch_market_history_alternative(market_ticker)
        
        data = response.json()
        return data.get("candlesticks", [])
        
    except Exception as e:
        print(f"[ERROR] History for {market_ticker}: {e}")
        return []


def fetch_market_history_alternative(market_ticker: str) -> List[Dict]:
    """Alternative method using trades endpoint if candlesticks not available."""
    url = f"{BASE_URL}/markets/{market_ticker}/trades"
    params = {"limit": 1000}
    
    try:
        response = requests.get(url, headers=get_headers(), params=params, timeout=15)
        if response.status_code != 200:
            return []
        
        data = response.json()
        return data.get("trades", [])
        
    except Exception as e:
        print(f"[ERROR] Trades for {market_ticker}: {e}")
        return []


def fetch_orderbook(market_ticker: str) -> Optional[Dict]:
    """Fetch current orderbook for a market."""
    url = f"{BASE_URL}/markets/{market_ticker}/orderbook"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code != 200:
            return None
        
        return response.json().get("orderbook", {})
        
    except Exception as e:
        print(f"[ERROR] Orderbook for {market_ticker}: {e}")
        return None


def fetch_market_details(market_ticker: str) -> Optional[Dict]:
    """Fetch detailed market information."""
    url = f"{BASE_URL}/markets/{market_ticker}"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code != 200:
            return None
        
        return response.json().get("market", {})
        
    except Exception as e:
        print(f"[ERROR] Market details for {market_ticker}: {e}")
        return None


def parse_quarter_from_event(event_ticker: str, title: str) -> Tuple[int, int]:
    """Extract year and quarter from event ticker/title."""
    # Try to parse from title first
    import re
    
    # Pattern: "Q1 2024", "Q2 2023", etc.
    match = re.search(r'Q(\d)\s*(\d{4})', title)
    if match:
        return int(match.group(2)), int(match.group(1))
    
    # Try from ticker
    # GDP-21JUN30 -> 2021, Q2
    # KXGDP-25APR30 -> 2025, Q1
    ticker_patterns = {
        'JAN': 4,  # Q4 of previous year
        'FEB': 4,
        'MAR': 1,
        'APR': 1,
        'MAY': 2,
        'JUN': 2,
        'JUL': 2,
        'AUG': 3,
        'SEP': 3,
        'OCT': 3,
        'NOV': 4,
        'DEC': 4,
    }
    
    for month, quarter in ticker_patterns.items():
        if month in event_ticker.upper():
            # Extract year from ticker
            year_match = re.search(r'(\d{2})[A-Z]{3}', event_ticker.upper())
            if year_match:
                year = 2000 + int(year_match.group(1))
                return year, quarter
    
    return None, None


def collect_gdp_data() -> pd.DataFrame:
    """
    Main function to collect all GDP market data from Kalshi.
    
    Returns a DataFrame with:
    - event_ticker: The event identifier
    - market_ticker: The specific market/contract ticker
    - title: Market title (e.g., "GDP growth 2.0% to 2.5%")
    - year: Year of GDP measurement
    - quarter: Quarter (1-4)
    - floor_strike: Lower bound of GDP range
    - cap_strike: Upper bound of GDP range
    - date: Date of observation
    - yes_price: Price for YES contract (in cents)
    - no_price: Price for NO contract (in cents)
    - implied_prob: Implied probability (yes_price / 100)
    - volume: Trading volume
    - open_interest: Open interest
    """
    
    all_data = []
    
    print("=" * 80)
    print("KALSHI GDP DATA COLLECTOR")
    print("=" * 80)
    
    # First, fetch all events from both series
    print("\n[1/4] Fetching GDP series and events...")
    
    all_events = []
    for series in GDP_SERIES:
        print(f"  Fetching events for series: {series}")
        events = fetch_events_for_series(series)
        all_events.extend(events)
        time.sleep(0.5)  # Rate limiting
    
    print(f"  Found {len(all_events)} total events")
    
    # Filter to target events
    target_tickers = set(TARGET_EVENTS)
    filtered_events = [e for e in all_events if e.get('ticker') in target_tickers or e.get('event_ticker') in target_tickers]
    
    print(f"  Matched {len(filtered_events)} target events")
    
    # If we didn't find events through the API, try direct market lookup
    if len(filtered_events) < len(TARGET_EVENTS):
        print("\n[2/4] Direct lookup for missing events...")
        found_tickers = set(e.get('ticker', e.get('event_ticker')) for e in filtered_events)
        missing = target_tickers - found_tickers
        
        for event_ticker in missing:
            print(f"  Looking up: {event_ticker}")
            markets = fetch_markets_for_event(event_ticker)
            if markets:
                # Create a pseudo-event entry
                filtered_events.append({
                    'ticker': event_ticker,
                    'event_ticker': event_ticker,
                    'title': markets[0].get('event_title', f'GDP {event_ticker}'),
                    'markets': markets
                })
            time.sleep(0.3)
    
    # Now collect market data for each event
    print("\n[3/4] Collecting market data for each event...")
    
    for event in filtered_events:
        event_ticker = event.get('ticker') or event.get('event_ticker')
        event_title = event.get('title', '')
        
        print(f"\n  Processing: {event_ticker} - {event_title}")
        
        # Get year and quarter
        year, quarter = parse_quarter_from_event(event_ticker, event_title)
        
        # Get markets for this event
        markets = event.get('markets') or fetch_markets_for_event(event_ticker)
        time.sleep(0.3)
        
        if not markets:
            print(f"    [WARN] No markets found")
            continue
        
        print(f"    Found {len(markets)} markets/contracts")
        
        for market in markets:
            market_ticker = market.get('ticker')
            market_title = market.get('title', market.get('subtitle', ''))
            
            # Extract strike prices (GDP ranges)
            floor_strike = market.get('floor_strike')
            cap_strike = market.get('cap_strike')
            
            # Current market state
            yes_bid = market.get('yes_bid')
            yes_ask = market.get('yes_ask')
            no_bid = market.get('no_bid')
            no_ask = market.get('no_ask')
            last_price = market.get('last_price')
            volume = market.get('volume')
            open_interest = market.get('open_interest')
            
            # Settlement info
            result = market.get('result')
            settled = market.get('status') == 'settled'
            close_time = market.get('close_time')
            
            # Get historical data (candlesticks)
            print(f"      Fetching history for: {market_ticker}")
            history = fetch_market_history(market_ticker)
            time.sleep(0.2)
            
            if history:
                # Add historical data points
                for candle in history:
                    timestamp = candle.get('end_period_ts') or candle.get('ts')
                    if timestamp:
                        date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
                    else:
                        date = candle.get('period_end', 'unknown')
                    
                    all_data.append({
                        'event_ticker': event_ticker,
                        'market_ticker': market_ticker,
                        'title': market_title,
                        'year': year,
                        'quarter': quarter,
                        'floor_strike': floor_strike,
                        'cap_strike': cap_strike,
                        'date': date,
                        'open_price': candle.get('open'),
                        'high_price': candle.get('high'),
                        'low_price': candle.get('low'),
                        'close_price': candle.get('close'),
                        'yes_price': candle.get('yes_price', candle.get('close')),
                        'volume': candle.get('volume'),
                        'implied_prob': (candle.get('close', 0) or 0) / 100.0,
                        'result': result,
                        'settled': settled,
                        'data_type': 'historical'
                    })
            
            # Always add current state
            all_data.append({
                'event_ticker': event_ticker,
                'market_ticker': market_ticker,
                'title': market_title,
                'year': year,
                'quarter': quarter,
                'floor_strike': floor_strike,
                'cap_strike': cap_strike,
                'date': datetime.now().strftime('%Y-%m-%d'),
                'open_price': None,
                'high_price': None,
                'low_price': None,
                'close_price': last_price,
                'yes_price': last_price,
                'yes_bid': yes_bid,
                'yes_ask': yes_ask,
                'no_bid': no_bid,
                'no_ask': no_ask,
                'volume': volume,
                'open_interest': open_interest,
                'implied_prob': (last_price or 0) / 100.0 if last_price else None,
                'result': result,
                'settled': settled,
                'close_time': close_time,
                'data_type': 'current'
            })
    
    print("\n[4/4] Creating DataFrame...")
    
    df = pd.DataFrame(all_data)
    
    # Sort by year, quarter, date
    if not df.empty:
        df = df.sort_values(['year', 'quarter', 'date', 'floor_strike'], 
                           ascending=[True, True, True, True])
    
    return df


def save_data(df: pd.DataFrame, output_dir: str = "data/kalshi"):
    """Save collected data to various formats."""
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save as Parquet (efficient for analysis)
    parquet_path = os.path.join(output_dir, f"kalshi_gdp_{timestamp}.parquet")
    df.to_parquet(parquet_path, index=False)
    print(f"  Saved: {parquet_path}")
    
    # Save as CSV (human readable)
    csv_path = os.path.join(output_dir, f"kalshi_gdp_{timestamp}.csv")
    df.to_csv(csv_path, index=False)
    print(f"  Saved: {csv_path}")
    
    # Save as JSON (for web apps)
    json_path = os.path.join(output_dir, f"kalshi_gdp_{timestamp}.json")
    df.to_json(json_path, orient='records', date_format='iso')
    print(f"  Saved: {json_path}")
    
    # Also save a "latest" version
    df.to_parquet(os.path.join(output_dir, "kalshi_gdp_latest.parquet"), index=False)
    df.to_csv(os.path.join(output_dir, "kalshi_gdp_latest.csv"), index=False)
    
    return parquet_path, csv_path, json_path


def create_probability_distribution_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create a summary DataFrame showing probability distributions for each GDP event.
    
    For each quarter, shows the implied probability for each GDP range bucket.
    """
    if df.empty:
        return pd.DataFrame()
    
    # Get latest data for each market
    latest = df[df['data_type'] == 'current'].copy()
    
    if latest.empty:
        latest = df.groupby('market_ticker').last().reset_index()
    
    # Pivot to show probability distribution
    summary = latest.pivot_table(
        index=['year', 'quarter', 'event_ticker'],
        columns='title',
        values='implied_prob',
        aggfunc='first'
    ).reset_index()
    
    return summary


def main():
    """Main entry point."""
    print("\n" + "=" * 80)
    print("KALSHI GDP DATA COLLECTION FOR NOWCASTING RESEARCH")
    print("=" * 80)
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target: GDP events from Q2 2021 to Q3 2025")
    print("=" * 80)
    
    # Collect data
    df = collect_gdp_data()
    
    if df.empty:
        print("\n[ERROR] No data collected. Please check API connectivity.")
        return
    
    print(f"\n[OK] Collected {len(df)} data points")
    
    # Show summary
    print("\n" + "-" * 80)
    print("DATA SUMMARY")
    print("-" * 80)
    print(f"Total rows: {len(df)}")
    print(f"Unique events: {df['event_ticker'].nunique()}")
    print(f"Unique markets: {df['market_ticker'].nunique()}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    
    print("\nEvents by year:")
    print(df.groupby('year')['event_ticker'].nunique())
    
    # Save data
    print("\n" + "-" * 80)
    print("SAVING DATA")
    print("-" * 80)
    
    save_data(df)
    
    # Create probability distribution summary
    print("\n" + "-" * 80)
    print("PROBABILITY DISTRIBUTION SUMMARY")
    print("-" * 80)
    
    summary = create_probability_distribution_summary(df)
    if not summary.empty:
        print(summary.to_string())
        summary.to_csv("data/kalshi/probability_summary.csv", index=False)
        print("\n  Saved: data/kalshi/probability_summary.csv")
    
    print("\n" + "=" * 80)
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)


if __name__ == "__main__":
    main()


