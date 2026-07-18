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

## Decisions delegated to Claude — provisional, Jiwon will play-test and overrule freely

- **D9 — Grading policy (B-4): "Valid Markdown never Fails; only the target defines Perfect."**
  - **Fail** = required skill/structure missing, or protected text not reproduced.
  - **Matched** = required skill used and Markdown valid, but the rendered result differs from the goal — extra inline markup (`# **Apple**`, `` # `Apple` ``, `# [Apple](url)`) or extra blocks (added paragraph / `## Details`). Passes (Next opens) + one review item naming the difference, e.g. `Your document renders more than the goal — remove the extra emphasis/content to match it exactly.`
  - **Perfect** = rendered result faithfully matches the goal.
  - Implementation: add editorial check `matches-target-exactly`; review cases A11–A13, A19–A20 move from Perfect → Matched+review. Pin ALL of these with tests either way (they are currently unpinned behavior).
  - Rationale: honors the spec's "never call valid Markdown wrong syntax" (nothing new Fails) while restoring meaning to "rebuild the target" (Perfect = faithful). Beginner-friendly: differences are coaching, not punishment.
- **D10 — Case sensitivity (B-6): keep it, but say it.** `# apple` vs goal `Apple` stays a Fail (faithful rebuild includes capitalization), but gets a dedicated feedback instead of the misleading generic one: `Close — match the capitalization: the goal says 'Apple'.` (Currently: "Keep the word 'Apple' in your answer," which the user feels they already did. Review P2-5.)
- **D11 — Setext feedback copy (from D8).** New predicate detecting a Setext heading whose text matches the target, checked before `use-h1-heading`, with encouraging feedback: `That's a real heading! Markdown has two heading styles — this quest practices the hash style. Try: # Rainy day` Optional small follow-on: when the submission is valid Markdown that renders like the goal, soften the visible status prefix from "Fail:" to "Almost:".

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
