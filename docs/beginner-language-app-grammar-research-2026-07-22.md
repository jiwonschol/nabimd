# The Common Interaction Grammar of Beginner Language-Learning Apps

**Date:** 2026-07-22 · **Status:** Research input — nothing in this document is a decision · **Tracker:** Issue #100

> [!IMPORTANT]
> **아직 미결정된 사항이 많다.** 이 문서는 확정된 제품 방향이 아니라 판단 재료다.
> 어떤 항목을 채택할지는 전부 Jiwon이 결정하며, 이 문서의 어떤 문장도 기존 확정
> 결정(D1–D17, 2026-07-20 pedagogy 결정)을 대체하지 않는다.
>
> 동반 문서: [갭 분석](beginner-language-app-gap-analysis-2026-07-22.md) ·
> [적용 제안](beginner-language-app-application-proposals-2026-07-22.md)

## 한국어 요약 (판단 재료 핵심)

Jiwon의 문제의식: *초보 수준의 언어학습기들이 지금껏 세상에 보여준 공통 문법이
있는데, 지금 nabimd에서는 그 느낌이 불분명하다.*

조사 결과, 그 공통 문법은 실재하며 놀랄 만큼 수렴한다. 12개 앱(Duolingo·Babbel·
Busuu·Memrise·LingoDeer 등)은 서로 경쟁하면서도 초보 레슨의 상호작용을 거의
동일한 골격으로 만든다. 골격의 핵심은 게임화(스트릭·XP)가 아니라 **피드백
순간의 설계**다:

1. **한 화면 = 한 과제**, 상단에 레슨 진행바, 몇 분이면 끝나는 묶음.
2. **정답 맥락은 앱이 다 주고, 학습자는 목표 토큰만 생산한다** — Babbel은 대화
   전체와 번역을 주고 빈칸 하나만 채우게 한다. nabimd의 D17(프로즈 제공, 마크만
   복원)은 이미 이 장르 핵심과 같은 구조다.
3. **오답 순간이 가장 공들인 화면이다** — 판정 배너는 학습자가 "GOT IT"을 누를
   때까지 사라지지 않고, 정답 전문을 보여주되 **틀린 토큰만 굵게/밑줄로 짚어준다**.
   nabimd의 판정 토스트는 1.6초 뒤 자동 소멸하고, 교정 정보는 탭 뒤에 있다.
4. **새 항목은 가르친 뒤 시험한다** — Duolingo는 레슨당 새 단어를 5–7개로 제한하고
   첫 등장에 보라색 NEW WORD 배지를 붙인다. nabimd에는 새 문법의 "첫 소개" 순간이
   없다.
5. **도움은 필요한 지점에 붙어 있다** — 모르는 단어를 탭하면 그 자리에서 뜻이
   뜬다(무벌점). Duolingo 백서는 이를 "학습자가 스스로 스캐폴딩 수준을 고르게
   한다"고 설명한다. nabimd의 힌트는 요청제(D4)이면서 탭 전환 뒤에 있다 —
   요청제 자체는 장르와 일치하고, 위치가 다르다.
6. 스트릭·XP·리그·하트는 **교육 기제가 아니라 리텐션 기계**이며, nabimd가
   2026-07-20 결정으로 거부한 바로 그 층이다. 11개 앱 대조 결과 하트(목숨)는
   사실상 **Duolingo 전용**이고 장르 공통이 아니다(Duolingo 자신도 2025년에
   하트를 에너지로 교체). 교육 층은 리텐션 층과 분리해서 가져올 수 있다.
7. **장르 안에 두 혈통이 있다.** 코스형(Duolingo·Babbel·LingoDeer 등 —
   가르친 뒤 시험, 인식→조립→생산 사다리)과 **리콜 드릴형**(Lingvist·
   Clozemaster — 시험 먼저, 모르면 즉시 정답 공개, 같은 세션 재출제, 단일
   연습 유형, 검소한 완료 화면). **Lingvist의 "문장 전체+번역 제공, 빈칸
   하나만 타이핑" 구조는 nabimd의 D17과 사실상 동형**이며, Lingvist는
   게임화도 의도적으로 거부한다 — nabimd가 닮아야 할 "느낌"의 실제 원본이
   Duolingo가 아니라 이쪽일 가능성은 그 자체로 판단 안건이다.

## Method

- **Scope:** the interaction grammar of *beginner-level lessons* — what the
  learner sees and does inside one exercise, one lesson, and one session. Not
  marketing, not business model.
- **Evidence classes:** (1) real product screens via Mobbin (canonical links);
  (2) official product statements — above all the
  [Duolingo Method whitepaper (2023)](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)
  and blog.duolingo.com, plus other apps' help centers; (3) reputable UX
  teardowns and reviews; (4) learning-science literature that explains *why*
  the grammar works; (5) a secondary sweep of apps that teach *formal syntax*
  (coding, typing, music) — the nearest neighbors to a Markdown trainer.
