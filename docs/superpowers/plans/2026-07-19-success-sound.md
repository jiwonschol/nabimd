# Success Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play one restrained success chime when a verdict becomes `matched`, with a persistent mute control and browser-safe first-gesture unlock.

**Architecture:** A small `successSound` controller owns the `HTMLAudioElement`, preference persistence, unlock state, and playback guard. `VerdictNotice` observes the verdict and calls the controller only from its evaluation effect; `ExerciseTopBar` renders a compact sound preference control. The sound is a self-hosted, swappable CC0 OGG asset.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, native `HTMLAudioElement`, localStorage preference.

## Global Constraints

- Play only when the evaluation becomes `matched`; Check, Next, keystrokes, and failed verdicts remain silent.
- Never attempt audible playback before a user gesture and never play while muted.
- Use no audio dependency and make the asset path replaceable in one place.
- Keep grading and verdict logic unchanged.
- Use Kenney Interface Sounds `confirmation_003.ogg`, licensed CC0 1.0, as the initial 0.32-second crisp confirmation sound.
- Preserve session-scoped learning progress; only the user sound preference may use localStorage.

---

### Task 1: Licensed verdict sound and mute preference

**Files:**
- Create: `src/sound/successSound.ts`
- Create: `src/sound/successSound.test.ts`
- Create: `src/components/VerdictNotice.test.tsx`
- Create: `public/audio/success.ogg`
- Create: `public/audio/LICENSE.md`
- Modify: `src/components/VerdictNotice.tsx`
- Modify: `src/components/ExerciseTopBar.tsx`
- Modify: `src/components/ExerciseTopBar.test.tsx`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `SUCCESS_SOUND_ASSET`, `unlockSuccessSound()`, `playSuccessSound()`, `readSoundMuted()`, `setSoundMuted(muted)`, `subscribeSoundMuted(listener)`.
- Consumes: `Evaluation.status`, native `Audio`, and guarded `window.localStorage`.

- [ ] **Step 1: Write the failing controller tests**

Add tests that inject a fake audio element and storage, then assert: locked playback is ignored; unlocking performs only silent priming; matched playback after unlock calls `play()` audibly once; mute suppresses it; and a stored mute value is restored. Reset controller state between tests.

- [ ] **Step 2: Run the controller tests and verify RED**

Run: `npm test -- src/sound/successSound.test.ts`

Expected: FAIL because `src/sound/successSound.ts` and its exports do not exist.

- [ ] **Step 3: Implement the minimal sound controller**

Implement one lazy `Audio(SUCCESS_SOUND_ASSET)` instance, a guarded localStorage adapter, one-shot `pointerdown`/`keydown` capture listeners for silent unlock, mute subscriptions for React, and a playback method that resets `currentTime` before `play()`. Swallow rejected playback promises because browser policy may still deny playback.

- [ ] **Step 4: Run the controller tests and verify GREEN**

Run: `npm test -- src/sound/successSound.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing integration tests**

Add a `VerdictNotice` test proving only a new `matched` evaluation invokes an injected/default playback seam, while `fail` and `null` stay silent. Extend `ExerciseTopBar.test.tsx` to prove the Sound control reflects and toggles the persisted preference without invoking verdict playback.

- [ ] **Step 6: Run the component tests and verify RED**

Run: `npm test -- src/components/VerdictNotice.test.tsx src/components/ExerciseTopBar.test.tsx`

Expected: FAIL because verdict playback and the Sound control are not wired.

- [ ] **Step 7: Wire verdict observation and the Sound control**

Call `playSuccessSound()` in `VerdictNotice`'s existing `useEffect([evaluation])` only when `evaluation.status === "matched"`. Add a compact `Sound on` / `Muted` button to the progress area, backed by the sound preference subscription, without changing Check/Next handlers or the equal-sized primary top-bar actions.

- [ ] **Step 8: Add the licensed asset and attribution**

Copy Kenney `confirmation_003.ogg` to `public/audio/success.ogg`. Record the original filename, source URL, author, CC0 1.0 license URL, and asset-swap note in `public/audio/LICENSE.md`.

- [ ] **Step 9: Verify focused and full behavior**

Run: `npm test -- src/sound/successSound.test.ts src/components/VerdictNotice.test.tsx src/components/ExerciseTopBar.test.tsx`

Run: `npm run check`

Expected: all focused tests and the full repository gate pass with no warnings caused by the change.

- [ ] **Step 10: Commit**

Commit message: `feat: add verdict success sound`
