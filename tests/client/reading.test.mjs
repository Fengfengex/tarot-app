import test from 'node:test';
import assert from 'node:assert/strict';
import { READING_TOPICS, createReadingController } from '../../src/client/reading.js';

const card = { cardName: 'The Fool', orientation: 'upright', standardMeaning: '新的开始。' };
const result = { headline: '标题', reading: '解读', action: '行动', disclaimer: '仅供娱乐。' };

test('exposes the Tarotoo topic fields and defaults to general', async () => {
  assert.deepEqual(Object.keys(READING_TOPICS), ['general', 'love', 'career', 'mood', 'spiritual']);
  let sent;
  const controller = createReadingController({
    fetchImpl: async (_url, init) => { sent = JSON.parse(init.body); return new Response(JSON.stringify(result), { status: 200 }); },
    view: { showLoading() {}, showSuccess() {}, showError() {} },
  });
  await controller.requestReading(card);
  assert.equal(sent.topic, 'general');
});

test('sends selected topic and reports loading then success', async () => {
  const events = [];
  const controller = createReadingController({
    fetchImpl: async (_url, init) => { assert.equal(JSON.parse(init.body).topic, 'love'); return new Response(JSON.stringify(result), { status: 200 }); },
    view: { showLoading: () => events.push('loading'), showSuccess: (value) => events.push(value), showError: () => events.push('error') },
  });
  controller.setTopic('love');
  await controller.requestReading(card);
  assert.deepEqual(events, ['loading', result]);
  assert.throws(() => controller.setTopic('health'), /Unknown reading topic/);
});

test('aborts the old request and ignores its late result', async () => {
  const successes = [];
  let resolveFirst;
  const first = new Promise((resolve) => { resolveFirst = resolve; });
  let calls = 0;
  const controller = createReadingController({
    fetchImpl: async () => (++calls === 1 ? first : new Response(JSON.stringify(result), { status: 200 })),
    view: { showLoading() {}, showSuccess: (value) => successes.push(value), showError() {} },
  });
  const pending = controller.requestReading(card);
  await controller.requestReading({ ...card, cardName: 'The Star' });
  resolveFirst(new Response(JSON.stringify({ ...result, headline: '旧结果' }), { status: 200 }));
  await pending;
  assert.deepEqual(successes, [result]);
});

test('reports a safe error for unsuccessful responses', async () => {
  let message;
  const controller = createReadingController({
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'AI 解读尚未配置' } }), { status: 503 }),
    view: { showLoading() {}, showSuccess() {}, showError: (value) => { message = value; } },
  });
  await controller.requestReading(card);
  assert.equal(message, 'AI 解读尚未配置');
});
