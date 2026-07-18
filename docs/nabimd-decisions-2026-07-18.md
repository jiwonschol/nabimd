# Nabi Markdown — Decision Record + Codex Task Brief
2026-07-18 · follow-up to `nabimd-review-2026-07-18.md` · out-of-band input for Jiwon → Codex

## Decisions confirmed by Jiwon (product owner)

- **D1 — Difficulty endpoint is fixed (A-1).** The ladder ends at: *writing a modern AI instruction document from a blank page* — goal, context, guardrails (things the AI must not do), output format. No artificial difficulty beyond that point. Jiwon has already supplied Codex with good example instruction documents (drawn from real Overwater operating prompts). This endpoint is also the long-term retention thesis if Nabi becomes a running service.
- **D2 — Levels are infinitely replayable (A-2).** Users self-regulate session length (10 min or 1 hour — they close the tab themselves). The product question therefore shifts to: *which level do you start at, and is the level right for you?* → needs a start/entry choice.
- **D3 — Progress ladder becomes ~5 steps (A-3).** After completing a step, ask the user their next turn: level up / stay / down. Define an explicit completion point. The header progress indicator must reflect these steps — not a hidden problem count that can end at "1 of 3" (review P1-1/P3-12).
- **D4 — Hint auto-open policy (C-8).** Hint opens automatically ONLY at Level 1 (user assumed beginner). Level 2+ starts hidden. Root cause acknowledged: there is no level-select surface yet — D2's entry chooser carries this.
- **D5 — Cmd/Ctrl+Enter: not a bug, close the finding (C-9).** Jiwon verified on a real keyboard that both Cmd+Enter and Ctrl+Enter trigger Check (the automation-only failure was an artifact). Action that remains: **show the shortcut on the Check button** (⌘↩ on macOS, Ctrl+↩ elsewhere) — users can't use what they can't see.
- **D6 — Invisibles must mark NBSP (C-7).** Add U+00A0 (and ideally U+3000) to `invisibleCharacters.ts` marking + tests. (Review P2-6.)
- **D7 — Identity & persistence (C-10).** Fully open source (brand retained by Jiwon), never any login. "Anyone drops in, types away, leaves." Progress is **session-scoped**: kept during the visit, fresh start after the browser closes → switch `localStorage` → `sessionStorage`. This also dissolves the schema-migration/reset concern (review P3-11). Note: the written spec's "versioned localStorage" clause must be updated to match (spec is the source of truth per repo docs).
- **D8 — Setext handling direction (B-5).** Beginner-encouraging: celebrate that it's a real heading, then guide to the `#` style. Copy below (D11).

- **D9 — Grading policy (confirmed 2026-07-19): two verdicts, Markdown only.**
  - **Try again** = the requested Markdown construct is absent or malformed.
  - **Matched** = the requested Markdown construct is valid; this is the only pass state.
  - `Perfect` and faithful-copy grading are removed. Optional review concerns Markdown document structure only and never changes the verdict.
  - The Goal is an example to reproduce structurally, not an exact prose answer key.
- **D10 — Case and prose sensitivity (confirmed 2026-07-19): do not grade prose.** `# apple`, `# aple`, and `# Banana` all pass the Level 1 hash-H1 exercise. Nabi preserves exactly what the learner typed and does not auto-capitalize, spell-check, or expose prose differences in Review.
- **D11 — Setext feedback copy (updated 2026-07-19).** Detect any top-level Setext H1 without comparing its prose, then guide the learner to the hash style: `That's a real heading! Markdown has two heading styles — this quest practices the hash style. Try: # Rainy day`. The visible failed-verdict label is `Try again`.

## Suggested Build Week scope split (deadline 2026-07-22 09:00 PDT→KST per rules; internal target 07-22 06:00 KST)

**Must-land before judging (all small, all judge-visible):**
1. Completion screen actions: `Practice again (new content)` + `Start over` (+ small repo link) — fixes review P1-1/P1-2 together with D2's replayability.
2. Entry chooser — one screen, three entries (`New to Markdown — start at Level 1` / `I know the basics` / `Challenge me`). Realizes D2, carries D4's hint policy. Not a full level map.
3. Progress header per D3 (step semantics; never strands at "1 of 3" on completion).
4. Engine/feedback batch: spacing-detector pattern fix (review P1-3) + D10 case feedback + D11 Setext feedback + D6 NBSP invisibles + D5 shortcut label on Check.
5. D7 sessionStorage swap (adjust persistence tests accordingly).
6. Regression tests pinning D9 policy + the review's test-gap list.

**Post-contest roadmap (feeds Devpost "What's next" honestly):**
- Full 5-step ladder to the D1 endpoint (AI instruction documents), using Jiwon's example corpus; new problem families beyond headings; D9 extended with schema-style checks for blank-page composition (title present, guardrail list present, output-format section present, length cap).

Repo's own cost rule applies ("adding a feature removes an equal-cost planned feature") — the must-land list above is deliberately small-ticket; if Codex judges any item larger than expected, cut from the bottom of the list (6 → 5 → 3), never cut items 1–2.
