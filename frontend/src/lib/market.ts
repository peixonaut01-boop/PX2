export interface TickerQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  currency?: string;
}

// API Keys
const TIINGO_TOKEN = "918080aac60e0ae5dece8cb055255a0f6947dc8e";

// Cache em memória para evitar rate limiting
const memoryCache: Map<string, { data: TickerQuote; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minuto de cache

// Fallback cache com cotações conhecidas (atualizado manualmente ou via API)
const FALLBACK_QUOTES: Record<string, { price: number; change: number; changePercent: number; currency: string }> = {
  // Brasileiras
  "PETR4": { price: 36.50, change: 0.5, changePercent: 1.39, currency: "BRL" },
  "VALE3": { price: 58.20, change: -0.3, changePercent: -0.51, currency: "BRL" },
  "BBAS3": { price: 27.80, change: 0.2, changePercent: 0.72, currency: "BRL" },
  "ITUB4": { price: 32.40, change: 0.4, changePercent: 1.25, currency: "BRL" },
  "ABEV3": { price: 12.90, change: -0.1, changePercent: -0.77, currency: "BRL" },
  "WEGE3": { price: 52.30, change: 0.8, changePercent: 1.55, currency: "BRL" },
  "RENT3": { price: 41.20, change: -0.5, changePercent: -1.20, currency: "BRL" },
  "LREN3": { price: 14.50, change: 0.1, changePercent: 0.69, currency: "BRL" },
  "MGLU3": { price: 7.80, change: -0.2, changePercent: -2.50, currency: "BRL" },
  "BBDC4": { price: 12.45, change: 0.15, changePercent: 1.22, currency: "BRL" },
  "B3SA3": { price: 10.80, change: 0.05, changePercent: 0.47, currency: "BRL" },
  "SUZB3": { price: 62.70, change: 1.2, changePercent: 1.95, currency: "BRL" },
  "JBSS3": { price: 36.90, change: 0.4, changePercent: 1.10, currency: "BRL" },
  "BEEF3": { price: 6.25, change: -0.1, changePercent: -1.57, currency: "BRL" },
  "GGBR4": { price: 17.80, change: 0.3, changePercent: 1.71, currency: "BRL" },
  "CSNA3": { price: 10.20, change: -0.15, changePercent: -1.45, currency: "BRL" },
  "USIM5": { price: 6.50, change: 0.08, changePercent: 1.25, currency: "BRL" },
  "EMBR3": { price: 55.40, change: 1.5, changePercent: 2.78, currency: "BRL" },
  "AZUL4": { price: 4.80, change: -0.12, changePercent: -2.44, currency: "BRL" },
  "GOLL4": { price: 1.25, change: -0.05, changePercent: -3.85, currency: "BRL" },
  "HAPV3": { price: 3.20, change: 0.05, changePercent: 1.59, currency: "BRL" },
  "RAIL3": { price: 21.50, change: 0.3, changePercent: 1.42, currency: "BRL" },
  "SBSP3": { price: 92.80, change: 1.8, changePercent: 1.98, currency: "BRL" },
  "VIVT3": { price: 54.60, change: 0.7, changePercent: 1.30, currency: "BRL" },
  "CXSE3": { price: 15.20, change: 0.2, changePercent: 1.33, currency: "BRL" },
  "MULT3": { price: 25.90, change: 0.4, changePercent: 1.57, currency: "BRL" },
  "TOTS3": { price: 30.50, change: 0.6, changePercent: 2.01, currency: "BRL" },
  "RADL3": { price: 26.80, change: 0.3, changePercent: 1.13, currency: "BRL" },
  "CIEL3": { price: 5.45, change: 0.08, changePercent: 1.49, currency: "BRL" },
  "COGN3": { price: 1.35, change: -0.03, changePercent: -2.17, currency: "BRL" },
  "YDUQ3": { price: 11.20, change: 0.15, changePercent: 1.36, currency: "BRL" },
  "PRIO3": { price: 42.80, change: 0.9, changePercent: 2.15, currency: "BRL" },
  "CSAN3": { price: 11.50, change: 0.2, changePercent: 1.77, currency: "BRL" },
  "UGPA3": { price: 22.30, change: 0.35, changePercent: 1.59, currency: "BRL" },
  "VBBR3": { price: 20.10, change: 0.25, changePercent: 1.26, currency: "BRL" },
  "ELET3": { price: 40.20, change: 0.5, changePercent: 1.26, currency: "BRL" },
  "ELET6": { price: 44.80, change: 0.6, changePercent: 1.36, currency: "BRL" },
  "CMIG4": { price: 12.30, change: 0.15, changePercent: 1.23, currency: "BRL" },
  "CPFE3": { price: 33.50, change: 0.4, changePercent: 1.21, currency: "BRL" },
  "ENGI11": { price: 44.20, change: 0.5, changePercent: 1.14, currency: "BRL" },
  "EQTL3": { price: 32.10, change: 0.4, changePercent: 1.26, currency: "BRL" },
  "TAEE11": { price: 35.80, change: 0.3, changePercent: 0.85, currency: "BRL" },
  "TRPL4": { price: 25.60, change: 0.2, changePercent: 0.79, currency: "BRL" },
  "SANB11": { price: 27.40, change: 0.3, changePercent: 1.11, currency: "BRL" },
  "BPAC11": { price: 32.50, change: 0.5, changePercent: 1.56, currency: "BRL" },
  "BRFS3": { price: 24.80, change: 0.4, changePercent: 1.64, currency: "BRL" },
  "MRFG3": { price: 18.30, change: 0.25, changePercent: 1.38, currency: "BRL" },
  "NTCO3": { price: 14.90, change: 0.2, changePercent: 1.36, currency: "BRL" },
  "ASAI3": { price: 7.20, change: 0.1, changePercent: 1.41, currency: "BRL" },
  "CRFB3": { price: 8.50, change: 0.12, changePercent: 1.43, currency: "BRL" },
  "LWSA3": { price: 4.30, change: 0.05, changePercent: 1.18, currency: "BRL" },
  "PETZ3": { price: 4.15, change: 0.06, changePercent: 1.47, currency: "BRL" },
  "SOMA3": { price: 6.80, change: 0.1, changePercent: 1.49, currency: "BRL" },
  "ARZZ3": { price: 52.40, change: 0.8, changePercent: 1.55, currency: "BRL" },
  "ALPA4": { price: 7.90, change: 0.1, changePercent: 1.28, currency: "BRL" },
  "SMTO3": { price: 27.30, change: 0.35, changePercent: 1.30, currency: "BRL" },
  "SLCE3": { price: 18.50, change: 0.2, changePercent: 1.09, currency: "BRL" },
  "KLBN11": { price: 22.80, change: 0.3, changePercent: 1.33, currency: "BRL" },

  // Americanas
  "AAPL": { price: 193.15, change: 2.34, changePercent: 1.23, currency: "USD" },
  "MSFT": { price: 378.91, change: 4.56, changePercent: 1.22, currency: "USD" },
  "TSLA": { price: 352.56, change: -3.21, changePercent: -0.90, currency: "USD" },
  "AMZN": { price: 184.25, change: 1.87, changePercent: 1.03, currency: "USD" },
  "GOOGL": { price: 175.98, change: 2.15, changePercent: 1.24, currency: "USD" },
  "GOOG": { price: 177.50, change: 2.20, changePercent: 1.25, currency: "USD" },
  "META": { price: 585.25, change: 5.43, changePercent: 0.94, currency: "USD" },
  "NVDA": { price: 138.25, change: 3.21, changePercent: 2.38, currency: "USD" },
  "AMD": { price: 138.50, change: 2.10, changePercent: 1.54, currency: "USD" },
  "INTC": { price: 24.30, change: 0.35, changePercent: 1.46, currency: "USD" },
  "NFLX": { price: 895.20, change: 8.50, changePercent: 0.96, currency: "USD" },
  "DIS": { price: 112.40, change: 1.20, changePercent: 1.08, currency: "USD" },
  "PYPL": { price: 89.50, change: 1.15, changePercent: 1.30, currency: "USD" },
  "V": { price: 295.80, change: 3.20, changePercent: 1.09, currency: "USD" },
  "MA": { price: 520.60, change: 5.40, changePercent: 1.05, currency: "USD" },
  "JPM": { price: 245.30, change: 2.80, changePercent: 1.15, currency: "USD" },
  "BAC": { price: 46.20, change: 0.55, changePercent: 1.20, currency: "USD" },
  "WFC": { price: 72.80, change: 0.85, changePercent: 1.18, currency: "USD" },
  "GS": { price: 582.40, change: 6.50, changePercent: 1.13, currency: "USD" },
  "MS": { price: 118.90, change: 1.40, changePercent: 1.19, currency: "USD" },
  "XOM": { price: 108.50, change: 1.20, changePercent: 1.12, currency: "USD" },
  "CVX": { price: 145.30, change: 1.60, changePercent: 1.11, currency: "USD" },
  "JNJ": { price: 156.80, change: 1.30, changePercent: 0.84, currency: "USD" },
  "PFE": { price: 26.40, change: 0.30, changePercent: 1.15, currency: "USD" },
  "UNH": { price: 585.20, change: 5.80, changePercent: 1.00, currency: "USD" },
  "KO": { price: 62.50, change: 0.45, changePercent: 0.73, currency: "USD" },
  "PEP": { price: 158.30, change: 1.20, changePercent: 0.76, currency: "USD" },
  "MCD": { price: 298.50, change: 2.80, changePercent: 0.95, currency: "USD" },
  "WMT": { price: 92.40, change: 0.85, changePercent: 0.93, currency: "USD" },
  "HD": { price: 415.60, change: 4.20, changePercent: 1.02, currency: "USD" },
  "NKE": { price: 78.30, change: 0.90, changePercent: 1.16, currency: "USD" },
  "BA": { price: 178.50, change: 2.10, changePercent: 1.19, currency: "USD" },
  "CAT": { price: 398.20, change: 4.50, changePercent: 1.14, currency: "USD" },
  "DE": { price: 445.80, change: 5.20, changePercent: 1.18, currency: "USD" },
  "GE": { price: 185.30, change: 2.20, changePercent: 1.20, currency: "USD" },
  "MMM": { price: 135.40, change: 1.50, changePercent: 1.12, currency: "USD" },
  "IBM": { price: 228.60, change: 2.40, changePercent: 1.06, currency: "USD" },
  "ORCL": { price: 192.50, change: 2.30, changePercent: 1.21, currency: "USD" },
  "CRM": { price: 348.70, change: 4.10, changePercent: 1.19, currency: "USD" },
  "ADBE": { price: 518.40, change: 5.80, changePercent: 1.13, currency: "USD" },
  "CSCO": { price: 58.90, change: 0.65, changePercent: 1.12, currency: "USD" },
  "QCOM": { price: 158.20, change: 2.00, changePercent: 1.28, currency: "USD" },
  "TXN": { price: 198.50, change: 2.30, changePercent: 1.17, currency: "USD" },
  "AVGO": { price: 238.60, change: 3.20, changePercent: 1.36, currency: "USD" },
  "COST": { price: 978.30, change: 9.50, changePercent: 0.98, currency: "USD" },
  "SBUX": { price: 102.40, change: 1.10, changePercent: 1.09, currency: "USD" },
  "T": { price: 22.80, change: 0.25, changePercent: 1.11, currency: "USD" },
  "VZ": { price: 42.30, change: 0.40, changePercent: 0.96, currency: "USD" },
  "CMCSA": { price: 42.50, change: 0.45, changePercent: 1.07, currency: "USD" },
  "COIN": { price: 312.40, change: 8.50, changePercent: 2.80, currency: "USD" },
  "UBER": { price: 68.50, change: 1.20, changePercent: 1.78, currency: "USD" },
  "LYFT": { price: 14.80, change: 0.25, changePercent: 1.72, currency: "USD" },
  "SPOT": { price: 485.30, change: 6.80, changePercent: 1.42, currency: "USD" },
  "SQ": { price: 92.40, change: 1.50, changePercent: 1.65, currency: "USD" },
  "SHOP": { price: 112.80, change: 1.80, changePercent: 1.62, currency: "USD" },
  "ROKU": { price: 85.60, change: 1.40, changePercent: 1.66, currency: "USD" },
  "ZM": { price: 82.30, change: 1.10, changePercent: 1.35, currency: "USD" },
  "PLTR": { price: 72.50, change: 1.80, changePercent: 2.55, currency: "USD" },
  "SNOW": { price: 178.40, change: 2.60, changePercent: 1.48, currency: "USD" },
  "CRWD": { price: 368.50, change: 5.20, changePercent: 1.43, currency: "USD" },
  "NET": { price: 118.30, change: 1.90, changePercent: 1.63, currency: "USD" },
  "DDOG": { price: 142.60, change: 2.20, changePercent: 1.57, currency: "USD" },
  "MDB": { price: 298.40, change: 4.50, changePercent: 1.53, currency: "USD" },
  "ABNB": { price: 142.80, change: 2.10, changePercent: 1.49, currency: "USD" },
  "DASH": { price: 185.40, change: 2.80, changePercent: 1.53, currency: "USD" },
  "RIVN": { price: 12.50, change: 0.35, changePercent: 2.88, currency: "USD" },
  "LCID": { price: 2.85, change: 0.08, changePercent: 2.89, currency: "USD" },
  "F": { price: 10.80, change: 0.12, changePercent: 1.12, currency: "USD" },
  "GM": { price: 58.40, change: 0.70, changePercent: 1.21, currency: "USD" },
  "SPY": { price: 605.20, change: 5.80, changePercent: 0.97, currency: "USD" },
  "QQQ": { price: 525.40, change: 6.20, changePercent: 1.19, currency: "USD" },
  "IWM": { price: 238.60, change: 2.40, changePercent: 1.02, currency: "USD" },
  "DIA": { price: 448.30, change: 4.20, changePercent: 0.95, currency: "USD" },
  "ARKK": { price: 58.40, change: 1.10, changePercent: 1.92, currency: "USD" },
  "GLD": { price: 242.50, change: 1.80, changePercent: 0.75, currency: "USD" },
  "SLV": { price: 28.60, change: 0.35, changePercent: 1.24, currency: "USD" },
  "USO": { price: 72.40, change: 0.85, changePercent: 1.19, currency: "USD" },
  "VTI": { price: 285.30, change: 2.80, changePercent: 0.99, currency: "USD" },
  "VOO": { price: 558.40, change: 5.40, changePercent: 0.98, currency: "USD" },
};

// Lista de ações brasileiras conhecidas
const BR_STOCKS = [
  "PETR4", "VALE3", "BBAS3", "ITUB4", "ABEV3", "WEGE3", 
  "RENT3", "LREN3", "MGLU3", "BBDC4", "B3SA3", "SUZB3",
  "JBSS3", "BEEF3", "GGBR4", "CSNA3", "USIM5", "EMBR3",
  "AZUL4", "GOLL4", "HAPV3", "RAIL3", "SBSP3", "VIVT3",
  "CXSE3", "MULT3", "TOTS3", "RADL3", "CIEL3", "COGN3",
  "YDUQ3", "PRIO3", "CSAN3", "UGPA3", "VBBR3", "ELET3",
  "ELET6", "CMIG4", "CPFE3", "ENGI11", "EQTL3", "TAEE11",
  "TRPL4", "SANB11", "BPAC11", "BRFS3", "MRFG3", "NTCO3",
  "ASAI3", "CRFB3", "LWSA3", "PETZ3", "SOMA3", "ARZZ3",
  "ALPA4", "SMTO3", "SLCE3", "KLBN11"
];

// Busca cotações brasileiras via Brapi (API gratuita brasileira)
async function getBrapiQuote(symbol: string): Promise<TickerQuote | null> {
  try {
    const response = await fetch(
      `https://brapi.dev/api/quote/${symbol}`,
      { next: { revalidate: 60 } }
    );
    
    if (!response.ok) {
      console.error(`Brapi response not ok for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const quote = data.results?.[0];
    
    if (!quote) {
      console.error(`Brapi no data for ${symbol}`);
      return null;
    }
    
    return {
      symbol: symbol,
      regularMarketPrice: quote.regularMarketPrice ?? 0,
      regularMarketChange: quote.regularMarketChange ?? 0,
      regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
      currency: "BRL",
    };
  } catch (err) {
    console.error(`Brapi error for ${symbol}:`, err);
    return null;
  }
}

// Busca cotações americanas via Tiingo Daily (endpoint mais completo)
async function getTiingoQuote(symbol: string): Promise<TickerQuote | null> {
  try {
    // Primeiro tenta o endpoint IEX (mais rápido, tempo real)
    const iexResponse = await fetch(
      `https://api.tiingo.com/iex/${symbol}?token=${TIINGO_TOKEN}`,
      { next: { revalidate: 60 } }
    );
    
    if (iexResponse.ok) {
      const iexData = await iexResponse.json();
      const iexQuote = Array.isArray(iexData) ? iexData[0] : iexData;
      
      if (iexQuote && iexQuote.last) {
        const price = iexQuote.last ?? iexQuote.tngoLast ?? 0;
        const prevClose = iexQuote.prevClose ?? price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        
        return {
          symbol: symbol.toUpperCase(),
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          currency: "USD",
        };
      }
    }
    
    // Fallback: endpoint daily (end-of-day, mais completo)
    const dailyResponse = await fetch(
      `https://api.tiingo.com/tiingo/daily/${symbol}/prices?token=${TIINGO_TOKEN}`,
      { next: { revalidate: 60 } }
    );
    
    if (dailyResponse.ok) {
      const dailyData = await dailyResponse.json();
      const dailyQuote = Array.isArray(dailyData) ? dailyData[0] : dailyData;
      
      if (dailyQuote && dailyQuote.close) {
        const price = dailyQuote.close;
        const prevClose = dailyQuote.open ?? price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        
        return {
          symbol: symbol.toUpperCase(),
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          currency: "USD",
        };
      }
    }
    
    // Último fallback: Yahoo Finance
    try {
      const yahooFinance = (await import("yahoo-finance2")).default;
      const yahooQuote = await yahooFinance.quote(symbol) as {
        regularMarketPrice?: number;
        regularMarketChange?: number;
        regularMarketChangePercent?: number;
        currency?: string;
      };
      
      if (yahooQuote && yahooQuote.regularMarketPrice) {
        return {
          symbol: symbol.toUpperCase(),
          regularMarketPrice: yahooQuote.regularMarketPrice ?? 0,
          regularMarketChange: yahooQuote.regularMarketChange ?? 0,
          regularMarketChangePercent: yahooQuote.regularMarketChangePercent ?? 0,
          currency: yahooQuote.currency ?? "USD",
        };
      }
    } catch (yahooErr) {
      console.error(`Yahoo fallback error for ${symbol}:`, yahooErr);
    }
    
    console.error(`All sources failed for ${symbol}`);
    return null;
  } catch (err) {
    console.error(`Tiingo error for ${symbol}:`, err);
    return null;
  }
}

// Retorna cotação do cache fallback
function getFallbackQuote(symbol: string): TickerQuote {
  const upperSymbol = symbol.toUpperCase();
  const fallback = FALLBACK_QUOTES[upperSymbol];
  
  if (fallback) {
    return {
      symbol: upperSymbol,
      regularMarketPrice: fallback.price,
      regularMarketChange: fallback.change,
      regularMarketChangePercent: fallback.changePercent,
      currency: fallback.currency,
    };
  }
  
  // Se não tem no cache, retorna placeholder
  return {
    symbol: upperSymbol,
    regularMarketPrice: 0,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    currency: BR_STOCKS.includes(upperSymbol) ? "BRL" : "USD",
  };
}

// Busca cotação com fallback e cache
async function getQuoteWithCache(symbol: string): Promise<TickerQuote> {
  const upperSymbol = symbol.toUpperCase();
  const cacheKey = upperSymbol;
  
  // Verifica cache em memória
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  let quote: TickerQuote | null = null;
  
  // Para ações brasileiras, usa Brapi
  if (BR_STOCKS.includes(upperSymbol)) {
    quote = await getBrapiQuote(upperSymbol);
  } else {
    // Para ações americanas, usa Tiingo com fallbacks
    quote = await getTiingoQuote(upperSymbol);
  }
  
  // Se não temos cotação da API, usa o cache fallback
  if (!quote || quote.regularMarketPrice === 0) {
    console.log(`Using fallback quote for ${upperSymbol}`);
    quote = getFallbackQuote(upperSymbol);
  }
  
  // Salva no cache em memória
  memoryCache.set(cacheKey, { data: quote, timestamp: Date.now() });
  
  return quote;
}

// Busca cotações em paralelo
export async function getQuotes(tickers: string[]): Promise<TickerQuote[]> {
  if (tickers.length === 0) return [];
  
  const results = await Promise.all(
    tickers.map(symbol => getQuoteWithCache(symbol))
  );
  
  return results;
}

// Aliases para compatibilidade
export const getTickerQuotes = getQuotes;
export const getBrazilQuotes = getQuotes;
