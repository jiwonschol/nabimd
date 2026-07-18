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
