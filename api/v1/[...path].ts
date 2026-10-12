import type { IncomingMessage, ServerResponse } from 'node:http';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

function apiOrigin(): URL {
  const raw = (process.env.API_ORIGIN || '').trim();
  if (!raw) throw new Error('API_ORIGIN is not configured');
  const url = new URL(raw);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('API_ORIGIN must use https in production');
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('API_ORIGIN must be an origin only, for example https://api.example.com');
  }
  return url;
}

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  let total = 0;
  const max = 12 * 1024 * 1024;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > max) throw new Error('Proxy request body exceeds 12MB limit');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function requestHeaders(req: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, raw] of Object.entries(req.headers)) {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP.has(lower) || raw == null) continue;
    if (Array.isArray(raw)) {
      for (const value of raw) headers.append(name, value);
    } else {
      headers.set(name, raw);
    }
  }
  const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
  if (forwardedHost) headers.set('x-forwarded-host', String(forwardedHost));
  headers.set('x-forwarded-proto', 'https');
  return headers;
}

function copyResponseHeaders(upstream: Response, res: ServerResponse) {
  upstream.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === 'content-encoding' || lower === 'set-cookie') return;
    res.setHeader(name, value);
  });

  const headersWithCookies = upstream.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headersWithCookies.getSetCookie?.() ?? [];
  if (cookies.length) res.setHeader('set-cookie', cookies);
  else {
    const cookie = upstream.headers.get('set-cookie');
    if (cookie) res.setHeader('set-cookie', cookie);
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const origin = apiOrigin();
    const requestUrl = new URL(req.url || '/api/v1', 'https://frontend.invalid');
    if (!requestUrl.pathname.startsWith('/api/v1/')) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const target = new URL(requestUrl.pathname + requestUrl.search, origin);
    const body = await readBody(req);
    const upstream = await fetch(target, {
      method: req.method || 'GET',
      headers: requestHeaders(req),
      body,
      redirect: 'manual',
    });

    res.statusCode = upstream.status;
    copyResponseHeaders(upstream, res);
    res.setHeader('x-electroobuddy-proxy', 'vercel');
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.end(responseBody);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      success: false,
      error: { code: 'API_PROXY_UNAVAILABLE', message: 'The API is temporarily unavailable.' },
    }));
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }
}
