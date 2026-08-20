import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer, startServer } from '../../server.mjs';

const reading = { headline: '标题', reading: '解读', action: '行动', disclaimer: '仅供娱乐与自我反思。' };
const body = { topic: 'general', cardName: 'The Fool', orientation: 'upright', standardMeaning: '新的开始。' };

async function withServer(options, fn) {
  const server = createAppServer(options);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('serves the app with security headers', async () => withServer({}, async (base) => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Ether Tarot/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const csp = response.headers.get('content-security-policy');
  assert.ok(csp);
  assert.match(csp, /script-src[^;]*'wasm-unsafe-eval'/);
  assert.match(csp, /worker-src[^;]*blob:/);
}));

test('does not expose legacy vendor modules', async () => withServer({}, async (base) => {
  assert.equal((await fetch(`${base}/vendor/anime.esm.js`)).status, 404);
  assert.equal((await fetch(`${base}/vendor/package.json`)).status, 404);
}));

test('returns a generated reading and rejects invalid API requests', async () => withServer({
  readingService: { generate: async () => reading },
}, async (base) => {
  const ok = await fetch(`${base}/api/reading`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), reading);

  assert.equal((await fetch(`${base}/api/reading`)).status, 405);
  const bad = await fetch(`${base}/api/reading`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' });
  assert.equal(bad.status, 415);
}));

test('blocks traversal and rate limits repeated API calls', async () => withServer({
  readingService: { generate: async () => reading }, rateLimit: { limit: 1, windowMs: 60_000 },
}, async (base) => {
  assert.notEqual((await fetch(`${base}/..%2Fpackage.json`)).status, 200);
  const init = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
  assert.equal((await fetch(`${base}/api/reading`, init)).status, 200);
  assert.equal((await fetch(`${base}/api/reading`, init)).status, 429);
}));

test('startServer listens on the configured local address', async () => {
  const server = await startServer({ port: 0, host: '127.0.0.1', log: () => {} });
  try {
    assert.equal(server.address().address, '127.0.0.1');
    assert.ok(server.address().port > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
