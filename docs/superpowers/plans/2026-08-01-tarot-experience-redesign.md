# Ether Tarot Experience Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Ether Tarot as a production-ready, gesture-first, single-card Rider–Waite experience with 78 complete bilingual card records, stable input, a cinematic 3D reveal, local interpretation, and deployable static output.

**Architecture:** Vite and TypeScript provide a modular static application. A single finite-state draw store coordinates MediaPipe gesture events, Three.js presentation, local Rider–Waite data, UI, and a replaceable interpretation provider; rendering and input never own draw rules.

**Tech Stack:** Vite, TypeScript, Three.js `WebGLRenderer`, MediaPipe Tasks Vision, Vitest, ESLint, CSS, GitHub Actions

## Global Constraints

- Acceptance priority is gesture stability, then visual impact, then loading speed.
- The first release supports one-card readings only and draws without replacement from all 78 Rider–Waite cards.
- Chinese is the primary language; English is limited to card names and supporting terminology.
- Every card has upright and reversed keywords plus general, love, career, wealth, and personal-growth meanings.
- `tarot_img/cover.jpg` is the only card-back asset.
- Gesture order is open palm, pinch and move, release in the reveal zone, hold fist for about 0.5 seconds, reveal, then hold open palm for about 0.3 seconds to archive.
- Archiving sends the revealed card into the lower-left history as a face thumbnail, preserves reversed orientation, decrements the upper-left remaining count, and restarts the carousel.
- Mouse and touch follow the same state machine when camera input is unavailable.
- The first release uses `WebGLRenderer`; WebGPU is not required.
- The production bundle is static and must work on GitHub Pages, Vercel, and generic HTTPS hosting.
- No real AI service, user account, database, cloud history, multi-card spread, or exposed API key is included.

---

## Planned File Structure

```text
index.html                         minimal application shell
package.json                       Vite scripts and locked dependencies
vite.config.ts                     base-path-safe static build
tsconfig.json                      strict TypeScript configuration
eslint.config.js                   source and test lint rules
src/
  main.ts                          application composition and startup
  app/app.ts                       lifecycle and cross-module orchestration
  app/config.ts                    timing, quality, and gesture constants
  app/types.ts                     shared application contracts
  draw/draw-machine.ts             authoritative finite-state transitions
  draw/draw-store.ts               deck, current draw, history, subscriptions
  draw/random.ts                   injectable unbiased selection
  tarot/cards.ts                   complete 78-card data
  tarot/types.ts                   card and meaning types
  tarot/validate.ts                runtime dataset validation
  interpretation/types.ts          request, response, and provider interface
  interpretation/local-provider.ts standard local interpretation
  gestures/gesture-engine.ts       MediaPipe lifecycle and semantic events
  gestures/classifier.ts           landmark-to-gesture classification
  gestures/stabilizer.ts           smoothing, hysteresis, dwell, and loss grace
  gestures/pointer-filter.ts       coordinate smoothing
  scene/tarot-scene.ts             Three.js scene public API
  scene/card-carousel.ts           remaining-card ellipse layout and motion
  scene/card-view.ts               back/front materials and flip orientation
  scene/archive-particles.ts       center-to-history particle transition
  scene/quality.ts                 device-sensitive renderer limits
  ui/app-view.ts                   DOM rendering and event bindings
  ui/copy.ts                       Chinese-first interface copy
  ui/styles.css                    theme, layout, responsiveness, reduced motion
  ui/fallback-2d.ts                non-WebGL presentation
tests/
  draw/draw-machine.test.ts
  draw/draw-store.test.ts
  tarot/cards.test.ts
  interpretation/local-provider.test.ts
  gestures/classifier.test.ts
  gestures/stabilizer.test.ts
  gestures/pointer-filter.test.ts
  scene/card-carousel.test.ts
  scene/card-view.test.ts
  ui/app-view.test.ts
  app/integration.test.ts
.github/workflows/deploy-pages.yml  build and Pages deployment
vercel.json                         Vercel static configuration
```

### Task 1: Establish the Vite and TypeScript Application Baseline

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `eslint.config.js`
- Create: `src/main.ts`
- Create: `src/ui/styles.css`

**Interfaces:**
- Produces: a strict TypeScript Vite application with `dev`, `build`, `preview`, `test`, `test:run`, `lint`, and `check` scripts.

