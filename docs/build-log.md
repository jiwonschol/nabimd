# Nabi Markdown Build Log

This log records what actually happened during OpenAI Build Week. It is not a
marketing timeline. Entries distinguish Jiwon's product decisions, Codex's
contribution, and the evidence used to verify the result.

## Evidence policy

- Record problems when they happen; do not reconstruct them at submission.
- Do not claim a feature before a test or runnable demonstration exists.
- Record rejected Codex suggestions when they changed the final result.
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

## Next entry

The next entry must cover the first vertical slice: what was attempted, which
grading case failed first, how Codex helped investigate it, what Jiwon chose,
and the test or browser evidence that closed it.
