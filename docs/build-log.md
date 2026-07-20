# Nabi Markdown Build Log

This log records what actually happened during OpenAI Build Week. It is not a
marketing timeline. Entries distinguish Jiwon's product decisions, Codex's
contribution, and the evidence used to verify the result.

## Evidence policy

- Record problems when they happen; do not reconstruct them at submission.
- Do not claim a feature before a test or runnable demonstration exists.
- Record rejected Codex suggestions when they changed the final result.
- For each consequential conflict, record the proposal, Jiwon's decision, the
  reason for it, and the artifact that eventually verifies the decision.
- Keep the majority of core implementation in one primary Codex thread.
- Generate `/feedback` in that thread after the core build is substantially
  complete, then submit the Session ID through Devpost.
- Use dated commits, test output, and the public demo as supporting evidence.

## 2026-07-18 — Repository foundation

### Context

The project began as a commercial Korean-first Markdown learning plan with 34
levels, daily drills, and monetization. It was re-scoped for a three-day OpenAI
Build Week Education submission.

### Decisions made by Jiwon

- Named the product **Nabi Markdown** and repository `nabimd`.
- Chose an English-first Build Week experience; Korean comes after the event.
- Chose a public repository and AGPL-3.0-or-later, while preserving a future
  commercial-license option and reserving the brand.
- Chose Codex as the only coding agent.
- Supplied the canonical founder story and Devpost narrative.
- Confirmed the Devpost plugin is connected and an Education draft exists.
- Chose to use the existing Codex plan and banked resets after not receiving
  additional Build Week Codex credits.

### Codex contribution

- Verified the current Official Rules and FAQ requirements for the repository,
  README, video, and primary-thread `/feedback` Session ID.
- Reduced the product to four English quests and one personalized Boss.
- Proposed TypeScript, React, Vite, native textarea, remark/mdast, local
  progress, and one bounded serverless model endpoint.
- Designed a deterministic AST grader that accepts supported equivalent
  Markdown syntax.
- Separated GPT-5.6 generation from deterministic correctness.
- Created the repository evidence structure and initial public documentation.

### Challenges and resolutions

| Challenge | Evidence | Resolution | Status |
|---|---|---|---|
| Commercial plan was too broad for three days | Original 34-level plan | Locked a 4+1 quest submission scope | Resolved in plan |
| Public source could be confused with giving up monetization | License comparison | AGPL code, separate brand policy, optional future commercial license | Resolved for bootstrap |
| GitHub CLI authentication had expired | `gh auth status` failed | Jiwon re-authenticated; authenticated owner verified as `jiwonschol` | Resolved |
| Devpost plugin is connected but not callable from this Codex tool environment | Available-tool inspection | Treat Official Rules and FAQ as source of truth; Jiwon uses plugin UI when needed | Known boundary |
| No promotional Codex credit allocation | Jiwon's account status | Use the existing plan and banked resets; keep API usage separately bounded | Active constraint |

### Verification

- GitHub owner authenticated: `jiwonschol`
- Repository name was unused before creation: `jiwonschol/nabimd`
- Repository visibility: public
- License file: GNU AGPL v3
- Application code: not started at this milestone

## 2026-07-18 — Learning model and product conflicts

### Context

Before application scaffolding, Jiwon and Codex reviewed the learning model
instead of treating the original plan as settled. The discussion changed the
product from an editor-like correction experience into deliberate Markdown
practice for people whose writing process or source document is visible to
other people.

### Conflict record

| Conflict | Codex proposal | Jiwon's decision and reason | Current resolution |
|---|---|---|---|
| Convenience versus learning | Quiet live correction after a typing pause | Rejected: automatic correction teaches the editor, not recall | Feedback appears only after `Check`; help is user-requested |
| First exposure | Begin with copy-and-paste or a nearly complete source | Rejected as too passive | Teach one syntax pattern, then require production with different text |
| Competing course models | Choose among a syntax ladder, editorial apprenticeship, or document makeovers | Keep all three because they serve different levels | Editorial apprenticeship is the main path; single-syntax warm-ups can appear anywhere; makeovers serve advanced practice |
| First visit | Mode chooser or placement test | Avoid choice burden | Start with a 60-second problem; experienced users can skip to a document challenge |
| Desktop layout | Single vertical sheet or an editorial desk | Selected the editorial desk | Prompt and rendered target stay above a wide editor |
| Coaching location | Inline feedback rail, modal, or separate side panel | Keep coaching outside the work surface | A right-side coach opens on request; it becomes a bottom sheet on small screens |
| Correctness versus presentation | Treat every valid answer as identical | Separate correct syntax from editorial polish without turning polish into failure | `Fail` blocks progress; `Matched` passes and unlocks `Next`; `Perfect` is an optional higher-quality pass |
| Review timing | Open editorial critique automatically after success | Rejected because it makes success feel like another failure | `Review` opens only when a matched user asks for it and shows all relevant refinements at once |
| Failed retry | Repeat the exact same question until correct | Rejected because repetition would encourage memorizing the answer and create frustration | A failed learner receives a different prompt that exercises the same syntax before progressing |
| AI at runtime | Generate personalized exercises and possibly editorial notes in the live app | Rejected: the learning experience and grading should remain stable, cheap, and inspectable | Ship a curated problem bank and deterministic grading; any GPT-5.6 contribution must occur in the documented curriculum-production workflow, not live grading |

### Learning states agreed

- **Fail:** required syntax is missing or malformed, required structure is
  absent, or protected prompt content is lost. `Next` stays locked and the next
  attempt uses different content for the same skill.
- **Matched:** the learner used the requested Markdown skill correctly. This is
  a pass and unlocks `Next`.
- **Perfect:** all applicable Nabi editorial checks also pass. This is a more
  polished pass, not a separate gate.
- A matched-but-not-perfect habit can return later inside another problem
  without revoking the earlier pass.

### Problem-bank contract

Each curated problem is expected to include a skill ID, difficulty, prompt,
protected content, match predicates, editorial checks, retry-family tags, and
review tags. Its fixtures must cover a canonical pass, supported alternatives,
missing or malformed syntax, a matched answer with optional refinements, a
perfect answer, and the expected feedback IDs.

No generated problem is accepted merely because a model produced it. The bank
must be refined through deterministic validation, repeated counterexamples,
and Jiwon's editorial approval.

### Build Week evidence boundary

- The public pull request preserves dated diffs and commit history, but judges
  should not have to infer product reasoning from a diff.
- This build log is the curated explanation of conflicts, decisions, and later
  verification evidence.
- The README will summarize only the strongest verified examples and link here.
- The primary-thread `/feedback` Session ID is the official thread identifier;
  it complements rather than replaces the README, commits, tests, and demo.
- The rules do not explicitly require a runtime API call. They do require
  meaningful Codex and GPT-5.6 use and a specific explanation in the repository
  and video. Concrete GPT-5.6 work and its resulting artifacts still need to be
  produced and recorded; ideation alone will not be presented as proof.

### Current verification

- Browser brainstorming selection: `Editorial Desk`
- Browser brainstorming selection: `Side Coach`
- Feature code: not started
- Grading fixtures: not started
- GPT-5.6 curriculum artifact: not yet produced

## 2026-07-18 — Written application contract

### Approval

Jiwon approved the written application design after the verbal interaction and
learning-state decisions had been consolidated. The approved contract covers
the audience, learning modes, Devpost-aligned syntax families, Fail/Matched/
Perfect progression, different-content transfer after a repaired failure,
request-only Hint and Review, the Editorial Desk, deterministic grading, local
progress, and the Build Week evidence boundary.

### Implementation cut

Codex translated the approved design into a task-level implementation plan but
did not start feature code at this milestone. The first implementation unit is
three H1 heading problems that exercise the complete system from fixtures to
deployment. The remaining 30-problem expansion waits until the schema, grader,
transfer behavior, persistence, Side Coach, and browser path work together.

This cut preserves the agreed 33-problem target without multiplying an
unproven grading contract across the bank. It also gives the project a working
demo early enough to spend the remaining time on content and visual quality.

### Verification

- Written spec status: approved by Jiwon on 2026-07-18
- Implementation plan: `docs/superpowers/plans/2026-07-18-heading-vertical-mvp.md`
- Runtime feature code: not started
- Tests and deployment: not started
- GPT-5.6 curriculum artifact: not yet produced

## 2026-07-18 — Heading vertical MVP

### What shipped in this milestone

Codex implemented the approved learning loop end to end for H1 document
titles: three problems, 18 fixtures, a validated content contract,
deterministic grading, Fail/Matched/Perfect outcomes, different-content
transfer after a repaired failure, local progress, progressive Hint, optional
Review, the Editorial Desk interface, responsive Side Coach, and automated
browser proof.

The implementation stayed static and local. There is no model call,
authentication, database, or server-side correctness decision in the learner
path.

### Test-first grading decisions

The first grader cases forced two distinctions that an exact answer comparison
would miss:

- `# Project notes #` is a supported equivalent H1 and must pass even though
  it is not the canonical source string.
- `#Project notes` is malformed Markdown, and the first useful correction is
  the missing space—not a generic message that no H1 AST node was found.

Codex encoded these cases in the fixture bank before implementing the grader.
Match checks carry an explicit priority so spacing feedback wins when several
checks could fail. The editorial single-H1 rule runs separately: an extra H1
produces Matched and an optional Review, never Fail.

### Problems encountered and resolved

| Problem observed | Investigation and decision | Resolution | Verification |
|---|---|---|---|
| Node 26 and jsdom exposed incompatible global `localStorage` behavior during progress tests | Codex isolated persistence behind the browser-standard `Storage` interface; no browser product workaround was justified | Added a complete `MemoryStorage` test double and explicit jsdom setup | `npm test` passes progress and hook restoration cases |
| A learner who clears the starter text initially could not receive a starting correction if Check were disabled | An empty answer is still a meaningful attempted answer | Kept Check available and let the deterministic grader supply the missing-structure action | Component and hook tests cover the empty draft boundary |
| Adding Playwright made the full gate fail even though all 62 Vitest assertions passed | Vitest was also collecting `tests/e2e/heading-flow.spec.ts` | Scoped Vitest to `src/**/*.test.{ts,tsx}` and left `tests/e2e` to Playwright | `npm run check` and `npm run test:e2e` pass independently |
| The first 390 px browser inspection wrapped the Nabi wordmark across two lines | The progress label occupied too much header width | Preserved the accessible label but visually shortened `Headings · 1 of 3` to `1 of 3` below 480 px | Chromium mobile path proves no horizontal overflow |
| The sandboxed local server could not bind to `127.0.0.1:4173` | This was an execution boundary, not an app defect | Ran the approved local browser server with the required permission and kept the app configuration unchanged | In-app browser and Playwright both loaded the same Vite app |
| First production deploy attempt reported an invalid stored Vercel token | Build completed locally; failure occurred before project deployment | Completed Vercel OAuth device login and redeployed | Vercel reported the production deployment Ready |
| The new short alias returned a Vercel Authentication 302 instead of the app | `curl` showed the SSO redirect while the previously assigned project alias returned 200 | Renamed the project to `nabimd`, assigned `nabimd.vercel.app`, and disabled project Vercel Authentication using Vercel's documented `{"ssoProtection": null}` setting; this static public demo has no private runtime data | The short URL returned HTTP 200 and passed all five clean Chromium paths without login |

### Visual verification

Codex compared the final browser render against the approved monochrome
Editorial Desk concept at desktop size. It then exercised Fail, Hint, repair,
transfer, and completion in the in-app browser. At `390 × 844`, the Side Coach
became a bottom sheet, the wordmark stayed on one line, and the document width
did not exceed the viewport.

### Verification at this milestone

- Clean dependency install: `npm ci` completed from `package-lock.json`.
- Install note: npm left two optional `fsevents` install scripts unapproved;
  the project builds and tests without approving them.
- TypeScript: `npm run typecheck` passed.
- Unit/component tests: 7 files, 62 tests passed.
- Production build: Vite transformed 186 modules and completed successfully.
- Browser tests: 5 Chromium journeys passed locally and against production.
- Verified browser paths: fail/repair/transfer/draft restore, first-attempt
  Perfect with keyboard Check, optional Matched Review, and mobile Coach with
  no horizontal overflow, plus the absence of runtime fetch/XHR requests.
