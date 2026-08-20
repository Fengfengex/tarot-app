import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildProphecyPrompt } from '../../src/client/prophecy-prompt.js';

const dataset = JSON.parse(await readFile(new URL('../../src/data/tarotoo-cards.json', import.meta.url), 'utf8'));

function draw(id, isReversed = false) {
  const source = dataset[id];
  return { isReversed, data: { name: source.name, source } };
}

test('builds the displayed prompt from three cards and the selected Tarotoo topic', () => {
  const prompt = buildProphecyPrompt({
    draws: [draw(0), draw(1, true), draw(2)],
    topic: 'career',
    question: '我的事业接下来会如何发展？',
    localizeCardName: card => `中文-${card.name}`,
  });

  assert.match(prompt, /关注主题：事业/);
  assert.match(prompt, /牌阵结构：现状 → 核心影响 → 发展建议/);
  assert.match(prompt, new RegExp(dataset[0].career.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, new RegExp(dataset[1].career_reversed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, new RegExp(dataset[1].meaning_reversed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, /逆位关键词/);
  assert.match(prompt, /元素：/);
  assert.doesNotMatch(prompt, /yes_no|肯定\/否定/);
});

test('rejects incomplete spreads and unsupported topics', () => {
  const base = { draws: [draw(0), draw(1), draw(2)], topic: 'love', question: '问题', localizeCardName: () => '牌名' };
  assert.throws(() => buildProphecyPrompt({ ...base, draws: base.draws.slice(0, 2) }), /exactly three cards/);
  assert.throws(() => buildProphecyPrompt({ ...base, topic: 'wealth' }), /Unknown prophecy topic/);
});
