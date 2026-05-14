// Vercel Serverless Function — Yahoo Finance v8 chart proxy.
// Yahoo blocks CORS for browser requests but allows server-to-server. This
// function forwards the chart query with a real user-agent and exposes it
// to the static frontend with permissive CORS + a short cache (5 min).
//
// Usage:  GET /api/stock?symbol=RIO&range=5d
//          GET /api/stock?symbol=YPF&range=1mo
//
// Supported ranges: 1d | 5d | 1mo | 3mo

const INTERVAL_BY_RANGE = {
  '1d':  '5m',
  '5d':  '15m',
  '1mo': '1d',
  '3mo': '1d'
};

const ALLOWED_RANGE = new Set(Object.keys(INTERVAL_BY_RANGE));
// Defense-in-depth: only allow ticker patterns we'd realistically see.
// Letters, digits, dot, dash, equal (BRK-B, BF.B, etc), up to 8 chars.
const TICKER_RE = /^[A-Z0-9.\-=]{1,8}$/i;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const symbol = (req.query.symbol || '').toString().trim().toUpperCase();
  const range  = (req.query.range  || '5d').toString().trim();

  if (!TICKER_RE.test(symbol)) {
    return res.status(400).json({ error: 'invalid_symbol' });
  }
  if (!ALLOWED_RANGE.has(range)) {
    return res.status(400).json({ error: 'invalid_range' });
  }

  const interval = INTERVAL_BY_RANGE[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/plain,*/*'
      }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'upstream_error', status: upstream.status });
    }

    const data = await upstream.json();
    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.status(404).json({ error: 'no_data' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=60, stale-while-revalidate=600');
    return res.status(200).json({
      meta: result.meta || null,
      timestamp: result.timestamp || [],
      close: result.indicators?.quote?.[0]?.close || []
    });
  } catch (e) {
    return res.status(502).json({ error: 'fetch_failed' });
  }
}
