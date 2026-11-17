/**
 * Express backend proxy server for Indian equity market data and Vite SPA middleware.
 */
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import YahooFinance from 'yahoo-finance2';
import nodemailer from 'nodemailer';

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
    source: 'NSE / BSE Live Market Feed',
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

    // Map each symbol to standard NSE format (e.g. RELIANCE.NS, or ^NSEI for NSE)
    for (const sym of rawSymbols) {
      const clean = sym.toUpperCase().trim();
      const ticker = clean === 'NSE' ? '^NSEI' : clean.includes('.') ? clean : `${clean}.NS`;
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
              const baseSymbol = q.symbol === '^NSEI' ? 'NSE' : q.symbol.replace('.NS', '').replace('.BO', '');
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
    const ticker = raw === 'NSE' ? '^NSEI' : raw.includes('.') ? raw : `${raw}.NS`;

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

const historyCache = new Map<string, CacheEntry>();

function toIstYearMonth(dateVal: Date): string {
  const ist = new Date(dateVal.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function toUtcYearMonth(dateVal: Date): string {
  const y = dateVal.getUTCFullYear();
  const m = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function dateToIndianFy(dateVal: Date): string {
  const y = dateVal.getUTCFullYear();
  const m = dateVal.getUTCMonth() + 1; // 1..12
  const fyEndYear = m >= 4 ? y + 1 : y;
  return `FY${String(fyEndYear).slice(-2)}`;
}

/**
 * 10-year historical market cap (from monthly share prices) and audited PAT/Revenue
 */
app.get('/api/stock/history/:symbol', async (req: Request, res: Response) => {
  try {
    const raw = req.params.symbol.toUpperCase().trim();
    const now = Date.now();
    const cached = historyCache.get(raw);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, source: 'cache', data: cached.data });
    }

    const isIndex = raw === 'NSE' || raw === 'NIFTY' || raw === 'NIFTY50';
    const primaryTicker = isIndex ? '^NSEI' : raw.includes('.') ? raw : `${raw}.NS`;

    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 10);
    period1.setMonth(period1.getMonth() - 1);

    let activeTicker = primaryTicker;
    let quoteRes: any = null;
    let chartRes: any = null;

    const fetchQuoteAndChart = async (ticker: string) => {
      const [q, c] = await Promise.all([
        yahooFinance.quote(ticker).catch(() => null),
        yahooFinance.chart(ticker, { period1, interval: '1mo' }).catch(() => null),
      ]);
      return { q, c };
    };

    const primary = await fetchQuoteAndChart(primaryTicker);
    quoteRes = primary.q;
    chartRes = primary.c;

    if ((!chartRes || !Array.isArray(chartRes.quotes) || chartRes.quotes.length === 0) && !isIndex && !raw.includes('.')) {
      const boTicker = `${raw}.BO`;
      const fallback = await fetchQuoteAndChart(boTicker);
      if (fallback.c && Array.isArray(fallback.c.quotes) && fallback.c.quotes.length > 0) {
        activeTicker = boTicker;
        quoteRes = fallback.q || quoteRes;
        chartRes = fallback.c;
      }
    }

    const [annualRes, quarterlyRes] = isIndex
      ? [[], []]
      : await Promise.all([
          yahooFinance.fundamentalsTimeSeries(activeTicker, { period1, type: 'annual', module: 'financials' }).catch(() => []),
          yahooFinance.fundamentalsTimeSeries(activeTicker, { period1, type: 'quarterly', module: 'financials' }).catch(() => []),
        ]);

    const livePrice = typeof quoteRes?.regularMarketPrice === 'number' ? quoteRes.regularMarketPrice : null;
    const liveMarketCapCr = typeof quoteRes?.marketCap === 'number' ? Math.round(quoteRes.marketCap / 1e7) : null;
    const sharesOutstanding =
      typeof quoteRes?.sharesOutstanding === 'number' && quoteRes.sharesOutstanding > 0
        ? quoteRes.sharesOutstanding
        : livePrice && liveMarketCapCr
          ? (liveMarketCapCr * 1e7) / livePrice
          : null;

    const monthlyCloses: Record<string, number> = {};
    const monthlyMarketCapCr: Record<string, number> = {};

    const quotesList: any[] = Array.isArray(chartRes?.quotes) ? chartRes.quotes : [];
    for (const bar of quotesList) {
      if (!bar?.date || typeof bar.close !== 'number' || !Number.isFinite(bar.close) || bar.close <= 0) {
        continue;
      }
      const d = bar.date instanceof Date ? bar.date : new Date(bar.date);
      const ym = toIstYearMonth(d);
      const closeRounded = Number(bar.close.toFixed(2));
      monthlyCloses[ym] = closeRounded;
      if (sharesOutstanding) {
        monthlyMarketCapCr[ym] = Math.round((closeRounded * sharesOutstanding) / 1e7);
      }
    }

    const annualFinancials: Record<string, { patCr: number | null; revenueCr: number | null }> = {};
    for (const row of (Array.isArray(annualRes) ? annualRes : []) as Array<Record<string, any>>) {
      if (!row?.date) continue;
      const d = row.date instanceof Date ? row.date : new Date(row.date);
      const fy = dateToIndianFy(d);
      const patCr = typeof row.netIncome === 'number' && Number.isFinite(row.netIncome) ? Math.round(row.netIncome / 1e7) : null;
      const revenueCr = typeof row.totalRevenue === 'number' && Number.isFinite(row.totalRevenue) ? Math.round(row.totalRevenue / 1e7) : null;
      if (patCr !== null || revenueCr !== null) {
        annualFinancials[fy] = { patCr, revenueCr };
      }
    }

    const quarterlyFinancials: Record<string, { patCr: number | null; revenueCr: number | null }> = {};
    for (const row of (Array.isArray(quarterlyRes) ? quarterlyRes : []) as Array<Record<string, any>>) {
      if (!row?.date) continue;
      const d = row.date instanceof Date ? row.date : new Date(row.date);
      const ym = toUtcYearMonth(d);
      const patCr = typeof row.netIncome === 'number' && Number.isFinite(row.netIncome) ? Math.round(row.netIncome / 1e7) : null;
      const revenueCr = typeof row.totalRevenue === 'number' && Number.isFinite(row.totalRevenue) ? Math.round(row.totalRevenue / 1e7) : null;
      if (patCr !== null || revenueCr !== null) {
        quarterlyFinancials[ym] = { patCr, revenueCr };
      }
    }

    const payload = {
      symbol: raw,
      ticker: activeTicker,
      isIndex,
      livePrice,
      liveMarketCapCr,
      monthlyCloses,
      monthlyMarketCapCr,
      annualFinancials,
      quarterlyFinancials,
      fetchedAt: new Date().toISOString(),
    };

    historyCache.set(raw, { data: payload, timestamp: now });
    return res.json({ success: true, source: 'live', data: payload });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || `Failed to load 10-year history for ${req.params.symbol}` });
  }
});

