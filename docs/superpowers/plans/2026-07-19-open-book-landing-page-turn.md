# Open-book Landing Page Turn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the form-like greeting with the selected open-book landing and carry a chosen level into the practice screen through a paper-turn sound and accessible page transition.

**Architecture:** `App` owns a short-lived transition phase so session state can start immediately while the landing remains as an inert visual overlay. A focused `OpenBookLanding` component renders curriculum actions, while a small page-transition sound module uses its own audio channel and the existing mute preference. CSS handles desktop page geometry, transform-only motion, compact-screen fallback, and reduced-motion behavior.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vite, Playwright.

## Global Constraints

- Selecting a level and starting are one action; no separate Start button.
- Use the selected open-book visual at 1440 x 1024 as the fidelity target.
- Preserve the existing five `entryChoices` as the curriculum source of truth.
- Use the product owner's `src/sound/nabi-page-turn.mp3` through a separate audio channel.
- Respect the existing mute preference and `prefers-reduced-motion`.
- Preserve keyboard-only entry and editor focus after navigation.

---

### Task 1: Page-turn sound channel

**Files:**
- Create: `src/sound/pageTurnSound.ts`
- Create: `src/sound/pageTurnSound.test.ts`
- Add: `src/sound/nabi-page-turn.mp3`

**Interfaces:**
- Consumes: `readSoundMuted(): boolean` from `src/sound/feedbackSound.ts`.
- Produces: `playPageTurnSound(): void` and `__resetPageTurnSoundForTesting(): void`.

- [x] **Step 1: Write the failing test**

```ts
it("plays the page-turn asset on an independent channel", () => {
  playPageTurnSound()
  expect(audio.src).toContain("nabi-page-turn.mp3")
  expect(audio.play).toHaveBeenCalledTimes(1)
})
```

- [x] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/sound/pageTurnSound.test.ts`

Expected: FAIL because `pageTurnSound.ts` does not exist.

- [x] **Step 3: Implement the channel**

```ts
import pageTurnSoundAsset from "./nabi-page-turn.mp3?url"
let pageTurnAudio: HTMLAudioElement | null = null

export function playPageTurnSound() {
  if (readSoundMuted() || typeof Audio === "undefined") return
  pageTurnAudio ??= new Audio(pageTurnSoundAsset)
  pageTurnAudio.currentTime = 0
  void Promise.resolve(pageTurnAudio.play()).catch(() => {})
}
```

- [x] **Step 4: Verify the focused test passes**

Run: `npm test -- src/sound/pageTurnSound.test.ts`

Expected: PASS.

### Task 2: Open-book landing and state handoff

**Files:**
- Create: `src/components/OpenBookLanding.tsx`
- Create: `src/components/OpenBookLanding.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `entryChoices`, `EntryId`, and `playPageTurnSound()`.
- Produces: `OpenBookLanding({ onChoose })`, where `onChoose(entryId)` is called exactly once after sound playback starts.

- [x] **Step 1: Write failing component and integration tests**

```tsx
await user.click(screen.getByRole("button", { name: entry.label }))
expect(playPageTurnSound).toHaveBeenCalledOnce()
expect(screen.getByTestId("page-turn-transition")).toBeVisible()
expect(screen.getByRole("textbox", { name: "Your Markdown" })).toBeVisible()
```

- [x] **Step 2: Run the focused tests and verify they fail**

Run: `npm test -- src/components/OpenBookLanding.test.tsx src/App.test.tsx`

Expected: FAIL because the component and transition state are absent.

- [x] **Step 3: Build the landing component**

```tsx
export function OpenBookLanding({ onChoose, turningEntryId }: Props) {
  return <main className="open-book">{/* intro page and entryChoices */}</main>
}
```

Use native buttons, disable all rows while turning, and keep labels sourced from `entryChoices`.

- [x] **Step 4: Add the App transition phase**

```tsx
const [turningEntryId, setTurningEntryId] = useState<EntryId | null>(null)
const chooseLevel = (entryId: EntryId) => {
  if (turningEntryId) return
  setTurningEntryId(entryId)
  playPageTurnSound()
  learningSession.start(entryId)
}
```

Keep `OpenBookLanding` as an inert overlay for 720 ms while `EditorialDesk` renders underneath.

- [x] **Step 5: Verify focused tests pass**

Run: `npm test -- src/components/OpenBookLanding.test.tsx src/App.test.tsx`

Expected: PASS.

### Task 3: Visual system, motion, and responsive fallbacks

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Consumes: `.open-book--turning` and `.page-turn-receiver` state classes.
- Produces: desktop open-book layout, 720 ms page turn, compact-screen fallback, reduced-motion fallback.

- [x] **Step 1: Add the open-book layout and component states**

Use a two-column grid, center fold, editorial type hierarchy, row separators, large native-button targets, and focus-visible styling matching the source mock.

- [x] **Step 2: Add transform-only transition keyframes**

```css
@keyframes turn-page-forward {
  to { transform: rotateY(-178deg); }
}

@keyframes receive-next-page {
  from { opacity: 0; transform: translateX(1.5rem); }
  to { opacity: 1; transform: translateX(0); }
}
```

- [x] **Step 3: Add compact and reduced-motion fallbacks**

At widths below 760 px, stack the book pages and replace 3D rotation with a short slide/crossfade. Under `prefers-reduced-motion`, disable page rotation and use 120 ms opacity only.

- [x] **Step 4: Run complete static verification**

Run: `npm run typecheck && npm test && npm run build`

Expected: zero failures and exit code 0.

### Task 4: Browser and design QA

**Files:**
- Create: `docs/design/qa/open-book-landing-design-qa.md`

**Interfaces:**
- Consumes: selected source image and browser screenshots.
- Produces: a passing visual/interaction QA record.

- [x] **Step 1: Run the app and capture the landing at 1280 x 720**

Run: `npm run dev -- --host 0.0.0.0`

Open the app with the in-app Browser and verify page identity, meaningful DOM, no framework overlay, and console health.

- [x] **Step 2: Exercise the transition**

Click Level 1, capture the transition and destination states, and verify the editor receives focus. Repeat using keyboard activation and verify rapid duplicate activation is blocked.

- [x] **Step 3: Verify responsive and reduced-motion states**

Capture desktop and a compact viewport, and inspect `prefers-reduced-motion` behavior.

- [x] **Step 4: Compare source and implementation together**

Create a same-viewport composite, record any P0/P1/P2 mismatch, fix it, and repeat until the dedicated QA record ends with `passed`.

- [x] **Step 5: Run the complete repository check**

Run: `npm run check`

Expected: zero failures and exit code 0.
