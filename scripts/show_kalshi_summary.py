"""Quick summary of collected Kalshi GDP data."""
import pandas as pd

df = pd.read_csv('data/kalshi/kalshi_gdp_latest.csv')

print('=' * 60)
print('KALSHI GDP DATA SUMMARY')
print('=' * 60)
print(f'Total rows: {len(df)}')
print(f'Unique events: {df["event_ticker"].nunique()}')
print(f'Unique markets: {df["market_ticker"].nunique()}')
print(f'Columns: {list(df.columns)}')

print()
print('=' * 60)
print('EVENTS FOUND (by year/quarter)')
print('=' * 60)
event_summary = df.groupby(['year', 'quarter', 'event_ticker']).agg({
    'market_ticker': 'nunique',
    'date': ['min', 'max'],
    'settled': 'first'
}).reset_index()
event_summary.columns = ['Year', 'Quarter', 'Event', 'Markets', 'First Date', 'Last Date', 'Settled']
print(event_summary.to_string(index=False))

print()
print('=' * 60)
print('SAMPLE DATA (first 15 rows)')
print('=' * 60)
sample = df[['event_ticker', 'market_ticker', 'title', 'date', 'implied_prob', 'settled', 'result']].head(15)
print(sample.to_string())

print()
print('=' * 60)
print('DATA QUALITY CHECK')
print('=' * 60)
historical = df[df['data_type'] == 'historical']
current = df[df['data_type'] == 'current']
print(f'Historical data points: {len(historical)}')
print(f'Current data points: {len(current)}')
print(f'Events with historical data: {historical["event_ticker"].nunique()}')
print(f'Events with only current data: {current["event_ticker"].nunique() - historical["event_ticker"].nunique() if historical["event_ticker"].nunique() < current["event_ticker"].nunique() else 0}')

print()
print('=' * 60)
print('PROBABILITY DISTRIBUTION EXAMPLE (Q4 2024 - KXGDP-25JAN31)')
print('=' * 60)
q4_2024 = df[(df['event_ticker'] == 'KXGDP-25JAN31') & (df['data_type'] == 'current')]
if not q4_2024.empty:
    prob_dist = q4_2024[['title', 'floor_strike', 'cap_strike', 'implied_prob']].sort_values('floor_strike')
    print(prob_dist.to_string(index=False))
else:
    print('No data found for Q4 2024')


