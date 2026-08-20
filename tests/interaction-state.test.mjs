import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as interactionState from "../src/interaction-state.mjs";

const {
  createInteractionState,
  transitionInteraction,
  isPointInsideDeckTarget,
  isPointInsideRevealZone,
  createInputEdgeState,
  resetInputEdgeState,
  updateInputEdgeState,
  findNearestAvailableSlot,
} = interactionState;

test("finds the nearest empty card slot inside the snap radius", () => {
  const slots = [
    { x: -3, y: 1, occupied: false },
    { x: 0, y: 1, occupied: true },
    { x: 3, y: 1, occupied: false },
  ];
  assert.equal(findNearestAvailableSlot({ x: 2.7, y: 1.1 }, slots, 1.5), 2);
  assert.equal(findNearestAvailableSlot({ x: 0, y: 1 }, slots, 1.5), -1);
  assert.equal(findNearestAvailableSlot({ x: 0, y: -2 }, slots, 1.5), -1);
});

test("requires aiming before a card can be grabbed", () => {
  const idle = createInteractionState();
  assert.equal(transitionInteraction(idle, { type: "GRAB" }).phase, "IDLE");
  const aiming = transitionInteraction(idle, { type: "POINTER_ENTER_DECK" });
  assert.equal(transitionInteraction(aiming, { type: "GRAB" }).phase, "DRAGGING");
});

test("only confirms a card inside the reveal zone", () => {
  let state = createInteractionState();
  state = transitionInteraction(state, { type: "POINTER_ENTER_DECK" });
  state = transitionInteraction(state, { type: "GRAB" });
  assert.equal(transitionInteraction(state, { type: "CONFIRM" }).phase, "DRAGGING");
  state = transitionInteraction(state, { type: "ENTER_REVEAL_ZONE" });
  assert.equal(transitionInteraction(state, { type: "CONFIRM" }).phase, "REVEALED");
});

test("reset returns every phase to idle", () => {
  const revealed = { phase: "REVEALED" };
  assert.deepEqual(
    transitionInteraction(revealed, { type: "RESET" }),
    createInteractionState(),
  );
});

test("rejects a reveal-zone point with valid x/y but distant z", () => {
  assert.equal(
    isPointInsideRevealZone(
      { x: 0.2, y: -0.1, z: -7.7 },
      { halfWidth: 1, halfHeight: 1, halfDepth: 0.5 },
    ),
    false,
  );
});

test("accepts a reveal-zone point within all three bounds", () => {
  assert.equal(
    isPointInsideRevealZone(
      { x: 0.2, y: -0.1, z: 0.3 },
      { halfWidth: 1, halfHeight: 1, halfDepth: 0.5 },
    ),
    true,
  );
});

test("rejects a reveal-zone point outside any boundary", () => {
  assert.equal(
    isPointInsideRevealZone(
      { x: 1.01, y: 0, z: 0 },
      { halfWidth: 1, halfHeight: 1, halfDepth: 0.5 },
    ),
    false,
  );
});

test("accepts the center of the deck target", () => {
  assert.equal(
    isPointInsideDeckTarget(
      { x: 0, y: 0 },
      { halfWidth: 1.25, halfHeight: 2.15 },
    ),
    true,
  );
});

test("rejects a point outside the deck target boundary", () => {
  assert.equal(
    isPointInsideDeckTarget(
      { x: 1.26, y: 0 },
      { halfWidth: 1.25, halfHeight: 2.15 },
    ),
    false,
  );
});

test("reset clears every input edge", () => {
  let inputEdges = createInputEdgeState();
  for (const edgeName of [
    "pointerOverDeck",
    "heldCardInRevealZone",
    "grabActive",
    "fistActive",
  ]) {
    inputEdges = updateInputEdgeState(inputEdges, edgeName, true).state;
  }

  assert.deepEqual(resetInputEdgeState(inputEdges), createInputEdgeState());
});

test("recognizes a grab rising edge after reset", () => {
  let inputEdges = createInputEdgeState();
  inputEdges = updateInputEdgeState(inputEdges, "grabActive", true).state;
  inputEdges = resetInputEdgeState(inputEdges);

  const nextGrab = updateInputEdgeState(inputEdges, "grabActive", true);
  assert.equal(nextGrab.rising, true);
  assert.equal(updateInputEdgeState(nextGrab.state, "grabActive", true).rising, false);
});