- **Breadth:** cross-checked against 12 language apps — Duolingo, Babbel,
  Busuu, Memrise, LingoDeer, Drops, Lingvist, Clozemaster, HelloChinese,
  Mondly, Pimsleur (app), Rosetta Stone — so that "common" means the genre,
  not one product. Per-item universality is tabulated in Part 1.5.
- Product facts checked 2026-07-22. Mobbin screens are dated captures and may
  lag the live apps; they evidence the established grammar, not any app's
  current release. One currency note: Duolingo began replacing Hearts with an
  "Energy" system for free users in 2025 (see G23).

## Part 1 — The common grammar, itemized

Each item: what it is → product evidence → why it works (where the learning
science speaks) → tag. **Tags:** `teaching` = pedagogical mechanic;
`motivation` = retention machinery; `identity` = brand/voice choice.

### A. Session shape

#### G1. The bounded micro-lesson `teaching`
A session unit is a short, pre-sized batch of exercises (Duolingo ~10–15, a
few minutes; Babbel 10–15 min; Memrise ~5 min; Drops a hard 5-minute timer)
that always ends with a closing screen. The learner never faces an open-ended
grind; "done" arrives quickly and predictably.

- Official: "a lesson takes no more than a few minutes, which means that
  completing multiple lessons in a row is easily achievable"
  ([Duolingo Method whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf));
  daily-habit framing ([habit post](https://blog.duolingo.com/putting-in-work-the-habit-of-language-learning/)).
- Why: distributed short practice beats massed practice
  ([Duolingo on spaced repetition](https://blog.duolingo.com/spaced-repetition-for-learning/)).

#### G2. One exercise per screen `teaching`
Every screen holds exactly one instruction, one stimulus, one answer surface,
one submit control. Nothing else competes for attention.

- Official: "Each exercise involves a single small task with instructions"
  ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)).
- Screens: [Duolingo translate-with-word-bank](https://mobbin.com/screens/3d1e792b-518f-4038-bc2c-30e1a9017893),
  [Duolingo form-the-sentence](https://mobbin.com/screens/06acbeb1-0adc-4a46-8c88-faa24d106899),
  [Babbel complete-the-dialogue](https://mobbin.com/screens/0d5f697a-323b-4da5-9079-8f7dc675cce4).
- Nuance: Duolingo forbids revisiting earlier exercises inside a lesson
  ([usabilitygeek teardown](https://usabilitygeek.com/ux-case-study-duolingo/));
  Babbel exposes ‹ › step arrows
  ([screen](https://mobbin.com/screens/8c40c89f-36ea-4ef8-82d9-2622e10e5012)).
  The genre is split on in-lesson back-navigation.

#### G3. Always-visible lesson progress bar + exit `teaching` `motivation`
A thin progress bar at the top fills as exercises pass; an X/exit sits beside
it. The learner always knows how much is left and that leaving is allowed.

- Visible in every lesson capture above; described in the
  [usabilitygeek teardown](https://usabilitygeek.com/ux-case-study-duolingo/).
- The bar can stall/extend when misses re-queue exercises (G13) — it tracks
  *completion of the batch*, not time.

### B. Exercise & input design

#### G4. A small fixed exercise-type vocabulary `teaching`
The whole course reuses a handful of exercise templates (translate,
fill-blank, match pairs, listen-and-pick, speak). Every studied app runs on
2–10 templates; after the first session the learner never learns a new UI
again — all attention goes to the content.

- Official enumeration of Duolingo's formats
  ([Duolingo 101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/));
  the whitepaper frames it as affordance-based design — learners always "know
  where to look as well as how to interact."
- Precedent at the minimum: **Lingvist runs on exactly one exercise type**
  (typed cloze) for its entire product
  ([review](https://discoverdiscomfort.com/lingvist-review-language-learning-app/)) —
  a single-type practice room is a legitimate genre member (drill lineage).

#### G5. Scaffold ladder: recognition → assembly → production `teaching`
New material is first *recognized* (multiple choice, match), then *assembled*
from given parts (word-bank tiles), and only later *produced* freely
(typing). Support fades as competence grows.

- Official: "we scaffold … so that you start with words, short phrases, and
  exercises with word banks until you're ready for longer writing on your own"
  ([Duolingo writing-skills post](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-writing-skills/));
  "in earlier exercises, you might learn to recognize a new word, and
  eventually you'll be typing it out yourself"
  ([Duolingo 101](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/)).
- Memrise's explicit ramp (flashcard → MC → listening → typed recall):
  [FluentU review](https://www.fluentu.com/blog/reviews/memrise/).
- Why: worked-example effect and scaffold fading
  ([Renkl & Atkinson 2004](https://link.springer.com/article/10.1023/B:TRUC.0000021815.74806.f6),
  [NSW CESE cognitive-load review](https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/2017-cognitive-load-theory.pdf)).
- Deliberate exceptions: Lingvist and Clozemaster are typing-first by design
  (drill lineage, Part 1.6).

#### G6. Context supplied; the learner produces only the target token `teaching`
The app provides the full sentence, dialogue, or document — often with
translation — and the learner contributes exactly the piece being taught.
Nothing off-target is typed.

- Babbel supplies the whole dialogue plus translation; the learner types one
  word into one blank
  ([screen](https://mobbin.com/screens/0d5f697a-323b-4da5-9079-8f7dc675cce4)).
- Duolingo fill-in-the-blank supplies the full sentence around the gap
  ([screen](https://mobbin.com/screens/7e486c79-f420-46f9-acc6-7e741f7a2fe0)).
- Lingvist's whole product is this shape: full sentence + translation, type
  the missing word
  ([review](https://discoverdiscomfort.com/lingvist-review-language-learning-app/)).

#### G7. Teach before test: new items are introduced, not sprung `teaching`
A brand-new word or structure is visibly marked as new and shown with its
meaning before (or as) it is first tested. Duolingo caps new material at 5–7
words per lesson, renders first appearances in bold purple with a `NEW WORD`
pill inside a sentence of otherwise-known material, and tests receptively
before productively.

- Official: [Right level of difficulty](https://blog.duolingo.com/right-level-of-difficulty/)
  (5–7 words, purple NEW WORD, Krashen i+1 rationale);
  `NEW WORD` badge visible in
  [this capture](https://mobbin.com/screens/3d1e792b-518f-4038-bc2c-30e1a9017893).
- LingoDeer goes further: explicit Tips sections *before* lessons
  ([review](https://www.smarterlanguage.com/the-smarter-language-review-of-lingodeer/)).
- Why: novices without schemas learn more from studied examples than from
  unsupported problem-solving
  ([worked examples](https://www.sciencedirect.com/science/article/abs/pii/S0361476X1000055X)).
- Deliberate exceptions: Lingvist ("press enter to admit you don't know" →
  answer revealed, re-queued) and Clozemaster are test-first by design
  ([Lingvist review](https://www.alllanguageresources.com/lingvist-review/)).

#### G8. Constrained input first, free input as opt-up `teaching`
Beginner answers are assembled from visible parts (tiles/word bank), which
bounds the search space; typing is an explicit learner-selectable harder mode.

- Official: "Tap the icon of the keyboard in the bottom left corner of the
  screen, and you'll be able to type your answer yourself"
  ([writing-skills post](https://blog.duolingo.com/covering-all-the-bases-duolingos-approach-to-writing-skills/));
  the whitepaper frames receptive-first design as letting learners "choose
  their level of scaffolding."
- Tiles with slot targets:
  [Duolingo](https://mobbin.com/screens/ef84c8cd-aac6-4211-b141-56e72227355f),
  [Duolingo](https://mobbin.com/screens/95575388-f5f3-465b-8bac-03e4856b9896).
- Generalizes to syntax teaching: Google's Grasshopper had learners tap blocks
  of *real JavaScript* — typing only names and strings
  ([Common Sense review](https://www.commonsense.org/education/reviews/grasshopper-learn-to-code)).

### C. The feedback loop

#### G9. Explicit submit, immediate binary verdict `teaching`
The learner answers, then explicitly submits (CHECK); the verdict is instant
and binary. The submit button stays disabled until an answer exists.

- CHECK disabled until an answer is formed
  ([screen](https://mobbin.com/screens/3d1e792b-518f-4038-bc2c-30e1a9017893));
  LingoDeer likewise grades only on Check
  ([official help](https://support.lingodeer.com/en/support/solutions/articles/61000307412-hints-to-help-you-through-the-lesson)).
- Official rationale — prediction-error learning: exercises make learners
  predict; "feedback then either confirms or denies these predictions"
  ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)).
- Why: immediate corrective feedback fixes errors while the question is in
  working memory ([IFAT study](https://link.springer.com/article/10.1007/BF03395423),
  [Metcalfe, Kornell & Finn 2009](https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Metcalfe.Kornell.Finn.2009.pdf)).

#### G10. The wrong-answer moment is the most designed screen `teaching`
On a miss, a red banner rises and **stays until the learner dismisses it**
("GOT IT"). It carries the header `Correct solution:` / `Correct Answer:` with
the full correct answer and **only the failed token emphasized**, often the
meaning, and (since 2025, free) an AI "Explain My Answer" option. The
correction is delivered at the moment and place of the error — the learner
never hunts for it.

- Screens: [fill-blank](https://mobbin.com/screens/7e486c79-f420-46f9-acc6-7e741f7a2fe0),
  [with EXPLAIN MY MISTAKE](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124),
  [hard exercise](https://mobbin.com/screens/473c4a6a-1d13-4842-8eec-11b81b32e213);
  the same grammar carries to Duolingo Math unchanged
  ([screen](https://mobbin.com/screens/029332cc-9653-4e7d-9545-7bd9d37114fe)).
- Official: "See—and understand—the correct form in the moment so you can more
  easily remember it later"
  ([Explain My Answer](https://blog.duolingo.com/explain-my-answer-now-free/)).
- Genre nuance: *revealing* the correct answer is near-universal, but
  *explaining why* is rare — Busuu's Mistake Repair is the only other
  productized attempt
  ([announcement](https://blog.busuu.com/new-mistake-repair-release/));
  Mondly is criticized for reveal-without-why
  ([review](https://improving-your-english.com/learn-english/courses/mondly-review/)).
- Why: showing the correct answer turns assessment into learning; corrected
  errors are remembered especially well
  ([Metcalfe, Learning from Errors](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022)).

#### G11. Distinct sensory verdict signature `teaching` `identity`
Correct and incorrect have instantly recognizable sound + color + motion
signatures. The learner knows the verdict before reading a word.

- "A splash of green appears … a cheerful 'ding'"
  ([usabilitygeek](https://usabilitygeek.com/ux-case-study-duolingo/));
  official: "a pleasant sound and a brief celebratory animation … after each
  completed exercise" ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)).

#### G12. Explicit continue gating — the learner sets the pace `teaching`
After feedback, nothing auto-advances; the learner presses CONTINUE/GOT IT.
Reading the correction is never raced by a timer — timed pressure exists only
in opt-in arcade modes ([ways to practice](https://blog.duolingo.com/ways-to-practice-in-duolingo/)).

- GOT IT gating on every incorrect capture above; CONTINUE on neutral steps
  ([match pairs](https://mobbin.com/screens/87691c95-e2ed-44e4-bd54-e2f0c54b20ff)).
- Exceptions exist (Memrise and Rosetta Stone auto-advance; Drops is timed) —
  a course-app norm rather than an absolute.

#### G13. Missed items recycle within the same session `teaching`
A missed exercise returns before the session ends, until answered correctly;
the lesson is not complete until every item has been produced right once.

- Official and precise: "an exercise targeting the same concept is resurfaced
  at the very end of the lesson so they can answer it accurately"
  ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf));
  "end-of-lesson mistake reviews" named as deliberate spacing
  ([spaced repetition post](https://blog.duolingo.com/spaced-repetition-for-learning/)).
- Same-session re-queue also in LingoDeer ("you'll just see that question
  again in a little while" — [review](https://www.smarterlanguage.com/the-smarter-language-review-of-lingodeer/)),
  HelloChinese ([review](https://studiousbees.tumblr.com/post/164349028583/app-review-hellochinese)),
  Clozemaster end-of-round ([review](https://togetherwelearnmore.com/clozemaster-complete-review/)),
  Memrise, Drops, Lingvist (SRS-soon).
- Cross-session variants: Babbel routes errors into its Review manager
  ([review](https://www.frenchlearner.com/reviews/babbel-review/)); Busuu
  productized "Mistake Repair" — collected mistakes become tailored repair
  exercises with explanations
  ([announcement](https://blog.busuu.com/new-mistake-repair-release/)) — the
  genre's closest cousin to nabimd's same-skill repair transfer.
- Why: answer-until-correct feedback and the hypercorrection effect
  ([IFAT](https://link.springer.com/article/10.1007/BF03395423),
  [hypercorrection](https://en.wikipedia.org/wiki/Hypercorrection_(psychology))).

#### G14. Slips are distinguished from errors `teaching` *(minority pattern)*
Typos and near-misses get "You have a typo" treatment and still pass;
alternate correct answers are accepted; error severity is graded. Only the
*target skill* is graded — the learner is never failed for something the
exercise wasn't teaching.

- Duolingo: accepted-answer lists + severity-graded errors ("forgetting a noun
  [is] worse than forgetting an article")
  ([user reports post](https://blog.duolingo.com/how-user-reports-improve-course-content/));
  "you have a typo" behavior
  ([community thread](https://forum.duome.eu/viewtopic.php?p=33100));
  "typos and almost-right pronunciations still count"
  ([flashcards post](https://blog.duolingo.com/duolingo-flashcards/)).
- Babbel implements Levenshtein-distance spelling tolerance
  ([engineering post](https://www.babbel.com/en/magazine/spelling-correction-with-levenshtein-distance)).
- Universality caveat: only Duolingo and Babbel document this; several apps
  are criticized for strictness, and tile-input apps avoid the issue
  entirely. A strong idea, not a universal convention.

#### G15. Failure is cheap and kindly worded `teaching`
Wrong answers cost seconds, not progress. Copy stays encouraging and
effort-based; errors are framed as part of learning.

- Official: "Duolingo uses effort-based praise and encouragement, which has
  been shown to increase perseverance (Dweck, 2007)"; anxiety reduction is a
  stated design goal
  ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf));
  "An important part of learning is making mistakes … and trying again"
  ([grammar tips](https://blog.duolingo.com/grammar-practice-tips/)).
- LingoDeer: no penalty, no speed bonus, by policy
  ([official help](https://support.lingodeer.com/en/support/solutions/articles/61000307412-hints-to-help-you-through-the-lesson)).
- Why: learners must feel safe to commit answers for retrieval practice to
  happen ([Metcalfe](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022),
  [Learning Scientists](https://www.learningscientists.org/blog/2019/10/17-1)).

### D. Help

#### G16. Zero-penalty help at the point of need `teaching` *(course-app norm, not universal)*
Help is attached to the confusing thing itself: tap a dotted-underlined word
and its meaning appears in place, any time, without penalty or mode switch.

- Dotted underlines + "Tap on a word to see its meaning!"
  ([screen](https://mobbin.com/screens/3d1e792b-518f-4038-bc2c-30e1a9017893));
  hints exist on every regular exercise, removed only in the opt-in
  "Legendary" mode ([ways to practice](https://blog.duolingo.com/ways-to-practice-in-duolingo/)).
- Official framing: receptive-first exercises with tappable hints let learners
  "choose their level of scaffolding"
  ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)) —
  help is learner-initiated, i.e. request-only *in place*.
- Also: LingoDeer's eye-icon hint + tap-word dictionary, official zero-penalty
  policy ([help](https://support.lingodeer.com/en/support/solutions/articles/61000307412-hints-to-help-you-through-the-lesson));
  HelloChinese tap-word grammar popups
  ([review](https://www.fluentu.com/blog/reviews/hellochinese/)).
- Universality caveat: the genre splits — free hints (Duolingo, LingoDeer,
  HelloChinese, Mondly, Lingvist), penalized (Clozemaster halves points),
  or none by design (Drops, Rosetta Stone, Memrise).

#### G17. Deeper explanations on demand, never forced `teaching`
Explicit grammar instruction is quarantined *outside* the exercise loop —
Duolingo's per-unit Guidebooks, LingoDeer's Tips — reachable whenever wanted,
never blocking the loop.

- Official: guidebooks at unit level; implicit-first stance — explicit tips
  "can help set learners on the right path" but don't replace interactive
  engagement ([home screen post](https://blog.duolingo.com/new-duolingo-home-screen-design/),
  [whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)).

#### G18. Skip and defer affordances `teaching`
Exercises the learner can't do right now are skippable without shame, and the
app offers the skip itself.

- "We'll skip listening for 15 minutes" with CONTINUE
  ([screen](https://mobbin.com/screens/77bc0da5-f18f-45bb-a451-540cd9a1bc90)).

### E. Closing

#### G19. Completion is always celebrated; stats are framed positively `teaching` `identity`
The lesson-complete screen celebrates regardless of accuracy — 50% accuracy
is labeled "GOOD," 100% "AMAZING." Two or three stat chips (XP, accuracy,
time), never a transcript of mistakes.

- ["Perfect lesson!" 100%](https://mobbin.com/screens/4926b0de-93c2-4ab9-8e4c-3edfbf059e1a),
  ["Lesson complete!" at 50% labeled GOOD](https://mobbin.com/screens/f0df639d-1a85-44d3-8e1e-43f837393f3a),
  ["Super fast!"](https://mobbin.com/screens/ac7c9ecc-8534-49d7-bf8d-5b0f5e5507eb),
  ["Practice complete!"](https://mobbin.com/screens/429b4df5-4ccb-4c24-9265-ff2a75db4c1b).
- Official: after a session "the learner receives a larger dose of positive
  reinforcement" ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf)).
- Intensity varies by identity: Busuu/Clozemaster/Mondly festive; **Babbel is
  deliberately modest ("no glitzy prizes"), Lingvist and Rosetta Stone sober**
  — a calm completion register has genre precedent
  ([Babbel review](https://www.frenchlearner.com/reviews/babbel-review/),
  [Lingvist review](https://www.fluentu.com/blog/reviews/lingvist/)).

#### G20. One obvious next action `teaching`
The closing screen has a single primary CTA (CONTINUE / CLAIM XP). Choices
are deferred; momentum is preserved.

### F. Entry

#### G21. Guided start: "where should I begin?" is answered for you `teaching`
Onboarding branches on prior knowledge: true beginners drop straight into the
first lesson with zero setup; claimed-knowledge learners get a ~10-minute
adaptive placement test that recommends a start point (partial-credit graded).

- Official: "you can take a placement test … to find the right level for you"
  ([add a course](https://blog.duolingo.com/add-new-course/));
  [partial-credit placement grading](https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/).
- Teardown: experience-level branching, first lesson before signup
  ([appcues onboarding teardown](https://goodux.appcues.com/blog/duolingo-user-onboarding)).

#### G22. A visible macro path `motivation` `teaching`
Beyond the lesson, a single linear path of nodes/units shows where you are in
the whole journey — exactly one "next thing to do" — with review/practice
nodes embedded along it.

- Official redesign rationale: learners were "not sure whether they're using
  Duolingo the 'correct' way"; practice built into the path
  ([new home screen](https://blog.duolingo.com/new-duolingo-home-screen-design/)).

### G. The motivation layer (separable from the teaching layer)

#### G23. Streaks, XP, leagues, hearts/energy, daily goals `motivation`
The retention machinery: daily streaks (near-universal — 10–11 of 12 apps,
even Babbel and Pimsleur;
[Babbel streak help](https://support.babbel.com/hc/en-us/articles/17020978582162-Streak)),
XP economies with weekly leagues (a minority: Duolingo, Busuu, Memrise,
Mondly, Clozemaster), and daily goals. **Hearts/lives are effectively
Duolingo-specific** — in regular lessons no other studied app uses them
(only bounded special modes: Memrise Speed Review, HelloChinese unit
quizzes) — and Duolingo itself replaced Hearts with an "Energy" system for
free users in 2025
([Class Central report](https://www.classcentral.com/report/duolingo-breaks-hearts-for-energy/),
[mechanics](https://duoplanet.com/duolingo-energy-system/)).
Note the internal tension: hearts/energy tax the very mistakes G13 treats as
learning events; Duolingo's teaching materials claim no pedagogical value for
them.

#### G24. A character carries the voice `identity` `motivation`
A mascot (Duo the owl, Babbel/Busuu characters) delivers feedback,
celebration, and reminders, giving system messages a warm persona. Character
present on exercise and celebration screens throughout the captures above.

### Addendum — patterns observed beyond the core list

- **Adaptive in-lesson sequencing** ("Birdbrain"): exercise difficulty and
  order adjust live to the learner; harder items deliberately placed at
  lesson end ([whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf),
  [teaching method](https://blog.duolingo.com/duolingo-teaching-method/)).
  For nabimd this collides with deterministic selection (D16) and
  session-scoped memory (D7) — recorded here as context, not a candidate.
- **Cross-session mistakes inventory**: missed items feed personalized
  practice sessions later ([Practice Hub](https://blog.duolingo.com/guide-to-duolingo-practice-hub/)) —
  requires cross-visit memory; conflicts with D7 by construction.

## Part 1.5 — How universal is each item?

Based on the 12-app comparison (full per-app convergence table in the
Appendix):

| Item | Universality | Notable exceptions |
|---|---|---|
| G1 bounded micro-lesson | universal | Lingvist endless deck (daily goal instead); Rosetta Stone long core |
| G2 one exercise/screen | universal | Pimsleur audio core |
| G3 in-lesson progress indicator | near-universal | form varies (bar, counter, %, timer) |
| G4 small fixed type set | universal | n ranges 1 (Lingvist) to ~10 |
| G5 recognition→production ladder | course-app norm (7/12) | drill apps typing-first by design |
| G6 context given, produce target only | universal in cloze/dialogue forms | — |
| G7 teach-before-test | course-app norm | Lingvist/Clozemaster test-first by design |
| G8 constrained input first | course-app norm | Lingvist typing-only; Drops tiles-only |
| G9 explicit submit + instant verdict | near-universal | Memrise/RS auto-advance variants |
| G10 persistent reveal of correct answer | near-universal | *why*-explanations rare (Duolingo, Busuu only) |
| G11 sensory verdict signature | universal | intensity varies |
| G12 continue gating | course-app norm | Drops timed; Memrise/RS auto-advance |
| G13 same-session re-queue | strong norm (7/12 same-session; 2 cross-session) | Mondly whole-lesson redo |
| G14 typo tolerance | **minority** | documented only in Duolingo, Babbel |
| G15 cheap, kind failure | universal | Mondly's lesson-redo is the outlier |
| G16 point-of-need tap help | split (5 free / 1 penalized / 3 none) | — |
| G17 optional deep explanation | course-app norm | Drops/RS none by design |
| G18 skip/defer | common | — |
| G19 celebratory completion | universal *screen*; intensity is identity | Babbel/Lingvist/RS sober |
| G20 single next CTA | universal | — |
| G21 guided start/placement | course-app norm | drill apps let you pick a corpus |
| G22 macro path | course-app norm | Lingvist/Clozemaster corpus % instead |
| G23 streak | near-universal | Lingvist abstains |
| G23 XP+leagues | minority (5/12) | Babbel/Lingvist/RS/Pimsleur reject |
| G23 hearts in lessons | **Duolingo-only** | special modes elsewhere; →Energy 2025 |
| G24 mascot voice | majority | Lingvist/RS deliberately none |

## Part 1.6 — The two lineages inside the genre

The 12 apps cluster into two coherent families:

- **Course lineage** (Duolingo, Babbel, Busuu, LingoDeer, HelloChinese,
  Mondly, Rosetta Stone, Pimsleur): teach-before-test, recognition→production
  ladders, varied exercise types, guided entry, warmer celebration.
- **Recall-drill lineage** (Lingvist, Clozemaster; Memrise sits between):
  test-first with instant reveal ("press enter to admit you don't know"),
  same-session re-queue, one or two exercise types, sober aesthetics, minimal
  or no gamification (Lingvist), self-selected corpus instead of a path.

**nabimd's practice contract (D17: supplied prose, restore the marks, typed,
one exercise type, Check-gated, calm register, no gamification) is
structurally a member of the drill lineage — it is very nearly "Lingvist for
Markdown syntax."** The drill lineage's answer to a miss, however, is a crisp
instant reveal + re-queue, which nabimd currently does not deliver (see gap
analysis G10/G13). Which lineage's *feel* nabimd should own — or whether to
borrow the course lineage's first-encounter teaching while keeping the drill
shape — is a product decision, not a research conclusion.

## Part 2 — Nearest neighbors: apps that teach formal syntax

Markdown is a formal syntax, not a natural language. The closest products to
nabimd are not only language apps but coding/typing/music trainers. Their
shared grammar with Part 1: one concept per lesson, tile assembly before free
typing (Grasshopper), bite-sized sessions, retry-with-reveal, end-of-run
summaries.

What they add that language apps do not:

1. **Per-keystroke validation** — typing tutors mark every character as
   typed; Typing.com blocks advancement until the correct key
   ([review](https://thelearningstandard.org/apps/typing-com)); Monkeytype
   highlights each mishit live ([settings](https://dev.monkeytype.com/settings)).
2. **Run-the-output as a second feedback channel** — Codecademy/Mimo/
   Grasshopper let learners *execute* their answer and see consequences, not
   just a verdict
   ([Codecademy lessons](https://help.codecademy.com/hc/en-us/articles/14298560842267-How-Lessons-and-Projects-Differ-in-Codecademy-s-Learning-Environment)).
   nabimd's Preview/Review rendered panes are exactly this channel.
3. **Spec-test grading over string matching** — Codecademy runs tests against
   learner code so many correct phrasings pass
   ([error docs](https://help.codecademy.com/hc/en-us/articles/220801027-Understanding-Code-Errors)).
   nabimd's structure-predicate grading (D9/D10) is this, not string matching.
4. **Sub-skill adaptive drills** — keybr generates items targeting the exact
   weak key ([review](https://cosmickeys.app/en/blog/keybr-review)).
5. **Feedback concurrent with production** — music apps score during the
   performance; "wait mode" pauses instead of failing
   ([Simply Piano vs Yousician](https://latouchemusicale.com/en/comparaisons/simply-piano-vs-yousician/)).
6. **User-selectable error strictness** — Monkeytype's Normal/Expert/Master
   modes ([settings](https://dev.monkeytype.com/settings)).
7. **Teach-then-drill lesson openers** — Mimo/SoloLearn open each lesson with
   a short concept blurb before the first exercise
   ([Mimo review](https://careerkarma.com/blog/mimo-coding-app-review/),
   [SoloLearn pillars](https://medium.com/sololearn/the-five-pillars-of-learning-feedback-assessments-7c9f10cf4f53)).
8. **Retry-or-reveal valves** — Mimo lets the learner choose on each miss:
   try again or reveal the answer immediately
   ([review](https://careerkarma.com/blog/mimo-coding-app-review/)).

One typing-tutor datum that argues *against* importing G8 into nabimd:
producing the marks by hand is nabimd's terminal skill, and typing tutors
never replace keystrokes with tiles — their scaffold is guidance (on-screen
keyboard, finger hints) that fades, applied *around* real typing
([Typing.com](https://thelearningstandard.org/apps/typing-com)).

## Part 3 — Learning-science index

The mechanisms behind the grammar, with primary sources:

| Mechanism | Grammar items | Key sources |
|---|---|---|
| Retrieval practice / testing effect | G9, G13 | [Roediger & Karpicke 2006](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x) · [Duolingo-format pretesting study 2026](https://link.springer.com/article/10.1186/s41235-026-00708-y) |
| Immediate corrective feedback | G9, G10 | [IFAT](https://link.springer.com/article/10.1007/BF03395423) · [Metcalfe/Kornell/Finn](https://web.williams.edu/Psychology/Faculty/Kornell/Publications/Metcalfe.Kornell.Finn.2009.pdf) |
| Prediction-error framing | G9 | [Duolingo whitepaper](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf) |
| Scaffolding + fading | G5, G8 | [Renkl & Atkinson 2004](https://link.springer.com/article/10.1023/B:TRUC.0000021815.74806.f6) |
| Worked examples / i+1 for novices | G7 | [NSW CESE review](https://education.nsw.gov.au/content/dam/main-education/about-us/educational-data/cese/2017-cognitive-load-theory.pdf) · [Right level of difficulty](https://blog.duolingo.com/right-level-of-difficulty/) |
| Error recycling / hypercorrection | G13 | [Metcalfe](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022) · [hypercorrection](https://en.wikipedia.org/wiki/Hypercorrection_(psychology)) |
| Distributed practice | G1 | [Duolingo spaced repetition](https://blog.duolingo.com/spaced-repetition-for-learning/) · [half-life regression](https://blog.duolingo.com/how-we-learn-how-you-learn/) |
| Low-stakes error climate / effort praise | G15, G23(tension) | [Metcalfe](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022) · [Duolingo whitepaper (Dweck)](https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf) |
| Interleaving | G4, D16 parallel | [Memory & Cognition](https://pubmed.ncbi.nlm.nih.gov/24984923/) · [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4141442/) |

## Appendix — 11-app convergence table (non-Duolingo)

Legend: **Y** yes · **P** partial · **N** no · **?** not evidenced. Columns:
Bab=Babbel, Bus=Busuu, Mem=Memrise, LD=LingoDeer, Drp=Drops, Lgv=Lingvist,
Clz=Clozemaster, HC=HelloChinese, Mnd=Mondly, Pim=Pimsleur(app), RS=Rosetta
Stone. (Duolingo, the twelfth app, is documented per-item in Part 1.)

| Pattern | Bab | Bus | Mem | LD | Drp | Lgv | Clz | HC | Mnd | Pim | RS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Single exercise per screen | Y | Y | Y | Y | Y | Y | Y | Y | Y | P | Y |
| In-lesson progress indicator | Y | Y | P | P | Y | P | Y | Y | Y | P | P |
| Immediate right/wrong, correct answer shown | Y | P | P | Y | Y | Y | Y | Y | Y | P | Y |
| Missed items re-queued in SAME session | P | P | Y | Y | Y | Y | Y | Y | N | Y | P |
| Recognition→production scaffolding | Y | Y | Y | Y | P | N | P | Y | Y | P | P |
| Zero-penalty hints | P | P | N | Y | N | Y | N | Y | Y | P | N |
| Typo tolerance | Y | ? | P | ? | n/a | P | ? | P | ? | n/a | ? |
| Explicit continue/Check | Y | Y | P | Y | N | Y | Y | Y | Y | P | P |
| Celebratory completion screen | P | Y | Y | P | P | N | Y | Y | Y | P | P |
| Short bounded session unit | Y | Y | Y | Y | Y | P | Y | Y | Y | Y | P |
| Teach-before-test | Y | Y | Y | Y | Y | N | N | Y | P | Y | Y |
| Small fixed exercise-type set | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Streak | Y | Y | Y | Y | Y | N | Y | Y | Y | Y | P |
| XP / points economy | N | Y | Y | P | P | N | Y | Y | Y | P | N |
| Lives / hearts in regular lessons | N | N | P | N | N | N | N | P | N | N | N |

Key per-app sources: [Babbel how-it-works](https://www.babbel.com/how-babbel-works) ·
[Babbel review](https://www.frenchlearner.com/reviews/babbel-review/) ·
[Busuu review](https://www.smarterlanguage.com/review-of-busuu/) ·
[Busuu Mistake Repair](https://blog.busuu.com/new-mistake-repair-release/) ·
[Busuu post-lesson teardown](https://screensdesign.com/showcase/busuu-language-learning) ·
[Memrise review](https://testprepinsight.com/reviews/memrise-review/) ·
[Memrise ramp](https://www.fluentu.com/blog/reviews/memrise/) ·
[LingoDeer review](https://www.smarterlanguage.com/the-smarter-language-review-of-lingodeer/) ·
[LingoDeer hints policy](https://support.lingodeer.com/en/support/solutions/articles/61000307412-hints-to-help-you-through-the-lesson) ·
[Drops](https://kahoot.com/home/learning-apps/drops/) ·
[Drops review](https://www.alllanguageresources.com/language-drops-app/) ·
[Lingvist review](https://discoverdiscomfort.com/lingvist-review-language-learning-app/) ·
[Lingvist SRS](https://www.alllanguageresources.com/lingvist-review/) ·
[Clozemaster points rules](https://docs.clozemaster.com/article/103-how-do-points-work) ·
[Clozemaster review](https://togetherwelearnmore.com/clozemaster-complete-review/) ·
[HelloChinese review](https://www.fluentu.com/blog/reviews/hellochinese/) ·
[HelloChinese re-queue](https://studiousbees.tumblr.com/post/164349028583/app-review-hellochinese) ·
[Mondly review](https://testprepinsight.com/reviews/mondly-review/) ·
[Mondly scoring](https://www.alllanguageresources.com/mondly/) ·
[Pimsleur review](https://www.alllanguageresources.com/pimsleur/) ·
[Rosetta Stone review](https://testprepinsight.com/reviews/rosetta-stone-spanish-review/) ·
[Dynamic Immersion](https://www.rosettastone.com/features/dynamic-immersion/)