- [ ] **Step 1: Replace package metadata and install the application toolchain**

Set scripts to:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint .",
    "check": "npm run lint && npm run test:run && npm run build"
  }
}
```

Run:

```powershell
npm install three @mediapipe/tasks-vision
npm install -D vite typescript vitest jsdom eslint @eslint/js typescript-eslint @types/three
```

Expected: `package-lock.json` is created and `npm install` exits 0.

- [ ] **Step 2: Add strict compiler, lint, and Vite configuration**

Use `strict: true`, `noUncheckedIndexedAccess: true`, DOM libraries, `ES2022`, and `moduleResolution: "Bundler"` in `tsconfig.json`. Configure Vitest with `environment: "jsdom"`. Configure Vite with `base: "./"` so one build works at the GitHub Pages repository subpath and at a Vercel root.

- [ ] **Step 3: Replace the legacy document with a minimal app shell**

`index.html` must contain `#app`, a JavaScript-required fallback, viewport metadata, Chinese document language, and only:

```html
<script type="module" src="/src/main.ts"></script>
```

Create `src/main.ts` that imports `./ui/styles.css` and renders a visible `Ether Tarot / 以太塔罗` boot label into `#app`.

- [ ] **Step 4: Verify the baseline**

Run:

```powershell
npm run lint
npm run test:run
npm run build
```

Expected: all commands exit 0 and `dist/index.html` exists.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json index.html vite.config.ts tsconfig.json eslint.config.js src/main.ts src/ui/styles.css
git commit -m "build: migrate tarot app to Vite and TypeScript"
```

### Task 2: Define and Validate the Complete Rider–Waite Dataset

**Files:**
- Create: `src/tarot/types.ts`
- Create: `src/tarot/cards.ts`
- Create: `src/tarot/validate.ts`
- Create: `tests/tarot/cards.test.ts`

**Interfaces:**
- Produces: `TarotCard`, `TarotMeaning`, `TAROT_CARDS`, `validateTarotCards(cards): ValidationIssue[]`.

- [ ] **Step 1: Write the failing dataset contract tests**

Test exact total and group counts, unique IDs, unique images, existing non-empty names, and all meaning fields:

```ts
expect(TAROT_CARDS).toHaveLength(78);
expect(TAROT_CARDS.filter(card => card.arcana === 'major')).toHaveLength(22);
expect(TAROT_CARDS.filter(card => card.arcana === 'minor')).toHaveLength(56);
expect(new Set(TAROT_CARDS.map(card => card.id)).size).toBe(78);
expect(validateTarotCards(TAROT_CARDS)).toEqual([]);
```

Also check that each referenced image path matches an existing filename in `tarot_img`.

- [ ] **Step 2: Run the test and observe the missing modules**

Run:

```powershell
npx vitest run tests/tarot/cards.test.ts
```

Expected: FAIL because `src/tarot/cards.ts` does not exist.

- [ ] **Step 3: Add the types and validator**

Define the exact `TarotCard` and `TarotMeaning` interfaces from the approved design. `validateTarotCards` must report duplicate IDs, invalid arcana/suit combinations, empty meanings, and absent image strings.

- [ ] **Step 4: Author all 78 card records**

Add 22 major arcana and four 14-card suits. Every record must have a Chinese and English name, local image path, and distinct upright and reversed `keywords`, `general`, `love`, `career`, `wealth`, and `growth` content. Use the existing filename mapping:

```ts
image: new URL('../../tarot_img/00.jpg', import.meta.url).href
image: new URL('../../tarot_img/Wands_Ace.jpg', import.meta.url).href
```

Do not generate meaning text at runtime.

- [ ] **Step 5: Run focused and full validation**

Run:

```powershell
npx vitest run tests/tarot/cards.test.ts
npm run check
```

Expected: 78 records pass all validation and the production build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add src/tarot tests/tarot
git commit -m "feat: add complete Rider-Waite card meanings"
```

### Task 3: Implement the Draw State Machine and No-Replacement Store

**Files:**
- Create: `src/app/config.ts`
- Create: `src/app/types.ts`
- Create: `src/draw/random.ts`
- Create: `src/draw/draw-machine.ts`
- Create: `src/draw/draw-store.ts`
- Create: `tests/draw/draw-machine.test.ts`
- Create: `tests/draw/draw-store.test.ts`

