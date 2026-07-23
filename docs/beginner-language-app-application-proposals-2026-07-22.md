# Application Proposals — What nabimd Should and Should Not Resemble

**Date:** 2026-07-22 · **Status:** Proposals only — every item awaits Jiwon's decision · **Tracker:** Issue #100

> [!IMPORTANT]
> **아직 미결정된 사항이 많다.** 아래 제안은 채택 목록이 아니라 결정 안건이다.
> 각 제안에는 기존 확정 결정(D1–D17, 2026-07-20 pedagogy 결정)과의 충돌 여부를
> 명시했다. `충돌 없음`이라도 구현 지시가 아니며, 코드 구현은 이 이슈(#100)의
> 범위 밖이다.
>
> 근거: [조사 문서](beginner-language-app-grammar-research-2026-07-22.md)(G번호) ·
> [갭 분석](beginner-language-app-gap-analysis-2026-07-22.md)

## 확정된 결정 (2026-07-22, Jiwon)

문서 등록 직후 Jiwon이 다음을 확정했다. 본문의 해당 절은 원문대로 두고 상태만
여기서 갱신한다.

- **P0 — 드릴 혈통 확정.** "마크다운 문법은 코스형으로 갈 만한 복잡한 난이도가
  아니다." 드릴형을 거부한 적은 없다 — nabimd는 리콜 드릴형의 느낌을 갖는다.
- **P1 — 채택 확정 + 키보드 계약 추가.** 오답 순간 재설계를 승인하며, 거기에
  **'키보드'로 넘어가는 쾌감**을 더한다:
  1. 6문제 턴 전체가 키보드만으로 완주 가능해야 한다 — 입력 → 정답확인 →
     다음 문제 진행. (한 문제 입력 후 마우스를 만지는 것도 허용 — 강제가 아니라
     보장이다.)
  2. 뒤로가기(앞 문제)도 키보드로 볼 수 있어야 한다.
  3. 힌트는 `H` 같은 단축키로 슬쩍 보였다가, 같은 키를 다시 누르면 닫힌다.
  4. Enter는 당연히 텍스트 입력이다 (플레인 Enter를 다른 기능에 뺏기지 않는다).
- **P1 확장 — 정답 자동 진행 확정.** "문제를 맞추고 정답을 확인했으면 바로
  넘어가는 게 맞다. 마치 스피드 퀴즈처럼 — 빠르게 넘어가라는 게 아니라
  편의성이다." Matched는 짧은 판정 비트(사운드+플래시) 후 자동 진행하고 두
  번째 확인 키를 요구하지 않는다; Try again만 홀드한다. 이는 G12(명시적 진행
  게이트)에서 **의식적으로 갈라서는** 드릴 혈통 결정이다 — 드릴형 선례:
  Memrise·Rosetta Stone 자동 진행, 타이핑 튜터의 연속 흐름 (틀렸을 때만
  멈춘다).
- 구현은 별도 이슈로 진행한다 — #100은 docs 전용이다.

## 확정된 결정 (2026-07-23, Jiwon — 센터카드)

- **센터카드 = 정식 입력 모드.** "센터카드"의 원래 의미가 확인되었다: 좌우
  워드프로세서가 아니라 **오른쪽 중앙에서 문법만 입력하는 작은 네모창**이다.
  #99가 카드를 오구현으로 보고 제거한 것은 지시의 오독이었다. 재구현 계약:
  1. **슬롯 하나씩 진행** — 문서의 마크 자리 하나가 카드의 현재 슬롯이 된다.
  2. **즉시 반영** — 맞는 마크를 넣는 순간 오른쪽 문서에 박히고 렌더된다.
  3. **인라인 에디터 전면 대체** — Write란은 공란에서 시작해 정답을 입력할수록
     자동으로 완성된다("이게 preview가 되는 거지"). 틀린 답으로는 넘어가지
     못하고, 자기 의도가 왼쪽 본문대로 완성되어 가는 경험을 준다.
  4. **글자당 네모 박스** — 입력 표면은 글자 하나당 큰 사각 박스(OTP형,
     Jiwon 스케치)이며, 잠긴 프로즈와 인라인으로 흐른다. #98의 삐뚤빼뚤한
     글자 크기 박스를 반복하지 않는다.
- 이 결정은 **D17(스타터 프로즈 프리필)과 D12의 Write 탭 계약을 의식적으로
  대체**한다. D9/D10(구조만 채점, 두 판정)과 자동 진행·키보드 계약(위
  2026-07-23 결정)은 그대로 유효하며 카드 위에서 동작한다.
- **'하드 코드' 모드 예약.** 센터카드가 자리 잡은 뒤에도, 카드 없이 진짜
  백지에서 입력하는 모드를 나중에 도입할 생각이 있다 — 카드는 교체 가능한
  입력 모드 레이어로 구현한다.

**Conflict legend:**
- `충돌 없음` — no confirmed decision is touched.
- `⚠️ D-x 재검토 필요` — the proposal's letter or spirit touches a confirmed
  decision; adopting it means Jiwon consciously amending that decision.
- `🚫 채택 반대` — conflicts with the product identity decisions; listed so the
  rejection is explicit and reasoned, not accidental.

## P0. The framing question that precedes every proposal below

> ✅ **2026-07-22 확정 — 드릴 혈통.** 상단 '확정된 결정' 참조.

Research Part 1.6: the genre has two lineages — **course apps** (Duolingo:
teach-first, exercise ladders, guided entry) and **recall-drill apps**
(Lingvist, Clozemaster: test-first, crisp instant reveal, one exercise type,
sober register, no gamification). nabimd's existing mechanics and its
2026-07-20 identity decisions both align with the **drill lineage** — it is
very nearly "Lingvist for Markdown." The open question behind the
"불분명한 느낌": nabimd currently delivers *neither* lineage's answer to a
struggling learner. P1 below is the drill lineage's answer (sharpen the
reveal loop); P2 is the course lineage's answer (teach first encounters).
They are compatible — Duolingo ships both layers — but deciding *which
lineage's feel nabimd owns* will settle several proposals at once.

