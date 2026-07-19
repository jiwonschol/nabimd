# CBT Editorial Desk Design

**Status:** Approved by Jiwon on 2026-07-19  
**Scope:** Replace the exercise screen only. Problem-family expansion belongs to Issue #9.

## Product intent

Nabi Markdown should borrow the interaction grammar of a familiar computer-based test: a stable question sheet on the left, an answer sheet on the right, and every action in one fixed top bar. A learner should not need to learn the interface before learning Markdown.

The layout must remain useful when a future Level 5 exercise is a long, real company work order. The browser viewport is the frame; long documents scroll inside equal panels instead of moving the page chrome.

## Outcome contract

There are exactly two grading outcomes:

- **Try again:** the requested Markdown syntax or structure is absent or malformed.
- **Matched:** the requested Markdown syntax and structure are present.

Capitalization, spelling, prose, and exact wording never affect the outcome. The learner's source is preserved exactly.

## Fixed frame

- The app shell occupies one viewport and never creates document-level vertical scroll during an exercise.
- One top bar owns the wordmark, Exit, Try another, elapsed clock, scheduled progress, sound, Hint, and Check/Next.
- Exit, Try another, Hint, and Check/Next use equal control dimensions. Check/Next remains the only filled control.
- The Nabi Markdown wordmark and Exit both return directly to the level chooser.
- Try another replaces only the current prompt with different content from the same skill. It does not consume a step or create transfer debt.
- The former bottom status bar is removed.

## Two-panel workspace

- Below the top bar, the workspace is a fixed 50:50 split: **Goal** and **Your answer**.
- The two panel frames always have the same dimensions on desktop, independent of content length or level.
- Each panel owns its own vertical scroll area. The top bar and panel headers never move.
- At narrow widths the two equal surfaces may stack vertically, but the page itself still must not overflow horizontally.

## Goal panel

- The left panel renders the target document only. It has no content mode or answer state.
- Hint belongs to this panel. The top-bar Hint control expands a vertical hint region inside the Goal panel and collapses it again.
- Level 1 may start with Hint open. Recall levels start closed.
- Hint reveals syntax and progressive coaching but never edits source.
- `?` toggles Hint only when focus is outside a text-entry surface, so ordinary question marks remain typeable.

## Answer panel

- Before checking, the tabs are **Write** and **Preview**.
- Write contains the CodeMirror source editor and its Invisibles control.
- Preview renders the learner's Markdown. There is no third Live Preview column.
- After a failed check, Preview becomes **Review** and opens automatically. Review shows only the Markdown part that needs attention, using beginner language:
  - `1 thing to fix`
  - `How it should look`
  - `What you wrote`
  - `How to fix it`
- After Matched, Review is available only when structural review items exist; otherwise Preview remains available.
- Review never presents prose, capitalization, spelling, or exact-target differences.
- `Alt+1` opens Write. `Alt+2` opens Preview or Review. Tab remains available for editor indentation and normal keyboard navigation.

## Feedback and focus

- Check is explicit and remains `Cmd+Enter` on macOS or `Ctrl+Enter` elsewhere.
  Its top-bar control visibly displays `⌘↩` on macOS or `Ctrl+↩` elsewhere so
  the keyboard path is discoverable.
- Try again and Matched appear briefly as a large, viewport-centered notice, pale red or pale green, then fade away. The notice is announced through an ARIA live region.
- Matched, Try again, and turn completion each have one restrained cue on a
  shared, interruptible audio channel. One persistent mute preference covers
  all three; no typing, Hint, Check-before-verdict, or Next sound is added.
- After Try again, the learner stays in the current problem and returns to Write to repair it.
- After Matched, the top-bar Next button receives focus. Space or Enter advances.
- When the next problem appears, Write opens and the editor receives focus.
- The full greeting-to-completion path is keyboard operable.

## Preview policy hook

Every new problem opens Write because editor focus is part of the keyboard contract. A level policy controls what happens after Check:

- Lower levels prefer Preview/Review after Check so syntax and rendered result remain closely connected.
- Higher levels may stay in Write after a clean Matched result and expose Preview/Review on demand.

This resolves the conflict between a low-level preview preference and the stronger requirement that each new problem immediately return focus to the editor.

## Completion

Completion replaces the two-panel workspace with a focused turn summary while the top bar stays fixed. The summary shows scheduled score, frozen elapsed time, encouraging copy, an honest level-standing placeholder from `rankingClient`, and authored syntax reminders for failed scheduled slots. It never invents percentile data or turns a remediation exercise into another score slot. The existing Practice again, Start over, and Change level choices remain.

## Accessibility and verification

- All visible actions have accessible names and visible two-pixel focus rings.
- Selected tabs expose the tab/tabpanel relationship and keyboard shortcuts.
- At 1280×800 the top chrome and both panels remain in one viewport with no body or document scroll.
- A long source document scrolls inside the answer panel without resizing either panel.
- Regression coverage proves Check → focused Next → Space/Enter → focused editor.

## Out of scope

- New problem families or a large problem bank (Issue #9).
- AI generation or runtime AI grading.
- GFM, Obsidian, or editor-mode expansion (Issue #16).
- Exact block diffing that would reintroduce prose comparison.