interface FeedbackEntry {
  id: string;
  name: string;
  contact: string;
  message: string;
  submittedAt: string;
  emailDispatched: boolean;
}

interface OutboundMailPayload {
  from: string;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

const feedbackStore: FeedbackEntry[] = [];
const outboundMailLog: Array<OutboundMailPayload & { timestamp: string; dispatched: boolean }> = [];

async function dispatchMail(payload: OutboundMailPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const port = Number(process.env.SMTP_PORT || 587);

  let dispatched = false;
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: payload.from,
        to: payload.to,
        replyTo: payload.replyTo,
        subject: payload.subject,
        text: payload.text,
      });
      dispatched = true;
    } catch (err: any) {
      console.warn(`SMTP dispatch warning (${payload.subject}): ${err?.message || err}`);
    }
  } else {
    console.info(`[Mail Queue] From: ${payload.from} | To: ${payload.to} | Subject: ${payload.subject}`);
  }

  outboundMailLog.push({
    ...payload,
    timestamp: new Date().toISOString(),
    dispatched,
  });

  return dispatched;
}

// Server Time Persistence (1000-day bar)
const SERVER_TIME_MAX_DAYS = 1000;
const SERVER_TIME_INITIAL_DAYS = 100;
const SERVER_TIME_EXTEND_STEP = 1;
const SERVER_TIME_FILE = '/tmp/bhartiyamarket-server-time.json';

interface ServerTimeState {
  daysRemaining: number;
  lastTickIso: string;
  lowAlertSent: boolean;
}

function loadServerTimeState(): ServerTimeState {
  try {
    if (fs.existsSync(SERVER_TIME_FILE)) {
      const raw = fs.readFileSync(SERVER_TIME_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed?.daysRemaining === 'number' && typeof parsed?.lastTickIso === 'string') {
        return {
          daysRemaining: Math.max(0, Math.min(SERVER_TIME_MAX_DAYS, parsed.daysRemaining)),
          lastTickIso: parsed.lastTickIso,
          lowAlertSent: Boolean(parsed.lowAlertSent),
        };
      }
    }
  } catch {
    // Fallback to clean initial state
  }
  return {
    daysRemaining: SERVER_TIME_INITIAL_DAYS,
    lastTickIso: new Date().toISOString(),
    lowAlertSent: false,
  };
}

