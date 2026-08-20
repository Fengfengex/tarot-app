const TOPICS = new Set(['general', 'love', 'career', 'mood', 'spiritual']);
const ORIENTATIONS = new Set(['upright', 'reversed']);

const OUTPUT_LIMITS = { headline: 40, reading: 300, action: 120, disclaimer: 40 };

export class ReadingServiceError extends Error {
  constructor(code, message, status = 502) {
    super(`${code}: ${message}`);
    this.name = 'ReadingServiceError';
    this.code = code;
    this.status = status;
  }
}

function exactObject(value, keys, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReadingServiceError(code, 'Expected an object', 400);
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new ReadingServiceError(code, 'Unexpected or missing fields', 400);
  }
}

function boundedString(value, max, code, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new ReadingServiceError(code, `Invalid ${field}`, 400);
  }
  return value.trim();
}

export function validateReadingRequest(value) {
  exactObject(value, ['topic', 'cardName', 'orientation', 'standardMeaning'], 'INVALID_REQUEST');
  if (!TOPICS.has(value.topic) || !ORIENTATIONS.has(value.orientation)) {
    throw new ReadingServiceError('INVALID_REQUEST', 'Invalid topic or orientation', 400);
  }
  return {
    topic: value.topic,
    cardName: boundedString(value.cardName, 80, 'INVALID_REQUEST', 'cardName'),
    orientation: value.orientation,
    standardMeaning: boundedString(value.standardMeaning, 500, 'INVALID_REQUEST', 'standardMeaning'),
  };
}

export function validateReadingOutput(value) {
  exactObject(value, Object.keys(OUTPUT_LIMITS), 'INVALID_MODEL_OUTPUT');
  return Object.fromEntries(Object.entries(OUTPUT_LIMITS).map(([field, max]) => [
    field,
    boundedString(value[field], max, 'INVALID_MODEL_OUTPUT', field),
  ]));
}

const instructions = `你是一个克制、温和的塔罗反思文案助手。只能依据用户消息中的固定主题、牌名、正逆位和标准牌义生成简体中文内容。使用“可能”“提醒”“可以考虑”等非确定性措辞，不得宣称预知事实、必然结果、诅咒或制造恐惧。不得提供医疗、法律或投资决策建议，不得索取个人信息。action 必须是低风险、现实可行的小行动。disclaimer 必须说明内容仅供娱乐与自我反思。只返回一个 JSON 对象，且必须恰好包含 headline、reading、action、disclaimer 四个字符串字段。`;

function outputText(payload) {
  return typeof payload?.choices?.[0]?.message?.content === 'string'
    ? payload.choices[0].message.content
    : '';
}

export function createReadingService({
  apiKey = '',
  model = 'deepseek-v4-pro',
  fetchImpl = globalThis.fetch,
  timeoutMs = 12_000,
} = {}) {
  return {
    async generate(rawRequest, { signal: outerSignal } = {}) {
      const request = validateReadingRequest(rawRequest);
      if (!apiKey) throw new ReadingServiceError('AI_NOT_CONFIGURED', 'AI 解读尚未配置', 503);

      const timeoutController = new AbortController();
      const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
      const abortFromOuter = () => timeoutController.abort();
      outerSignal?.addEventListener('abort', abortFromOuter, { once: true });
      try {
        const response = await fetchImpl('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          signal: timeoutController.signal,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: instructions },
              { role: 'user', content: JSON.stringify(request) },
            ],
            stream: false,
            thinking: { type: 'disabled' },
            response_format: { type: 'json_object' },
            max_tokens: 500,
          }),
        });
        if (!response.ok) throw new ReadingServiceError('AI_UPSTREAM_ERROR', 'AI 解读服务暂不可用');
        const payload = await response.json();
        let parsed;
        try { parsed = JSON.parse(outputText(payload)); } catch {
          throw new ReadingServiceError('INVALID_MODEL_OUTPUT', 'AI 返回内容格式无效');
        }
        return validateReadingOutput(parsed);
      } catch (error) {
        if (error instanceof ReadingServiceError) throw error;
        if (timeoutController.signal.aborted) throw new ReadingServiceError('AI_TIMEOUT', 'AI 解读请求超时', 504);
        throw new ReadingServiceError('AI_UPSTREAM_ERROR', 'AI 解读服务暂不可用');
      } finally {
        clearTimeout(timeout);
        outerSignal?.removeEventListener('abort', abortFromOuter);
      }
    },
  };
}
