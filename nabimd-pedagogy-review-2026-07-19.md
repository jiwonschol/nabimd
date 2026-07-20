# Nabi Markdown — Pedagogy & Curriculum Review (2026-07-19)

Method: read-only audit of the repo (4 parallel lenses: curriculum inventory, learner journey, learning-science alignment, adversarial problem sampling) + a hands-on first-time-learner run on production. Measured, not assumed: 344 problems (L1 136 / L2 148 / L3 30 / L4 20 / L5 10), runPolicy turnSize 6 (4 at-level + 2 next-level challenges, hints auto-open on the first 4), verdicts Try again/Matched (Perfect removed by D9 rev.), transfer on fail only (D4 rev.). Where the repo's decision log supersedes earlier conversation (6-problem turn, 2-state verdicts), the newer decisions were evaluated on their merits — not flagged as drift.

## Verdict against the four goals

| Goal | Verdict | One-line basis |
|---|---|---|
| ① A place anyone can learn without pressure | **Strong** | "Try again" (the word Fail never renders), 1.6s self-dismissing toast, no streak/XP/lives, penalty-free hints, Try another escape hatch. Two tensions: always-on clock, percentile seed (below). |
| ② Main page with zero friction to start | **Strong** | 1 click (or Tab+Enter) → problem with editor auto-focused. Book-spread metaphor, "There is no wrong place to start." No signup, no placement test. |
| ③ Practice teaches by following the goal | **Strong at L1–L2, broken at L3–L5** | L1–2: teaching block + chips + prose preseed = textbook completion-problem design. L3–5: feedback/hints reference a "Goal" document that brief mode never renders (56/60 problems) — learners are compared against something they cannot see. |
| ④ Summary: mistakes visible, courage to restart | **Structurally strong** | Score + frozen time + "Syntax to revisit" (per-family reteaching with tokens & how-to) + always-positive encouragement + autoFocus Practice again (1 key). Inherits ③'s defect at L3–5. |

Overall: **L1–L2 is a shippable, literature-aligned piece of instructional design. L3–L5 has the right skeleton (structural predicates, conventions, vocabulary ladder) but its feedback contract is broken in a trust-destroying way.** The pipeline exists, so the cost of regeneration is low — this is a content-contract fix, not an architecture fix.

## What is genuinely good (keep, and say so in the submission)

1. **Preseeded completion problems (L1–2)**: learners get the prose and add only the markup. This is the worked-example → completion-problem strategy straight from cognitive load research, and it removes typing (irrelevant load) while keeping the learning target (structure). The single best design decision in the product.
2. **Explicit Check = retrieval practice**: no live grading while typing; the recorded rejection of a "quiet live coach" (because auto-correction develops operation, not recall) is exactly right and worth telling judges.
3. **Failure framing**: "Try again — One part needs a Markdown mark." No red X, no permanent marks, toast dissolves in 1.6s, context preserved for in-place repair. Review tab's 4-part structure (thing to fix / how it should look / what you wrote / how to fix it) is model KCR+elaborated feedback.
4. **Transfer as near transfer**: fail → repair → same skill, different content, loop-capped. Recognition becomes recall without punishment.
5. **Interleaving with guardrails (L1)**: weighted round-robin across families, no adjacent same-family, per-turn family cap — interleaved practice done properly.
6. **Curriculum data quality gates**: teaching {concept, howTo, example} enforced; 3-stage hints (abstract → procedure → example) enforced; 6-role fixtures per problem; every matchCheck fixture-covered; vocabulary profile pinned per level and enforced.
7. **Summary design**: failure is aggregated to the skill level ("Syntax to revisit" with reteaching), not itemized as a scoreboard of wrongness; restart is one keypress.
8. **CBT frame**: one screen, chrome fixed, panels scroll internally; interface requires no learning.

## P1 — fix before submission (trust-breaking)

