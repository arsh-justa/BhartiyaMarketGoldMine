/**
 * Express backend proxy server for Yahoo Finance and Vite SPA middleware.
 */
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import YahooFinance from 'yahoo-finance2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize YahooFinance client with notices suppressed
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// In-memory cache with 15-minute TTL to respect rate limits
interface CacheEntry {
  data: any;
  timestamp: number;
}
const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Health & sync status information route
 */
app.get('/api/stock/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    source: 'Yahoo Finance (NSE / BSE)',
    method: 'Automated 1st-of-month cadence + On-demand top-left manual refresh',
    cachedQuotes: quoteCache.size,
    serverTime: new Date().toISOString(),
  });
});

/**
 * Bulk quote synchronization route
 * Accepts array of Indian equity symbols (e.g. ['RELIANCE', 'TCS', 'HDFCBANK'])
 */
app.post('/api/stock/sync', async (req: Request, res: Response) => {
  try {
    const rawSymbols: string[] = req.body?.symbols || [];
    if (!rawSymbols || rawSymbols.length === 0) {
      return res.status(400).json({ error: 'No symbols provided in request body' });
    }

    const now = Date.now();
    const results: Record<string, any> = {};
    const toFetch: string[] = [];

    // Map each symbol to standard NSE format (e.g. RELIANCE.NS)
    for (const sym of rawSymbols) {
      const clean = sym.toUpperCase().trim();
      const ticker = clean.includes('.') ? clean : `${clean}.NS`;
      const cached = quoteCache.get(ticker);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        results[clean] = cached.data;
      } else {
        toFetch.push(ticker);
      }
    }

    if (toFetch.length > 0) {
      // Chunk requests in batches of 20 to be safe with upstream API
      const chunkSize = 20;
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        const chunk = toFetch.slice(i, i + chunkSize);
        try {
          const quotes: any = await yahooFinance.quote(chunk);
          const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
          for (const q of quotesArray) {
            if (q && q.symbol) {
              const baseSymbol = q.symbol.replace('.NS', '').replace('.BO', '');
              const marketCapCr = q.marketCap ? Math.round(q.marketCap / 1e7) : null;
              const quoteData = {
                symbol: baseSymbol,
                ticker: q.symbol,
                name: q.shortName || q.longName || baseSymbol,
                regularMarketPrice: q.regularMarketPrice ?? null,
                marketCap: q.marketCap ?? null,
                marketCapCr: marketCapCr,
                currency: q.currency || 'INR',
                exchange: q.exchange || 'NSE',
                regularMarketChangePercent: q.regularMarketChangePercent ?? null,
                regularMarketTime: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : new Date().toISOString(),
                syncedAt: new Date().toISOString(),
              };
              results[baseSymbol] = quoteData;
              quoteCache.set(q.symbol, { data: quoteData, timestamp: now });
            }
          }
        } catch (err: any) {
          console.warn(`Batch fetch error for [${chunk.slice(0, 3).join(', ')}...]: ${err.message}`);
          // Fallback to fetch individually if batch fails
          for (const ticker of chunk) {
            try {
              const q: any = await yahooFinance.quote(ticker);
              if (q && q.symbol) {
                const baseSymbol = q.symbol.replace('.NS', '').replace('.BO', '');
                const marketCapCr = q.marketCap ? Math.round(q.marketCap / 1e7) : null;
                const quoteData = {
                  symbol: baseSymbol,
                  ticker: q.symbol,
                  name: q.shortName || q.longName || baseSymbol,
                  regularMarketPrice: q.regularMarketPrice ?? null,
                  marketCap: q.marketCap ?? null,
                  marketCapCr: marketCapCr,
                  currency: q.currency || 'INR',
                  exchange: q.exchange || 'NSE',
                  regularMarketChangePercent: q.regularMarketChangePercent ?? null,
                  regularMarketTime: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : new Date().toISOString(),
                  syncedAt: new Date().toISOString(),
                };
                results[baseSymbol] = quoteData;
                quoteCache.set(ticker, { data: quoteData, timestamp: now });
              }
            } catch {
              // Silently continue for non-existent tickers
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      count: Object.keys(results).length,
      data: results,
    });
  } catch (err: any) {
    console.error('Error during stock sync:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during stock sync' });
  }
});

/**
 * Single stock quote lookup
 */
app.get('/api/stock/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const raw = req.params.symbol.toUpperCase().trim();
    const ticker = raw.includes('.') ? raw : `${raw}.NS`;

    const now = Date.now();
    const cached = quoteCache.get(ticker);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', data: cached.data });
    }

    const q: any = await yahooFinance.quote(ticker);
    if (!q) {
      return res.status(404).json({ error: `Symbol ${raw} not found` });
    }

    const marketCapCr = q.marketCap ? Math.round(q.marketCap / 1e7) : null;
    const quoteData = {
      symbol: raw,
      ticker: q.symbol,
      name: q.shortName || q.longName || raw,
      regularMarketPrice: q.regularMarketPrice ?? null,
      marketCap: q.marketCap ?? null,
      marketCapCr: marketCapCr,
      currency: q.currency || 'INR',
      exchange: q.exchange || 'NSE',
      regularMarketChangePercent: q.regularMarketChangePercent ?? null,
      regularMarketTime: q.regularMarketTime ? new Date(q.regularMarketTime).toISOString() : new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };

    quoteCache.set(ticker, { data: quoteData, timestamp: now });
    return res.json({ success: true, source: 'live', data: quoteData });
  } catch (err: any) {
    return res.status(404).json({ error: err.message || `Symbol ${req.params.symbol} not found` });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