**Interfaces:**
- Consumes: `TarotCard`, `TAROT_CARDS`.
- Produces: `DrawPhase`, `DrawEvent`, `DrawSnapshot`, `createDrawStore({cards, random})`.
- Store methods: `dispatch(event)`, `getSnapshot()`, `subscribe(listener)`, and `reset()`.

- [ ] **Step 1: Write failing transition tests**

Cover:

```text
READY + START → CAROUSEL
CAROUSEL + PINCH_STABLE → HOLDING
HOLDING + RELEASE_IN_ZONE → PLACED
HOLDING + RELEASE_OUTSIDE → CAROUSEL
PLACED + FIST_DWELL_COMPLETE → REVEALING
REVEALING + FLIP_COMPLETE → READING
READING + OPEN_DWELL_COMPLETE → ARCHIVING
ARCHIVING + ARCHIVE_COMPLETE → CAROUSEL or COMPLETE
```

Assert invalid and repeated animation events leave state unchanged.

- [ ] **Step 2: Run tests to verify missing implementation**

Run:

```powershell
npx vitest run tests/draw/draw-machine.test.ts tests/draw/draw-store.test.ts
```

Expected: FAIL with missing draw modules.

- [ ] **Step 3: Implement the pure transition reducer**

Use a discriminated union for phases and events. Keep the reducer pure and return the same state object for ignored events. Put `fistDwellMs: 500`, `openArchiveDwellMs: 300`, and gesture stability settings in `src/app/config.ts`.

- [ ] **Step 4: Implement the injectable random draw store**

Inject `random(): number` so tests can fix outcomes. Lock `cardId` and orientation on `FIST_DWELL_COMPLETE`, remove the card only on `ARCHIVE_COMPLETE`, and append:

```ts
interface DrawHistoryItem {
  cardId: string;
  orientation: 'upright' | 'reversed';
  drawnAt: number;
}
```

Assert 78 draws are unique, remaining counts move from 78 to 0 only after archive completion, and reset restores 78.

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run tests/draw
npm run check
```

Expected: state, uniqueness, locking, history, and reset tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/app src/draw tests/draw
git commit -m "feat: add deterministic tarot draw state machine"
```

### Task 4: Add the Local Interpretation Provider and Future API Boundary

**Files:**
- Create: `src/interpretation/types.ts`
- Create: `src/interpretation/local-provider.ts`
- Create: `tests/interpretation/local-provider.test.ts`

**Interfaces:**
- Consumes: `TAROT_CARDS`.
- Produces: `InterpretationRequest`, `InterpretationResponse`, `InterpretationProvider`, `LocalInterpretationProvider`.
- Method: `interpret(request: InterpretationRequest): Promise<InterpretationResponse>`.

- [ ] **Step 1: Write failing provider tests**

Test all five topics and both orientations. Assert returned `source` is `standard`, the correct Chinese card title is used, and an unknown card rejects with `Unknown tarot card: <id>`.

- [ ] **Step 2: Run the test to verify failure**

Run:

```powershell
npx vitest run tests/interpretation/local-provider.test.ts
```

Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement the contracts and local provider**

Use:

```ts
type InterpretationTopic = 'general' | 'love' | 'career' | 'wealth' | 'growth';
type CardOrientation = 'upright' | 'reversed';
```

Map `topic` directly to the selected standard meaning and return keywords as `guidance`. Do not call the network or accept an API key.

- [ ] **Step 4: Verify**

Run:

```powershell
npx vitest run tests/interpretation
npm run check
```

Expected: all provider cases pass.

- [ ] **Step 5: Commit**

```powershell
git add src/interpretation tests/interpretation
git commit -m "feat: add replaceable local interpretation provider"
```

### Task 5: Build Stable Gesture Classification and Pointer Filtering

**Files:**
- Create: `src/gestures/classifier.ts`
- Create: `src/gestures/stabilizer.ts`
- Create: `src/gestures/pointer-filter.ts`
- Create: `src/gestures/gesture-engine.ts`
- Create: `tests/gestures/classifier.test.ts`
- Create: `tests/gestures/stabilizer.test.ts`
- Create: `tests/gestures/pointer-filter.test.ts`

