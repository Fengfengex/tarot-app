import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('vendors all 78 Tarotoo cards with the four selected topic fields', async () => {
  const cards = JSON.parse(await readFile(new URL('../../src/data/tarotoo-cards.json', import.meta.url), 'utf8'));
  assert.equal(cards.length, 78);
  assert.equal(new Set(cards.map(card => card.id)).size, 78);
  assert.equal(new Set(cards.map(card => card.name)).size, 78);
  for (const card of cards) {
    assert.ok(card.meaning_upright);
    assert.ok(card.meaning_reversed);
    for (const topic of ['love', 'career', 'mood', 'spiritual']) {
      assert.ok(card[topic]);
      assert.ok(card[`${topic}_reversed`]);
    }
  }
});

test('records the pinned dataset source and MIT attribution', async () => {
  const notice = await readFile(new URL('../../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8');
  assert.match(notice, /8cee2b1abf399a90e760307ee4c447c4d0505cdd/);
  assert.match(notice, /License: MIT/);
});
