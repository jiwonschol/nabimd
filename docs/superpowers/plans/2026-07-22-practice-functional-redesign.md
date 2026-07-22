# Practice Functional Redesign — Diagnosis and Rebuild

**Date:** 2026-07-22 · **Status:** In progress (this session) · **Owner directive:** post-Build-Week full functional redesign of the practice page. Visual redesign is explicitly out of scope for this pass; functionality first.

> 경계 선언: 이 문서는 이 세션의 SoT다. 구현은 이 세션에서 진행하되, 푸시·PR·배포는 하지 않는다(로컬 커밋까지만).

## §0 Scope — owner's directives (2026-07-22 message)

| # | Directive | Workstream | Status |
|---|-----------|------------|--------|
| ① | Level 1 is completely broken — weird syntax demanded, unclear prompts | WS-A | done (guided wizard removed) |
| ② | Left goal + right auto-filled card, type ONLY the syntax — restore this contract | WS-A | done (D17 starter restored) |
| ③ | Wrong input → re-entry impossible — must retry freely | WS-A | done (stay-on-Write + editor refocus) |
| ④ | 100+ line problems still visible; L4/L5 teach composite syntax but stay SHORT | WS-C | done (runtime budgets + batch 021) |
| ⑤ | 앞으로/뒤로 (forward/back) dead, or Back exits the site | WS-B | done (prev/next controls + per-problem history) |
| ⑥ | Scrapping the broken problem inventory is authorized (전량폐기 OK) | WS-C | done (runtime retirement, artifacts immutable) |
| ⑦ | Invariant at every level: an easy place to practice Markdown *syntax*, never document authorship / typing stamina | all | done (runtime budget gate pins it) |

## §0.5 Standing decisions re-stated (violation forbidden)

From `docs/nabimd-decisions-2026-07-18.md` (D1–D17), `docs/build-week-pedagogy-decision-2026-07-20.md`, `docs/level-3-5-curriculum-correction-2026-07-21.md`:

- **D3** six-problem turn: L1–4 = 4 at-level + 2 next-level challenges; L5 = 6 at-level. Progress rail = 6 slots; repair/transfer stays outside scheduled slots.
- **D9/D10** two verdicts only (`Try again` / `Matched`); grade Markdown structure, never prose/case/spelling.
- **D12** open-book CBT desk: fixed top strip, Goal page left, answer page right with Write / Preview(→Review) / Hint.
- **D14** level identities: `1 Learn the syntax · 2 Rebuild real documents · 3 Write for people · 4 Write for work · 5 Write for developers` (L4/L5 renames were pending in UI — shipped in this pass).
- **D15** fixed visible Goal at every level; learner never authors new prose.
- **D16** deterministic weighted selection; no family repeats between neighbors; ≤2 per family per turn.
- **D17** answer sheet pre-filled with the Goal's words and exact line topology, Markdown marks removed; learner restores structure. Saved real drafts win.
- **2026-07-21 correction:** L4/L5 ≤ 40 authored lines / ≤ 165 words as *ceiling*, prefer the shortest coherent miniature; 1–3 minute problems; realism never replaces the syntax lesson.
- Accepted problem batches are immutable artifacts; runtime classification/selection may evolve without rewriting their evidence (established precedent: ordered-list drills retired via runtime exclusion, PR #96).
- No account, no streak, session-scoped progress, all levels directly selectable.

## §1 Current structure — diagnosis evidence (2026-07-22)

Verified first-hand in the running app plus two code-trace reports. The engine, gates and selection pipeline are **healthy**; the rot is in (a) the PR #98 guided-interaction layer and (b) L4/L5 content.

### A. Guided-syntax layer (PR #98) — the acute breakage
- Editor starts **empty**; `useGuidedSyntaxPractice.ts` comments "Guided practice intentionally begins on an empty source page" — a direct D17 violation. The D17-conformant projection (`derivePlaintextStarter` / `markdownBlankGuides.ts`) became dead code in the app.
- The card's real input is `opacity:0; pointer-events:none` (`global.css` ~3328) and is focused only programmatically on checkpoint change. After a wrong submit nothing refocuses it; clicking the visible blanks does nothing. Reproduced live: after one wrong submit, Backspace and typing were dead — the exact "재입력도 되지않아" report.
- One `problem.prompt` is repeated for every checkpoint; a 36-line L4 spec becomes a **1/15 blank-fill wizard** with no per-step instruction. Reproduced live on `l4-api-field-deprecation-migration`.
- The card demands contiguous mark strings (`[](`+`)`) split across locked prose, and Hint renders pseudo-tokens (`Space`, `Words`) as code chips — the "weird syntax" feeling.
- Guided mode is unconditional for every level and every problem with marks.
- A failed Check force-switches to the Review tab, unmounting the card mid-interaction.

### B. Navigation
- No URL routing. App pushes one history entry per problem; the guided hook pushes one **per syntax blank** on the same stack with empty URLs. Browser Back therefore steps blank-by-blank; past the landing `replaceState` entry it exits the site.
- There is **no problem-level prev/next UI**. The card chevrons ("Previous syntax") drive `history.back()` per checkpoint.
- Dead code: `useLearningSession.startOver` duplicates `practiceAgain`, consumed nowhere.

### C. Content (live bank = `runtime-projections.generated.json`, 360 problems)
- L1 140 / L2 148 / L3 30 / L4 20 / L5 22. L1–L3 targets are short and on-spec (L1 max 5 lines). **L1 content is not broken — its interaction layer was.**
- L4 is dev-spec material: batch 012 (36-line specs) + 40-line contract specs (017) + 25–34-line docs (018). Rendered goal region for one L4 problem measured 87 DOM lines — the owner's "100+ lines with blanks" perception.
- L5 batch 020 (12 compact developer forms, 14–18 lines) matches the corrected contract and is the model to keep. 018's L5 records run 25–34 lines.
- `curriculum-v2.json` still defines L4 as "executable development specifications" and L5 as "AI-executable work orders" — the definition that pulled content long. Contradicts the 2026-07-21 correction.
- Landing labels still show the pre-D14 names for L4/L5.
- Authoring length gate exists (`AUTHORING_BUDGET_BY_LEVEL`, batchPipeline.mjs) but only for batches ≥ 018; nothing gates the runtime projection.

## §2 Redesign

**One interaction model at every level (replaces the card wizard):** left Goal (rendered, fixed) · right answer page **pre-filled with the Goal's prose minus marks (D17)** · learner types the Markdown marks directly in the editor · explicit Check · `Try again` keeps the Write tab active and the editor editable. No hidden inputs, no checkpoint wizard, no per-blank history. The whole focus-trap bug class becomes unrepresentable.

### WS-A Interaction repair
1. Remove `GuidedSyntaxCard` from the flow (component + hook + per-blank history pushes). Editor binds to the session draft again.
2. Restore D17 starter: fresh problems open with `derivePlaintextStarter(target)`; saved drafts win.
3. Failed Check: stay on Write, show `Try again` verdict + feedback; Review remains an optional tab. (Fixes forced tab-switch.)
4. Prompts: `prompt` + `teaching.howTo` visible on the answer side; Hint unchanged (request-only). Remove pseudo-token chips (`Space`, `Words`) from Hint surface.

### WS-B Navigation
1. In-app **Prev / Next** problem controls in the top bar. Prev revisits earlier steps of the run with drafts + verdicts intact; re-check allowed; rail reflects latest verdicts. Next follows existing advance rules (matched or skip-forward to furthest unlocked step).
2. History = one entry per view transition only: landing ↔ practice-step. Back walks problem steps then landing; never blank-by-blank. Remove guided history layer entirely.
3. Delete dead `startOver`.

### WS-C Content
1. **Runtime retirement** (established PR #96 pattern — artifacts stay immutable): exclude from projections/selection every problem whose target exceeds the new runtime budget. Retires batch 012 entirely, 017's 40-liners, 018's 25–34-liners, and the 4 over-length milestone-001 records.
2. **New L4 batch 021 "workplace notes"** through the standard pipeline: 12 problems, composite syntax (heading + list + bold/inline-code + blockquote mixes), 8–18 authored lines, ≤ 120 words, batch-020 tone. L4 = short workplace notes/handoffs/checklists per the corrected ladder.
3. D14 renames in `curriculumLevels.ts` + landing/summary labels; correct `curriculum-v2.json` L4/L5 identities to the 2026-07-21 ladder (short forms, familiarity-not-difficulty).
4. L5 stays on batch 020 (+018 compact survivors if any pass the budget).

### WS-D Deterministic guards
1. **Runtime projection gate** (new): every problem entering `runtime-projections.generated.json` must satisfy per-level budgets — L1 ≤ 5 lines, L2 ≤ 14, L3 ≤ 28, L4/L5 ≤ 20 lines & ≤ 120 words. CI-fails on violation, so over-length content can never ship again regardless of authoring-era.
2. Regression tests: fresh problem → starter is D17 projection (not empty); failed check → editor still editable + Write tab active; run navigation prev/next; history never pushes per-blank.

**Order:** WS-A → WS-B (both touch EditorialDesk/AnswerPanel; A first because B's step-history replaces the guided history A removes) → WS-C (content, independent of A/B code paths) → WS-D last (gates pin the final shape).

## §3 Success gates (numeric, decided before implementation)

- G1 Full `npm run check` green (typecheck, unit, bank gates, build, bundle verify).
- G2 Runtime bank stats: 0 problems > 40 lines; 0 L4/L5 problems > 20 lines / > 120 words; L4 count ≥ 12; every level ≥ 12 uniques (D16 rotation viable).
- G3 Live-app verification (browser, not eyeball-only — DOM-measured): L1 run → wrong answer → **retype immediately succeeds**; verdict copy visible; L4 run median goal ≤ 20 authored lines.
- G4 Navigation: from practice step N, in-app Prev reaches N−1 with draft intact; browser Back never exits the site from inside practice; landing Back exits (expected browser behavior, 1 entry only).
- G5 No `guided-syntax` runtime code paths remain (grep 0 in src, tests updated).

**폐기 기준:** editor-native blank guides가 L1에서 "어디에 문법을 넣는지"를 육안으로 못 보여주면(빈칸 표시 불가) WS-A를 카드-수리 방향(보이는 input + 클릭 포커스 + per-step 지시문)으로 전환한다.

## §4 Assumptions (owner may override later)

1. "센터카드" = the answer page of the open book (D12/D17), not the floating checkpoint card from PR #98. The floating card is treated as GPT's mis-implementation and removed rather than repaired.
2. D3's 4+2 challenge composition stays (L1 runs still end with two L2 problems) — the complaint was card opacity, not the ladder.
3. Link/image problems: URL is not part of "syntax the learner must invent" — starter keeps the URL visible as prose so the learner only adds the marks. If the engine's `link-shape` pins a URL, the starter must contain it.
4. Local commits only; no push/PR/deploy from this session.

## §5 Session log

- 2026-07-22: Diagnosis complete (live repro + 2 code traces). Plan written. Implementation starting: WS-A. (Update this log and the §0 status column as workstreams actually land — never pre-record results.)
- 2026-07-22 (cont.): WS-A+B landed (guided layer removed end-to-end; D17 starter back; failed Check stays on Write with editor focus; in-app Prev/Next via per-step snapshots reusing the history-navigated reducer path; per-blank history pushes gone). Unit suite 10,109 green; e2e 41 green after spec rework.
- 2026-07-22 (cont.): WS-C landed. Batch 021 `2026-07-22-l4-workplace-notes-021` authored (12 problems × 4 families, 9–13 lines, 141 fixtures) and published through the sealed pipeline (prepare → 2 mechanical review replays → editorial → publish; tracker 360→372). Runtime budget filter retires all document-length problems (served: L1 140 / L2 148 / L3 30 / L4 12 / L5 12; max lines 5/11/25/13/18). D14 labels shipped (`Write for work` / `Write for developers`); curriculum-v2 L4/L5 identities corrected to compact documents. WS-D landed: `runtimeBudget.gate.ts` in the gate chain + updated bank tests. Unit suite 10,114 green.
- 2026-07-22 (final gates): G1 `npm run check` exit 0 (typecheck · 21 batch gates · runtime-budget gate · repository immutability gate · 10,114 unit tests · build · bundle verify) and full e2e 41/41 exit 0 — both after WS-C. G3/G4 verified live in the browser: L1 wrong `*` → Try again keeps Write selected + editor focused, immediate retype to backticks → Matched; in-app Prev restores step 0 with draft intact, Next-visited returns; browser Back moves problem-by-problem, never exits the site; L4 run = 4 workplace notes + 2 compact L5 forms, first goal 13 lines. Local commits only — push/PR/배포는 Jiwon 결정 대기.
