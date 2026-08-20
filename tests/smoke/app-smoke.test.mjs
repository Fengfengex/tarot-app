import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../../server.mjs';

test('app exposes four Tarotoo topics and AI reading contract', async () => {
  const expected = { headline: '留意新的入口', reading: '可以温和地探索新方向。', action: '写下一项小尝试。', disclaimer: '内容仅供娱乐与自我反思。' };
  const server = createAppServer({ readingService: { generate: async () => expected } });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(base)).text();
    for (const label of ['感情', '事业', '心境', '灵性']) assert.match(html, new RegExp(label));
    for (const id of ['ai-headline', 'ai-text', 'ai-action', 'ai-disclaimer']) assert.match(html, new RegExp(`id="${id}"`));
    for (const id of ['onboarding-dialog', 'onboarding-guide', 'onboarding-camera-error']) assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, /role="dialog"/);
    assert.match(html, /<html lang="zh-CN" class="ritual-booting">/);
    assert.match(html, /html\.ritual-booting body::after/);
    assert.doesNotMatch(html, /id="onboarding-dialog"[^>]*hidden/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /摄像头画面仅在浏览器本地用于手势识别/);
    assert.match(html, /改用鼠标/);
    assert.doesNotMatch(html, /跳过引导/);
    assert.doesNotMatch(html, /id="onboarding-start"/);
    assert.doesNotMatch(html, /主题只影响抽牌后的星语解读/);
    assert.doesNotMatch(html, /data-onboarding-topic="general"/);
    assert.equal(html.match(/data-onboarding-topic=/g)?.length, 4);
    for (const icon of ['heart-handshake', 'briefcase-business', 'cloud-sun', 'sparkles']) {
      assert.match(html, new RegExp(`lucide-${icon}`));
    }
    assert.match(html, /data-onboarding-topic="spiritual"[^>]*>[\s\S]*?灵性[\s\S]*?探索内在指引/);
    assert.match(html, /tarotoo-cards\.json/);
    assert.doesNotMatch(html, /Wands 正位含义 - 能量流动/);
    assert.match(html, /onboarding\.start\(\);[\s\S]*?renderOnboarding\(\)/);
    assert.match(html, /createOnboardingController/);
    assert.match(html, /createOnboardingController\(\{ storage: null \}\)/);
    assert.doesNotMatch(html, /if \(onboarding\.getState\(\)\.completed\)/);
    assert.match(html, /startGestureCamera/);
    assert.doesNotMatch(html, /id="shuffle-status"/);
    assert.doesNotMatch(html, /id="shuffle-action"/);
    assert.doesNotMatch(html, /id="shuffle-skip"/);
    assert.match(html, /createShuffleSequence/);
    assert.match(html, /shuffleSequence\.update\(dt\)/);
    assert.match(html, /function createShuffleRitualVisuals\(\)/);
    assert.match(html, /function startShuffleRitualVisuals\(\)/);
    assert.match(html, /startShuffleRitualVisuals\(\);[\s\S]*?shuffleSequence\.start\(shuffleCards\)/);
    assert.match(html, /new THREE\.TorusGeometry/);
    assert.match(html, /duration: 4050/);
    assert.doesNotMatch(html, /开始洗牌/);
    assert.match(html, /onboarding\.start\(\);[\s\S]*?startShuffle\(\);/);
    assert.doesNotMatch(html, /跳过动画/);
    assert.doesNotMatch(html, /DECK READY|CONVERGE ·|ASCEND ·|ORBIT ·|CUT ·|MERGE ·/);
    assert.doesNotMatch(html, /updateShuffleUi/);
    assert.doesNotMatch(html, /shuffleElements/);
    assert.match(html, /id="custom-cursor"/);
    assert.match(html, /body\.prophecy-active \.oracle-console/);
    assert.doesNotMatch(html, /class="status-panel|id="status-text"|id="deck-count"/);
    assert.match(html, /id="btn-mode"/);
    assert.match(html, /document\.getElementById\('btn-mode'\)\.addEventListener\('click', toggleMode\)/);
    assert.doesNotMatch(html, /id="onboarding-help"|id="topic-picker"|class="gesture-guide"/);
    assert.match(html, /function hideDeckForProphecy\(\)/);
    assert.match(html, /projectedLabel\.y = 0\.9/);
    assert.match(html, /card\.position\.y \+ upwardDistance/);
    assert.match(html, /delay: index \* 95/);
    assert.match(html, /ease: 'inOut\(4\)'/);
    assert.match(html, /const follow = Math\.max\(0, Math\.min\(1, \(progress - 0\.07\) \/ 0\.93\)\)/);
    assert.match(html, /completedCards === transitions\.length/);
    assert.match(html, /prophecy-stream\.stream-two[^}]*stroke-width:2\.4/);
    assert.equal(html.match(/class="prophecy-stream stream-/g)?.length, 3);
    assert.match(html, /svg\.createDrawable\(paths\)/);
    assert.match(html, /draw: \['0 0', '0 1'\]/);
    assert.match(html, /function drawProphecyConnections\(onComplete\)/);
    assert.match(html, /function revealProphecyPanel\(\)/);
    assert.match(html, /drawProphecyConnections\(revealProphecyPanel\)/);
    assert.match(html, /function createProphecyCurve\(start, panelTop, laneIndex\)/);
    assert.match(html, /randomBetween\(-18, 18\)/);
    assert.match(html, /stagger\(randomBetween\(90, 155\)\)/);
    assert.doesNotMatch(html, /class="prophecy-stem"/);
    assert.match(html, /fetch\('\/api\/prophecy'/);
    assert.match(html, /id="prophecy-result"/);
    assert.match(html, /renderProphecyResult\(payload\)/);
    assert.match(html, /requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => window\.location\.reload\(\)\)\)/);
    assert.doesNotMatch(html, /查看发送给 LLM 的完整 Prompt|id="prophecy-prompt"/);
    assert.match(html, /body,body \*\s*\{\s*cursor:none!important;/);
    assert.match(html, /body\s*\{[^}]*-webkit-user-select:none;[^}]*user-select:none;/);
    assert.match(html, /customCursor\.style\.transform = `translate3d\(\$\{e\.clientX\}px,\$\{e\.clientY\}px,0\)`/);
    assert.match(html, /cursorMesh\.visible = mode !== 'mouse'/);
    assert.match(html, /if \(STATE\.mode === 'mouse'\) cursorMesh\.position\.copy\(pos\)/);
    assert.match(html, /createDeckBackTexture/);
    assert.match(html, /class="oracle-header editorial-intro"/);
    assert.match(html, /THE INTERACTIVE ARCANA/);
    assert.match(html, /class="oracle-console editorial-intro"/);
    assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(html, /https:\/\/cdn\.jsdelivr\.net\/npm\/animejs@4\.5\.0\/\+esm/);
    assert.doesNotMatch(html, /from ['"]\/vendor\/anime\.esm\.js['"]/);
    assert.match(html, /createUiMotion/);
    assert.match(html, /animate as animeAnimate/);
    assert.doesNotMatch(html, /import \{ animate, createTimeline, stagger \}/);
    assert.match(html, /const matFront = new THREE\.ShaderMaterial/);
    assert.match(html, /tex\.anisotropy = renderer\.capabilities\.getMaxAnisotropy\(\)/);
    assert.match(html, /new THREE\.LineBasicMaterial\(\{ color: 0xffdf82/);
    assert.match(html, /saturation:\s*\{ value: 1\.04 \}/);
    assert.match(html, /contrast:\s*\{ value: 1\.06 \}/);
    assert.match(html, /vec3 softClipped = contrasted \/ \(1\.0 \+ max\(contrasted - 0\.92, 0\.0\) \* 1\.6\)/);
    assert.match(html, /color:\s*0xffffff/);
    assert.match(html, /emissive:\s*0x5a441c/);
    assert.match(html, /cardHeight,\s*0\.025/);
    assert.match(html, /new THREE\.EdgesGeometry\(geometry\)/);
    assert.match(html, /createMinorEffectController/);
    assert.match(html, /createThreeElementRenderer/);
    assert.match(html, /function createCardSlots\(\)/);
    assert.match(html, /findNearestAvailableSlot\(pos, cardSlots, snapRadius\)/);
    assert.match(html, /function placeHeldCard\(slotIndex\)/);
    assert.match(html, /animation\.card\.rotation\.y = animation\.startRotationY \+ Math\.PI \* eased/);
    const placementSource = html.slice(html.indexOf('function placeHeldCard'), html.indexOf('function updateCardAnimations'));
    assert.doesNotMatch(placementSource, /requestReading|fetch\(/);
    assert.match(html, /elementEffect\.update\(dt\)/);
    assert.match(html, /suit: suit \|\| null/);
    const response = await fetch(`${base}/api/reading`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic: 'general', cardName: 'The Fool', orientation: 'upright', standardMeaning: '新的开始。' }) });
    assert.deepEqual(await response.json(), expected);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('drawn card title uses the legacy bold Courier face', async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(base)).text();
    assert.match(html, /#result-title\s*\{[^}]*font-family:'Courier New',Courier,monospace;[^}]*font-weight:bold;/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('serves card artwork and exposes the requested corner layout', async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(base)).text();
    const artwork = await fetch(`${base}/tarot_img/00.jpg`);
    assert.equal(artwork.status, 200);
    assert.match(artwork.headers.get('content-type') ?? '', /^image\/jpeg/);
    assert.match(html, /\? `\/tarot_img\/\$\{source\.id/);
    assert.match(html, /: `\/tarot_img\/\$\{suit\}_\$\{rank\}\.jpg`/);
    assert.match(html, /<h1>ETHER TAROT<\/h1>/);
    assert.match(html, /\.oracle-header h1\s*\{[^}]*white-space:nowrap/);
    assert.doesNotMatch(html, /id="history-panel"|#history-panel/);
    assert.match(html, /\.oracle-console\s*\{[^}]*position:fixed;[^}]*right:/);
    assert.match(html, /#onboarding-guide\s*\{[^}]*position:fixed;[^}]*right:/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('does not expose completed-draw or AI retry buttons', async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const html = await (await fetch(base)).text();
    assert.doesNotMatch(html, /id="ai-retry"/);
    assert.doesNotMatch(html, /重试 AI 解读/);
    assert.doesNotMatch(html, /本轮已抽牌/);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