- GitHub CI: Node 22 verification passed in 52 seconds.
- Deployment: Vercel production status Ready.
- Public unrestricted URL: [https://nabimd.vercel.app](https://nabimd.vercel.app)
- Production proof: HTTP 200 without authentication and all five Chromium
  paths passed against the public URL.

## 2026-07-18 — First developer hands-on MVP review

### Review context

After using the public heading MVP himself, Jiwon supplied the first
developer/product-owner review before the problem bank was expanded. This is a
hands-on acceptance review, not a reconstructed submission narrative. The
observations below are recorded before a replacement design or implementation
is chosen.

### Observations from Jiwon

1. **The exercise sentence needs native educational-copy review.** The current
   `Turn Project notes into the document's main heading.` is understandable,
   but Jiwon questioned whether it sounds like language a US learning app would
   naturally use. The first lesson needs shorter, more direct action language.
2. **`Project notes` does not read as an obvious learner task.** It resembles a
   label introducing a document that will follow, rather than a concrete piece
   of text the learner is being asked to transform. Warm-up content should come
   from a broader bank of short, familiar words or phrases—such as fruit,
   weather, or learning tools—whose role is immediately obvious.
3. **The prefilled editor makes the first screen feel redundant.** The rendered
   target already displays the same words that appear in `Your Markdown`.
   Prefilling those words makes the target, editor, and live preview repeat one
   another without clearly signaling what the learner must produce. An empty
   production area is the leading alternative, subject to the revised lesson
   design.
4. **The target/editor/preview hierarchy is oversized for the exercise.** A
   one-line heading task does not need a document-sized textarea or a large
   second preview. The placement, relative emphasis, and dimensions of
   `Target`, `Your Markdown`, and `Live preview` need to be redesigned together
   rather than resized independently.

### Product interpretation

The vertical slice proved the grading and retry loop, but it inherited the
spatial assumptions of a general Markdown editor. The next design should behave
like a focused learning interaction: one unmistakable object to transform, one
compact place to type, and one immediate visual consequence. It should not look
as though the learner is beginning a long project document.

### Status at the initial report

- The review is accepted as the first post-MVP product finding.
- No replacement copy, content set, empty-editor behavior, or layout has been
  approved yet.
- Application code remains unchanged while those decisions are explored.

### Design review continuation

Jiwon then reviewed four visual-companion iterations and corrected the design
model before implementation:

- **Level 1 teaches before it tests.** A new syntax rule is available up front
  in the first exposure. From Level 2 onward, recall matters: a collapsed Hint
  must reveal neither the answer nor its punctuation until the learner opens
  it.
- **Hint is a downward disclosure, not a horizontal drawer.** It sits beside
  the compact goal area and expands from top to bottom so opening help does not
  change the width or alignment of the rendered reference.
- **Goal means the rendered reference.** It is not a prose restatement of the
  instruction. `Instruction` tells the learner what to do; `Goal` shows the
  finished rendering; `Your Markdown` contains learner source; `Live preview`
  shows the current rendering. A correct preview should visually match Goal.
- **Goal and preview need the same surface treatment.** Different borders,
  typography, or paper textures imply different functions even though the
  exercise asks the learner to reproduce the goal.
- **Source and preview stay side by side at equal height.** The focused lesson
  remains compact at Level 1, while the same two-pane workbench can grow
  vertically for Level 3 document exercises.
- **The source pane must look and behave like an editor.** Monospace text alone
  is not enough. The accepted direction includes an active caret and restrained
  editor affordances, plus an optional way to inspect invisible spacing.
- **Whitespace marks must feel conventional rather than like learner syntax.**
  Microsoft Word documents spaces as dots and tabs as arrows; Apple Pages calls
  the same family of marks “invisibles” and allows their colour to be changed.
  The next mockup therefore treats them as faint, optional editor annotations,
  not full-strength Markdown characters.

Jiwon also set the documentation policy for these reviews: developer feedback
is recorded in English, edited for clarity rather than copied verbatim, and
written as evidence that an outside reviewer or Build Week judge can follow.

The visual decisions remain design evidence only; application code has not yet
been changed to match them at this point in the log.

### Level 5 north star supplied by Jiwon

Jiwon supplied a real 210-line Codex implementation work order from another
project as an example of Nabi's eventual Level 5 outcome. The document does
more than format a request: it separates mission, prior failure context,
ordered sources of truth, a comprehension gate, staged execution, absolute
prohibitions, stop conditions, verification commands, repository conventions,
and a final-report schema.

The product decision is to use that anatomy as a future curriculum reference,
not to copy the project-specific work order or ask learners to transcribe it.
Level 5 should teach a person to turn unstructured project intent into an
agent-ready Markdown work order that is executable by a contemporary coding
agent and auditable by another human. The detailed north-star analysis lives in
`docs/design/level-5-agent-brief-north-star.md`.

This addition does not expand the current implementation milestone. It explains
why the H1 redesign is being sized from a moderate document rather than the
shortest possible heading exercise.

### C6 written approval and implementation boundary

Jiwon approved the C6 written specification and added the final long-term
constraint: document lines remain relatively narrow, but the workspace must be
able to grow much farther vertically. By Level 5, repeated Markdown practice
should have taught the learner the structure of a contemporary AI work order
almost incidentally. Because those conventions change, reviewed curriculum
versions can create long-term continuity and may later support paid advanced
content; monetization remains outside Build Week.

Codex translated the approval into a test-first implementation and PR plan. It
also turned the supplied real work order into an anonymized fictional reference
that preserves mission, authority order, staged autonomy, constraints, stop
conditions, verification, and final-report structure without publishing the
source project's paths or operational details.

The first redesign implementation makes one additional learning inference:
opening Help during a recall problem means recall was not independently proven.
A later pass therefore creates the same different-content transfer obligation
as a repaired failure. The visible rule in the first introduce problem does not.
This rule will be treated as implemented only after reducer and browser tests
prove it.

The existing H1 pull request remains the feature delivery unit. Commits separate
the approved record, behavior contract, C6 interface, and browser proof. Remote
review occurs at a behavior checkpoint and again on the complete release
candidate; deployment waits for current-head review and CI rather than relying
on approvals of superseded commits.

Artifacts at approval time:

- Approved redesign:
  `docs/superpowers/specs/2026-07-18-first-exercise-redesign-design.md`
- Test-first execution plan:
  `docs/superpowers/plans/2026-07-18-first-exercise-redesign.md`
- Level 5 analysis: `docs/design/level-5-agent-brief-north-star.md`
- Anonymized public work-order reference:
  `docs/examples/level-5-agent-work-order-reference.md`
- Runtime status: approved but not yet implemented

## 2026-07-18 — C6 first-exercise release candidate

### What changed

Codex implemented the approved first-exercise redesign without replacing the
verified learning engine. The three heading prompts now use Apple, Rainy day,
and Study tools; every source starts empty; and `introduce` versus `recall` is
explicit curriculum data rather than a UI guess. The first exposure shows the
rule. Recall starts with Help closed, and opening it creates a same-skill
transfer obligation after a later pass.

The interface now follows the C6 hierarchy approved by Jiwon:

- Instruction says what action to take.
- Goal is the large rendered reference.
- Help is a fixed narrow desktop column that opens downward.
- Your Markdown is a restrained CodeMirror source surface.
- Live preview uses the same safe rendered-document component as Goal.
- Source and preview stay side by side and equal-height on desktop, then stack
  in semantic order on small screens.

No runtime AI, service, learner-media fetch, authentication, database, or
server grading was introduced.

### Product decisions and Codex implementation calls

Jiwon approved the C6 spatial contract, required conventional optional
whitespace marks, kept Help hidden for recall, and set a longer-term Level 5
direction in which narrow, vertically growing documents teach contemporary AI
work-order structure. Codex selected exact CodeMirror 6 packages, represented
invisibles as view decorations, shared the renderer between Goal and preview,
and encoded recall Help as transfer debt. The latter is an implementation of
Jiwon's learning rule—not a claim that Jiwon specified reducer fields.

### Problems encountered and resolved

| Problem observed | Investigation and decision | Resolution | Verification |
|---|---|---|---|
| Making Level 1 Help visible caused the legacy mobile Side Coach to cover Check | The fixed overlay was incompatible with normal lesson order, not merely a test inconvenience | Removed Side Coach and made Help an in-flow downward disclosure | The 390 px browser path proves Goal → Help → source → preview order, usable Check flow, and no horizontal overflow |
| Full-app typing lost characters although the isolated CodeMirror wrapper test passed | A passive controlled-value effect could replay a stale parent echo between rapid editor transactions | Synchronized controlled document changes in the layout phase | Ten App tests and the real Chromium keyboard path pass |
| CodeMirror's empty placeholder is rendered inside the contenteditable tree | An assertion for empty `textContent` described DOM internals rather than the learner's empty draft | Asserted the accessible placeholder and visible CodeMirror placeholder; persisted draft proof remains separate | Empty start and empty transfer both pass in unit and browser tests |
| The first browser render matched C6 structure but stretched nearly across a 1440 px viewport | This contradicted the approved narrow-reading-measure, tall-document direction | Constrained the app to 72rem, the learning workspace to 68rem, and the base workbench to a 24rem maximum height | A second visual comparison confirmed Goal priority, stable Help width, shared paper treatment, 1:1 workbench, and intentional outer whitespace |
| The old no-network E2E attached its request listener after navigation | Bootstrap-time third-party requests could escape the assertion | Attached the listener before `page.goto` and kept it active while learner media Markdown was entered | The Chromium path observes no external runtime or image request |

### Verification at the release-candidate gate

- TypeScript: `npm run typecheck` passed.
- Unit/component tests: 10 files, 83 tests passed.
- Production build: Vite transformed 198 modules and completed successfully.
- Browser tests: 8 Chromium paths passed locally.
- Browser evidence covers first-attempt Perfect, Fail and progressive Help,
  repair and different-content transfer, recall Help transfer debt, optional
  Matched Review, draft restoration, desktop one-pixel alignment, non-mutating
  invisibles, mobile semantic stacking, and no external runtime request.
- In-app desktop visual inspection found no console warning or error from the
  application.
- Remote review, GitHub CI on this head, production deployment, and production
  browser verification remain pending at this entry. They must not be reported
  as complete from the older deployed head.

### PR checkpoint decision

The behavior commit was intentionally kept local while the legacy interface
was incompatible with the new Help state. The release candidate is now split
into reviewable documentation, learning-state, C6 interface, and browser-proof
commits. PR #1 remains the H1 delivery unit. Fresh Codex and CodeRabbit review
will be requested only after this complete candidate is pushed; deployment
waits for current-head CI and review triage.

## 2026-07-18 — Review corrections and final C6 delivery

### What the final review changed

The latest-head Codex review found five valid boundary defects after the first
C6 release candidate. They were fixed together in application commit
`410f0e2e98c4ad8fa803bceb53d1087d413cdd8a`:

1. A transferred problem could inherit the previous CodeMirror undo history.
   The editor is now keyed by problem ID, so the transfer creates a fresh
   editing history as well as an empty draft.
2. Merely accessing `window.localStorage` could throw in a restricted browser.
   Storage resolution is guarded and falls back to a volatile per-session
   `Storage` implementation without changing the progress schema.
3. Starting a transfer did not immediately clear its pending family. The
   reducer now consumes that obligation when the transfer begins.
4. Reloading an active transfer that happened to target the introductory Apple
   problem reopened its rule. Active transfers now restore as recall, while a
   normal first exposure still behaves as an introduction.
5. A Setext H1 such as `Apple` followed by `=====` could pass even though the
   lesson explicitly teaches `# Space Title`. The H1 check now also requires an
   ATX/hash source span for this exercise family.

Regression coverage was added for transfer undo isolation, a throwing
`localStorage` getter, transfer obligation consumption, introduce-target
restoration, and Setext rejection. Every current inline review thread was
answered with evidence and resolved.

### Final evidence

- Application commit: `410f0e2e98c4ad8fa803bceb53d1087d413cdd8a`.
- TypeScript and production build: passed; Vite transformed 199 modules.
- Unit/component tests: 10 files, 86 tests passed.
- Browser tests: all 8 Chromium journeys passed locally and against production.
- GitHub: Verify completed successfully in 59 seconds; CodeRabbit approved the
  application commit; aggregate review state was `APPROVED`, merge state was
  `CLEAN`, and actionable unresolved threads were zero.
- Production deployment:
  `dpl_kNkfBiPqSXJjYLEFAB486Fz1ZTGZ` at
  `https://nabimd-qj4q2mlzc-jiwon112-3536s-projects.vercel.app`, aliased to
  `https://nabimd.vercel.app`.
- Public access: the alias returned HTTP 200 without authentication.
- Runtime: this is a static build; the Vercel runtime-log query returned no
  function logs, as expected for this architecture.

The earlier production deployment of `410a8fb` was superseded after review.
The public alias now serves the reviewed `410f0e2` application. This final
evidence update changes documentation only, so it requires the lightweight
repository CI gate but not another production deployment.

Two non-blocking platform notices remain recorded rather than hidden: Vite
warns that the main JavaScript chunk is over 500 kB before gzip, and CodeRabbit
shows a generic docstring-coverage notice even though this repository defines
no docstring-coverage rule. Neither altered the verified learner path; bundle
splitting can be considered after the Build Week curriculum scope is complete.

## Planned evidence after the C6 milestone

Record the primary-task `/feedback` Session ID, the Devpost submission and
video evidence, and the GPT-5.6 curriculum-refinement artifact before beginning
the next syntax family.

## 2026-07-18 — Trust-first problem-bank pipeline and Level 1 teaching

### Product decision

Issue #7 exposed a real constraint rather than a reason to inflate the demo:
the verified grader currently supports only top-level hash H1 exercises. Codex
generated and normalized 128 candidates—16 in each Devpost-aligned family—but
only the 16 headings are eligible for the runtime gate. The other 112 remain
recorded as `engine-family-not-supported`. They are not described as shipped.

Level 1 now teaches the rule in the Instruction area before asking for recall:
one sentence names the concept, one explains the keystrokes, and one inline
example shows `# Weather`. The block renders from the dynamic session
`introduce` state, so it appears when Practice again rotates a non-Apple
problem into the first Level 1 step. Basics, Challenge, transfer, and later run
steps stay lean.

### GPT-5.6 generation and refinement

The exact prompt and raw artifact are committed under
`curriculum/problem-bank/`. A first compact draft revealed three trust risks:
bare horizontal-rule targets had no human-readable context, invented
`example.com` destinations weakened link exercises, and image URLs implied
assets that did not exist. The artifact was corrected before review:

- every family now preserves concept/how-to/example teaching data;
- every normalized candidate carries expected skill, a likely malformed trap,
  and an editorial note inside its digest;
- horizontal rules preserve prose blocks on both sides with blank lines;
- links use descriptive labels and public documentation destinations; and
- images use reserved local practice paths and remain blocked until licensed
  assets and visual alt-text review exist.

### Deterministic gate

The pipeline enforces generate → real fixture engine → declared-independent
agreement → editorial acceptance → exact publish-set equality. Candidate data uses
canonical SHA-256 digests. Heading reviews additionally bind the full
`evaluateProblem` transcript and its 29-fixture count. Missing, stale,
duplicate, or disagreeing reviews fail; a third negative verdict cannot be
ignored. The runtime JSON is generated separately and must exactly match the
accepted editorial set.

At this implementation checkpoint, TypeScript, 652 unit/component/pipeline
tests, the production build, and all 15 Chromium paths pass. Browser proof now
includes the first Level 1 teaching block, its non-Apple replay introduction,
and the lean Basics path. The final bank gate is intentionally red only because
no independent reviewer or editorial acceptance has yet been recorded. Those
records must be produced by separate review passes against the exact printed
digests before this issue can merge.

## Next entry

Record the two independent reviewer artifacts, editorial acceptance, final
bank-gate result, browser proof, review corrections, merge, and production
verification for issue #7.

## 2026-07-18 — Issue #7 independent review and publication gate

### Review passes

The runtime bank was frozen before review. Two Codex agents then worked from
the same committed manifest without reading or copying one another's review
file:

- Atlas regenerated the manifest, ran all 16 heading candidates through their
  29 real-engine fixtures, inspected the learner copy, and recorded 16 passes.
- Orchid repeated the same work independently and recorded 16 passes with a
  distinct reviewer and run ID.

Each pass is tied to its candidate digest, full runtime problem, complete
fixture definitions, actual engine transcript, and fixture count. An
independent editorial pass accepted the 16 concise US-English heading titles
and shared teaching block. Under Jiwon's approved autonomous-execution grant,
the primary Codex task recorded that editorial acceptance as
`codex-primary-autonomous-editorial-acceptance`; it is not represented as a
manual review performed by Jiwon. The remaining 112 candidates stay blocked.
The repository gate verifies that the records declare different reviewer and
run IDs; it cannot authenticate agent identity from static JSON. The stronger
process claim above comes from the actual separate agent runs and is recorded
as Build Week provenance, not inferred by the executable gate.

### Audit correction before acceptance

The first frozen manifest bound candidate content and engine results but did
not bind every runtime problem field. That meant a later prompt or hint edit
could theoretically leave existing reviews looking current. The primary task
stopped the two reviewers before they wrote verdicts, added a failing
regression, and changed the fixture-result digest to include the complete
runtime problem and full fixture transcript. It also made the manifest command
fail when its committed file is stale and rejected blank reviewer/run or
editorial identities. The manifest was regenerated, frozen, and both reviewers
reran their checks before their final records were accepted.

### Verified result before remote review

- `npm run check`: passed.
- Vitest: 15 files, 661 tests passed after local and GitHub CodeRabbit review
  corrections.
- Publication gate: passed with two distinct review artifacts and digest-bound
  editorial acceptance.
- Production build: Vite transformed 203 modules and completed successfully.
- Browser suite: a fresh final Chromium run passed all 15 paths, including
  1280 × 800 and 1440 × 900 no-scroll bounds and 320/375 px overflow checks.
- Remote PR review, merge, deployment, and production-browser verification are
  still pending and are not claimed by this entry.

### Local CodeRabbit review corrections

The CodeRabbit CLI reviewed the complete `main...issue-7` diff and raised five
valid boundary issues: two major and three minor. The release candidate now
fails explicitly if an entry points to a missing starting problem, rejects
missing or non-positive fixture counts, validates malformed artifact/family/
candidate records without dereferencing them, requires kebab-case candidate
IDs, and labels the former 24 + 6 + 3 curriculum outline as future scope rather
than the Build Week publish set. Four new regression tests cover the executable
changes; the full gate remains green.

GitHub CodeRabbit then raised six additional publication-boundary issues. The
generation prompt now defines the exact JSON contract and family-default
inheritance, optional candidate overrides are validated before normalization,
runtime teaching modes are parsed instead of trusted through a TypeScript cast,
and public gate language is limited to what static artifacts can prove:
distinct declared reviewer and run IDs. The spec's old 24 + 6 + 3 outline had
already been corrected to future scope. Its incremental rereview also found
that a truthy non-array candidate collection could reach `.entries()` after
recording an error; validation now falls back to an empty array and returns the
error instead of throwing. Three more regressions cover the new runtime checks;
the final local gate passes 661 tests.

## 2026-07-18 — Issue #7 merge and production proof

### Remote review and merge

PR #17 reached a clean, approved state at head `49a62e55a1cddc35be20fd259644f5c24279669a`:

- GitHub Verify passed on the final head;
- CodeRabbit approved after all six actionable GitHub threads were answered,
  confirmed, and resolved; its final incremental pass produced no new
  actionable comment;
- the GitHub Codex reviewer reported no major issue on the final head; and
- all six review threads were resolved before merge.

The PR was merged into `main` as
`d1b9b6ecc5ba23eeee6e69011e006a7591f003f3`. The local main checkout was then
fast-forwarded to the same commit without modifying the user's untracked font,
logo, or Session ID files.

### Production deployment and browser proof

The merged main was linked explicitly to the existing
`jiwon112-3536s-projects/nabimd` Vercel project and deployed as
`dpl_4qCZZARAD2JEcWbnNcBiRwrwRqxd`. Vercel rebuilt 203 modules successfully and
reported the deployment Ready at
`https://nabimd-3jsyb8obz-jiwon112-3536s-projects.vercel.app`.

The CLI initially updated only the project's generated production aliases, so
`nabimd.vercel.app` still served the previous build. The primary task detected
the different response ETag and content length, assigned the public alias to
the new deployment explicitly, and rechecked both public addresses. They then
returned HTTP 200 with the same new ETag.

The production app was opened in the app browser rather than accepted from an
HTTP check alone. The welcome screen rendered the released wordmark and three
entry choices. A fresh Level 1 run showed the teaching block, Goal, downward
Hint, source editor, and Live preview. Entering `# Apple` returned Perfect;
Next advanced to a blank `Rainy day` recall exercise at step 2 of 3. This final
check exercised the deployed learner path, not a local server or preview URL.

## 2026-07-18 — PR #15 restored-progress hardening

### Finding assessment and correction

Codex security review identified that browser-restored problem-ID arrays were
accepted without a length bound before the app copied and rendered them. The
static path is real, but the repository does not establish a remote attacker
or cross-user input boundary: the value comes from the learner's same-origin
`sessionStorage`. The project therefore treats this as client-state resilience
hardening rather than claiming a demonstrated remote vulnerability.

The PR's first implementation compared a restored run with one exact generated
sequence plus at most one insertion. GitHub Codex review found a legitimate
counterexample: transfer practice can move a later problem to the next step
without changing the array length. That implementation would discard valid
progress after refresh. The final invariant limits a run to the generated
three-problem baseline through the product's structural maximum of one transfer
per baseline problem, while allowing the normal reordering. Completed and
recent ID lists are independently capped at the finite problem-bank size. A
subsequent CodeRabbit review correctly noted that length and known IDs alone
would still accept arbitrary duplicates. The final validator replays the same
pure insertion/reordering transition used by the learning session and accepts
only a schedule reachable at the persisted step and transfer state.

### Verified result before remote review

- Focused persistence and session suites: 47 tests passed, including a real
  transfer reorder followed by hook remount, the six-step structural maximum,
  oversized-list rejection, and rejection of a bounded but unreachable run.
- `npm run check`: passed.
- Vitest: 15 files, 670 tests passed.
- Publication gate: passed.
- Production build: Vite transformed 204 modules and completed successfully.
- Remote rereview, merge, and production verification are still pending and
  are not claimed by this entry.

## 2026-07-18 — PR #15 merge and production proof

### Final review and merge

PR #15 reached an approved state at final head
`a3e4bd9590fc1496d5761808acc29d5725555f97`:

- GitHub Verify passed on the final head;
- CodeRabbit approved the final head and explicitly confirmed that the shared
  run-schedule state machine addressed its bounded-but-unreachable duplicate
  finding;
- GitHub Codex reported no major issue on the final head; and
- both actionable review threads were answered and resolved.

The PR was merged into `main` as
`de3c68b541b768299c6f61fb43e0bc46e0fb8d46`. Local `main` was fast-forwarded
to the same commit without changing the user's untracked font, logo, or session
ID files. The merged remote feature branch was deleted afterward.

### Production deployment and browser proof

The merged main was linked to the existing
`jiwon112-3536s-projects/nabimd` Vercel project and deployed as
`dpl_BbxQfTxr5dT8czfTADt3aivWLdeM`. Vercel reported the production deployment
Ready at `https://nabimd-rmgwmoy4n-jiwon112-3536s-projects.vercel.app`.

Vercel's generated production alias pointed to the new artifact, while
`nabimd.vercel.app` still returned the previous ETag. The primary task assigned
the public alias explicitly and verified HTTP 200 with the new deployment ETag
`d6fa3385bba56b1a66cb2bd0cebc7506`. Vercel reported no runtime error logs for
the deployment.

The production app was then exercised in the app browser. A fresh Level 1 run
opened the Apple goal and teaching UI; entering `# Apple` returned Perfect;
Next advanced to a blank Rainy day exercise at step 2 of 3. The browser console
reported no errors. This verifies the deployed learner path, while the
malformed-storage and transfer-remount boundaries remain covered by the 670
automated tests run before merge.

## 2026-07-19 — Grammar-only verdict decision

### Product conflict resolved

The first shipped grader treated the Goal as both a Markdown example and a
prose answer key. That made capitalization and protected wording blocking
checks, and split successful work into Matched and Perfect. Play-testing showed
that this contradicted Nabi's actual promise: it teaches Markdown production,
not English spelling or faithful transcription.

Jiwon and Codex replaced the three-tier model with two user-visible outcomes:

- Try again when the requested Markdown construct is absent or malformed;
- Matched when that construct is valid.

The learner's prose is preserved exactly and never auto-corrected. Case,
spelling, punctuation, wording, and extra prose do not affect the verdict or
appear as Review differences. Optional Review is reserved for Markdown document
structure, such as multiple H1 document titles, and never blocks Next.

The decision deliberately makes `# apple`, `# aple`, and `# Banana` equivalent
for the Level 1 hash-H1 exercise. Tests were changed first and produced 279
expected failures against the old engine before the implementation was updated.

### Revalidation evidence

Changing the fixture contract invalidated every previously accepted heading
digest, so the publication gate correctly stopped with 16 stale-review errors.
Atlas and Orchid independently reran the real engine against all 16 headings
and 28 fixtures per heading. Both accepted the grammar-only results and wrote
fresh, distinct review records. The primary editorial acceptance and frozen
manifest were then rebound to those reviewed fixture digests; no stale record
was carried forward.

- `npm run check`: passed, including TypeScript, 657 Vitest tests, the
  publication gate, and the production build.
- `npm run test:e2e`: 15 Chromium journeys passed, including the complete
  keyboard run and the 1280 × 800 no-page-scroll check.

## 2026-07-19 — CBT Editorial Desk rebuild

### Product conflict resolved

The first Editorial Desk was visually polished but behaved like a Markdown
editor: Goal, source, live preview, Hint/Review, and a bottom action bar competed
for attention. That arrangement was tolerable for a one-line H1 but would turn
a future Level 5 company work order into three tall, repetitive columns.

Jiwon chose a familiar computer-based-test grammar instead. The browser now
contains one fixed top bar and two equal sheets: immutable rendered Goal on the
left, and the learner's answer on the right. Write and Preview share the answer
sheet; after a failed Check, Preview becomes Review. The always-visible Live
Preview column and the bottom status bar were removed.

The change also resolved smaller hands-on findings in the same product frame:

- the Nabi Markdown wordmark and boxed Exit return to the level chooser;
- Try another replaces the current prompt with different same-skill content
  without consuming progress;
- Hint reveals vertically inside Goal and remains hidden at recall levels;
- learner copy uses Write, Preview, Review, How it should look, What you wrote,
  and How to fix it instead of Source, Render, Diff, or block-type vocabulary;
- Try again and Matched appear briefly at the center of the viewport; and
- a clean Matched result focuses Next, while the next problem returns focus to
  the editor.

### Codex implementation and test-first evidence

Codex wrote the approved frame contract and a task-level plan before feature
code. Reducer and component assertions pinned same-skill replacement, exactly
two workspace panels, the absence of a Live Preview region and bottom bar,
Hint/Review state, and the Check → focused Next → Space/Enter → focused editor
sequence. The implementation then composed the screen from a top bar, Goal
panel, answer panel, and transient verdict notice while keeping the existing
deterministic grader and CodeMirror editor.

The browser suite was rewritten around the new contract rather than preserving
obsolete Side Coach selectors. It covers keyboard-only completion, failure and
repair, transfer, persistence, Hint, Review, equal panel dimensions, narrow
screens, fixed desktop chrome, and an 80-line work order that scrolls inside
the editor instead of the page.

### Visual and interaction verification before remote review

- Unit/component/session tests: 14 files, 665 tests passed.
- Browser tests: 19 Chromium journeys passed.
- At `1586 × 992`, Goal and Your answer measured exactly `772 × 880` pixels
  each; the document measured `1586 × 992` with no page overflow.
- An 80-line answer produced an editor scroller of 2,582 pixels inside a
  782-pixel viewport while the document height stayed fixed at 992 pixels.
- A lowercase `# rainy day` produced Matched without changing the learner's
  text. `## Study tools` produced Try again and the beginner-facing Review.
- Try another replaced Study tools with Weekend forecast at the same progress
  position; the wordmark returned directly to the entry chooser.
- The in-app browser console reported zero warnings or errors.
- The selected reference and implementation were compared side by side at the
  same viewport. The equal frame, fixed chrome, centered verdict, and control
  hierarchy matched the approved direction; content density differs because
  Issue #9, not this layout PR, owns the Level 5 problem bank.

### Local CodeRabbit review

The authenticated CodeRabbit CLI reviewed the complete committed CBT diff and
raised 14 issues: two major and twelve minor. Each was checked against the
running product instead of being applied automatically.

The review produced concrete accessibility and resilience improvements:

- inactive CodeMirror views no longer take focus during mount;
- answer tabs use roving tab stops and Left/Right Arrow navigation;
- reduced-motion users see the verdict for its full React-controlled lifetime
  instead of a one-millisecond CSS animation ending at zero opacity;
- the visual contract records automatic Level 1 Hint, automatic failed Review,
  and exact verdict colors;
- the runtime-network test now catches same-origin `/api/` traffic as well as
  external requests; and
- undo and literal-space regressions assert observable editor content rather
  than placeholder attributes or normalized text.

The reported long-Review clipping was not present: the later
`.answer-panel__body--reading` rule already overrides the base hidden overflow.
An 80-line failed answer was added as an executable counterexample and proved
that Review scrolls internally while the document stays fixed. The proposed
removal of the `Try another` fallback was rejected because finite-bank
exhaustion must still return different current content instead of making a
visible button do nothing. Two date corrections were also rejected: Jiwon
approved the design on July 19 KST and this work occurred on July 19 KST.

A full CodeRabbit rerun on the corrected implementation raised zero issues.

### GitHub Codex review corrections

The GitHub Codex reviewer found three P2 boundaries that local visual QA did not
exercise. All three were reproduced with failing tests before correction:

- Try another changed the persisted run slot, but the hardened progress loader
  recognized only baseline schedules and transfer moves. The reachability
  validator now models an explicit same-retry-family replacement without
  accepting cross-family substitutions, and a hook remount proves the replaced
  problem and draft survive refresh.
- A keyboard Check that failed opened Review while DOM focus remained inside
  the now-hidden CodeMirror surface. Failed Review now moves focus to its
  selected tab, while Matched continues to focus Next.
- The fixed practice viewport also prevented short greeting and completion
  content from scrolling. Those non-editor surfaces now own bounded internal
  scroll paths; a `667 × 320` journey reaches both the entry choices and all
  completion actions without document scrolling.

The corrections increased the local gate to 669 tests and the browser suite to
19 passing journeys.

### Remote CodeRabbit review corrections

The first GitHub CodeRabbit pass reviewed the preceding head and raised eight
issues. Six were actionable and were reproduced or pinned with tests before
correction:

- moving from Write to Preview/Review with `Alt+2`, or through a keyboard
  failure Check, now moves focus to the visible selected tab instead of leaving
  it inside a hidden editor;
- the failed Review introduction now accurately asks the learner to compare
  the expected Markdown with their answer instead of claiming that a cropped
  block diff is displayed;
- the `?` shortcut cannot create hidden Hint state after completion;
- the approved visual contract, specification, and implementation plan all
  require the platform-appropriate Check shortcut to be visibly displayed;
- the keyboard-only browser journey types through real sequential key events
  instead of using a value-injection helper; and
- the local-font regression verifies both the regular and semibold Source
  Serif faces that the page loads.

The reported July 19 date mismatch was rejected because the design approval and
implementation both occurred on July 19 KST. The short-viewport clipping report
was stale against the next commit: greeting and completion already gained
bounded internal scrolling, and the `667 × 320` browser regression reaches both
surfaces without document scroll.

An incremental CodeRabbit pass raised one final test-coverage nit. Dedicated
top-bar assertions now prove that a question mark typed in a text field does not
open Hint and that a handled document-level Hint shortcut prevents the browser
default action.

The final local gate is 15 files and 669 passing tests, plus 19 passing Chromium
journeys. A fresh remote re-review, merge, deployment, and production
verification remain pending and are not claimed by this entry.

## 2026-07-19 — Issue #9 five-level problem-bank program begins

### Product conflict resolved before implementation

The existing application specification still described three entry modes into
an H1-only vertical and treated the 500-problem bank and Level 5 grader as a
future direction. Issue #9 superseded that boundary: the Build Week program now
requires a playable five-level ladder and at least 500 inspected problems.

The Level 5 north-star document also contained an older proposal to distinguish
Matched from Perfect and to protect critical prose through curated text checks.
That contradicted Jiwon's later D9/D10 decision that Nabi grades Markdown
grammar only. The source of truth now has one pass state, Matched. Level 3–5
problems use ordered structural slots—heading depth and position, lists, code
blocks, and document anatomy—without comparing section titles, spelling,
capitalization, or the meaning of the learner's prose. Build-time inspection,
not learner-time grading, establishes that each Goal is a credible document.

### Codex planning and parallel role evidence

Codex read the prerequisite Issue #7 pipeline, the approved decision record,
the application spec, the anonymized agent-work-order example, the current
heading engine, and the session scheduler before editing the specification.
Four isolated planning roles were used:

- an architecture role compared a typed predicate registry with a generic DSL
  and family-specific graders;
- a pipeline role audited digest and review boundaries and compared a monolith,
  an immutable batch ledger, and a hosted queue;
- a Level 1–2 curriculum role proposed low-friction vocabulary and single-skill
  fixture matrices; and
- a Level 3–5 curriculum role designed human-document, development-spec, and
  agent-work-order archetypes.

The selected design uses a normalized schema-v2 problem contract, a closed
typed predicate registry, append-only batch evidence, and generated runtime and
tracker projections. Runtime AI and web crawling remain absent. Raw model
generation is reproducible from committed output onward; reviews are described
honestly as declared-independent repository evidence, not cryptographic proof
of reviewer identity.

### Autonomous decisions recorded

- Target the first complete bank at 512 accepted problems: 128/128/96/80/80
  across Levels 1–5. This gives the eight foundational syntax families broad
  guided and recall coverage while reserving substantial advanced variety.
- Normalize omitted `flavor` to `standard` before hashing and ship no flavor UI
  or GFM content in this issue.
- Treat vocabulary as generation and editorial metadata only; it cannot enter
  a learner verdict predicate.
- Require convention version and review date on every Level 5 problem because
  coding-agent practices change.
- Replace the single mutable pipeline artifact with immutable batch evidence
  and deterministic compiled projections, preserving the old Issue #7
  artifacts as audit history.
- Requalify old accepted headings after schema changes instead of carrying
  stale approvals across new digests.
- Keep image exercises blocked until local licensed assets and their alt-text
  guidance receive visual inspection; a blocked asset family cannot weaken the
  bank-wide trust gate.

### First playable five-level foundation

Codex implemented the schema-v2 contract and the first deliberately small
vertical slice before attempting the 512-problem expansion. Four distinct
problems now exist at each level. This is the minimum that lets a three-problem
run offer a genuinely different `Try another` candidate without crossing a
level, flavor, or retry family.

The foundation includes:

- pure Markdown-AST predicates that inspect structure but cannot read Goal
  prose, vocabulary terms, capitalization, spelling, or semantic similarity;
- direct fixtures for every declared match check, plus canonical,
  different-prose, case-or-spelling, missing, malformed, and optional-Review
  boundaries;
- full-length Level 5 work orders whose convention metadata is dated and
  versioned;
- a five-choice entry screen and deterministic three-problem schedules bound
  to the compiled bank revision; and
- a schema-v2 append-only pipeline that normalizes, hashes, verifies through
  the real engine, freezes review scope, requires two distinct declared review
  runs, and publishes only separately accepted editorial decisions.

Two implementation regressions were exposed by integration rather than hidden:

1. The application tests still assumed the previous three entry choices and
   resumed the first saved run while attempting to open Level 2. The tests now
   clear browser-session progress between isolated entry cases and assert all
   five exact levels.
2. The browser runner reused a Vite server left on port 4173 by another
   checkout, so it displayed the old product while the new tests ran. The
   Playwright configuration now owns an overridable isolated port and no longer
   mistakes a stale checkout for the branch under test.

At this checkpoint, 21 Vitest files and 758 assertions pass. The refreshed
12-journey Chromium suite covers the five-level chooser, structure-only case
and spelling tolerance, keyboard Check/Next focus, repaired transfer,
same-level replacement, session restore, request-only Hint, safe local Preview,
and the fixed `1280 × 800` Level 5 scroll contract. Publication review evidence
is recorded in the immutable batch directory rather than inferred from this
summary.

### Milestone 1 review and publication result

The frozen foundation batch contains 20 candidates and 184 fixtures. Two
review roles independently accepted all 20 against the same review manifest.
One checked 104 direct match-check counterexamples and the absence of prose
operands in the engine; the other separately checked Level 3–5 target anatomy,
section-occurrence scoping, and transfer variants. A third editorial role then
inspected all eight required dimensions for every candidate.

The trust gate caught a real evidence-authoring error before publication: the
first editorial draft contained one mistyped candidate digest and had not yet
been sealed with its review digests. The compiler reported stale editorial
scope, digest, and candidate evidence and kept the tracker at zero. Only after
the editorial actor corrected that one digest and sealed the complete artifact
did `bank:batch:publish` produce 20 accepted problems—four at every level—with
zero rejected or blocked records.

The final batch records its accepted set, bank projection, tracker, review
digests, and editorial digest in `summary.generated.json`. A fresh local
`npm run check` passed the 15 pipeline tests, 7 state-aware publication tests,
2 repository-history tests, 774 application tests, legacy gate, typecheck,
production build, and fixture-exclusion bundle check. The bundle-size warning
remains informational; no runtime AI or new network dependency was added.

### Public-PR review correction

CodeRabbit and Codex reviewed the public PR and exposed assumptions the local
foundation review had not challenged. The accepted changes now:

- bind `package-lock.json` into the engine contract;
- make candidate revision part of fixture, verdict, editorial, and compilation
  identity, so a later accepted revision can safely supersede the same ID;
- require direct section lists, preventing a nested list from satisfying the
  outer exercise;
- recognize ATX H1 through H6 consistently, including malformed spacing;
- remove Level 5 character and line limits from Matched so only Markdown
  structure is graded;
- reject cross-level transfer data during persisted-session restoration;
- exclude fixture-only source from the learner production bundle;
- fail a batch closed on partial, malformed, unknown, or non-independent
  evidence; and
- compare accepted immutable batches against the base branch in repository CI.

Those corrections invalidated the old mechanical artifacts and review seals.
Codex did not carry the stale approval forward. It regenerated 184 fixtures,
proved 184/184 results and 104/104 direct counterexamples against manifest
`2b89bc66a6d743af47264aac6431f7e4210704e5555b76e22c32284191ecdb5b`,
then obtained two fresh 20/20 independent reviews and a separate 20/20
eight-dimension editorial inspection. The current sealed review digests are
`18d8a6ee0c1bcaee2b22fd8190e00374ecdfdabeae40e97af7b404e66f25a45f`
and `4dab094ac04359377780372c61a8c940d5018932bc364b57dccb5ce3b26c6470`;
the editorial digest is
`31a304a41a7376502c1c4113d2706e5473338455a827880573b5c9416429a7c3`.

Two reviewer suggestions were deliberately not converted into product changes.
Schema-v2 progress is safely invalidated rather than migrated because old
session data has no bank revision and visits are intentionally ephemeral.
Likewise, any evidence error blocks its immutable batch rather than publishing
a clean-looking subset. The review artifacts use July 19 because creation and
inspection occurred on July 19 in the repository owner's `Asia/Seoul`
timezone; the external review service displayed the same moment as July 18 UTC.

The local CodeRabbit agent callback could not be reused after its OAuth state
expired, and the pasted callback secret was neither stored nor committed. That
did not block review: the installed GitHub app reviewed the public PR, which is
the intended external-review boundary for this repository.

The first public CI rerun also caught a delivery mistake rather than a product
failure: `package.json` invoked the production-bundle verifier, but the new
script itself had been left untracked. All preceding CI stages had passed. A
small follow-up commit added the exact locally verified file and restarted CI.
The next incremental review then found one real fail-open edge: a resolved base
commit whose tracker could not be read had been treated like an intentional
pre-tracker bootstrap. The gate now uses `git ls-tree` to distinguish an absent
historical path and lets invalid commits, failed reads, and invalid JSON stop the
run. Two smaller test assertions now pin schema v2 and an unknown candidate with
a valid revision.

Two incremental-review reports were rejected with evidence. The ATX expression
`#{${heading.depth}}` deliberately produces the regular-expression
quantifier `#{1}` through `#{6}`; all six depth tests pass, so replacing it would
only churn the sealed engine contract. The July 19 metadata likewise remains
correct in `Asia/Seoul`, the repository owner's recorded review timezone.

### Issue #9 heading vocabulary expansion

The second schema-v2 batch follows the product owner's instruction to expand
the words before expanding the grammar. Level 1 uses familiar concrete phrases
such as food, weather, school, pets, and family activities. Level 2 asks for the
same H1 structure through everyday routines, so recall is tested without
introducing another syntax family. Neither level grades capitalization,
spelling, punctuation, wording, prose meaning, or document length.

Batch `2026-07-19-l1-l2-headings-002` contains 24 candidates and 192 fixtures.
All 24 candidates and all 192 real-engine results passed the frozen manifest.
Two independent reviewers accepted 24/24 against the same digests, and a
separate editorial pass accepted all eight required dimensions for 24/24. The
published projection now contains 44 problems with a 16/16/4/4/4 level split;
the application consumes that generated ledger directly instead of maintaining
a parallel handwritten source list.

The pipeline work also added engine-contract validation to batch loading,
global batch-sequence and candidate-revision preflight checks, and a repository
gate that forbids changes inside already accepted batch directories. Any
reviewer or editorial disagreement still blocks the entire new batch; no
clean-looking subset is silently published. The runtime remains deterministic
and makes no AI or learner-content API request.

A local CodeRabbit CLI OAuth attempt introduced an unnecessary pause while its
browser callback returned to `127.0.0.1`. It was removed from the required
workflow rather than represented as completed review evidence. From this batch
forward, the delivery gate is an open public PR with Codex review and CI;
comments left independently by the installed CodeRabbit GitHub app may be
considered as a secondary signal, but local CodeRabbit authentication is not a
blocking step.

### Issue #9 bold-emphasis expansion

The third schema-v2 batch adds the first new Level 1–2 syntax family without
changing the two-verdict product contract. It grades the parsed Markdown
`strong` node, not the learner's prose or a preferred delimiter spelling.
Consequently `**phrase**`, `__phrase__`, and strong text nested with other valid
inline Markdown are Matched. Plain text, italic-only text, unclosed markers,
and marker characters inside inline code do not satisfy the exercise. Multiple
bold spans remain Matched; a short-note focus suggestion is optional Review and
cannot revoke the pass.

The predicate and schema changes were written test-first. The implementation
also exposed an evidence-lifecycle requirement: a new editorial predicate
changes the current engine contract, but must not rewrite an already accepted
batch's immutable verification transcript. Older batches now keep their sealed
engine evidence while all of their fixtures replay against the current engine
as regression proof. Incomplete later batches likewise cannot invalidate an
earlier batch's own gate.

Batch `2026-07-19-l1-l2-emphasis-003` contains 24 candidates and 216 frozen
real-engine fixtures. Two independent reviewers accepted 24/24 against manifest
`a5fb3c1931e1d7562703af8498198c8cdaa5116bc265dd2093afde74f2179a53`;
one reviewer also ran 360 additional CommonMark adversarial probes. Separate
editorial inspection accepted all eight dimensions for 24/24. Publication
raises the deterministic runtime bank to 68 problems with a 28/28/4/4/4 split.
The live learner still makes no AI or learner-content API request.

### Issue #9 bullet-list expansion

The fourth schema-v2 batch adds 24 Level 1–2 bullet-list exercises. Level 1
shows the hyphen-and-space pattern with familiar concrete nouns; Level 2 asks
for the same structure from memory through short everyday actions. The parser
accepts standard `-`, `*`, and `+` markers, additional valid items, and a valid
bullet list inside another Markdown wrapper. It does not grade item wording,
capitalization, spelling, punctuation, or order. Numbered lists, marker text in
code, missing spaces, fewer than three items, and empty items receive Try
again. More than one list group remains Matched with optional structural
Review.

Independent review materially changed the frozen batch before publication.
The first editorial pass rejected `l1-list-pencil-case` because its Goal
duplicated the visible teaching example, effectively revealing the answer.
A separate engine review found that nonempty image-alt list items were treated
as empty because mdast stores their learner-visible text in `alt`, not `value`.
The Goal and teaching copy were separated, image alt was added to the
structure-only content check, positive and negative image-alt fixtures were
added, and all mechanical artifacts and digests were regenerated. No rejected
manifest was represented as accepted evidence.

A final post-review adversarial check then exposed a narrower nesting edge:
three empty parent bullets could borrow text from three separate one-item child
lists and appear nonempty. The item-content walk now stops at nested list
boundaries. The nested children may still satisfy the lesson if one child list
itself has three nonempty items, but they can no longer make an empty parent
item pass. A regression test pins this distinction while the frozen batch
fixtures continue to replay successfully against the current engine.

The corrected batch contains 24 candidates and 360 frozen real-engine
fixtures. Atlas accepted 24/24 after recomputing the engine and artifact
digests. Orchid independently accepted 24/24 after 360/360 frozen fixtures and
504 additional adversarial CommonMark probes passed. The separate editorial
rerun accepted all eight required dimensions for 24/24 against manifest
`9781f5059c3088cfe1ed5f2347f86375e1839de9cc3f62c673400df359d1f1c6`.
Publication raises the deterministic runtime bank to 92 problems with a
40/40/4/4/4 split. The live application remains network-free during grading.

The exact-head Codex review found two remaining publication defects. First,
recursive list discovery allowed a valid bullet list nested under a numbered
list to satisfy the bullet-list lesson even though the answer's outer structure
was numbered. A failing regression reproduced the collision before the
traversal was changed to preserve ancestor-list marker types; nested lists can
now match through neutral wrappers such as blockquotes, but cannot borrow a
different ordered/unordered outer structure. Second, the pipeline README still
described the preceding 68-problem publication. Its fixture and level totals
now match the generated 92-problem tracker.

PR #25 merged the corrected bullet-list batch as
`f1cd0b36718721f494b35b12f72f95090eaae0ed` after exact-head CI and Codex
review passed. A detached merge worktree then passed the full 1,655-test check,
the production build, and all 12 browser journeys. Vercel deployment
`dpl_CRSodcpvtPgrdGEcNJ7TmhHuSdZB` was promoted to
`https://nabimd.vercel.app`; the public alias and immutable deployment returned
the same ETag, and the 12 production journeys passed against the alias.

### Issue #9 ordered-list expansion

The fifth schema-v2 batch adds 24 Level 1–2 ordered-list exercises. It teaches
the familiar period form (`1.`, `2.`, `3.`) while grading the parsed ordered
list, not the literal marker numbers. Repeated `1.` markers, non-one starts,
nonsequential numbers, CommonMark parenthesis delimiters, additional nonempty
items, and neutral wrappers such as blockquotes are Matched. Bullet lists,
ordered lists nested under a bullet-list ancestor, split two-plus-one groups,
code lookalikes, fewer than three items, and empty items receive Try again.
Multiple qualifying ordered lists remain Matched with optional Review.

The first generated manifest,
`1936b1391bc524421eae54f3290232fe9984d9010ec14a722cc4ec1421e77a16`,
was not published. Mechanical review passed it, but the independent editorial
review rejected six Level 2 prompts because phrases such as “battery sign,”
“return the chairs,” “loop the lock,” “check the rain,” and “due book” were
awkward or unclear for novice US English, and the document-saving sequence did
not actually say to save. Those prompts were rewritten as natural, explicit
actions. Every generated artifact and digest was then discarded and rebuilt;
all three reviews reran from scratch against the corrected manifest. This is a
real product correction from the review gate, not a retrospective success
claim.

Corrected manifest
`c98f90df1d6dbd254274d5e86a74682b0aaf780e482b2f9e0731f1a8d0a980ea`
contains 24 candidates and 624 frozen real-engine fixtures. Atlas accepted
24/24 after all 624 fixtures and 15 additional adversarial probes passed.
Orchid independently accepted 24/24 after all frozen fixtures and 1,536
additional CommonMark probes passed. The separate editorial rerun accepted all
eight dimensions for 24/24. Publication raises the deterministic runtime bank
to 116 problems with a 52/52/4/4/4 split, while live grading remains
network-free and grammar-only.

### Issue #9 blockquote expansion

The sixth schema-v2 batch adds 24 Level 1–2 blockquote exercises. The Goal
teaches the portable `>` marker followed by a space, while grading follows the parsed CommonMark
blockquote rather than a marker regex. No-space markers, up to three leading
spaces, lazy continuation, images with visible alt text, headings, lists,
code, neutral wrappers, and nested quotes can therefore match. Empty quotes,
invisible-only content, definitions, thematic breaks, raw HTML, escaped or
fullwidth markers, and code lookalikes do not. Nested or multiple blockquotes
remain Matched with optional Review instead of becoming a third verdict.

Independent engine review changed the implementation before the first
manifest was frozen. The initial visible-content walk treated arbitrary AST
`value` fields as learner-visible, which let HTML comments, empty raw HTML,
zero-width spaces, and word joiners satisfy a quote. A failing regression set
reproduced those cases before the predicate moved to an explicit visible-node
allowlist and Unicode whitespace/default-ignorable filter. The final batch has
28 real-engine fixtures per candidate, including those hidden-content and
CommonMark boundary cases.

The first frozen manifest,
`9f793bd584842b2b5d6821bfc6483b1de4337ac582174084f693320f728ac3a5`,
was not published. Orchid found that `quiet-hours` reused a content variant
from the accepted emphasis batch, and the separate editorial review rejected
“Call me after school” because it assumed a school-centered life stage rather
than remaining age-neutral. Tests were added to compare new authored
identities with the accepted bank and to pin the age-neutral replacement. The
two candidates became “Call me when you get home” and “The lobby opens at
eight,” and all mechanical artifacts and reviews were regenerated from
scratch.

Corrected manifest
`310c36d8b7e96bf02277d0c08d12cca57edb370265d36e203922e56ef3ad509a`
contains 24 candidates and 672 frozen real-engine fixtures. Atlas accepted
24/24 after 672/672 fixtures, 755 targeted checks, and 984 additional
adversarial evaluations passed. Orchid independently accepted 24/24 after all
frozen fixtures and 1,752 additional CommonMark evaluations passed. Separate
editorial inspection accepted all required dimensions for 24/24. Publication
raises the deterministic runtime bank to 140 problems with a 64/64/4/4/4
split, while live grading remains network-free and grammar-only.

### Issue #9 inline-code expansion

The seventh schema-v2 batch adds 24 Level 1–2 inline-code exercises. The Goal
teaches paired backticks around short keys, values, file names, and safe
commands. Grading checks for at least one meaningful parsed inline-code span;
it never grades the token, prose, capitalization, spelling, or punctuation.
CommonMark alternate delimiter runs, literal backticks, multiline spans, and
inline code nested in headings, lists, blockquotes, links, or emphasis match.
Unclosed or mismatched delimiters, empty or invisible-only spans, fenced and
indented code, raw HTML, image alt text, definitions, autolinks, comments, and
lookalike punctuation do not. More than one span remains Matched with an
optional Review instead of becoming a third verdict.

The first frozen manifest,
`219fb5131e2a989990e623b885fe7697f9939e63d471c1db03e666ebf3ed8eac`,
was not published. Separate editorial inspection rejected a `date` command
because it can enter a date-setting flow on Windows, and rejected “Open
list.txt” because it was too close to the visible teaching example “Open
notes.txt.” They became “Search for rain” and “Name the list today.txt,” with
only the practiced item wrapped in inline code.

The second manifest,
`0d54904b870d828e0613ff174e9b436edffea4cd1be38948412497e983386ede`,
was also not published. Atlas independently found a batch-wide false positive:
CommonMark replaces a raw NUL with U+FFFD before exposing the AST value, so a
NUL-only span appeared visible. The predicate now extracts the original span
from AST source positions before Unicode filtering. Regressions distinguish a
raw NUL, a raw NUL followed by visible text, and a literal replacement
character. An earlier Orchid pass did not include the NUL probe and was
discarded as stale rather than counted as evidence.

Corrected manifest
`5b4fc70970a16b0e25eb14c77daea8f69bf525f5e12da5a7be0c63fae73b979c`
contains 24 candidates and 912 frozen real-engine fixtures. Atlas accepted
24/24 after all frozen fixtures and 2,328 additional adversarial evaluations
passed. Orchid independently accepted 24/24 after all frozen fixtures and
3,456 additional evaluations passed. Separate editorial inspection accepted
all required dimensions for 24/24. Publication raises the deterministic
runtime bank to 164 problems with a 76/76/4/4/4 split, while live grading
remains network-free and grammar-only.

### Issue #9 link expansion

The eighth schema-v2 batch adds 24 Level 1–2 inline-link exercises. Level 1
introduces the familiar `[readable words](web address)` shape through short
everyday notes; Level 2 recalls the same structure in project and vibe-coding
contexts. Grading requires a parsed link with a visible label and a meaningful
destination, but never compares the label, destination, capitalization,
spelling, punctuation, or surrounding prose with the Goal. Direct links and
resolved full, collapsed, or shortcut reference links match. Autolinks do not,
because they skip the separate descriptive label this lesson teaches. Multiple
qualifying links remain Matched with an optional Review.

The renderer is deliberately a separate security boundary. Goal and learner
preview links keep a monochrome underlined appearance but become inert text:
no destination, anchor, image, navigation, or network request is exposed.
Syntactically valid destinations such as `javascript:`, `data:`, or `file:`
therefore still demonstrate Markdown grammar without becoming executable UI.
Empty, invisible-only, control-only, NUL-only, and percent-encoded hidden
destinations fail the structural lesson. Regression coverage distinguishes a
raw NUL from a literal replacement character and applies the same qualification
logic to optional multiple-link Review.

The first frozen manifest,
`77f4ef71714ab25836da951ff8ed7522161f224f07051bb2ba03e3f23f840d91`,
was not published. Separate editorial inspection rejected a shared teaching
sentence—“A Markdown link gives a web address readable words instead of
showing the full address.”—as ungrammatical novice US English. The sentence
became “A Markdown link connects readable words to a web address without
showing the full address.” Every mechanical artifact and digest was discarded
and regenerated; reviewers were stopped before stale verdicts could be
materialized, and all three reviews restarted from scratch.

The second manifest,
`7acff6e61dacbd1cdda5ed2d915be21365b54db7af160037461b79ff0103cb3c`,
was also not published. Its engine, independent reviews, and editorial review
passed, but a later local CodeRabbit agent review found that all 24 fixtures
labelled “case/spelling variation” reused the unrelated phrase “COMPLETELY
DIFFRENT WORDS.” The answers correctly matched, but this repeated the broader
different-prose proof instead of isolating capitalization and spelling against
each problem's own canonical label. Each fixture now uppercases its own label
and removes one character. A batch test proves all 24 sources are unique,
one-edit canonical variants, and distinct from their different-prose partner.
The generation brief now records this rejected pattern. Prior seals were
discarded and the complete review cycle restarted again.

Final manifest
`4c027a146b1f54ae99c143e552deb5e2851b615c34539529adfd6c167832c5cf`
contains 24 candidates and 2,304 frozen real-engine fixtures. Atlas accepted
24/24 after all frozen fixtures and 1,584 additional adversarial and scoped
evaluations passed. Orchid independently accepted 24/24 after all frozen
fixtures and 4,968 additional adversarial evaluations passed. Both explicitly
reproved the 24 corrected case/spelling fixtures. Separate editorial inspection
accepted all 24 candidates after checking language, safety, distinctness,
grammar-only boundaries, and collisions against the 164 previously published
problems. Publication raises the deterministic runtime bank to 188 problems
with an 88/88/4/4/4 split, while live grading remains network-free and
grammar-only.

### Issue #9 Markdown-divider expansion

The ninth schema-v2 batch adds 24 Level 1–2 Markdown-divider exercises. Every
authored Goal is a small human-readable note with text before and after the
divider. Learner grading remains narrower: it asks only whether the CommonMark
parser produced a real thematic break. `---`, `***`, `___`, spaced and longer
forms, and valid dividers nested inside otherwise valid Markdown can therefore
match. Setext headings, too-short or mixed markers, code, comments, raw HTML,
links, images, escaped markers, and Unicode lookalikes do not. More than one
divider remains Matched with a single optional Review.

Images were the first candidate for this batch, but the approved curriculum
blocks that family until local assets and alt-text guidance receive their own
visual and editorial inspection. The batch switched to the next ready Standard
Markdown family instead of weakening that stop. Independent pre-review also
found that the generic match-side block counter was root-only, unlike other
single-syntax lessons. A backward-compatible `recursive` option was added; its
default remains root-only for every existing problem, while this batch opts in
to avoid rejecting a genuine divider inside a blockquote or list.

The first frozen manifest,
`a8086c617fa593f788fc69f84a0bef08c61d723985d9daf3e66915cd5fd572b7`,
was not published. Orchid rejected one authored Goal because it used the open
compound “rain coat” instead of standard US-English “raincoat.” That finding
did not change grammar-only learner grading, but it correctly raised the
quality bar for prose shown by the teacher. The Goal, vocabulary, and derived
fixtures were corrected; the manifest and all three review records were
discarded and rebuilt from scratch.

Final manifest
`4f20f8c8d493e57f00ef7f9fe452bec719cbe957c8e8a2b3f78f3a6fb3e9d6eb`
contains 24 candidates and 1,272 frozen real-engine fixtures. Atlas accepted
24/24 after all frozen fixtures and 1,632 additional adversarial evaluations
passed. Orchid independently accepted 24/24 after all frozen fixtures and
1,920 additional CommonMark probes passed. The separate editorial rerun
accepted 24/24 and confirmed that the obsolete spelling occurs zero times.
Publication raises the deterministic runtime bank to 212 problems with a
100/100/4/4/4 split, while grading remains deterministic, network-free, and
grammar-only.

Local CodeRabbit CLI authentication was confirmed through the configured agent
API key, but both the pre-fix and final-commit `cr --agent` runs remained at
`connecting_to_review_service` for the full ten-minute review window. They were
terminated without findings and are not represented as completed reviews. The
open GitHub PR review remains the separate CodeRabbit gate for this batch.

### Issue #9 Level 3 readable-document pilot

The tenth schema-v2 batch is the first expansion beyond isolated Level 1–2
syntax. It adds 12 Level 3 workplace documents in three structurally distinct
retry families: status or handoff notes, how-to notes, and decision records.
Each family has four different content variants, so a three-problem run and
`Try another` remain inside one document anatomy without repeating the same
displayed material.

The initial curriculum proposal allowed 24 Level 3 documents. A separate engine
audit confirmed that all 24 were expressible, but recommended two 12-problem
immutable batches. Composite documents contain more interacting checks than a
single-syntax exercise; one ambiguous candidate would invalidate every seal in
the batch. The smaller pilot therefore reduces restart cost without weakening
the 512-problem target. Publication raises Level 3 from four to 16 and the bank
from 212 to 224 problems, with a 100/100/16/4/4 split.

Every Goal is a 55–71-word plain-US-English workplace document. Runtime grading
uses only heading order, H2 counts and occurrence scopes, block sequences, list
shape, blockquote shape, bold presence, and meaningful inline-code presence.
Heading labels, prose, vocabulary, capitalization, spelling, punctuation,
length, and semantic truth remain outside the verdict. The batch adds 212
frozen real-engine fixtures, 17–18 per problem, including direct failure
evidence for every match check and same-anatomy different-prose variants.

Two predicate limits were found before the manifest was frozen and are recorded
instead of hidden. Section-scoped inline code can be required in the second H2
section but not specifically inside its ordered list; authored Goals demonstrate
the preferred list-item placement while the learner feedback states the actual
section scope. The existing `list-shape` predicate also counts HTML/comment node
values as nonempty list-item content even when the preview has no visible words.
Issue #9 forbids changing existing verdict semantics in this content batch, so
explicit Matched fixtures preserve that boundary. Editorial inspection still
requires every authored Goal to contain visible, useful list items.

Final manifest
`0e96ab6128ea0c4f068244d3f9208abce42e389be82426e8f89fc1521f288c8a`
contains 12 candidates and 212 passing frozen fixtures. Atlas accepted 12/12
after replaying all fixtures and 25 independent probes. Orchid independently
accepted 12/12 after all fixtures and 508 adversarial evaluations. The separate
editorial review accepted 12/12, confirmed three distinct document anatomies,
and found no ID, Goal, content-variant, or vocabulary-set collision against the
published or frozen legacy banks. The sealed batch digest is
`5edfb1b60e3fa1c6cc2a61180e790a5c6fd62dd84b2e30e0f661ec8761fb712c`.

The configured local `cr --agent` command was invoked after the full test and
browser gates, but the execution environment rejected the unpublished-source
export before CodeRabbit started. Authentication was therefore not the cause
and the local run is not represented as a review. Because the repository and
PR are public, the open GitHub CodeRabbit review remains the external review
gate for the exact committed head.

### Issue #9 Level 3 composite-document continuation

The eleventh schema-v2 batch adds 12 more Level 3 workplace documents in three
new retry families: meeting agendas, reference notes, and recommendation
briefs. Each family has four distinct workplace scenarios. Together with the
pilot, Level 3 now offers six document anatomies that can support same-family,
different-content transfer without asking the learner to repeat an answer.

A fenced copy-ready template was prototyped before the review scope froze, then
rejected. The existing `code-block` predicate can require a fence but cannot
prove that its visible contents are nonempty. Calling an empty-but-Matched
fence “copy-ready” would overstate the deterministic grader. The replacement
recommendation brief uses only predicates whose learner-facing promise the
engine can prove; no runtime AI or network dependency was added.

Every Goal is a 55–77-word plain-US-English workplace document. Grading checks
only parsed Markdown anatomy: heading depth and order, section-scoped blocks,
thematic breaks, descriptive links, direct blockquotes, and ordered or
unordered list shape. Heading text, prose, capitalization, spelling,
punctuation, and semantic quality remain outside the binary Matched verdict.
The batch freezes 252 real-engine fixtures, exactly 21 per candidate, with an
isolated failure for every required check and same-family alternate prose.

Final manifest
`fd9c371e31fe99176ffbd67dc82d952a22e8bed7280fc9105ef56e1068d94cab`
contains 12 candidates and 252 passing frozen fixtures. Atlas accepted 12/12
after replaying all fixtures and 30 independent probes. Orchid independently
accepted 12/12 after replaying all fixtures and 604 fresh adversarial probes.
The separate editorial review accepted 12/12, verified 48 visible useful list
items and no collision against the published 224-problem bank, then sealed both
review digests. CodeRabbit then caught that Orchid's family breakdown recorded
per-candidate probe counts under a family-total field. Orchid re-ran the exact
manifest and corrected the evidence to 192 agenda, 184 recommendation, and 228
reference probes; Editorial resealed the unchanged 12 accepted decisions
against the corrected review digest. The published batch digest is
`ab09371a1be1da653a879ac872e67e76297ae96ca4c57ea6d8823b164db6fc66`.
Publication raises Level 3 from 16 to 28 and the deterministic bank from 224 to
236 problems, with a 100/100/28/4/4 split.

### Issue #9 Level 4 executable-development-spec expansion

The twelfth schema-v2 batch adds 12 Level 4 development specifications in
three mechanically distinct retry families: interface feature specs, bug
investigations, and staged migration plans. Each family has four different
work scenarios, so a failed answer can transfer to new content without changing
the document anatomy being practiced. Together with the four original Level 4
seeds, the level now contains 16 problems across four retry families.

The design started with the existing five-section development-spec seed but did
not clone it with new nouns. Feature specs add a linked dependency and inline
code, a quoted constraint, ordered implementation, acceptance bullets, and a
closed fenced verification section. Bug investigations combine quoted evidence
and a divider with ordered reproduction, constraints, a fix plan, regression
acceptance, an open decision, and an inline-code verification checklist.
Migration plans use exactly three H3 stages with task lists, then rollback,
acceptance, an open decision, and fenced verification. A prototype test first
broke every check individually; heading-only outline predicates prevent a
generic message from shadowing the specific failure.

Nabi still grades only parsed Markdown structure. It does not compare heading
labels or prose, judge technical truth, or execute commands. A fenced code
block is checked for direct placement, a fence, and a language tag; even an
empty tagged fence remains Matched under the current engine contract. That
limit is frozen in the fixtures and stated in the generation brief instead of
calling the block executable proof. The 12 Goals are 128–184 words and use
visible, original, vendor-neutral workplace scenarios.

The first frozen manifest,
`76b8e20ef5e5a83f537edc94b41b9727effd7a3ef4d609ba2cfe520675978759`,
was not published. Separate editorial inspection stopped the review for three
learner-facing copy defects: one prompt exposed the internal phrase
“deterministic Markdown anatomy,” one open decision said a row position should
“return,” and one implementation step said to “finish” a browser download.
The two mechanical reviewers were interrupted before their stale records could
be accepted. The three sentences were rewritten, all derived candidates,
fixtures, verification records, and manifest bindings were regenerated, and
all reviews restarted with new run IDs.

Final manifest
`f4bf9a7241dbe6da2113c13fcaac21d5f5593988674cebaf21e4f2f5e6bcb9ab`
contains 12 candidates and 488 passing frozen fixtures. Atlas accepted 12/12
after replaying all fixtures and 180 fresh adversarial probes. Orchid
independently accepted 12/12 after all fixtures, 644 fresh probes, and 144
transfer or cross-family checks. The separate editorial rerun accepted 12/12,
then sealed only the two review digest values without reading reviewer files or
conclusions. The published batch digest is
`5e03747f907dd72e712db2e783d6b729d8381632be8a8d8cfe7fd8d7aa76d69d`.
Publication raises Level 4 from four to 16 and the deterministic bank from 236
to 248 problems, with a 100/100/28/16/4 split.

## 2026-07-19 — Issue #36 level identities and 4+2 turns

Hands-on testing exposed a scheduling defect rather than a missing bank: the
runtime had 248 accepted problems, but the old selector read consecutive
records from a bank grouped by syntax family. A learner could therefore receive
the same blockquote shape repeatedly even though other families existed.

Jiwon and Codex replaced the ambiguous guided/recall ladder with five exact
tasks: Learn the syntax, Rebuild real documents, Write for people, Write a
development spec, and Write an agent work order. The same identity now appears
at entry, in the exercise header, and at completion. Levels 1–2 rebuild a
rendered target; Levels 3–5 compose from a brief. The evaluator did not change:
it still grades only declared Markdown structure and ignores prose, case,
spelling, and punctuation.

The new turn policy is centralized. Levels 1–4 receive four chosen-level
problems followed by two next-level challenges. Chosen-level Hint starts open;
challenge Hint starts closed but can always be opened manually. Opening Hint is
not a failure and creates no remediation. Only an actual failed Check inserts a
same-skill, different-content repair, which can truthfully extend the displayed
turn from six to seven.

Low-level single-syntax scheduling now rotates deterministically by family.
Ordered and unordered lists have a mild frequency boost; inline code, links,
and images have a mild reduction; the remaining supported families use the
baseline. Scheduled neighbors cannot repeat a family, including across turn
boundaries, and no family appears more than twice in one turn. Composite Level
2 rebuilds are preferred and exempt from the single-family rule. Until Issue #9
publishes enough composite Level 2 content, accepted single-syntax records fill
the remaining slots.

The Level 5 bank contains only four unique accepted work orders. Rather than
duplicate two and pretend the turn contains six different tasks, the scheduler
returns four. It will reach six automatically when the bank has six. Accepted
batch files and review digests remain untouched; this issue changes runtime
classification and scheduling only. The session storage schema moved to v4 so
an old three-problem schedule cannot resume under the new contract.

The authenticated CodeRabbit CLI reached the remote connection phase but did
not return a review, so it was stopped rather than allowed to block delivery.
An independent Codex review found two Major selector boundaries: challenges
could repeat the preceding family, including across turns, and a tiny bank
could reuse one problem ID inside a turn. Both were reproduced with failing
tests. A shared turn context now carries the final family through all six slots
and into the next turn, while selected IDs are excluded and insufficient banks
degrade to their unique supply. The same reviewer confirmed both findings
closed with no new Critical or Major issue.

Final evidence: the complete repository check passed, including 8,014
unit/component tests, every immutable problem-bank gate, typechecking,
production build, and bundle inspection. All 12 Chromium journeys passed,
including keyboard-only completion, chosen-level versus challenge Hint rhythm,
truthful Level 5 scrolling, fixed `1280 × 800` chrome, and session restore.

### Post-merge review correction

PR #44 was merged while the GitHub CodeRabbit review still had an active
heartbeat. That was a workflow error: an active review must be allowed to
finish and its findings must be processed before merge. Codex and CodeRabbit
completed shortly afterward and left seven inline threads plus three related
nitpicks. Their overlap reduced to six implementation boundaries, all handled
in a dedicated follow-up rather than rewriting the earlier record.

The correction rotates the actual problem variant within each challenge
family, advances the four-item Level 5 bank between turns, caches deterministic
turn history, and rejects implausibly large untrusted run numbers before any
schedule reconstruction. High-level brief exercises no longer reveal the
canonical target after a failed Check. Session advancement now requires an
actual next problem or an explicit completion event, and a replaced problem
recomputes whether Hint should start open. The browser layout test now creates
a genuinely overflowing Goal before asserting internal scrolling.

The follow-up's complete repository check passed with 8,020 unit/component
tests, all immutable bank gates, typechecking, production build, and bundle
inspection. All 12 Chromium journeys also passed. The review policy is now
explicit: wait whenever CodeRabbit is actively reviewing; use an independent
Codex review as the fallback only when CodeRabbit has no heartbeat, returns no
response, or fails.

GitHub Codex then found one remaining same-family boundary in the follow-up:
Level 4's two Level 5 challenges advanced the family cursor by one record, so
consecutive turns shared one of the four work orders. A real failing regression
proved the overlap. The cursor now advances by the full two-slot offset, giving
the first two work orders to one turn and the other two to the next. GitHub
CodeRabbit could not review this PR because its explicit fair-usage response
deferred the next included review; it was not represented as active or complete.

## 2026-07-19 — Issue #37 verdict success sound

Jiwon wanted one refined success cue at the moment a correct verdict appears,
not UI noise on Check, Next, failure, or typing. Codex selected Kenney's
`confirmation_003.ogg`, recorded its CC0 source, and kept the asset behind one
native `Audio` controller so it remains replaceable without an audio library.
The preference is the one deliberate localStorage exception: learning progress
stays session-scoped, while an accessibility mute choice survives the visit.

Browser autoplay policy created the important engineering boundary. The first
pointer or keyboard gesture primes muted audio asynchronously; a verdict that
arrives during that promise is queued once, rejection leaves later gestures
free to retry, and muting stops and rewinds active playback. Success fires only
on a non-Matched to Matched transition, so React rerenders cannot replay it.

Codex review found duplicate transition playback, mute-during-playback,
premature asynchronous unlock, and a changing accessible toggle name. Each was
fixed and independently rechecked. GitHub CodeRabbit then completed its active
review, approved the PR, and suggested isolating singleton sound state between
tests; that valid nitpick was also fixed before merge. PR #46 merged only after
CI and CodeRabbit both passed.

## 2026-07-19 — Issue #38 game layer design and implementation

The results layer exposed a real product tension. D3 says remediation can make
six scheduled exercises become seven visible exercises, while a game score and
progress rail need a stable denominator. Nabi now treats those as different
facts: six scheduled markers remain the score slots, and `Repair practice`
shows the truthful expanded queue position such as `Exercise 2 of 7`. A
persisted scheduled cursor stays on the same marker during repair, so repeated
failure in that repair cannot deduct the scheduled score twice.

The elapsed clock persists one epoch start and one completion timestamp rather
than writing storage every second. React derives the display from those facts,
so background throttling and a same-session reload cannot reset the clock. The
progress document moved to schema v5 and now validates timing order, bounded
scheduled failures, known failed problem IDs, and deterministic run reachability.
As required by D7, incompatible earlier session records reset safely instead of
being migrated across browser sessions.

The new results screen leads with scheduled score and frozen time, keeps all
three replay actions, and groups authored teaching reminders by syntax family.
It never compares the learner's prose. `rankingClient` is asynchronous and
identity-free so Issue #41 can implement it later; the shipped local client
returns `Collecting data` and `Your time only` rather than fabricating a
percentile. No login, backend, PII, grading change, or editor-key change entered
this issue.

Independent Codex review found that the first repair implementation could move
a later scheduled problem forward instead of adding a separate exercise. That
made it possible to finish without practicing all six scored slots. The queue
now always inserts repair practice and preserves every scheduled occurrence;
the persisted-schedule validator also tracks the scheduled cursor through its
reachability graph instead of accepting an unrelated in-range value. Review
also led to clamping completion time against a backward wall-clock change and
announcing asynchronous standing updates to assistive technology.

After the initial #37 merge, Jiwon supplied the three final product cues and
rejected the temporary success sound on listening. Codex converted the WAV
masters to compact MP3 delivery assets, removed the temporary Kenney file, and
generalized the browser-safe controller to one interruptible channel for
Matched, Try again, and the turn summary. The existing persistent mute choice,
first-gesture unlock, rejected-playback retry, and duplicate-transition guards
remain in force.

## 2026-07-20 — Issue #9 code-block breadth and rebuild batch

Issue #9's refinement showed that a high problem count was still producing a
narrow low-level experience. Batch 014 therefore adds a new Level 1 syntax
family instead of another vocabulary-only variant: 12 short code-block lessons
and 12 Level 2 rebuilds across sample notes, quick references, and numbered
routines. The learner-facing copy calls the structure a `Code block`; it does
not require a language tag or teach programming. Matching checks only for a
nonempty, explicitly closed fenced block and the requested document anatomy.
Text, case, spelling, punctuation, and code meaning remain outside grading.

The first implementation exposed several real engine and scheduling defects.
CommonMark parses an unclosed opening fence through end of file, so the new
lesson uses an opt-in closed-fence check without changing legacy predicates.
Nested fences, CR-only line endings, raw NUL input, and a literal replacement
character required separate regression cases so visible content could be
recognized without accepting an invisible-only block. Level 2's stable seeded
selection also starved some variants; persistent per-family rotation now makes
all 12 rebuilds reachable while preserving retry-family separation.

The first final seal was not published. Separate editorial inspection found
that one Level 1 Goal and two Level 2 Goals reused their shared teaching
example. The examples were replaced with different documents, a regression now
requires every teaching example to differ from its Goal, all derived evidence
was deleted, and both independent mechanical reviews restarted from zero.

Final manifest
`2ea7c49635f0d3d5afe3298f795b5dfb439fda82198b2c2e8b4fce9c141948d9`
contains 24 accepted candidates and 620 frozen real-engine fixtures. The first
PR-head CodeRabbit review found that a NUL in the fence's info string could
incorrectly consume a literal replacement character from the visible body.
The bug was reproduced before the fix; 24 new edge fixtures now freeze that
boundary, and all mechanical and editorial evidence was regenerated again.
Atlas replayed every fixture plus 756 fresh probes; Orchid independently
replayed every fixture plus 744 fresh probes. Both proved all 12 Level 2 variants
reachable across 256 seeds with no adjacent-family, duplicate, or determinism
violation. The separate editorial rerun accepted 24/24. Publication raises the
deterministic bank from 272 to 296, split 124/124/28/16/4, and records fenced
code blocks as a CommonMark-compatible syntax family supported by Devpost
without claiming complete Markdown or GFM coverage. The exact published tree
passed 9,129 unit and component tests, every immutable batch and repository
gate, typechecking, the production build and bundle inspection, plus all 13
Chromium user journeys including keyboard-only completion through the new
Level 2 code-block challenges.

## 2026-07-20 — Issue #9 heading-depth pre-review freeze

Batch 015 freezes 24 new candidates without publishing them: 12 Level 1 ATX
heading-depth lessons and 12 Level 2 sectioned-document rebuilds. Heading depth
was chosen over indented code because Batch 014 had just expanded the code-block
family and the current engine already grades H2-H6 without a predicate change.
Paragraph and line-break lessons remain useful future breadth, but a line-break
contract would need new source-aware engine and scheduler work. Images remain
blocked on licensed local assets plus visual alt-text review. Heading depth
therefore adds uncovered CommonMark structure with the smallest engine risk.

The Level 1 matrix is exactly three H2, three H3, two H4, two H5, and two H6
lessons. It freezes current engine boundaries rather than tightening them:
zero-to-three leading spaces, tab or multiple-space separators, optional closing
ATX markers, and empty ATX headings Match. Four-space indentation, the wrong
depth, seven hashes, missing separator space, escaped or fullwidth hashes,
Setext H2, raw HTML, fenced-code lookalikes, and nested-only headings fail the
document-root contract. Level 2 freezes four process, four checklist, and four
message documents with exact block anatomy, unskipped heading hierarchy, and
nonempty list or quote structure. Prose, case, spelling, punctuation, and
semantic truth are not grading operands.

Issue #50 owns selection composition, entry choices, session/progress behavior,
and heading-flow E2E coverage. Batch 015 deliberately uses the existing
`heading-h1`, list, and blockquote skill classifications and does not edit any
path owned by Issue #50. No predicate, runtime AI call, network dependency, GFM
syntax, HTML lesson, image lesson, reviewer verdict, editorial verdict,
published summary, tracker projection, or runtime projection is part of this
freeze.

The frozen evidence contains 24 candidates and 419 fixtures: each H2 candidate
has 23, each H3-H6 candidate has 22, each process/checklist rebuild has 13, and
each message rebuild has 12. All 24 candidates pass their frozen fixtures
through the real learner engine. The prior runtime and tracker files remain
byte-identical at Git blob IDs
`bbd4941276f3e0f4d88fc5ca9ba3b7593f2f20f1` and
`6fc715d5a1f950c105e5f7c00dd4aba442101762`, preserving the published total of
296 and split 124/124/28/16/4 until unanimous review and editorial acceptance.

Frozen digests:

- generation prompt: `032fb250d21c38890ce246fd714cb5de97cab94f0b26b1113144f09d2e42fb41`
- raw candidates: `5573b1c77b542193cbb7f248923d3bbb6fed96fa16cdda103eaf09897d88b64e`
- normalized candidates: `10c36db41cdbf948ce4c46ceb8ac2d751ee4b9959a267d75253cbb9b041584d3`
- fixture artifact: `f42ec61fa6756b40080bcc0d910687817ee98b625a1a1d750b57ff99b50d7247`
- verification: `5613dff8c05e645108808a657b1fc9ec33fe66478778eabc1aa2b9a7d1aca5f5`
- engine contract: `79062e6a97de9f015e5d3be6d0d59abf0f2e78d160278500f2ba0e3e746e457b`
- review manifest: `10d64813601f53649d2feae357c84aac5eac2f88cebf6dbccaa55d99bd2bc9d2`
- prepared summary: `c5e80b9362278a1bd06d01a8a080c7efd8579bc07225a50e68fb482517aef5f3`

TDD began with
`npx vitest run src/content/batches/headingDepthBatch015.test.ts`, which failed
as expected because the Batch 015 modules did not exist. The focused green run
`npx vitest run src/content/batches/headingDepthBatch015.test.ts src/engine/structuralPredicates.test.ts src/content/validateProblemBankV2.test.ts`
passes 629 tests in three files. `npm run bank:batch:heading-depth-015:prepare`
then freezes the evidence, and
`npm run bank:batch:heading-depth-015:check` passes seven mechanical gate tests.
The final pre-review verification also runs `npm test`, `npm run typecheck`, and
`git diff --check` before commit.

Two pre-freeze integration drafts were rejected. The exact requested `tsx`
entry point initially exposed that the runner was not a declared dependency, so
`tsx` 4.22.4 was pinned before continuing. The first artifact draft also wrote
legacy optional heading `text` fields as explicit `undefined`; canonical JSON
correctly rejected those values, so the fields were omitted while tests still
assert their observable value is undefined. The artifacts above were generated
only after both corrections. Publication remains intentionally fail-closed at
`awaiting-independent-review`: zero reviewer verdict sets, no `editorial.json`,
no `summary.generated.json`, and a preserved 296-problem runtime bank.

The first editorial pass rejected the bake-sale checklist's `## Table box`
heading as unnatural and ambiguous US English. That draft's manifest
`b5877a9687312217ec65b0b8238f722ec697cc73c4dafd6fc3f5af10644cf9b4`
and both independent review seals were invalidated before editing. The
authoritative target now says `## Table supplies`; a regression test failed on
the rejected wording before the source fix. Both reviewer JSON files and the
editorial verdict were deleted, the complete pre-review artifact set was
regenerated, and review restarts from zero against manifest
`10d64813601f53649d2feae357c84aac5eac2f88cebf6dbccaa55d99bd2bc9d2`.
The engine contract remained byte-identical because no engine code changed.

The repaired review cycle then completed unanimously against manifest
`10d64813601f53649d2feae357c84aac5eac2f88cebf6dbccaa55d99bd2bc9d2`.
Atlas (`reviewer-atlas-batch015`, run
`atlas-batch015-10d64813-repaired-002`) replayed all 419 fixtures, added 336
fresh probes, and accepted 24/24 with review digest
`55e82627be8a1d5f52e0889fdaf161e126ffada0fda95b641213ec3ce9b0d96a`.
Orchid (`codex-orchid-batch015`, run
`orchid-batch015-10d64813-repaired-mechanical-002`) independently replayed all
419 fixtures, added 504 fresh probes, and accepted 24/24 with review digest
`4b401f943109ee50e917c6414ae788bceb1a7aefc2af6aa90335299ce82fb8a3`.
The separate `codex-editorial-batch015` actor accepted 24/24 in run
`editorial-batch015-10d64813-repaired-2026-07-20-002`, sealed by editorial
digest `ee3297b5ad774bcb26fb340cab326a8f1d13555a287180b0a516346676e9ce60`.

`npm run bank:batch:heading-depth-015:publish` compiled all 24 accepted records
and raised the deterministic bank from 296 to 320, split 136/136/28/16/4.
The published family counts include 44 `headings` and 12
`rebuild-sectioned-documents`. Final publication digests are batch
`a76ba73b923a0e6706e1cc817bd6a80efa4ed8df1e2a14f81b67fe6fd65fe02e`,
bank `3864f5233e3f521f952c8f05359bb3936df33ff1688bdbdd40bbbcf37b1e8d07`,
runtime projection
`9230750169a6732a83d4f582d942048ea73852d554b891a45770f439766e3295`,
tracker `61d4338103e8812b7a1222f1e0b38c9526d39cd84a5a0aef3da2946a6c50c293`,
and summary `0a470abf6094f9980564421be5b224d6bef3a2e54b34310f4ca0fd92d074d79d`.

Publication testing caught one expected integration update and one authored
test defect. Before Batch 015 fixtures joined the runtime-bank fixture list,
`src/content/problemBank.test.ts` failed one of five tests with 216 missing
fixture/check errors; adding the frozen Batch 015 fixtures made it pass 5/5.
The first `npm run check` then failed one assertion out of 9,555 because Batch
015's collision test compared the now-published batch against itself. The test
was corrected to filter its own `sourceBatchId`, preserving its intended
comparison against the prior 296-problem bank; the focused pair then passed
431/431. The rerun of `npm run check` passed typechecking, 18/18 pipeline tests,
93/93 immutable batch-gate tests, 3/3 repository-gate tests, 9,555/9,555 unit
and component tests, the legacy bank gate, a 222-module production build, and
bundle inspection excluding four fixture-only sentinels from the single
JavaScript asset. `npm run test:e2e` passed all 13 Chromium journeys. No path
owned by Issue #50 changed, and the 512-problem closing target remains open.

## 2026-07-20 — Issue #9 nested-list document pre-review freeze

Batch 016 freezes 12 Level 2 document rebuilds without publishing them. The
next uncovered basic family considered was paragraph separation, but Level 1
cannot schedule a paragraph-only family without editing Issue #50-owned
taxonomy and selection paths. That breadth remains deferred. Nested lists are
reachable through the existing Level 2 composite path and reuse the current
AST predicates, so this batch adds four nested checklists, four nested outlines,
and four nested step documents without changing runtime verdict semantics.

The syntax scope incorporates all four references named in Issue #9's
2026-07-19 refinement:

- <https://daringfireball.net/projects/markdown/basics>
- <https://daringfireball.net/projects/markdown/syntax>
- <https://www.markdownguide.org/basic-syntax/>
- <https://markdown.kr/guide.php>

Those sources define syntax scope only; vocabulary was authored locally and
was not crawled. Each candidate requires an exact root block sequence, at least
two nonempty items in one root list, and exactly two recursive list nodes. The
root ordered or unordered kind is binding, while the descendant marker kind is
deliberately unconstrained. Teaching therefore says to "nest one list inside
another" and does not claim that the child marker must match its parent.
Wording, capitalization, spelling, punctuation, and semantic truth remain
outside grading.

The repaired immutable fixture set contains 252 real-engine cases, exactly 21 per
candidate. It freezes canonical, different-prose, case/spelling, alternative
indentation, alternative root markers, and mixed child-marker matches. It also
rejects flat lists, insufficient indentation, sibling root lists, a third list
depth, missing or undersized root lists, wrong root order, extra root blocks,
fenced and indented code lookalikes, blockquote-only nested lists, and extra
blockquotes, headings, dividers, or code blocks inside the root list. The
prior runtime and tracker remain byte-identical at Git blob IDs
`03e2513cc351ac0cffe0851e0f519a1b568a884a` and
`e8c0746933ef88348334c6e2326ddb6e8ad1c72a`, preserving 320 published
problems split 136/136/28/16/4. Unanimous review would publish 332 split
136/148/28/16/4, with 12 in `rebuild-nested-list-documents`.

Frozen digests:

- generation prompt: `cc89729c9614ce13eb526d1f18190d9de3c1646ccfb7db08d6a0b788e293811f`
- raw candidates: `429cdf2855c0f70ce73bcf222e274ddfbb23788cbc54303415393350e4598e69`
- normalized candidates: `5846144d1392857634c58fb4b231a2a0253f76d7826066a5e7c03be7fa6920b6`
- fixture artifact: `3dc50ed957ac798679e690ae819b4cd861c524ff49747e94731975dce6019698`
- verification: `7a064ab2b795c836460591b8929b57d433584c60e7aedc97b94296c03142e94f`
- engine contract: `79062e6a97de9f015e5d3be6d0d59abf0f2e78d160278500f2ba0e3e746e457b`
- review manifest: `56d69a26f0977a54f4c27a6d501a364c6ae5e9ed270d1ce9b99ff5de367dc382`
- prepared summary: `511635520043981162e6970b234ca7f604f9078cd68d16a0a88f8ca6fb66bf56`

TDD began with
`npx vitest run src/content/batches/nestedListBatch016.test.ts`, which failed
because both authored modules did not exist. The artifact gate then failed
until the Batch 016 support module, package aliases, gate configuration, and
pre-review artifacts existed. A learner-facing copy test separately rejected
the article-less `Rebuild nested ...` titles; the final titles use natural
`Rebuild a nested ...` phrasing. The focused content, structural-predicate, and
schema-v2 run passes 459 tests in three files. The Batch 016 gate passes seven
tests, `npm test` passes 9,811 unit and component tests in 51 files,
`npm run typecheck` passes, and `git diff --check` is clean.

Two draft artifact sets were discarded before this immutable freeze. The first
did not yet carry the refinement's four source links. The second preceded the
test-first title copy edit and one fixture prose cleanup. No independent review
had started, so neither draft produced a reviewer or editorial seal. The final
directory contains zero reviewer verdict sets, no `editorial.json`, no
`summary.generated.json`, and remains fail-closed at
`awaiting-independent-review`. No Issue #50-owned path, engine predicate,
runtime AI call, network dependency, GFM extension, image lesson, or vocabulary
crawler is part of this freeze.

The first committed freeze at `05403c9` did not pass its task review. Its
manifest
`952a1c4c73493ac93c6389a04226589c56172ed760accd6efa8ff1805c824326`
contained the ungrammatical steps-family title `Rebuild a nested steps`. It
also allowed a learner to insert a blockquote, heading, thematic break, or code
block inside the root list while retaining the required root anatomy and list
count. Exact family-title assertions now require `Rebuild a nested step list`.
Four root-list-scoped recursive `block-count` checks, each with `max: 0` and a
distinct priority and feedback ID, close the structural hole using only the
existing engine. Forty-eight new real-engine fixtures exercise every new
failure ID across all 12 candidates.

No independent or editorial review had begun, so the complete generated
artifact set was deleted and rebuilt from zero. The repaired manifest
`56d69a26f0977a54f4c27a6d501a364c6ae5e9ed270d1ce9b99ff5de367dc382`
supersedes the rejected freeze; the engine contract remains unchanged.

## 2026-07-20 — Batch 016 invisible-list repair and evidence invalidation

The final whole-branch review rejected published commit `412293a`: every
Batch 016 problem accepted a list item whose only content was an HTML comment,
even though that item renders as blank. Publication was undone with normal
revert commit `760522c`, preserving the audit trail and returning the runtime
bank and tracker to 320 accepted problems split 136/136/28/16/4.

The deterministic list-shape engine now has two optional, backwards-compatible
capabilities. `descendantsOnly` limits a recursive shape check to nested lists,
and `requireVisibleItems` requires every selected list item to contain
meaningful visible text, inline code, or image alternative text. HTML comments,
definitions, dividers, breaks, whitespace, control characters, and default-
ignorable characters do not satisfy the latter. Both flags default off, and a
regression test records the legacy `requireNonemptyItems` behavior unchanged.

Batch 016 opts its root lists into visible-item grading and adds a separate
`nested-*-visible-child-items` check for the one descendant list. The frozen
matrix now contains 288 real-engine fixtures, 24 per candidate: 12 invisible
root-item cases plus 24 child-list cases covering HTML-comment-only and zero-
width-only items. Every new child fixture is bound to the exact new feedback
ID. The previous Atlas and Orchid seals, editorial verdict, publication
summary, and all digest-bound generated evidence were invalidated. The complete
pre-review set was rebuilt with zero reviewer seals, no editorial verdict, no
publication summary, and status `awaiting-independent-review`.

Repaired pre-review digests:

- generation prompt: `c7c9f6549d7bfcfdf6f47aca404b967193107cbf9f35a930dced890c47d29ebe`
- raw candidates: `1d627ca5bf87c7af496c59269df6f841b3ecf905a98a85aa84be424a61187dce`
- normalized candidates: `bb9ee6041bc589605da1403eed4f118e9130b453dd3a78ffe350ee0444722b6a`
- fixture artifact: `d3b34303d78fac93c14c4f7fbe482ff9831cc375cb27c3417e5d064271aa5d52`
- verification: `699750999c4effd3ebcef365ed65e8128b1112827dc7bb03fd74ce6ddc59c012`
- engine contract: `3a5da05c423920dc24290864cfde3c913f5ba40c9bf164322aebf7f5b1de20ea`
- review manifest: `335e8819e130afe6cdf86460e2fdb5d2a51ee20118a843404f34b6e70b895a07`
- prepared summary: `d9556cb7fd4f4bcce3bae0ae0b030df274da36833d90ae0d2b74d5843a1b3480`

TDD first reproduced the hole in the structural predicate and schema validator
tests. The repaired focused run passes 509/509 tests. The Batch 016 gate passes
7/7, the full unit and component suite passes 9,861/9,861 in 51 files,
`npm run typecheck` passes, and `git diff --check` is clean. No Issue #50-owned
path changed. Independent mechanical and editorial review must restart against
the new manifest before Batch 016 can be published again.

A second P2 review on `a81a2ef` found one parser-boundary case: CommonMark
replaces a raw U+0000 with U+FFFD in the AST, so the first visibility repair
mistook a NUL-only item for a literal visible replacement character. The
source-aware repair now removes only as many parsed replacement characters as
raw NULs occur in that node's source. A literal U+FFFD remains visible, and a
raw NUL mixed with visible content remains valid. The same helper now backs
code-block content without changing its established behavior; inline code
retains its established source-aware path, and image alternatives now isolate
their raw label source before applying the same NUL accounting.

Twelve NUL-only descendant fixtures bring the immutable matrix to 300 cases,
25 per candidate, each bound to the exact `nested-*-visible-child-items`
feedback ID. Regenerated evidence remains fail-closed at 320 accepted problems
with zero reviewer seals, no editorial verdict, and no publication summary.
The superseding digests are fixture artifact
`779f264d6b5febdf492467b2545fcdb5398101c127030a205fcc8f090d04ea31`,
verification
`7c2de8b4ea90d06d37e29f9766aa3fab00b6a2b7fc5977fc8376cdfa7bd0b0ca`,
engine contract
`f3060a62eefbbb46f8711a36c3c6947332eecce061940855f70ced3bdfa6c8a9`,
manifest
`4953c83fbe12669e8f73b0f247ee60023b438152e54f0bfe72ed06f206143457`,
and prepared summary
`e085b601e23501ee7193a1e8d5c9db7e4937c14d0720d247c27a426798801871`.
The focused run passes 524/524, the Batch 016 gate passes 7/7, the full suite
passes 9,876/9,876 in 51 files, typechecking passes, and `git diff --check` is
clean. No Issue #50-owned path changed.

The fresh repair review cycle completed unanimously against manifest
`4953c83fbe12669e8f73b0f247ee60023b438152e54f0bfe72ed06f206143457`
and engine contract
`f3060a62eefbbb46f8711a36c3c6947332eecce061940855f70ced3bdfa6c8a9`.
Atlas (`reviewer-atlas-batch016`, run
`atlas-batch016-4953c83f-repaired-001`) replayed all 300 frozen fixtures,
added 456 fresh probes, and accepted 12/12 with review digest
`eb8d7dcd354433b7f8ba194913b5d8970e37f3067be1a2b6c3b521422a996e6f`.
Orchid (`codex-orchid-batch016-repaired-engine`, run
`orchid-batch016-4953c83f-engine-repair-mechanical-001`) independently
replayed the frozen matrix, added 972 fresh probes, and accepted 12/12 with
review digest
`bada6ccb246f35f916440bc60836d1673db8a1c96d25892eaa27a3719ac60128`.
The separate `codex-editorial-batch016-repaired-engine` actor accepted 12/12
in run `editorial-batch016-4953c83f-repaired-engine-2026-07-20-002`, sealed by
editorial digest
`f7f36693ef6baab7469c0fba49e3e3e9c045284cb61fc604ac22f6e2d4e8110e`.

This is the replacement publication, not a continuation of the rejected
evidence. Whole-branch review rejected the original `412293a` publication;
`760522c` reverted it, `a81a2ef` added visible root/child grading,
`b88cc37` corrected raw-NUL parsing, and `7942de2` committed only fresh review
seals for the repaired engine and manifest. No digest or verdict from the
rejected publication is used by the replacement.

Running `npm run bank:batch:nested-list-016:publish` twice produced identical
artifacts and raised the deterministic bank from 320 to 332, split
136/148/28/16/4, with 12 `rebuild-nested-list-documents` problems. Final
publication digests are batch
`ba0fa8ceb1cff2a79871aaf66cc35dddcd721933834be2beee4672061045d1d6`,
bank `b9ad420505055ab2e061e229ef2410574dd0ac1e7dcf81a8803224777aaeb65f`,
runtime projection
`132ea134d89f06c45156dc2a34c251a9c068c10650f4080fa800ab3189eb7508`,
tracker `1fddd8fc64685c1461d6c41ea68f23880a58c5080f0ab91d591b1dbcd3f38f39`,
and summary
`0da0618d85b98fdad2cc67703e9e8d4f4da5af0ce144b3f284427139b18b553f`.

Publication testing first failed at the three expected integration points: the
runtime-bank test still asserted 320, omitted the Batch 016 fixtures, and the
batch-local collision test compared the now-published records against itself.
The count and split assertions now read 332 and 136/148/28/16/4, all 300
fixtures join the published-bank contract, and collision checking excludes
only this exact source batch. The targeted publication and engine run then
passed 513/513.

The pre-review `npm run check` passed typechecking, 18/18 pipeline tests, 100/100
immutable batch-gate tests, 3/3 repository-gate tests, 9,876/9,876 unit and
component tests, the legacy bank gate, a 222-module production build, and
bundle inspection excluding four fixture-only sentinels. Local Chromium E2E
passed all 13 user journeys. No Issue #50-owned path changed.

GitHub CodeRabbit then requested two valid lifecycle guards. The validator now
rejects `descendantsOnly: true` unless `recursive: true`, so an author receives
an immediate schema error instead of creating an unwinnable list check. The
generic `bank:batch:generate` alias is now permanently read-only and runs the
state-aware all-batch validation; only an explicitly named unsealed batch
command may write authored evidence. A repository gate prevents that alias
from drifting back to a sealed batch. GitHub Codex found no major issue on the
reviewed head. After these review fixes, `npm run check` passes 9,877/9,877
unit and component tests, 100/100 immutable batch gates, and 4/4 repository
gates with the same 222-module production build.

The tracker-backed documentation now reports 332 without claiming the closing
target. Another 168 accepted problems are required to reach the public
500-problem floor, and 180 are required to reach the internal 512-problem
closing target. Paragraph separation and image lessons remain deferred under
their recorded constraints; publication did not weaken those stop conditions.

## 2026-07-20 — Issue #9 advanced-document Batch 017 checkpoint

Batch 017 adds exactly two Level 3 operational-impact briefs, four Level 4
integration-contract specs, and six Level 5 agent work orders. The Level 5
set is divided into evidence recovery, bounded refactoring, and coordinated
rollout, with two transfer variants in each retry family. The 12 Goals use
fictional contemporary US workplace contexts and existing Standard Markdown
predicates only; learner prose, capitalization, spelling, punctuation, and
domain truth remain outside grading.

Pre-review editorial inspection restarted the immutable cycle twice before
approval. The first restart capitalized the rendered H1 examples while
retaining case-insensitive learner grading. The second removed repeated
teaching examples within retry families. The final frozen scope is commit
`172e932`, manifest
`f64697d77c17af5189daecbdd4166b9fc72602186c1226079579730f3ce8a030`,
engine contract
`f3060a62eefbbb46f8711a36c3c6947332eecce061940855f70ced3bdfa6c8a9`,
normalized artifact
`056e4191a3bbbb4e6b56ac9bb3f6cb02c8b87d58b817bf9730765bbcbee75e0e`,
fixture artifact
`5f1fdd81fa090c183f03ca19965e795e3c10f4c7540d35da1c0bbe62837782a1`,
and verification
`2d1b18c5fb8c80c8afa7ddb28620a7cbb1fcda3757efbaacae19d102e70fcbf6`.

Atlas replayed 238/238 frozen fixtures, covered 166/166 direct checks, passed
348/348 fresh probes, and found no collision against the published 332; review
digest
`6704c98539a7ed629194b3c175dfd34ebdddc6c541968de18f3c24059ceec7bf`.
Orchid independently replayed 238/238, covered 166/166 direct checks, passed
216/216 fresh probes, and found the same zero-collision result; review digest
`78ef4aa276c13f7819920e5ddc03fa8f4725f5eebcc17ff9c1695210acf25297`.
Both explicitly checked teaching-example uniqueness. The separate
`codex-editorial-batch017` actor accepted 12/12 for level fit, vocabulary,
ambiguity, Goal quality, duplication, licensing, standard flavor, and the
no-runtime-AI boundary; editorial digest
`061f3be56e4bbb1eb760b7a1522a5e017f9cc0d8388e2883c2f411e278c67ed8`.

Publishing raised the deterministic bank from 332 to the intermediate
344-problem checkpoint, split 136/148/30/20/10. Advanced family totals are now
30 readable human documents, 20 executable development specs, and 10
agent-ready work orders. Publication digests are batch
`7824a8848edf2254faae4a68887dfcb780b875dbe7db70546a544fcd1793df50`,
bank `3b30540b1ef31e9b908f7c91c614649dcd11d5eefacbcfa764cd899c76ecf0cc`,
runtime projection
`417c3e6987ef1bce22ebb912a5c923c8d1f13ec172d1c6e94ba948109e3f50a9`,
and tracker
`123924a5fb466deadb0ebf032fce62d2a46e5ea7b922e5d4a149f54e1932a161`.
Issue #9 remains open: this PR uses `Refs #9`, preserves the 512 target and
completion floors, and intentionally leaves later Level 5 expansion available.

### Batch 017 brevity repair and evidence invalidation

Developer playtesting rejected the first publication candidate as too much
workplace reading for a Markdown lesson. Its Level 4 lists commonly contained
four items, while the Level 5 work orders stretched to 84–93 lines and roughly
2,300–2,500 source characters. Those records were structurally valid, but the
extra policy, comprehension, and reporting detail taught document operations
rather than additional Markdown.

The replacement contract caps Level 4 at 28–40 lines and 95–165 words, and
Level 5 at 40–65 lines and 150–230 words. Every Level 4–5 list contains two or
three short items. Recovery orders now use eight H2 sections, refactor orders
seven, and rollout orders seven; each retains three H3 stages and the distinct
Markdown devices that define its family. Grammar-only grading remains
unchanged.

The prior Atlas and Orchid reviews, editorial verdict, publication summary,
and manifest are historical evidence only and cannot authorize the replacement
content. They were removed from the active artifact set before regeneration.
The repository-local `authoring-nabimd-problem-banks` skill now captures the
same brevity budgets, fixture protocol, grammar boundary, and immutable review
lifecycle for future “Level X” problem-bank requests. Pressure tests before
and after the skill showed the intended correction: without it, agents proposed
four- and five-item lists and 80-line work orders; with it, they held Level 4
and Level 5 to the compact budgets and explicitly refused realism inflation.

The replacement freeze contains 228 real-engine fixtures for 12 candidates.
Level 4 Goals are exactly 40 lines and 128–135 words; Level 5 Goals are
59–65 lines and 186–223 words. The active manifest is
`212139fb20e45aaeb7b114b199bbe4b757484c4952962250bc7d65b262cfbbc4`,
normalized artifact
`3e7eb537e69e3f511a29182e1b7d6c33d20826f2eb45e1033f00f4ab7463fdb1`,
verification
`bd268af56bef57b82f5902b81e28d271dfac1676e11eab8ba7ca6eb3530bf84a`,
and prepared summary
`68d30b086951ff1f500722e97df11dfa072e73d67c4a553f8c0bb3f7c5a83303`.
The engine contract remains unchanged. Runtime projections and tracker are
restored to the prior 332-problem checkpoint until two new mechanical reviews
and one new editorial review accept this exact freeze.

The first replacement Atlas run correctly refused to seal commit `8a6a0af`.
Although all 228 frozen fixtures, 156 direct checks, 328 fresh probes, the
Batch 017 gate, focused regressions, and typechecking passed, three integration
tests still asserted the rejected publication's post-344 state while runtime
and tracker were intentionally fail-closed at 332. The pre-publication tests
now assert the truthful 332 split and four-problem Level 5 turn; advanced-family
assertions follow the tracker so they remain valid on both sides of publication.
No candidate, fixture, prompt, engine contract, verification, or manifest
changed. Because the reviewed HEAD changed, both independent mechanical runs
still restart from zero and no verdict from the blocked run is reusable.

The independent Orchid run also refused to seal `8a6a0af`. Five Level 5 Goals
displayed `AGENTS.md` as inline code in authority lists even though those
spans were outside each family's inline-code matcher scope. Removing only the
backticks still Matched, so the decoration violated the authoring rule that
every visible Markdown device must be a practiced decision. Those five file
names are now plain text; the checked inline-code spans in scope and
verification sections remain. This candidate mutation invalidates the prior
manifest and requires complete artifact regeneration plus both mechanical and
editorial reviews from zero.

The superseding pre-review freeze keeps the same 228-fixture matrix and exact
brevity budgets. Its manifest is
`f739f876963fb9177328e1c966f91e5037fc7ff07db300010d0b14fadce97549`,
normalized artifact
`8487123bf006e8ad424329021e0f825c1a2d908c9fea391c4034492679d9380e`,
verification
`ccc887bd6446abb380c52c3f847e10dd0c5fd7a9bb64401762840671f51677e8`,
and prepared summary
`f0e475918332bbb704f4a47bad0c8c5163b223d15d2392615180cf23c3d83415`.
The Batch 017 gate passes 7/7, the complete unit and component suite passes
9,885/9,885 in 52 files, typechecking passes, and `git diff --check` is clean.
The runtime bank remains fail-closed at 332 pending fresh reviews.

Both replacement mechanical reviews accepted the exact `f739f876…`
manifest. Atlas replayed 228/228 frozen fixtures, covered 156/156 direct
checks, passed 328/328 fresh probes, and found zero collisions against the
published 332; review digest
`86ef5a2c8fdcac098be78d4bc1c50ad81fa398de1f9e9550697504b9318d2c98`.
Orchid independently replayed the same freeze, passed 208 behavioral probes,
and then removed each of 430 visible Markdown devices one at a time; all 430
mutations failed in the intended scope. Its combined 638-probe review digest
is `e3b1154510e018143545e598916a27de836fa9ec170d41cb0b224ce014225bf1`.
Both runs passed the complete 9,885-test pre-publication suite, typechecking,
the focused gate, brevity/list limits, deterministic evidence, and collision
checks. Publication remains blocked pending a separate editorial review.

The separate `codex-editorial-batch017-compact` actor then accepted all 12
candidates against the same manifest and both mechanical review digests. It
explicitly checked level fit, US-English clarity, ambiguity, uniqueness,
licensing, flavor, the no-runtime-AI boundary, visible-syntax purpose, and the
new “Markdown typing, not company-document reading” contract. Editorial run
`editorial-batch017-f739f876-compact-2026-07-20-002` is sealed by digest
`88ed632a0709e48707ae70fc16822b6844ef1e341e5943484b4b9e6412befac2`.

Publishing the accepted replacement twice produced identical artifacts and
raised the runtime bank from 332 to the intermediate 344 checkpoint, split
`136/148/30/20/10`. Replacement publication digests are batch
`ec3826cb3206a4b72fcced2e940714d27e7dec964ecb70e917c11f7a8ccf18dc`,
bank `be6a660939c623b5d9db2ac38f034c83d86b72f5db6ff5cec1b28503aa5d1dc6`,
runtime projection
`89c098f3d79ee963fe5696d2d247585e784ce1a40c1b576c2766010440f29f44`,
tracker `9c0b9d7daa121d484456249461631dcf947e7e75069a0894e5aa0bc436bb8686`,
and summary `011d9526bd5712ae135df1378c2d50328e23627883f8cad7897c9246f6862403`.

The final `npm run check` passes typechecking, 18/18 pipeline tests, every
immutable batch gate, 4/4 repository gates, 9,885/9,885 unit and component
tests, the compiled-bank gate, a 222-module production build, and bundle
inspection. Local Chromium E2E passes all 13 learner journeys, including every
level opening a six-problem turn and a long Level 5 answer scrolling inside
the editor. Issue #9 remains open and this replacement still uses `Refs #9`.

## 2026-07-20 — Issue #40 keyboard contract

The editor now supports readline movement without replacing CodeMirror's
platform defaults. Linux and Windows receive `Ctrl+A/E` for line boundaries
and `Ctrl+B/F` for character motion; macOS keeps CodeMirror's equivalent
native bindings. Every platform adds `Alt+B/F` word motion, while the audited
default `Mod+Home/End` bindings continue to own document start/end. Real
macOS testing exposed that Option-key layouts may report `Option+B/F` as
`∫/ƒ`; a physical-key-code fallback now preserves the requested movement
without intercepting plain characters or unrelated modifier combinations.

Check and Next now derive from one shortcut table. `Ctrl+Enter` works
everywhere, `Cmd+Enter` is added on macOS, and `Shift+Enter` is added on
Windows. The same table produces the CodeMirror bindings, DOM-event matcher,
visible label, and `aria-keyshortcuts`, so the two actions cannot drift. Bare
Space and Enter no longer activate the focused Next button; they remain
ordinary editor and IME keys.

The first Chromium run uncovered an event-ownership race: an editor Check
could render Matched and install a document-level Next listener before that
same keydown finished bubbling, so one press performed both transitions. The
global listener was removed. Matched still focuses Next, and that focused
button alone owns the second action shortcut. This makes one key press equal
one state transition and restores editor focus after the next problem opens.

Final verification passes `npm run check`, including 9,890/9,890 unit and
component tests, all immutable problem-bank gates, typechecking, the
223-module production build, and bundle inspection. Chromium passes all 13
learner journeys. A separate in-app macOS browser run verified Command-Enter
Check, Control-Enter Next, non-advancing Space/Enter, every caret motion,
visible platform labels, an empty error console, and an unobstructed rendered
exercise screen.

The independent Codex review then found two boundary cases that the initial
happy-path tests missed. A held action shortcut could emit repeated keydowns
after Next had focused the new editor, immediately checking its empty draft.
Also, movement commands returned `false` when the caret was already at a
boundary, allowing CodeMirror or the browser to reinterpret the same key; on
some paths `Ctrl+A` could select all or `Option+F` could insert `ƒ`. The editor
now consumes recognized repeated action keys without running them and owns
every declared caret shortcut even when no movement is possible. Tests dispatch
real boundary key events and replay a repeated Check/Next event after the next
problem mounts. The post-review gate passes 9,892/9,892 tests and the same 13
Chromium learner journeys.

## 2026-07-20 — Issue #39 prose-first answer sheets

Playtesting had exposed a mismatch between Nabi's grammar-only promise and its
blank answer sheet: beginner exercises already showed the finished prose in
Goal, but still asked the learner to retype every word before practicing the
Markdown marks. Level 1 and Level 2 now start with that visible prose and its
line breaks in `answer.md`. Levels 3–5 remain blank because they compose from a
brief and have no fixed target to strip. A saved learner draft always wins over
the starter, and the evaluator still ignores prose differences.

The first implementation fork was whether to rewrite all 284 accepted Level
1–2 records. That would have changed review-bound batch digests for a runtime
presentation behavior. Instead, one adapter hydrates `starterText` when the
accepted projections enter the app. A pure mdast serializer removes headings,
list markers, quote markers, emphasis delimiters, link destinations, dividers,
and code fences while preserving visible text, code bodies, image alt text, and
block boundaries. It also removes zero-width characters and normalizes Unicode
spaces without adding a dependency. Generated projections, candidates,
fixtures, manifests, and review evidence remain byte-for-byte unchanged.

Browser verification exposed three test-assumption problems rather than
product defects. CodeMirror renders each source line in a separate `.cm-line`,
so parent `textContent` hid line breaks; the E2E reader now rebuilds the source
from those lines. Reloading `/` correctly restored the active session instead
of returning to the level picker, so cross-level checks now clear only the
progress record while preserving the deterministic session seed. Finally, an
empty Level 3 editor exposes `Type Markdown…` as a DOM placeholder, not source;
the assertion now distinguishes the placeholder from the document value.

Final verification passes `npm run check`: typechecking, 18/18 pipeline tests,
every immutable batch and repository gate, 9,900/9,900 unit and component
tests, the compiled-bank gate, a 224-module production build, and bundle
inspection. Chromium passes all 14 learner journeys, including Level 1–2
pre-seeding, Invisibles source preservation, Level 3 blank composition,
session draft persistence, keyboard completion, and the 1280×800 layout.