## A. 닮아야 할 후보 (adopt candidates)

### P1. Rebuild the wrong-answer moment (G10) — `충돌 없음`

> ✅ **2026-07-22 채택 확정 + 키보드 계약 추가.** 상단 '확정된 결정' 참조.
Make `Try again` behave like the genre's most-designed screen: the verdict
surface **persists until the learner dismisses or retypes** (no 1.6 s
auto-vanish), and carries the **top pinpointed correction in place** — the
existing `buildReviewCorrections` output ("You wrote `*bold*` / Use `**`"),
not a generic line. Review tab stays for the full list.
- D9/D10 intact: verdicts remain exactly two; grading unchanged. This changes
  *presentation* of an existing verdict, not policy.
- Why first: the gap analysis locates the "불분명한 느낌" most strongly here;
  it is also the cheapest high-leverage change. Genre data sharpens it:
  nabimd's correction *content* (why + how) already exceeds the genre norm —
  reveal-without-why is standard, and only Duolingo and Busuu productize
  explanations. Only the *delivery* (persistence + placement) is behind.
- Lineage note: this is the drill lineage's core move (Lingvist/Clozemaster:
  instant, persistent reveal) — adopting it deepens nabimd's existing
  identity rather than importing a foreign one.

### P2. Give every syntax family a first-encounter introduction (G7) — `⚠️ D4 재검토 필요`
When a turn first meets a syntax family, show the mark before grading it —
e.g. a `NEW MARK` moment: the family's `teaching.example` + one-line `howTo`
(content already in the bank), then the problem. Alternatives by increasing
D4 friction: (a) a badge on the problem + auto-opened Hint for first
encounters only; (b) a 5-second interstitial teaching card; (c) a distinct
non-graded "look first" step.
- **D4 conflict to resolve:** D4 says Hint stays closed until requested. A
  forced first-encounter teaching moment is against D4's letter for that one
  problem (or sits outside the Hint system entirely). Learning science sides
  with teach-before-test for novices (worked-example effect); D4's intent was
  "no nagging," not "no introduction." Jiwon must rule whether first-encounter
  teaching is an exception to D4 or a new surface outside it.
- Lineage note: this is the course lineage's move (Duolingo NEW WORD i+1,
  LingoDeer Tips). The drill lineage deliberately skips it — Lingvist's
  first-encounter answer is "(d) admit you don't know → instant reveal →
  re-queue," which nabimd could express as a zero-penalty `Show me` affordance
  on first encounters instead of a teaching card. Option (d) has no D4
  friction at all (it is learner-requested) and stays inside the drill feel.

### P3. Answer "where should I begin?" on the landing (G21, D2's open question) — `충돌 없음`
Lightweight guidance, not a gate: one "start here if…" line per chapter card
(e.g. L1 "never typed Markdown," L3 "comfortable with the basics"), or a
single question ("Have you written Markdown before?") that highlights — never
locks — a suggested chapter. All five levels stay directly selectable
(2026-07-20 decision preserved).
- Distinct from a placement *test* (see N3). Recommendation ≠ gate.

### P4. Split the `Try again` copy by failure shape (G14) — `충돌 없음`
Keep two verdicts (D9), but let the failed verdict's subtitle distinguish
*malformed* from *absent*: "The mark is there but shaped differently" vs "One
part still needs its mark." The evaluation layer already knows the difference
(corrections carry `learnerExcerpt` vs not). This is the genre's typo-vs-wrong
distinction translated to structure-only grading. (Universality caveat: a
minority pattern even in the genre — Duolingo and Babbel only — so this is
"borrow a good idea," not "close a genre gap.")