1. **Brief-mode feedback references an invisible "Goal" — 56 of 60 L3–5 problems.** Brief mode renders only a one-sentence prompt (by design, D15), yet failure feedback says e.g. "…two H2 sections in the Goal's order." The learner is graded against a document that does not exist on screen. Fix: (a) rewrite brief-mode feedback templates to enumerate the requirement itself ("Use one title, an opening paragraph, then two H2 sections: Decision, Actions."); (b) add a validator rule: brief-mode problems must not contain the string "Goal" in feedback/hints; (c) regenerate through the existing pipeline.
2. **Briefs under-specify what is graded.** Worst cases: `l5-auth-migration-work-order` (one-sentence brief vs 9 structural checks incl. exactly 7 H2s); `l5-release-context-work-order` (brief enumerates 6 of the 7 required sections — following instructions faithfully produces failure). Fix: pipeline contract + validator cross-check — every graded section/count must be derivable from the brief text; for L5, surface the work-order convention as a visible reference card (the convention metadata already exists in data).
3. **Next button advertises "Space / Enter" but both are intentionally blocked** (ExerciseTopBar keydown preventDefault; advance works only via Ctrl/Cmd+Enter or click — reproduced live). A control that promises keys it suppresses is a label-behavior contradiction. Fix: either honor Enter/Space (debounce against double-fire instead of blocking) or change the label to the real shortcut. Recommend honoring Enter at minimum.
4. **First-turn challenge violates prerequisites (deterministic).** Seed-0 L1 turn 1: slots 1–4 introduce list/ordered/blockquote/bold; slot 5 (`l2-code-block-alarm-routine`, hints closed) demands H1 + fenced code + ordered list — two never-introduced syntaxes, described in hints with unlearned jargon ("H1", "backtick"). Fix: constrain challenge selection to families already introduced in the current turn (or make turn-1 challenges at-level); cheap alternative: reorder the L2 arrays so early challenge picks are single-family recalls.

## P2 — learning-curve and quality

5. **L2→L3 cliff**: three axes change at once (rendered target → one-line brief; preseeded prose → blank page; 4-line → 16-line documents). Buffers exist (challenge previews, briefs that half-enumerate structure) but no bridge task. Fix: add one faded-brief completion type — brief + half-built skeleton (starterText for the first L3 slots).
6. **Scaffold fading has only two steps** (hints open → hints closed AND level+1 simultaneously). Fix: an intermediate state — e.g., challenge slot 1 same-level/no-hint, or a tokens-only hint stage.
7. **List spacing feedback is imprecise** (live repro: `1.Place…` → "Add at least three numbered steps, with words after each marker." — the missing space is never named, while headings have the precise "Add one space after the hash symbol."). Fix: marker-spacing detectors + dedicated feedback for ordered/unordered lists.
8. **24 thematic-break problems expose literal `\n\n` in stage-3 hints.** Non-developers do not read escape sequences. Fix: hint-text lint (no `\n`, no escaped wrappers) + regenerate; also review inline-code hint double-backtick wrappers rendering literally.
9. **Upper-level bank is thin**: L3 30/96, L4 20/80, L5 10/80 vs targets; L5 repeats content from turn 2; retryFamilies with only 2 variants degrade transfer to same-problem reuse. Fix: prioritize L3–5 batches; raise the variant floor to ≥4 for L3+.
10. **Always-visible clock + percentile seed vs the no-pressure philosophy.** Elapsed time ticks on the very first L1 problem; "Level standing / About top N%" scaffolding is already rendered (currently "Collecting data"). Fix: hide the clock during L1 by default (reveal in summary); replace percentile with self-referential comparison (vs your own previous turns).
11. **"Start over" and "Practice again" are currently the same implementation** (both `startRun(entryId, runNumber+1)`) while the spec defines Start over as returning to the original deterministic sequence. Fix to spec or drop one button.
12. **Link problems**: the grader accepts any URL (correct choice) but the goal render hides the URL and nothing tells the learner any address passes. Fix: one hint line — "Any web address works here."

## P3 — enrichment (post-contest)

13. Mastery signal without gates: if both challenge slots pass hint-free, summary adds "Ready for Level N+1." (no forced gating — preserves self-selection).
14. Session-scoped storage precludes cross-visit spacing — an intended consequence of D7. If ever revisited: a minimal localStorage skill-vector (last-failed families only) would enable warm starts without accounts. Product decision, not a defect.
15. Germane load: optional one-line self-explanation prompt after Matched ("Why the blank line?" — ungraded).
16. Summary shows family-level failures only (defensible abstraction); a subtle per-slot mark on the rail would add item-level visibility if ever wanted.

## Real-device checklist (automation could not verify; e2e covers most — 2 minutes)

- Landing: Tab → Enter enters Level 1 (e2e says yes; my synthetic Enter did not fire).
- After Matched: does Enter or Space on the focused Next advance? (Expected per code: NO — that is finding P1-3.)
- `?` opens hint outside the editor; Alt+1/Alt+2 switch Write/Preview.
- Sounds: matched / try-again / summary each audible once; mute persists across sessions.

## Inventory snapshot (for planning)

344 problems · 17 batches all accepted · fixtures per batch 184–2,304 · L1 136 (headings 28, lists 24, others 12 each) · L2 148 (100 single-syntax recall + 48 composite rebuilds) · L3 30 (8 document archetypes) · L4 20 (5 families) · L5 10 (4 families, conventions enforced) · vocabulary ladder real and enforced (everyday → agent-workflow) · README of batch 017 claims 238 frozen fixtures, actual 228 · `l2-nested-outline-*` syntaxTokens omit `##`.
