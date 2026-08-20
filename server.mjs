import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReadingService, ReadingServiceError } from './src/server/reading-service.mjs';
import { createProphecyService } from './src/server/prophecy-service.mjs';
import { createRateLimiter } from './src/server/rate-limit.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

function headers(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com; worker-src 'self' blob:; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'");
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

async function readJson(req) {
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    throw new ReadingServiceError('UNSUPPORTED_MEDIA_TYPE', '请求必须使用 JSON', 415);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw new ReadingServiceError('PAYLOAD_TOO_LARGE', '请求内容过大', 413);
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {
    throw new ReadingServiceError('INVALID_JSON', 'JSON 格式无效', 400);
  }
}

export function createAppServer({ readingService, prophecyService, rateLimit } = {}) {
  const service = readingService ?? createReadingService({ apiKey: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL });
  const prophecy = prophecyService ?? createProphecyService({ apiKey: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL });
  const allow = createRateLimiter(rateLimit);
  return http.createServer(async (req, res) => {
    headers(res);
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/prophecy') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST' } }); }
      if (!allow(req.socket.remoteAddress ?? 'unknown')) return json(res, 429, { error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' } });
      try { return json(res, 200, await prophecy.generate(await readJson(req))); }
      catch (error) {
        const safe = error instanceof ReadingServiceError ? error : new ReadingServiceError('INTERNAL_ERROR', '服务暂不可用');
        return json(res, safe.status, { error: { code: safe.code, message: safe.message.replace(/^\w+:\s*/, '') } });
      }
    }
    if (url.pathname === '/api/reading') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST' } }); }
      if (!allow(req.socket.remoteAddress ?? 'unknown')) return json(res, 429, { error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' } });
      try {
        const result = await service.generate(await readJson(req));
        return json(res, 200, result);
      } catch (error) {
        const safe = error instanceof ReadingServiceError ? error : new ReadingServiceError('INTERNAL_ERROR', '服务暂不可用');
        return json(res, safe.status, { error: { code: safe.code, message: safe.message.replace(/^\w+:\s*/, '') } });
      }
    }

    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '不支持该方法' } });
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    if (pathname.startsWith('/vendor/')) { res.writeHead(404); return res.end('Not Found'); }
    if (pathname === '/') pathname = '/index.html';
    const file = resolve(root, `.${pathname}`);
    const rootPrefix = root.endsWith(sep) ? root : root + sep;
    if (!file.startsWith(rootPrefix) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('Not Found'); }
    res.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  });
}

export function startServer({
  port = Number(process.env.PORT) || 8090,
  host = '127.0.0.1',
  log = console.log,
} = {}) {
  const server = createAppServer();
  return new Promise((resolveStart, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      const actualPort = server.address().port;
      log(`Ether Tarot running at http://localhost:${actualPort}`);
      resolveStart(server);
    });
  });
}

if (process.argv[1]?.endsWith('server.mjs')) {
  startServer().catch((error) => {
    console.error(`Unable to start Ether Tarot: ${error.message}`);
    process.exitCode = 1;
  });
}
