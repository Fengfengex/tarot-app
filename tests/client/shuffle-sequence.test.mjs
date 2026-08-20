import test from 'node:test';
import assert from 'node:assert/strict';
import { createShuffleSequence } from '../../src/client/shuffle-sequence.js';

const vector = (x = 0, y = 0, z = 0) => ({ x, y, z });
const cards = (count = 78) => Array.from({ length: count }, (_, index) => ({
  position: vector(0, -2, index * 0.006), rotation: vector(), scale: vector(1, 1, 1),
}));

test('cards gather from outside, collapse, and complete once', () => {
  const deck = cards();
  const sequence = createShuffleSequence();
  let completed = 0;
  sequence.onComplete(() => { completed += 1; });
  sequence.start(deck);
  assert.equal(sequence.getState().phase, 'gather');
  assert.ok(deck.every(card => Math.max(Math.abs(card.position.x), Math.abs(card.position.y)) > 9));
  sequence.update(2.8);
  assert.equal(sequence.getState().phase, 'collapse');
  sequence.update(1.05);
  assert.equal(sequence.getState().phase, 'ready');
  assert.equal(completed, 1);
  sequence.update(5);
  assert.equal(completed, 1);
});

test('early cards rotate on the sphere while later cards are still arriving', () => {
  const deck = cards();
  const sequence = createShuffleSequence({ radius: 3.4 });
  sequence.start(deck);
  sequence.update(1.2);
  const earlyPosition = { ...deck[0].position };
  const lateDistance = Math.hypot(deck.at(-1).position.x, deck.at(-1).position.y);
  assert.ok(Math.abs(Math.hypot(earlyPosition.x, earlyPosition.y, earlyPosition.z) - 3.4) < 0.001);
  assert.ok(lateDistance > 5);
  sequence.update(0.35);
  assert.notDeepEqual(deck[0].position, earlyPosition);
  assert.ok(sequence.getState().orbitAngle > Math.PI);
});

test('all cards occupy unique sphere positions before collapse begins', () => {
  const deck = cards();
  const sequence = createShuffleSequence({ radius: 3.4 });
  sequence.start(deck);
  sequence.update(2.8);
  const radii = deck.map(card => Math.hypot(card.position.x, card.position.y, card.position.z));
  assert.ok(radii.every(radius => Math.abs(radius - 3.4) < 0.001));
  assert.ok(new Set(deck.map(card => `${card.position.x.toFixed(3)}:${card.position.y.toFixed(3)}:${card.position.z.toFixed(3)}`)).size > 70);
  assert.ok(deck.every(card => Math.abs(card.scale.x - 0.24) < 0.001));
});

test('collapse forms one central ordered deck', () => {
  const deck = cards();
  const sequence = createShuffleSequence({ deckY: -2.65 });
  sequence.start(deck);
  sequence.update(3.85);
  assert.equal(sequence.getState().phase, 'ready');
  assert.ok(deck.every(card => Math.abs(card.position.x) < 0.001 && Math.abs(card.position.y + 2.65) < 0.001));
  assert.ok(deck.every(card => card.scale.x === 1 && card.rotation.y === 0));
  assert.equal(new Set(deck.map(card => card.position.z.toFixed(4))).size, 78);
});

test('skip and reset restore cards safely without duplicate completion', () => {
  const deck = cards();
  const sequence = createShuffleSequence();
  let completed = 0;
  sequence.onComplete(() => { completed += 1; });
  sequence.start(deck);
  sequence.update(0.6);
  sequence.skip();
  sequence.skip();
  assert.equal(sequence.getState().phase, 'ready');
  assert.equal(completed, 1);
  assert.ok(deck.every(card => card.position.x === 0 && card.position.y === -2));
  sequence.reset(deck);
  assert.deepEqual(sequence.getState(), { phase: 'idle', active: false, ready: false, progress: 0, orbitAngle: 0 });
});

test('reduced motion preserves gather and collapse with shorter timing', () => {
  const deck = cards();
  const sequence = createShuffleSequence({ reducedMotion: true });
  sequence.start(deck);
  const phases = [sequence.getState().phase];
  for (let index = 0; index < 30; index += 1) {
    sequence.update(0.05);
    if (sequence.getState().phase !== phases.at(-1)) phases.push(sequence.getState().phase);
  }
  assert.deepEqual(phases, ['gather', 'collapse', 'ready']);
  assert.equal(sequence.getState().ready, true);
});