test("recognizes a fist rising edge after reset", () => {
  let inputEdges = createInputEdgeState();
  inputEdges = updateInputEdgeState(inputEdges, "fistActive", true).state;
  inputEdges = resetInputEdgeState(inputEdges);

  const nextFist = updateInputEdgeState(inputEdges, "fistActive", true);
  assert.equal(nextFist.rising, true);
  assert.equal(updateInputEdgeState(nextFist.state, "fistActive", true).rising, false);
});

test("page exposes a three-card spread and a layered deck", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /id="spread-progress"/);
  assert.match(html, /\[-2\.35, 0, 2\.35\]/);
  assert.match(html, /STATE\.deck\.map\(\(cardId, index\)/);
  assert.match(html, /index \* 0\.006/);
  assert.match(html, /function styleDeckPile\(\)/);
  assert.match(html, /deckEdgeMaterial/);
  assert.match(html, /deckBaseShadow/);
  assert.match(html, /Math\.sin\(index \* 1\.73\)/);
  assert.match(html, /deckY: -2\.65/);
  assert.match(html, /deckScale: 0\.84/);
  assert.match(html, /function updateSlotReveal\(dt\)/);
  assert.match(html, /slotGroup\.visible = false/);
});

test("page raycasts the layered deck recursively", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /raycaster\.intersectObjects\(cardGroup\.children,\s*true\)/);
  assert.match(html, /topCard\.userData\.isDeck = true/);
});

test("page highlights and snaps only to empty nearby slots", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /findNearestAvailableSlot\(pos, cardSlots, snapRadius\)/);
  assert.match(html, /setHoveredSlot\(slotIndex\)/);
  assert.match(html, /if \(slotIndex >= 0\) placeHeldCard\(slotIndex\)/);
  assert.match(html, /slotDetachRadius/);
  assert.match(html, /STATE\.heldCard\.scale\.lerp\(slotScale, 0\.28\)/);
  assert.match(html, /new THREE\.Vector3\(slot\.x, slot\.y, slot\.z\)/);
  assert.match(html, /STATE\.heldCard\.scale\.lerp\(heldScale, 0\.2\)/);
});

test("page returns a mouse-dropped card outside the slots to the deck", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /function cancelHeldCard\(\)/);
  assert.match(html, /STATE\.deck\.push\(STATE\.drawnCardData\.data\.id\)/);
  assert.match(html, /else if \(STATE\.mode === 'mouse'\) cancelHeldCard\(\)/);
});

test("page flips each placed card and stops after the third", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /animation\.card\.rotation\.y = animation\.startRotationY \+ Math\.PI \* eased/);
  assert.match(html, /const complete = STATE\.placedCards\.length === 3/);
  assert.match(html, /STATE\.locked = complete/);
  const placement = html.slice(html.indexOf("function placeHeldCard"), html.indexOf("function updateCardAnimations"));
  assert.doesNotMatch(placement, /requestReading|triggerAshEffect|setTimeout/);
  assert.match(html, /function createCardNameLabel\(draw, slot\)/);
  assert.match(html, /function chineseCardName\(card\)/);
  assert.match(html, /updateCardLabels\(dt\)/);
  assert.match(html, /fillText\(draw\.data\.name\.toUpperCase\(\), canvas\.width \/ 2, 64\)/);
  assert.match(html, /fillText\(chineseCardName\(draw\.data\), canvas\.width \/ 2, 136\)/);
  assert.match(html, /id="prophecy-panel"/);
  assert.match(html, /function enterProphecyPhase\(\)/);
  assert.match(html, /prophecyPanel\.classList\.add\('is-growing'\)/);
  assert.match(html, /window\.location\.reload\(\)/);
  assert.match(html, /id="prophecy-flow"/);
  assert.match(html, /import \{ buildProphecyPrompt \} from '\.\/src\/client\/prophecy-prompt\.js'/);
  assert.match(html, /const prompt = buildProphecyPrompt\(\{/);
  assert.match(html, /console\.debug\('\[prophecy\] LLM prompt', prompt\)/);
  assert.match(html, /function moveCardsIntoProphecyLayout\(onComplete\)/);
  assert.match(html, /moveCardsIntoProphecyLayout\(\(\) => drawProphecyConnections/);
  assert.match(html, /function hideDeckForProphecy\(\)/);
});
