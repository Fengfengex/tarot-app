import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ReadingServiceError,
  createReadingService,
  validateReadingOutput,
  validateReadingRequest,
} from '../../src/server/reading-service.mjs';

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

test('accepts all fixed topics and orientations', () => {
  for (const topic of ['general', 'love', 'career', 'mood', 'spiritual']) {
    for (const orientation of ['upright', 'reversed']) {
      assert.deepEqual(validateReadingRequest({ ...validRequest, topic, orientation }), {
        ...validRequest,
        topic,
        orientation,
      });
    }
  }
});

test('rejects unknown, missing, and oversized input', () => {
  assert.throws(() => validateReadingRequest({ ...validRequest, topic: 'health' }), /INVALID_REQUEST/);
  assert.throws(() => validateReadingRequest({ ...validRequest, surprise: true }), /INVALID_REQUEST/);
  assert.throws(() => validateReadingRequest({ ...validRequest, cardName: '' }), /INVALID_REQUEST/);
  assert.throws(() => validateReadingRequest({ ...validRequest, standardMeaning: '意'.repeat(501) }), /INVALID_REQUEST/);
});

test('validates the exact bounded output shape', () => {
  assert.deepEqual(validateReadingOutput(validOutput), validOutput);
  assert.throws(() => validateReadingOutput({ ...validOutput, extra: 'x' }), /INVALID_MODEL_OUTPUT/);
  assert.throws(() => validateReadingOutput({ ...validOutput, reading: '字'.repeat(301) }), /INVALID_MODEL_OUTPUT/);
});

test('requires a server-side API key', async () => {
  const service = createReadingService({ apiKey: '' });
  await assert.rejects(service.generate(validRequest), (error) => {
    assert.equal(error instanceof ReadingServiceError, true);
    assert.equal(error.code, 'AI_NOT_CONFIGURED');
    return true;
  });
});

test('calls DeepSeek V4 Pro without thinking and parses JSON output', async () => {
  let requestUrl;
  let requestBody;
  const service = createReadingService({
    apiKey: 'test-key',
    model: 'deepseek-v4-pro',
    fetchImpl: async (url, init) => {
      requestUrl = url;
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validOutput), reasoning_content: 'private reasoning' } }] }), { status: 200 });
    },
  });

  assert.deepEqual(await service.generate(validRequest), validOutput);
  assert.equal(requestUrl, 'https://api.deepseek.com/chat/completions');
  assert.equal(requestBody.model, 'deepseek-v4-pro');
  assert.deepEqual(requestBody.thinking, { type: 'disabled' });
  assert.equal('reasoning_effort' in requestBody, false);
  assert.deepEqual(requestBody.response_format, { type: 'json_object' });
  assert.equal(requestBody.max_tokens, 500);
  assert.match(requestBody.messages[0].content, /不得提供医疗、法律或投资决策建议/);
  assert.deepEqual(JSON.parse(requestBody.messages[1].content), validRequest);
});

test('maps malformed responses and timeouts to safe errors', async () => {
  const malformed = createReadingService({
    apiKey: 'test-key',
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), { status: 200 }),
  });
  await assert.rejects(malformed.generate(validRequest), (error) => error.code === 'INVALID_MODEL_OUTPUT');

  const timedOut = createReadingService({
    apiKey: 'test-key',
    timeoutMs: 5,
    fetchImpl: async (_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    }),
  });
  await assert.rejects(timedOut.generate(validRequest), (error) => error.code === 'AI_TIMEOUT');
});