### P5. Move help toward the point of need (G16) — `⚠️ D4 재검토 필요`
Candidates, in increasing D4 friction: (a) after a failed Check, blank guides
near failed regions become tappable to reveal the needed mark for that spot;
(b) hover/tap on a Goal element names its mark ("this is a `#` heading");
(c) always-tappable blank guides. All zero-penalty, learner-initiated —
arguably D4-conformant (each tap *is* a request) — but they relocate hint
content outside the Hint tab, so D4's boundary needs an explicit ruling.
Supporting datum: Duolingo's whitepaper frames its tap-hints exactly as
letting learners "choose their level of scaffolding" — i.e. the genre's
point-of-need help is *also* request-only. The divergence from D4 is
location, not principle.

### P6. Per-problem matched moment, slightly warmer (G11/G19) — `충돌 없음`
Keep the calm register but let `Matched` land: the toast may stay a beat
longer, with a small ink-flourish/checkmark motion consistent with the book
world. No confetti, no character required. Belongs naturally to the deferred
visual-redesign pass; listed here so it is not lost.

### P7. Name the session promise on the landing (G1) — `충돌 없음`
The genre sells its session shape ("a few minutes a day"). nabimd's promise —
"Open a page. Type for ten minutes. Leave Markdown feeling a little more
natural." (2026-07-20) — exists in a decision doc but not in the product.
One line on the landing page closes it.

## B. 판단 유보 (comparison material, no recommendation)

### M1. Same-item re-queue at turn end (G13) — `⚠️ D3/D4 재검토 필요`
The genre guarantees "you produced every item correctly at least once before
the lesson ends." nabimd instead does immediate near-transfer repair (D3/D4) —
different content, same skill, arguably deeper. Adopting re-queue would
*replace* a confirmed mechanism rather than fill a hole. Listed only so the
difference is a known choice; no adoption recommended.

### M2. Constrained input mode — mark tiles (G5/G8) — `⚠️ D12/D17 재검토 필요`
A tile bank of marks (`#`, `**`, `-`, `` ` ``) to place into blank guides
would give nabimd the genre's assembly stage. Counter-argument from the
typing-tutor family: producing marks *by hand* is nabimd's terminal skill, and
typing tutors never replace keystrokes with tiles. Likely relevant only if a
touch/mobile surface ever matters. Touches the D12 desk and D17 answer
contract; treat as a future surface question, not a current gap.

### M3. Character/mascot voice (G24) — `충돌 없음` (identity 결정 사안)
The genre uses a character to make feedback warm; nabimd uses a quiet book
world. Adopting any persona is a brand identity decision that belongs to the
deferred visual redesign, entirely Jiwon's. Research note: the character is
the genre's *delivery mechanism* for G15's kind failure climate — nabimd
already achieves G15 through copy alone, so a mascot is optional, not owed.

### M4. Duolingo-style per-lesson accuracy chip on Summary (G19) — `충돌 없음`
Summary already shows Score/Time. The genre adds a positively-labeled accuracy
frame ("GOOD" at 50%). nabimd's strength statement plays this role in prose.
No evidence the chip form is better for a no-pressure room; purely optional.

## C. 닮지 말아야 할 것 (explicit non-adoption, with reasons)

### N1. Streaks, XP, leagues, hearts, daily goals (G23) — `🚫 채택 반대`
Direct conflict with the 2026-07-20 decision (no account/streak/daily
obligation; drop-in room). Hearts additionally *punish* errors — they
contradict the genre's own G15 and nabimd's penalty-free contract, they are
effectively Duolingo-specific rather than genre grammar (no other studied app
uses lives in regular lessons), and Duolingo itself retired Hearts for an
Energy system in 2025. The teaching layer of the genre (Part A above) is
fully separable from this retention layer; nothing in P1–P7 requires it.

### N2. Cross-visit mastery path / skill tree (G22) — `🚫 채택 반대`
Requires remembering the learner across visits — conflicts with D7
(session-scoped progress) and the 2026-07-20 decision (no mastery vector, no
placement memory). The six-dot rail already provides the within-session map.

### N3. Placement *test* as an entry gate (G21) — `🚫 채택 반대`
"All five levels remain directly selectable" (2026-07-20). Guidance may
recommend (P3); nothing may lock. A graded onboarding quiz would also create
the account-like "the app knows my level" expectation D7 avoids.

### N4. Accounts / social comparison — `🚫 채택 반대`
D7: never any login. Leagues/leaderboards presume identity and comparison;
both are outside the product.

## Suggested decision order (판단 순서 제안)

0. **P0** (lineage) — one sentence from Jiwon ("nabimd는 드릴 혈통이다" /
   "코스 혈통을 섞는다") orients everything below.
1. **P1** (wrong-answer moment) — no conflicts, highest leverage on the stated
   문제의식, and identity-deepening under either lineage answer.
2. **P2 + P5 together** — both hinge on one D4 boundary ruling: *does
   "request-only Hint" mean "no teaching outside the Hint tab," or "no
   unrequested nagging"?* One ruling settles both. (If P0 = drill lineage,
   P2's option (d) `Show me` resolves this with zero D4 friction.)
3. **P3 + P7** (landing guidance + session promise) — no conflicts, small.
4. **P4, P6** — polish tier.
5. **B/C sections** — no action; they exist to keep future work honest about
   what is a decision change vs a gap fill.
