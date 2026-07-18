# OpenAI Build Week Submission Checklist

Official sources take priority over this file:

- [Official Rules](https://openai.devpost.com/rules)
- [FAQ](https://openai.devpost.com/details/faqs)
- [Resources](https://openai.devpost.com/resources)

Internal target: submit by **2026-07-22 06:00 KST**, three hours before the
official deadline.

## Registration and project

- [x] Join OpenAI Build Week on Devpost
- [x] Select the Education track and create a draft
- [x] Connect the optional Devpost Hackathons Plugin
- [x] Create a public repository with a relevant license
- [x] Approve the written application design and learning-state contract
- [x] Complete and deploy the heading vertical MVP
- [x] Complete a working, non-trivial project built with Codex and GPT-5.6
- [x] Publish a free, unrestricted test URL
- [ ] Keep the test URL available through judging and winner verification

## Primary Codex thread

- [x] Designate the current core-build Codex thread as primary
- [x] Build the majority of core functionality in that thread
- [ ] Run `/feedback` in that thread after core implementation
- [ ] Copy the generated Session ID into the Devpost submission form
- [x] Explain significant secondary Codex threads in the README if any

No significant secondary Codex thread was used for the core build. The README
states that the majority of the project was completed in one primary task.

The Session ID is submitted through Devpost. It does not replace the public
commit history, tests, build log, README explanation, or working demo.

## README final audit

- [x] Setup instructions match a clean checkout
- [x] Sample data or fallback content is included where needed
- [x] Run and test commands are exact and verified
- [x] Public demo link works without an account
- [x] `How we built it` names specific Codex contributions
- [x] Human product, engineering, and design decisions are explicit
- [ ] GPT-5.6's curriculum-production role is concrete, meaningful, and backed
      by repository artifacts
- [x] Challenges describe real failures and resolutions
- [x] Accomplishments are backed by tests or a runnable demo
- [x] Unsupported Markdown syntax is stated honestly
- [x] Open-source dependencies and pre-existing work are disclosed

## Repository and testing

- [x] Typecheck passes
- [x] Unit and grading fixtures pass
- [x] Every problem has canonical, alternate, fail, matched, and perfect fixtures
- [x] A failed retry selects different content for the same skill
- [x] Production build passes
- [x] Clean-browser critical path passes
- [x] The learner path has no runtime dependency on an AI service
- [x] No API key, private token, personal data, or secret appears in the repo
- [x] License and trademark notices are present

## Video and Devpost

- [ ] English public YouTube video is no longer than three minutes
- [ ] Video has voiceover
- [ ] Video shows the working product clearly
- [ ] Voiceover explains what was built
- [ ] Voiceover explains the specific Codex workflow and key decisions
- [ ] Voiceover explains the specific GPT-5.6 curriculum work and what shipped
      because of it
- [ ] Submission text, images, video, README, and live build agree
- [ ] Run the plugin's `$prepare-submission` workflow if available
- [ ] Verify every field manually on the Devpost website
- [ ] Submit by the internal deadline and preserve confirmation evidence
