import { ReadingServiceError } from './reading-service.mjs';

const POSITIONS = ['现状', '核心影响', '发展建议'];
const LIMITS = { headline: 40, overview: 700, synthesis: 700, action: 240, disclaimer: 80 };

function boundedString(value, max, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ReadingServiceError('INVALID_MODEL_OUTPUT', `Invalid ${field}`);
  return value.trim();
}

export function validateProphecyRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 1) throw new ReadingServiceError('INVALID_REQUEST', '请求字段无效', 400);
  if (typeof value.prompt !== 'string' || value.prompt.length < 200 || value.prompt.length > 14_000) throw new ReadingServiceError('INVALID_REQUEST', 'Prompt 长度无效', 400);
  return { prompt: value.prompt };
}

export function validateProphecyOutput(value) {
  const expected = ['headline', 'overview', 'cards', 'synthesis', 'action', 'disclaimer'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== expected.sort().join() || !Array.isArray(value.cards) || value.cards.length !== 3) {
    throw new ReadingServiceError('INVALID_MODEL_OUTPUT', 'AI 返回内容结构无效');
  }
  const cards = value.cards.map((card, index) => {
    if (!card || typeof card !== 'object' || Object.keys(card).sort().join() !== ['position', 'card', 'interpretation'].sort().join() || card.position !== POSITIONS[index]) {
      throw new ReadingServiceError('INVALID_MODEL_OUTPUT', 'AI 卡牌解读结构无效');
    }
    return { position: card.position, card: boundedString(card.card, 80, 'card'), interpretation: boundedString(card.interpretation, 500, 'interpretation') };
  });
  return {
    headline: boundedString(value.headline, LIMITS.headline, 'headline'), overview: boundedString(value.overview, LIMITS.overview, 'overview'), cards,
    synthesis: boundedString(value.synthesis, LIMITS.synthesis, 'synthesis'), action: boundedString(value.action, LIMITS.action, 'action'), disclaimer: boundedString(value.disclaimer, LIMITS.disclaimer, 'disclaimer'),
  };
}

export function createProphecyService({ apiKey = '', model = 'deepseek-v4-pro', fetchImpl = globalThis.fetch, timeoutMs = 30_000 } = {}) {
  return { async generate(rawRequest) {
    const { prompt } = validateProphecyRequest(rawRequest);
    if (!apiKey) throw new ReadingServiceError('AI_NOT_CONFIGURED', 'AI 预言尚未配置', 503);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({
        model, messages: [
          { role: 'system', content: '你是塔罗反思解读助手。严格遵循用户提供的资料、约束和 JSON 输出格式。不得输出 Markdown 或 JSON 之外的内容。' },
          { role: 'user', content: prompt },
        ], stream: false, thinking: { type: 'disabled' }, response_format: { type: 'json_object' }, max_tokens: 1400,
      }) });
      if (!response.ok) throw new ReadingServiceError('AI_UPSTREAM_ERROR', 'AI 预言服务暂不可用');
      const payload = await response.json();
      let parsed;
      try { parsed = JSON.parse(payload?.choices?.[0]?.message?.content); } catch { throw new ReadingServiceError('INVALID_MODEL_OUTPUT', 'AI 返回内容格式无效'); }
      return validateProphecyOutput(parsed);
    } catch (error) {
      if (error instanceof ReadingServiceError) throw error;
      if (controller.signal.aborted) throw new ReadingServiceError('AI_TIMEOUT', 'AI 预言请求超时', 504);
      throw new ReadingServiceError('AI_UPSTREAM_ERROR', 'AI 预言服务暂不可用');
    } finally { clearTimeout(timeout); }
  } };
}
