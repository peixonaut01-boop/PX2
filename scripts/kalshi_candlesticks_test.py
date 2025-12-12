"""
Test Kalshi candlesticks API endpoint for historical data.
"""
import requests
import json

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"

# Test market ticker from Q4 2022
market_ticker = "GDP-232022 Q4-T2.0"

# Headers
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

# Try different period intervals (in minutes)
# 1 = 1 minute, 60 = 1 hour, 1440 = 1 day
period_intervals = [1, 60, 1440]

print(f"Testing candlesticks for: {market_ticker}")
print("=" * 60)

for interval in period_intervals:
    print(f"\nTrying period_interval={interval} ({interval} minutes)...")
    
    url = f"{BASE_URL}/markets/{market_ticker}/candlesticks"
    params = {
        "period_interval": interval
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            candlesticks = data.get('candlesticks', [])
            print(f"  Got {len(candlesticks)} candlesticks!")
            
            if candlesticks:
                print(f"  First candle: {candlesticks[0]}")
                print(f"  Last candle: {candlesticks[-1]}")
                
                # Save to file
                with open(f'test_candlesticks_{interval}.json', 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"  Saved to test_candlesticks_{interval}.json")
        else:
            print(f"  Response: {response.text[:500]}")
            
    except Exception as e:
        print(f"  Error: {e}")

# Also try the series/event candlesticks endpoint
print("\n" + "=" * 60)
print("Trying event-level candlesticks...")

event_ticker = "GDP-232022 Q4"
url = f"{BASE_URL}/events/{event_ticker}"

try:
    response = requests.get(url, headers=headers, timeout=15)
    print(f"Event info status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Event data: {json.dumps(data, indent=2)[:1000]}")
except Exception as e:
    print(f"Error: {e}")

# Try the series candlesticks
print("\n" + "=" * 60)
print("Trying series-level candlesticks...")

series_ticker = "KXGDP"
url = f"{BASE_URL}/series/{series_ticker}/candlesticks"
params = {"period_interval": 1440}

try:
    response = requests.get(url, headers=headers, params=params, timeout=15)
    print(f"Series candlesticks status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        candlesticks = data.get('candlesticks', [])
        print(f"Got {len(candlesticks)} series candlesticks!")
    else:
        print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