**Interfaces:**
- Produces: `GestureKind = 'OPEN' | 'PINCH' | 'FIST' | 'UNKNOWN' | 'LOST'`.
- Produces: `classifyGesture(landmarks, thresholds): GestureKind`.
- Produces: `createGestureStabilizer(config).update(sample, timestamp)`.
- Produces: `createPointerFilter(alpha).update(point)`.
- Produces: `GestureEngine.start(video, onFrame)` and `GestureEngine.stop()`.

- [ ] **Step 1: Write failing classifier and filter tests**

Use fixed 21-landmark fixtures for open, pinch, and fist hands. Test different enter/exit thresholds, consecutive-frame confirmation, 500 ms fist dwell, 300 ms open dwell in reading mode, loss grace, and exponential pointer smoothing.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npx vitest run tests/gestures
```

Expected: FAIL because gesture modules do not exist.

- [ ] **Step 3: Implement pure classification and stabilization**

Normalize distances by palm scale. Detect pinch from thumb/index distance and fist from folded finger tips relative to their proximal joints. Keep thresholds in configuration and emit a semantic event only after stability requirements are satisfied.

- [ ] **Step 4: Implement the MediaPipe Tasks Vision engine**

Load `HandLandmarker` for one hand in video mode, use camera timestamps monotonically, cap inference near 24 FPS, skip when the document is hidden, and stop media tracks on `stop()`. Map permission, no-device, timeout, and model errors to typed engine errors.

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run tests/gestures
npm run check
```

Expected: gesture fixtures, dwell timing, loss protection, smoothing, lint, and build pass.

- [ ] **Step 6: Commit**

```powershell
git add src/gestures tests/gestures
git commit -m "feat: add stable MediaPipe gesture pipeline"
```

### Task 6: Implement the Three.js Carousel, Card Reveal, and Archive Effects

**Files:**
- Create: `src/scene/quality.ts`
- Create: `src/scene/card-carousel.ts`
- Create: `src/scene/card-view.ts`
- Create: `src/scene/archive-particles.ts`
- Create: `src/scene/tarot-scene.ts`
- Create: `tests/scene/card-carousel.test.ts`
- Create: `tests/scene/card-view.test.ts`

**Interfaces:**
- Consumes: remaining card IDs, pointer positions, current draw, orientation, reduced-motion preference.
- Produces: `TarotScene.mount(element)`, `setCards(ids)`, `setPointer(point)`, `pickCard()`, `moveHeldCard(point)`, `releaseHeldCard()`, `reveal(card, orientation)`, `archive(targetRect)`, `resize()`, and `dispose()`.

- [ ] **Step 1: Write failing scene math tests**

Test that `layoutCarousel(ids, time)` returns one unique transform per remaining card on an ellipse, handles 78 and 1 cards, and never returns non-finite coordinates. Test that reversed front transforms include a 180-degree face rotation.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npx vitest run tests/scene
```

Expected: FAIL because scene modules do not exist.

- [ ] **Step 3: Implement quality and carousel math**

Clamp renderer pixel ratio, choose particle counts by device capability, and keep carousel layout as a pure function. Use `cover.jpg` for every back material and local face assets from card data.

- [ ] **Step 4: Implement card lifecycle and public scene facade**

Create and reuse geometries/materials where possible. Animate hover, hold, return, vertical-axis flip, upright/reversed front, and center positioning. Await the face texture before the reveal begins; surface texture errors instead of archiving.

- [ ] **Step 5: Implement archive particles**

Transform the central result into gold particles that travel toward the lower-left history target, then resolve an animation promise. Under reduced motion, perform a short fade and resolve without particle simulation.

- [ ] **Step 6: Verify and manually inspect**

Run:

```powershell
npx vitest run tests/scene
npm run build
npm run dev
```

Expected: tests and build pass; the browser shows 78 local `cover.jpg` backs, smooth carousel motion, a correct upright/reversed flip, and a completed archive animation without console errors.

- [ ] **Step 7: Commit**

```powershell
git add src/scene tests/scene
git commit -m "feat: build cinematic tarot carousel and reveal"
```

### Task 7: Build the Chinese-First Responsive Interface

**Files:**
- Create: `src/ui/copy.ts`
- Create: `src/ui/app-view.ts`
- Create: `src/ui/fallback-2d.ts`
- Modify: `src/ui/styles.css`
- Create: `tests/ui/app-view.test.ts`

**Interfaces:**
- Consumes: `DrawSnapshot`, current card, `InterpretationResponse`, gesture status, camera status.
- Produces: `createAppView(root)` with `render(model)`, `getSceneHost()`, `getVideoElement()`, `getHistoryTargetRect()`, `bind(actions)`, and `dispose()`.

- [ ] **Step 1: Write failing UI tests**

Assert:

- upper-left text begins at `余牌 78 / 78`;
- lower-left history renders true face thumbnails and applies `data-orientation="reversed"`;
- Chinese meaning is primary and English name is secondary;
- camera errors expose retry and mouse/touch actions;
- reading tabs cover general, love, career, wealth, and growth.

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npx vitest run tests/ui/app-view.test.ts
```