function saveServerTimeState(state: ServerTimeState): void {
  try {
    fs.writeFileSync(SERVER_TIME_FILE, JSON.stringify(state), 'utf-8');
  } catch {
    // Ignore filesystem errors in read-only sandboxes
  }
}

let serverTimeState: ServerTimeState = loadServerTimeState();

async function evaluateServerTimeCountdown(): Promise<ServerTimeState> {
  const nowMs = Date.now();
  const lastMs = new Date(serverTimeState.lastTickIso).getTime();
  if (Number.isFinite(lastMs) && nowMs > lastMs) {
    const elapsedDays = Math.floor((nowMs - lastMs) / (24 * 60 * 60 * 1000));
    if (elapsedDays >= 1) {
      serverTimeState.daysRemaining = Math.max(0, serverTimeState.daysRemaining - elapsedDays);
      serverTimeState.lastTickIso = new Date(lastMs + elapsedDays * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  if (serverTimeState.daysRemaining < 15 && !serverTimeState.lowAlertSent) {
    serverTimeState.lowAlertSent = true;
    saveServerTimeState(serverTimeState);
    await dispatchMail({
      from: 'support@bhartiyamarket.com',
      to: process.env.ALERT_EMAIL_TO?.trim() || 'admin@bhartiyamarket.com',
      subject: 'Bhartiya Market 15 days left',
      text: `Alert: Bhartiya Market server time is critically low (${serverTimeState.daysRemaining} days left out of ${SERVER_TIME_MAX_DAYS} days). Please renew or extend server time.`,
    });
  } else {
    saveServerTimeState(serverTimeState);
  }

  return serverTimeState;
}

function getServerTimeZone(days: number): 'red' | 'red-to-yellow' | 'yellow' | 'green' | 'dark-green' {
  if (days < 60) return 'red';
  if (days < 180) return 'red-to-yellow';
  if (days < 300) return 'yellow';
  if (days < 600) return 'green';
  return 'dark-green';
}

app.get('/api/server-time', async (_req: Request, res: Response) => {
  const state = await evaluateServerTimeCountdown();
  return res.json({
    daysRemaining: state.daysRemaining,
    maxDays: SERVER_TIME_MAX_DAYS,
    status: getServerTimeZone(state.daysRemaining),
    lowAlertSent: state.lowAlertSent,
  });
});

app.post('/api/server-time/extend', async (_req: Request, res: Response) => {
  const state = await evaluateServerTimeCountdown();
  state.daysRemaining = Math.min(SERVER_TIME_MAX_DAYS, state.daysRemaining + SERVER_TIME_EXTEND_STEP);
  state.lastTickIso = new Date().toISOString();
  if (state.daysRemaining >= 15) {
    state.lowAlertSent = false;
  }
  saveServerTimeState(state);

  return res.json({
    daysRemaining: state.daysRemaining,
    maxDays: SERVER_TIME_MAX_DAYS,
    status: getServerTimeZone(state.daysRemaining),
    lowAlertSent: state.lowAlertSent,
  });
});

function isValidEmailOrPhone(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digitsOnly = value.replace(/[\s\-()+]/g, '');
  const phoneRegex = /^\d{10,15}$/;
  return emailRegex.test(value) || phoneRegex.test(digitsOnly);
}

/**
 * Visitor feedback submission route
 */
app.post('/api/feedback', async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
  const contact = typeof req.body?.contact === 'string' ? req.body.contact.trim().slice(0, 120) : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1000) : '';

  if (!contact || !isValidEmailOrPhone(contact)) {
    return res.status(400).json({
      error: 'Please enter a valid Email ID or 10-digit Phone Number before submitting.',
    });
  }

  if (!message) {
    return res.status(400).json({ error: 'Please enter your feedback message before submitting.' });
  }

  const emailDispatched = await dispatchMail({
    from: 'support@bhartiyamarket.com',
    to: 'agrominrastogi@gmail.com',
    replyTo: contact.includes('@') ? contact : undefined,
    subject: `Bhartiya Market Feedback from ${name || contact}`,
    text: [
      'New Feedback Received on Bhartiya Market',
      `Name: ${name || 'Not provided'}`,
      `Email / Phone: ${contact}`,
      `Submitted At: ${new Date().toISOString()}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  });

  const entry: FeedbackEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || 'Visitor',
    contact,
    message,
    submittedAt: new Date().toISOString(),
    emailDispatched,
  };

  feedbackStore.push(entry);
  return res.status(201).json({ success: true, entry, emailDispatched });
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
