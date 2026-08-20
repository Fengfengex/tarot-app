export const READING_TOPICS = Object.freeze({ general: '综合', love: '感情', career: '事业', mood: '心境', spiritual: '灵性' });

export function createReadingController({ fetchImpl = globalThis.fetch, view }) {
  let topic = 'general';
  let sequence = 0;
  let controller;
  return {
    setTopic(next) {
      if (!(next in READING_TOPICS)) throw new Error(`Unknown reading topic: ${next}`);
      topic = next;
    },
    cancel() { sequence += 1; controller?.abort(); },
    async requestReading(card) {
      const current = ++sequence;
      controller?.abort();
      controller = new AbortController();
      view.showLoading();
      try {
        const response = await fetchImpl('/api/reading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ topic, ...card }) });
        const value = await response.json();
        if (!response.ok) throw new Error(value?.error?.message || 'AI 解读暂不可用');
        if (current === sequence) view.showSuccess(value);
      } catch (error) {
        if (current === sequence && error?.name !== 'AbortError') view.showError(error.message || 'AI 解读暂不可用');
      }
    },
  };
}
