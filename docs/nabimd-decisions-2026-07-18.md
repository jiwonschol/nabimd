# Nabi Markdown — Decision Record + Codex Task Brief
2026-07-18 · follow-up to `nabimd-review-2026-07-18.md` · out-of-band input for Jiwon → Codex

## Decisions confirmed by Jiwon (product owner)

- **D1 — Difficulty endpoint is fixed (A-1).** The ladder ends at: *writing a modern AI instruction document from a blank page* — goal, context, guardrails (things the AI must not do), output format. No artificial difficulty beyond that point. Jiwon has already supplied Codex with good example instruction documents (drawn from real Overwater operating prompts). This endpoint is also the long-term retention thesis if Nabi becomes a running service.
- **D2 — Levels are infinitely replayable (A-2).** Users self-regulate session length (10 min or 1 hour — they close the tab themselves). The product question therefore shifts to: *which level do you start at, and is the level right for you?* → needs a start/entry choice.
- **D3 — Progress ladder (superseded 2026-07-19).** The earlier “~5 steps” decision has become a concrete turn contract: Levels 1–4 schedule six problems, four at the selected level plus two next-level challenges. Level 5 schedules up to six unique at-level problems; while only four exist, the visible total is four. A failed-check remediation is outside the scheduled six and may extend the visible total to seven.
- **D4 — Hint rhythm (superseded 2026-07-19).** Hint begins open for chosen-level problems and closed for next-level challenges. It remains manually available everywhere. Opening Hint never creates remediation or changes a verdict; only an actual failed Check creates the different-content same-skill repair.
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
- **D12 — Exercise frame becomes a CBT desk (confirmed 2026-07-19).** Replace the editor-like Goal/Source/Live Preview/Coach layout with a familiar test frame: one fixed top bar and two equal sheets, immutable rendered Goal on the left and the learner's answer on the right. The answer sheet owns `Write` and `Preview`; after a failed Check, `Preview` becomes `Review`. Hint reveals vertically inside Goal. Long Level 5 work orders scroll inside the equal panels, never through the page chrome.
- **D13 — Problem-bank variety is vocabulary-led (confirmed 2026-07-19).** Issue #9 expands the number of vetted prompts without changing the grammar-only grading policy. Level 1 uses short familiar nouns and phrases from fruit, weather, and learning tools. Higher levels combine skills around realistic US company documents; Level 5 uses real work-order and AI-instruction vocabulary. Repetition practices a Markdown skill with new content instead of asking the learner to copy the same prose again.
- **D14 — Definitive level identities (confirmed 2026-07-19).** The five entry, header, and completion labels are: `Level 1 — Learn the syntax`, `Level 2 — Rebuild real documents`, `Level 3 — Write for people`, `Level 4 — Write a development spec`, and `Level 5 — Write an agent work order`.
- **D15 — Target versus brief (confirmed 2026-07-19).** Levels 1–2 show a rendered target to rebuild. Levels 3–5 show a brief and ask the learner to compose the document. Both are graded by the same Markdown-structure predicates; neither route compares prose.
- **D16 — Scheduled variety (confirmed 2026-07-19).** Low-level single-syntax selection is deterministic and weighted: lists appear mildly more often, inline code/link/image mildly less, and other families at baseline. Scheduled neighbors never share a family, including between turns; one family appears no more than twice per turn. Composite Level 2 rebuilds are exempt. Accepted problem batches remain immutable; runtime classification and selection may evolve without rewriting their evidence.

## Historical Build Week scope split (superseded by D14 and the five-choice runtime)

**Must-land before judging (all small, all judge-visible):**
1. Completion screen actions: `Practice again (new content)` + `Start over` (+ small repo link) — fixes review P1-1/P1-2 together with D2's replayability.
2. Entry chooser — originally proposed as three entries; the shipped direction now exposes all five exact D14 levels.
3. Progress header per D3 (step semantics; always shows the truthful current total).
4. Engine/feedback batch: spacing-detector pattern fix (review P1-3) + D10 case feedback + D11 Setext feedback + D6 NBSP invisibles + D5 shortcut label on Check.
5. D7 sessionStorage swap (adjust persistence tests accordingly).
6. Regression tests pinning D9 policy + the review's test-gap list.

**Post-contest roadmap (feeds Devpost "What's next" honestly):**
- Full 5-step ladder to the D1 endpoint (AI instruction documents), using Jiwon's example corpus; new problem families beyond headings; D9 extended with schema-style checks for blank-page composition (title present, guardrail list present, output-format section present, length cap).

Repo's own cost rule applies ("adding a feature removes an equal-cost planned feature") — the must-land list above is deliberately small-ticket; if Codex judges any item larger than expected, cut from the bottom of the list (6 → 5 → 3), never cut items 1–2.
