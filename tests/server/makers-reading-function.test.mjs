import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost } from '../../cloud-functions/api/reading.js';

const validRequest = {
  topic: 'career',
  cardName: 'The Fool',
  orientation: 'upright',
  standardMeaning: '新的开始，自由，纯真。',
};

const validOutput = {
  headline: '给新可能留出位置',
  reading: '这张牌提醒你，新方向可能值得小步探索。',
  action: '今天写下一项可以低成本尝试的行动。',
  disclaimer: '内容仅供娱乐与自我反思。',
};

function request() {
  return new Request('https://example.test/api/reading', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validRequest),
  });
}

test('returns a DeepSeek reading from the Makers handler', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(validOutput) } }],
  }), { status: 200 }));

  const response = await onRequestPost({
    request: request(),
    env: { DEEPSEEK_API_KEY: 'test-key', DEEPSEEK_MODEL: 'deepseek-v4-pro' },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), validOutput);
});

test('returns a safe error when the Makers secret is missing', async () => {
  const response = await onRequestPost({ request: request(), env: {} });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: { code: 'AI_NOT_CONFIGURED', message: 'AI 解读尚未配置' },
  });
});

test('rejects non-JSON Makers requests', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.test/api/reading', { method: 'POST', body: '{}' }),
    env: { DEEPSEEK_API_KEY: 'test-key' },
  });

  assert.equal(response.status, 415);
  assert.equal((await response.json()).error.code, 'UNSUPPORTED_MEDIA_TYPE');
});
