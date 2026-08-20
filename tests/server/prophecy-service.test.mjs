import test from 'node:test';
import assert from 'node:assert/strict';
import { createProphecyService, validateProphecyOutput, validateProphecyRequest } from '../../src/server/prophecy-service.mjs';

const prompt = '完整三牌 Prompt：' + '牌义与解读规则。'.repeat(40);
const output = {
  headline: '新的方向正在形成', overview: '整体来看，你正处在一个需要整合经验的阶段。',
  cards: [
    { position: '现状', card: 'The Fool', interpretation: '新的可能正在出现。' },
    { position: '核心影响', card: 'The Magician', interpretation: '你已有可调动的资源。' },
    { position: '发展建议', card: 'The High Priestess', interpretation: '给判断留出沉淀时间。' },
  ],
  synthesis: '三张牌从开启、行动走向内在确认。', action: '写下一个本周可以验证的小步骤。', disclaimer: '本解读仅供娱乐与自我反思，不替代专业建议。',
};

test('validates the full prompt and structured three-card output', () => {
  assert.deepEqual(validateProphecyRequest({ prompt }), { prompt });
  assert.deepEqual(validateProphecyOutput(output), output);
  assert.throws(() => validateProphecyRequest({ prompt: 'too short' }), /INVALID_REQUEST/);
  assert.throws(() => validateProphecyOutput({ ...output, cards: output.cards.slice(1) }), /INVALID_MODEL_OUTPUT/);
});

test('sends the displayed prompt to DeepSeek and parses its JSON result', async () => {
  let body;
  const service = createProphecyService({ apiKey: 'test-key', fetchImpl: async (_url, init) => {
    body = JSON.parse(init.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] }), { status: 200 });
  } });
  assert.deepEqual(await service.generate({ prompt }), output);
  assert.equal(body.messages[1].content, prompt);
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.equal(body.max_tokens, 1400);
});
