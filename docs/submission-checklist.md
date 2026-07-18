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
- [ ] Complete a working, non-trivial project built with Codex and GPT-5.6
- [ ] Publish a free, unrestricted test URL
- [ ] Keep the test URL available through judging and winner verification

## Primary Codex thread

- [x] Designate the current core-build Codex thread as primary
- [ ] Build the majority of core functionality in that thread
- [ ] Run `/feedback` in that thread after core implementation
- [ ] Copy the generated Session ID into the Devpost submission form
- [ ] Explain significant secondary Codex threads in the README if any

The Session ID is submitted through Devpost. It does not replace the public
commit history, tests, build log, README explanation, or working demo.

## README final audit

- [ ] Setup instructions match a clean checkout
- [ ] Sample data or fallback content is included where needed
- [ ] Run and test commands are exact and verified
- [ ] Public demo link works without an account
- [ ] `How we built it` names specific Codex contributions
- [ ] Human product, engineering, and design decisions are explicit
- [ ] GPT-5.6's product role is visible and meaningful
- [ ] Challenges describe real failures and resolutions
- [ ] Accomplishments are backed by tests or a runnable demo
- [ ] Unsupported Markdown syntax is stated honestly
- [ ] Open-source dependencies and pre-existing work are disclosed

## Repository and testing

- [ ] Typecheck passes
- [ ] Unit and grading fixtures pass
- [ ] Production build passes
- [ ] Clean-browser critical path passes
- [ ] GPT timeout and fallback path pass
- [ ] No API key, private token, personal data, or secret appears in the repo
- [ ] License and trademark notices are present

## Video and Devpost

- [ ] English public YouTube video is no longer than three minutes
- [ ] Video has voiceover
- [ ] Video shows the working product clearly
- [ ] Voiceover explains what was built
- [ ] Voiceover explains the specific Codex workflow and key decisions
- [ ] Voiceover explains how GPT-5.6 is integrated and what it does
- [ ] Submission text, images, video, README, and live build agree
- [ ] Run the plugin's `$prepare-submission` workflow if available
- [ ] Verify every field manually on the Devpost website
- [ ] Submit by the internal deadline and preserve confirmation evidence
