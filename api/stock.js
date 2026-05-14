// Vercel Edge Function — stock data proxy with fallback.
//
// Runs on Vercel Edge Runtime (different IPs than Node serverless, less
// likely to be blocked by Yahoo's rate limiter). Tries Yahoo Finance for
// sparkline + meta. Falls back to Stooq for current quote only. Returns
// JSON with a `sparkline: bool` flag so the frontend can degrade gracefully.

export const config = { runtime: 'edge' };

const INTERVAL_BY_RANGE = {
  '1d':  '5m',
  '5d':  '15m',
  '1mo': '1d',
  '3mo': '1d'
};

const ALLOWED_RANGE = new Set(Object.keys(INTERVAL_BY_RANGE));
// Allow Yahoo-style symbols including ASX (.AX), TSX (.TO), LSE (.L), etc.
const TICKER_RE = /^[A-Z0-9.\-=]{1,12}$/i;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/'
};

const YAHOO_HOSTS = [
  'query2.finance.yahoo.com',
  'query1.finance.yahoo.com'
];

async function fetchYahoo(symbol, range) {
  const interval = INTERVAL_BY_RANGE[range];
  const endpoints = [
    (host) => `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`,
    (host) => `https://${host}/v7/finance/spark?symbols=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}&includePrePost=false`
  ];
  for (const host of YAHOO_HOSTS) {
    for (const buildUrl of endpoints) {
      try {
        const r = await fetch(buildUrl(host), { headers: BROWSER_HEADERS });
        if (!r.ok) continue;
        const data = await r.json();
        const result = data?.chart?.result?.[0] || data?.spark?.result?.[0]?.response?.[0];
        if (!result || !result.timestamp || !result.timestamp.length) continue;
        return {
          source: 'yahoo',
          sparkline: true,
          meta: result.meta || null,
          timestamp: result.timestamp,
          close: result.indicators?.quote?.[0]?.close || []
        };
      } catch (_) { /* try next */ }
    }
  }
  return null;
}

async function fetchStooq(symbol) {
  const stooqSymbol = symbol.toLowerCase() + '.us';
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcvw&h&e=csv`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': BROWSER_HEADERS['User-Agent'] } });
    if (!r.ok) return null;
    const text = await r.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const cells = lines[1].split(',');
    if (cells.length < 8) return null;
    const [sym, date, time, open, high, low, close, volume] = cells;
    const num = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };
    const closeN = num(close);
    if (closeN == null) return null;
    return {
      source: 'stooq',
      sparkline: false,
      meta: {
        symbol: sym.replace('.US', ''),
        currency: 'USD',
        exchangeName: 'US',
        regularMarketPrice: closeN,
        regularMarketDayHigh: num(high),
        regularMarketDayLow: num(low),
        regularMarketVolume: parseInt(volume, 10) || null,
        regularMarketOpen: num(open),
        regularMarketTime: Math.floor(new Date(`${date}T${time}Z`).getTime() / 1000),
        previousClose: null
      },
      timestamp: [],
      close: []
    };
  } catch (_) {
    return null;
  }
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const range  = (searchParams.get('range')  || '5d').trim();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!TICKER_RE.test(symbol)) {
    return new Response(JSON.stringify({ error: 'invalid_symbol' }), { status: 400, headers });
  }
  if (!ALLOWED_RANGE.has(range)) {
    return new Response(JSON.stringify({ error: 'invalid_range' }), { status: 400, headers });
  }

  const yahoo = await fetchYahoo(symbol, range);
  if (yahoo) {
    return new Response(JSON.stringify(yahoo), {
      status: 200,
      headers: { ...headers, 'Cache-Control': 'public, s-maxage=300, max-age=60, stale-while-revalidate=600' }
    });
  }

  const stooq = await fetchStooq(symbol);
  if (stooq) {
    return new Response(JSON.stringify(stooq), {
      status: 200,
      headers: { ...headers, 'Cache-Control': 'public, s-maxage=300, max-age=60, stale-while-revalidate=600' }
    });
  }

  return new Response(JSON.stringify({ error: 'all_sources_failed' }), { status: 502, headers });
}