Expected: FAIL because `app-view.ts` does not exist.

- [ ] **Step 3: Implement semantic UI and copy**

Build accessible buttons, live status regions, gesture progress, collapsible camera preview, remaining counter, history, reading panel, reset confirmation, and WebGL fallback. Use Chinese labels with restrained English supporting labels.

- [ ] **Step 4: Implement the visual system**

Use CSS custom properties for deep indigo, ink black, antique gold, ivory, and cinnabar. Add celestial linework and restrained cloud patterns using CSS/SVG decoration, responsive desktop/mobile layouts, visible focus states, and `prefers-reduced-motion`.

- [ ] **Step 5: Verify**

Run:

```powershell
npx vitest run tests/ui
npm run check
```

Expected: UI tests, accessibility-sensitive states, lint, and build pass.

- [ ] **Step 6: Commit**

```powershell
git add src/ui tests/ui
git commit -m "feat: add bilingual celestial tarot interface"
```

### Task 8: Compose the Complete Application and Equivalent Input Modes

**Files:**
- Create: `src/app/app.ts`
- Modify: `src/main.ts`
- Create: `tests/app/integration.test.ts`

**Interfaces:**
- Consumes: draw store, gesture engine, tarot scene, app view, and local provider.
- Produces: `createTarotApp({root, random?})` with `start()` and `dispose()`.

- [ ] **Step 1: Write failing integration tests**

Use fakes for scene and gesture input. Verify the full event sequence:

```text
OPEN → PINCH_STABLE → pointer moves → RELEASE_IN_ZONE
→ FIST_DWELL_COMPLETE → flip complete → reading
→ OPEN_DWELL_COMPLETE → archive complete
```

Assert one history item, 77 remaining cards, the revealed orientation, ignored repeated fist events, out-of-zone return, loss-safe release, and reset.

- [ ] **Step 2: Run integration tests to verify failure**

Run:

```powershell
npx vitest run tests/app/integration.test.ts
```

Expected: FAIL because application composition does not exist.

- [ ] **Step 3: Compose gesture, mouse, and touch adapters**

Route all three input modes into the same `DrawEvent` union. Request camera access only after an explicit start action. On camera failure, keep the application usable and select pointer mode without changing draw rules.

- [ ] **Step 4: Coordinate reveal, reading, archive, and counts**

Await scene animation promises before dispatching `FLIP_COMPLETE` and `ARCHIVE_COMPLETE`. Fetch local interpretation after the locked result exists. Update history and remaining count only after archive completion.

- [ ] **Step 5: Add lifecycle cleanup and WebGL fallback**

On disposal, stop media tracks, cancel animation loops, remove listeners, unsubscribe store observers, and dispose Three.js resources. Mount the 2D fallback when WebGL initialization fails.

- [ ] **Step 6: Verify**

Run:

```powershell
npx vitest run tests/app/integration.test.ts
npm run check
```

Expected: complete gesture and pointer flows pass with no duplicate draw or history transition.

- [ ] **Step 7: Commit**

```powershell
git add src/app src/main.ts tests/app
git commit -m "feat: compose complete gesture-first tarot flow"
```

