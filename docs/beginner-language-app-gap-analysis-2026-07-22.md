# Gap Analysis — Common Grammar × Current nabimd Practice

**Date:** 2026-07-22 · **Status:** Research input — nothing in this document is a decision · **Tracker:** Issue #100

> [!IMPORTANT]
> **아직 미결정된 사항이 많다.** 이 표는 "무엇을 고치라"가 아니라 "현재 어디에
> 있는가"다. 어떤 갭을 닮을지/닮지 않을지는 전부 Jiwon이 결정한다.
>
> 기준 코드 상태: PR #99 머지 직후의 `main`(7f21a90). 항목 번호(G1–G24)는
> [조사 문서](beginner-language-app-grammar-research-2026-07-22.md)를 따른다.

**State legend:** ✅ present · ⚠️ partial/different mechanism · ❌ absent ·
🚫 deliberately rejected by a confirmed decision (adopting it = changing a
decision, not filling a gap).

## The table

| # | Genre grammar item | nabimd today (code evidence) | State |
|---|---|---|---|
| G1 | Bounded micro-lesson (10–20 items, minutes) | Six-problem turn (D3), problems sized 1–3 min (2026-07-21 contract, runtime budget gate). Turn ends in a Summary. | ✅ |
| G2 | One exercise per screen | One problem per desk view; Goal left, answer right (D12). | ✅ |
| G3 | Always-visible progress bar + exit | Six-dot rail + level label + elapsed time + Home (`ExerciseTopBar.tsx`); `Repair practice — Exercise N of M` for off-rail steps. Babbel-style ‹ › step arrows also present (PR #99). | ✅ |
| G4 | Small fixed exercise-type vocabulary | Exactly **one** exercise type at every level: restore the marks over a D17 starter. Uniform (never a new UI), but there is no second type — no recognition or assembly variant anywhere. Genre precedent for n=1 exists: Lingvist's whole product is a single typed-cloze type (drill lineage). | ⚠️ |
| G5 | Scaffold ladder: recognition → assembly → production | None. Every problem at every level is free production from the starter. The only fading is content-level (single mark at L1 → composite at L4/5). | ❌ |
| G6 | Context supplied; learner produces only the target token | **This is D17 verbatim**: starter = Goal prose with marks removed; learner types only the Markdown marks. nabimd's strongest alignment with the genre core. | ✅ |
| G7 | Teach before test (NEW badge, meaning shown first) | No first-encounter moment. A new syntax family is first met *inside a graded problem*; the teaching content (`teaching.howTo`, `teaching.example`) exists in the bank but is only reachable through the request-only Hint tab (D4). | ❌ |
| G8 | Constrained input first (tiles), typing as opt-up | No constrained mode. The editor does render blank guides showing *where* marks go (`deriveMarkdownBlankGuides`), which bounds the search space visually — a partial analog. Note: for nabimd, typing the marks *is* the terminal skill (typing-tutor family), so "tiles first" may not transfer; see proposals doc. | ⚠️ |
| G9 | Explicit submit → immediate binary verdict | Check button + ⌘/Ctrl+Enter (D5), two verdicts only (D9): `Try again` / `Matched`. | ✅ |
| G10 | Wrong-answer moment: persistent banner, correct answer shown, failed token pinpointed | Verdict toast auto-dismisses after **1.6 s** (`VerdictNotice.tsx`) with a generic line ("One part needs a Markdown mark"). The pinpointed correction ("You wrote X / Use Y / repair instruction", `buildReviewCorrections`) **exists but lives behind the Review/Hint tabs** — the learner must navigate to find what the genre delivers in place, unprompted, and persistently. Note: the *content* of nabimd's corrections (why + how) already exceeds the genre norm — reveal-without-why is standard, and only Duolingo (Explain My Answer) and Busuu (Mistake Repair) productize explanations. The gap is delivery, not content. | ⚠️ |
| G11 | Distinct sensory verdict signature | Matched/retry/summary sounds + mute toggle (`feedbackSound.ts`); color-coded toast. Present, though the toast's 1.6 s life limits it. | ✅ |
| G12 | Explicit continue gating | On `Matched`, the Check button becomes `Next exercise` and receives focus; nothing auto-advances. | ✅ |
| G13 | Missed items recycle in the same session | Different mechanism, deliberately: a failed Check schedules **one same-skill, different-content repair** immediately (D3/D4), instead of re-queuing the same item at the end. Near-transfer instead of literal repetition — arguably stronger pedagogy (Busuu's productized "Mistake Repair" is the genre's closest cousin), but the genre's "the lesson isn't done until you've produced this one right" guarantee is absent. | ⚠️ |
| G14 | Slips distinguished from errors ("you have a typo") | The grading *domain* implements this idea structurally — prose, case, spelling are never graded (D10) — but **within** the graded domain there is one flat `Try again`: a malformed mark (`*bold*` for `**bold**`) and an absent mark read identically at the verdict layer. Corrections downstream do distinguish, the verdict copy does not. (Universality caveat: a minority pattern — only Duolingo and Babbel document it.) | ⚠️ |
| G15 | Failure cheap and kindly worded | No lives, no penalty, hint never punished (D4), repair framed as practice, summary aggregates by family instead of listing mistakes (2026-07-20 decision). | ✅ |
| G16 | Zero-penalty help at the point of need (tap-the-thing) | Hint is zero-penalty but **not at the point of need**: it is a tab switch away from the Write surface, and request-only (D4). Nothing in the Goal or the editor is tappable for in-place explanation. Blank guides show *where* but not *what*. Note: Duolingo's help is *also* learner-initiated (tap = request) — the divergence is location, not the request-only principle; D4's spirit has genre support. | ⚠️ |
| G17 | Deeper explanations on demand, never forced | Hint tab: syntax pattern chips + `teaching.howTo`; after a fail, staged corrections (2 hint levels). Optional, never forced. | ✅ |
| G18 | Skip/defer affordances | `Try another` swaps in a same-skill replacement without penalty; in-app Prev/Next walk visited steps. No explicit "skip this one, come back later" but the escape hatch exists. | ⚠️ |
| G19 | Completion always celebrated, stats framed positively | `RunSummary`: "Well done. / Good finish.", strength statement always positive, Score + Time chips, ≤3 family reminders instead of a mistake transcript, summary sound. Calm-book register rather than confetti — a deliberate identity difference with direct genre precedent (Babbel "no glitzy prizes", Lingvist/Rosetta Stone sober). | ✅ |
| G20 | One obvious next action | `Practice again` primary + `Change level` secondary. | ✅ |
| G21 | Guided start ("where should I begin?" answered) | Landing = five chapter cards with D14 labels and no guidance. **D2 explicitly named this open question** ("which level do you start at, and is the level right for you?") — it remains unanswered in the product. The genre answers it with branching + placement; nabimd currently answers it with a menu. | ❌ |
| G22 | Visible macro path (course map, units) | No cross-visit path — progress is session-scoped (D7, 2026-07-20). Within-session rail exists (G3). A persistent path presumes memory across visits. | 🚫 |
| G23 | Streaks, XP, leagues, hearts, daily goals | None, by decision (2026-07-20: no account, streak, daily goal, mastery gate; drop-in practice room). Hearts also conflict with G15. | 🚫 |
| G24 | Character carries the voice | No mascot/persona. Quiet book-world identity (open-book frame, sprig/bookmark art, page-turn sound). Copy has a consistent calm register but no character delivering it. Visual redesign is deferred scope. | ❌ |

## Reading the table (판단 재료 요약)

**Where nabimd already matches the genre core (✅ ×10):** session shape
(G1–G3), the supplied-context/produce-only-the-target contract (G6 = D17), the
explicit-check two-verdict loop (G9, G12), penalty-free help and failure
climate (G15, G17), and a positively-framed closing (G19, G20). The 2026-07-20
audit's judgment that "the lightweight parts are the strongest parts" holds in
genre terms.

**Where the unclear feeling (`그 느낌이 불분명`) most plausibly lives — the
❌/⚠️ cluster in the feedback-and-teaching loop:**

1. **G10 — the wrong-answer moment.** The genre's single most-engineered
   screen is nabimd's most fleeting: 1.6 s of generic toast, with the real
   correction two tabs away. Every studied app holds the correction on screen
   until dismissed and pinpoints the exact failed token in place.
2. **G7 — no teach-before-test moment.** The genre never tests a brand-new
   item without introducing it; nabimd's first encounter with a syntax family
   is always a graded attempt, with teaching content present in the bank but
   gated behind a request.
3. **G21 — the unanswered entry question.** D2 posed exactly the question the
   genre solves at onboarding; the landing currently offers an unlabeled
   difficulty menu.
4. **G16 — help location.** Zero-penalty (genre-conform) but not point-of-need
   (genre-divergent): a tab, not a tap on the confusing thing.
5. **G5/G8 — no ladder below free production.** Defensible for a typing-family
   skill (see proposals), but it is a real divergence from the genre's ramp.

**Where nabimd must consciously *not* close the gap (🚫 ×2):** G22 macro path
and G23 streak/XP machinery are excluded by the 2026-07-20 pedagogy decision
and D7. These rows are listed so that future proposals cannot smuggle them in
as "genre alignment" without surfacing the decision conflict.

**A lineage reading of the whole table.** Research Part 1.6 identifies two
genre lineages: course apps (teach-first, exercise-type ladders, guided
entry) and recall-drill apps (test-first, instant reveal, one exercise type,
sober register — Lingvist, Clozemaster). nabimd's ✅ column matches the drill
lineage almost perfectly, and its 🚫 rows are exactly the things the drill
lineage also rejects. But its ⚠️/❌ cluster (G7, G10, G16, G21) means it
currently delivers **neither** lineage's answer to a struggling learner: not
the course lineage's taught first encounter, and not the drill lineage's
crisp, persistent instant reveal. The "불분명한 느낌" may be precisely this
in-between state — drill-shaped mechanics without the drill lineage's
sharpest tool (the reveal loop) or the course lineage's teaching beats.
