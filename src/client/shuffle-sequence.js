const PHASES = ['gather', 'collapse'];
const NORMAL_DURATIONS = Object.freeze({ gather: 2.8, collapse: 1.05 });
const REDUCED_DURATIONS = Object.freeze({ gather: 0.7, collapse: 0.35 });
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const clamp01 = value => Math.max(0, Math.min(1, value));
const smoothstep = value => value * value * (3 - 2 * value);
const mix = (from, to, amount) => from + (to - from) * amount;
const point = (x = 0, y = 0, z = 0) => ({ x, y, z });
const read = value => point(value.x, value.y, value.z);

function write(target, value) {
  if (typeof target.set === 'function') target.set(value.x, value.y, value.z);
  else Object.assign(target, value);
}

function interpolate(target, from, to, amount) {
  write(target, point(mix(from.x, to.x, amount), mix(from.y, to.y, amount), mix(from.z, to.z, amount)));
}

function deckTarget(index, deckY) {
  return { position: point(0, deckY, index * 0.006), rotation: point(), scale: point(1, 1, 1) };
}

function spherePoint(index, count, radius) {
  const y = 1 - (2 * (index + 0.5)) / count;
  const horizontal = Math.sqrt(Math.max(0, 1 - y * y));
  const angle = index * GOLDEN_ANGLE;
  return {
    position: point(radius * horizontal * Math.cos(angle), radius * y, radius * horizontal * Math.sin(angle)),
    rotation: point(-y * 0.3, angle + Math.PI, (index % 7 - 3) * 0.025),
    scale: point(0.24, 0.24, 0.24),
  };
}

function outsidePoint(index, count, radius) {
  const angle = (index / count) * Math.PI * 2 + (index % 5) * 0.17;
  // Keep every starting point beyond the camera frustum, including diagonal angles.
  const distance = radius * (5.2 + (index % 4) * 0.18);
  return {
    position: point(Math.cos(angle) * distance, Math.sin(angle) * distance * 0.85, 0.4 - (index % 4) * 0.12),
    rotation: point((index % 3 - 1) * 0.45, angle, (index % 9 - 4) * 0.12),
    scale: point(0.16, 0.16, 0.16),
  };
}

function rotatedSphereTarget(base, angle, index) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    position: point(base.position.x * cos - base.position.z * sin, base.position.y, base.position.x * sin + base.position.z * cos),
    rotation: point(base.rotation.x, base.rotation.y + angle, base.rotation.z + Math.sin(angle + index) * 0.035),
    scale: base.scale,
  };
}

function snapshot(cards) {
  return cards.map(card => ({ position: read(card.position), rotation: read(card.rotation), scale: read(card.scale) }));
}

export function createShuffleSequence({ reducedMotion = false, radius = 3.4, deckY = -2 } = {}) {
  const durations = reducedMotion ? REDUCED_DURATIONS : NORMAL_DURATIONS;
  let cards = [];
  let sphereTargets = [];
  let outsideTargets = [];
  let collapseStarts = [];
  let phaseIndex = -1;
  let elapsed = 0;
  let completed = false;
  let completionCallback = () => {};
  let state = { phase: 'idle', active: false, ready: false, progress: 0, orbitAngle: 0 };

  function enterPhase(index) {
    phaseIndex = index;
    elapsed = 0;
    if (phaseIndex >= PHASES.length) return finish();
    const phase = PHASES[phaseIndex];
    if (phase === 'collapse') collapseStarts = snapshot(cards);
    state = { ...state, phase, active: true, ready: false, progress: 0 };
  }

  function applyGather(progress) {
    const orbitAngle = progress * Math.PI * (reducedMotion ? 0.45 : 3.4);
    state = { ...state, progress, orbitAngle };
    cards.forEach((card, index) => {
      const delay = (index / Math.max(1, cards.length - 1)) * 0.58;
      const arrival = smoothstep(clamp01((progress - delay) / 0.42));
      const target = rotatedSphereTarget(sphereTargets[index], orbitAngle, index);
      interpolate(card.position, outsideTargets[index].position, target.position, arrival);
      interpolate(card.rotation, outsideTargets[index].rotation, target.rotation, arrival);
      interpolate(card.scale, outsideTargets[index].scale, target.scale, arrival);
    });
  }

  function applyCollapse(progress) {
    const eased = smoothstep(progress);
    state = { ...state, progress };
    cards.forEach((card, index) => {
      const target = deckTarget(index, deckY);
      interpolate(card.position, collapseStarts[index].position, target.position, eased);
      interpolate(card.rotation, collapseStarts[index].rotation, target.rotation, eased);
      interpolate(card.scale, collapseStarts[index].scale, target.scale, eased);
    });
  }

  function finish() {
    cards.forEach((card, index) => {
      const target = deckTarget(index, deckY);
      write(card.position, target.position);
      write(card.rotation, target.rotation);
      write(card.scale, target.scale);
    });
    state = { phase: 'ready', active: false, ready: true, progress: 1, orbitAngle: state.orbitAngle };
    if (!completed) {
      completed = true;
      completionCallback();
    }
  }

  return {
    start(nextCards) {
      if (!Array.isArray(nextCards) || nextCards.length === 0) throw new Error('Shuffle requires at least one card');
      cards = nextCards;
      sphereTargets = cards.map((_, index) => spherePoint(index, cards.length, radius));
      outsideTargets = cards.map((_, index) => outsidePoint(index, cards.length, radius));
      cards.forEach((card, index) => {
        write(card.position, outsideTargets[index].position);
        write(card.rotation, outsideTargets[index].rotation);
        write(card.scale, outsideTargets[index].scale);
      });
      completed = false;
      state = { phase: 'idle', active: false, ready: false, progress: 0, orbitAngle: 0 };
      enterPhase(0);
      return this.getState();
    },
    update(deltaSeconds) {
      if (!state.active || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return this.getState();
      let remaining = deltaSeconds;
      while (remaining > 0 && state.active) {
        const duration = durations[state.phase];
        const consumed = Math.min(remaining, duration - elapsed);
        elapsed += consumed;
        remaining -= consumed;
        const progress = Math.min(1, elapsed / duration);
        if (state.phase === 'gather') applyGather(progress);
        else applyCollapse(progress);
        if (progress >= 1 - Number.EPSILON) enterPhase(phaseIndex + 1);
      }
      return this.getState();
    },
    skip() {
      if (state.active) finish();
      return this.getState();
    },
    reset(nextCards = cards) {
      cards = nextCards;
      cards.forEach((card, index) => {
        const target = deckTarget(index, deckY);
        write(card.position, target.position);
        write(card.rotation, target.rotation);
        write(card.scale, target.scale);
      });
      phaseIndex = -1;
      elapsed = 0;
      completed = false;
      state = { phase: 'idle', active: false, ready: false, progress: 0, orbitAngle: 0 };
      return this.getState();
    },
    getState() { return { ...state }; },
    onComplete(callback) {
      completionCallback = typeof callback === 'function' ? callback : () => {};
      return this;
    },
  };
}
