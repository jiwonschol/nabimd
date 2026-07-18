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

## Next entry

The next entry must cover the first vertical slice: what was attempted, which
grading case failed first, how Codex helped investigate it, what Jiwon chose,
and the test or browser evidence that closed it.