### Task 9: Optimize Assets, Loading, and Runtime Resilience

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/scene/tarot-scene.ts`
- Modify: `src/scene/quality.ts`
- Modify: `src/ui/app-view.ts`
- Create: `tests/app/resilience.test.ts`

**Interfaces:**
- Consumes: existing scene, UI, and engine errors.
- Produces: deterministic recovery actions and quality selection.

- [ ] **Step 1: Write failing resilience tests**

Test denied camera, absent camera, model failure, face texture failure, card-back failure, hidden-document throttling, and WebGL failure. Assert each state offers a concrete retry or pointer/2D fallback and never adds a history item for an unrevealed card.

- [ ] **Step 2: Run the tests to verify gaps**

Run:

```powershell
npx vitest run tests/app/resilience.test.ts
```

Expected: FAIL for unhandled recovery states.

- [ ] **Step 3: Implement recovery and asset scheduling**

Load `cover.jpg` first. Preload only the next bounded batch of face textures, retry failed faces on user action, and show an internal styled back if `cover.jpg` fails. Pause inference and animation when hidden, cap pixel ratio and particle count, and release unused textures.

- [ ] **Step 4: Verify production behavior**

Run:

```powershell
npm run check
```

Then use browser developer tools with disabled camera permission and network throttling.

Expected: the application remains usable in pointer mode, loading state is visible, errors are recoverable, and no external runtime image URL is requested.

- [ ] **Step 5: Commit**

```powershell
git add src/app src/scene src/ui tests/app/resilience.test.ts
git commit -m "perf: harden tarot loading and runtime fallbacks"
```

### Task 10: Add Static Deployment and Release Documentation

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `vercel.json`
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `npm ci`, `npm run check`, and `dist`.
- Produces: repeatable GitHub Pages and Vercel deployments.

- [ ] **Step 1: Add generated-directory ignores**

Ignore:

```gitignore
node_modules/
dist/
.superpowers/
```

Do not ignore `tarot_img`, tests, or documentation.

- [ ] **Step 2: Add GitHub Pages workflow**

Configure pushes to `main` and manual dispatch. Use Node LTS, `npm ci`, `npm run check`, `actions/configure-pages`, `actions/upload-pages-artifact` with `./dist`, and `actions/deploy-pages`. Grant only `contents: read`, `pages: write`, and `id-token: write`.

- [ ] **Step 3: Add Vercel configuration**

Set `framework` to `vite`, `buildCommand` to `npm run build`, and `outputDirectory` to `dist`.

- [ ] **Step 4: Rewrite README run and interaction sections**

Document Node installation, `npm ci`, `npm run dev`, `npm run check`, camera HTTPS requirements, gesture sequence, pointer/touch fallback, Rider–Waite data coverage, local interpretation boundary, Pages deployment, and Vercel deployment. Replace garbled characters and outdated Webpack/CDN statements.

- [ ] **Step 5: Run the release gate**

Run:

```powershell
npm ci
npm run check
git status --short
```

Expected: lint, tests, TypeScript, and production build pass; only intended deployment and documentation files are uncommitted.

- [ ] **Step 6: Commit**

```powershell
git add .github/workflows/deploy-pages.yml vercel.json README.md .gitignore
git commit -m "ci: add static deployment and release guide"
```

### Task 11: Complete Cross-Device Acceptance Verification

**Files:**
- Create: `docs/testing/2026-08-01-release-checklist.md`
- Modify only files proven defective by the checks below.

**Interfaces:**
- Consumes: the complete production build.
- Produces: recorded acceptance evidence for the first release.

- [ ] **Step 1: Run automated verification from a clean install**

Run:

```powershell
npm ci
npm run check
```

Expected: every command exits 0.

- [ ] **Step 2: Verify the 78-card session**

Using deterministic test controls, complete 78 archive cycles and record that:

- no card repeats;
- remaining count runs from 78 to 0 only after archive;
- reversed fronts and history thumbnails are upside down;
- the 79th draw is blocked;
- reset restores 78.

- [ ] **Step 3: Verify input and recovery matrices**

Record results for:

- desktop Chrome or Edge with webcam;
- mobile Safari or Chrome with touch;
- mouse-only mode;
- denied camera permission;
- temporary hand loss during hold;
- slow face-image loading;
- reduced-motion preference;
- WebGL-unavailable 2D fallback.

- [ ] **Step 4: Verify production hosting paths**

Run:

```powershell
npm run build
npm run preview
```

Expected: all scripts, WASM/model files, `cover.jpg`, and card fronts load from the preview build with no CDN dependency or path error.

- [ ] **Step 5: Record evidence and commit**

Write pass/fail, browser/device, date, and any corrected defects in the checklist.

```powershell
git add docs/testing/2026-08-01-release-checklist.md
git commit -m "test: record tarot release acceptance"
```

- [ ] **Step 6: Confirm a clean final state**

Run:

```powershell
git status --short
git log --oneline -12
```

Expected: clean worktree and one reviewable commit per implementation task.
