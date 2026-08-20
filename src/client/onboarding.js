const MODES = new Set(['gesture', 'mouse']);
const TOPICS = new Set(['general', 'love', 'career', 'mood', 'spiritual']);
const PATHS = Object.freeze({
  gesture: ['shuffle', 'locate-input', 'target-deck', 'grab', 'reveal', 'result-explainer'],
  mouse: ['shuffle', 'target-deck', 'grab', 'reveal', 'result-explainer'],
});
const EVENT_FOR_PHASE = Object.freeze({
  shuffle: 'shuffle-complete',
  'locate-input': 'hand-visible',
  'target-deck': 'deck-targeted',
  grab: 'card-grabbed',
  reveal: 'card-revealed',
  'result-explainer': 'result-explainer-dismissed',
});

export function createOnboardingController({
  storage = globalThis.localStorage,
  completedKey = 'ether-tarot:onboarding-complete',
} = {}) {
  let completed = false;
  try { completed = storage?.getItem(completedKey) === '1'; } catch {}

  let state = {
    phase: completed ? 'complete' : 'welcome',
    mode: null,
    topic: 'general',
    active: !completed,
    firstVisit: !completed,
    completed,
  };

  const snapshot = () => ({ ...state });
  const setPhase = (phase) => { state = { ...state, phase }; };

  function finish({ persist }) {
    if (persist) {
      try { storage?.setItem(completedKey, '1'); } catch {}
    }
    state = {
      ...state,
      phase: 'complete',
      active: false,
      firstVisit: persist ? false : state.firstVisit,
      completed: persist ? true : state.completed,
    };
    return snapshot();
  }

  return {
    getState: snapshot,
    selectMode(mode) {
      if (!MODES.has(mode)) throw new Error(`Unknown onboarding mode: ${mode}`);
      state = { ...state, mode, phase: 'topic', active: true };
      return snapshot();
    },
    selectTopic(topic) {
      if (!TOPICS.has(topic)) throw new Error(`Unknown onboarding topic: ${topic}`);
      state = { ...state, topic };
      return snapshot();
    },
    start() {
      if (!MODES.has(state.mode)) throw new Error('Select an onboarding mode before starting');
      setPhase(PATHS[state.mode][0]);
      state = { ...state, active: true };
      return snapshot();
    },
    notify(event) {
      if (!state.active || EVENT_FOR_PHASE[state.phase] !== event) return snapshot();
      if (state.phase === 'result-explainer') return finish({ persist: true });
      const path = PATHS[state.mode];
      const next = path[path.indexOf(state.phase) + 1];
      if (next) setPhase(next);
      return snapshot();
    },
    replay(mode = state.mode || 'mouse') {
      if (!MODES.has(mode)) throw new Error(`Unknown onboarding mode: ${mode}`);
      state = { ...state, mode, phase: PATHS[mode][0], active: true };
      return snapshot();
    },
    skip() { return finish({ persist: false }); },
    complete() { return finish({ persist: true }); },
  };
}
