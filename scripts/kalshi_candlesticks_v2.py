"""
Test Kalshi candlesticks API - trying different ticker formats and endpoints.
"""
import requests
import json

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

# First, get the event and extract actual market tickers
event_ticker = "GDP-232022 Q4"
url = f"{BASE_URL}/events/{event_ticker}"

print("Step 1: Getting event info to find market tickers...")
print("=" * 60)

try:
    response = requests.get(url, headers=headers, timeout=15)
    if response.status_code == 200:
        data = response.json()
        event = data.get('event', {})
        markets = data.get('markets', [])
        
        print(f"Event: {event.get('title')}")
        print(f"Series: {event.get('series_ticker')}")
        print(f"Event Ticker: {event.get('event_ticker')}")
        print(f"\nFound {len(markets)} markets:")
        
        for m in markets:
            ticker = m.get('ticker')
            subtitle = m.get('subtitle') or m.get('sub_title')
            last_price = m.get('last_price')
            result = m.get('result')
            print(f"  - {ticker}: {subtitle} | Last Price: {last_price}c | Result: {result}")
        
        # Try candlesticks for each market ticker format
        print("\n" + "=" * 60)
        print("Step 2: Testing candlesticks endpoints...")
        
        # Get the first market ticker
        if markets:
            market = markets[0]
            ticker = market.get('ticker')
            print(f"\nTrying market ticker: {ticker}")
            
            # Try different URL formats
            endpoints = [
                f"{BASE_URL}/markets/{ticker}/candlesticks",
                f"{BASE_URL}/candlesticks/markets/{ticker}",
                f"{BASE_URL}/series/KXGDP/candlesticks",
            ]
            
            for endpoint in endpoints:
                print(f"\n  Trying: {endpoint}")
                try:
                    r = requests.get(endpoint, headers=headers, params={"period_interval": 1440}, timeout=10)
                    print(f"    Status: {r.status_code}")
                    if r.status_code == 200:
                        d = r.json()
                        candles = d.get('candlesticks', [])
                        print(f"    Got {len(candles)} candlesticks!")
                        if candles:
                            print(f"    Sample: {candles[0]}")
                    else:
                        print(f"    Response: {r.text[:200]}")
                except Exception as e:
                    print(f"    Error: {e}")
        
        # Save full event data
        with open('gdp_q4_2022_event.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("\nSaved event data to gdp_q4_2022_event.json")
        
except Exception as e:
    print(f"Error: {e}")

# Try listing all markets for the series with history endpoint
print("\n" + "=" * 60)
print("Step 3: Try /markets with event filter to find history endpoint...")

url = f"{BASE_URL}/markets"
params = {
    "event_ticker": "GDP-232022 Q4",
    "limit": 100
}

try:
    response = requests.get(url, headers=headers, params=params, timeout=15)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        markets = data.get('markets', [])
        print(f"Found {len(markets)} markets")
        
        if markets:
            # Try the history endpoint with actual ticker from API
            actual_ticker = markets[0].get('ticker')
            print(f"\nActual ticker from API: {actual_ticker}")
            
            # Try /markets/{ticker}/history
            history_url = f"{BASE_URL}/markets/{actual_ticker}/history"
            print(f"Trying: {history_url}")
            r = requests.get(history_url, headers=headers, timeout=10)
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                print(f"Response: {r.json()}")
            else:
                print(f"Response: {r.text[:300]}")
                
except Exception as e:
    print(f"Error: {e}")

# Try the trades endpoint for historical data
print("\n" + "=" * 60)
print("Step 4: Try /trades endpoint for historical trades...")

for market in markets[:1]:  # Just first market
    ticker = market.get('ticker')
    url = f"{BASE_URL}/markets/{ticker}/trades"
    
    print(f"\nTrades for {ticker}:")
    try:
        response = requests.get(url, headers=headers, params={"limit": 10}, timeout=15)
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            trades = data.get('trades', [])
            print(f"  Got {len(trades)} trades!")
            
            for trade in trades[:5]:
                print(f"    {trade}")
                
            # Save trades
            with open('gdp_q4_2022_trades.json', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"  Saved to gdp_q4_2022_trades.json")
        else:
            print(f"  Response: {response.text[:300]}")
    except Exception as e:
        print(f"  Error: {e}")

