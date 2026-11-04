# Contributing

Thank you for your interest in Nabi Markdown.

## Issues are welcome

Open an issue to report a problem or share feedback. The most useful reports
say which screen language you used (한국어 or English), which document you were
writing (its title, or the `doc=` part of the address), what you typed, and
what the verdict said. Please do not paste personal information into an issue.

Report security problems privately as described in [SECURITY.md](SECURITY.md).

## Pull requests

The project does not merge outside pull requests yet. Code is licensed under
the AGPL and problem-bank content under CC BY-SA, and the maintainer has not
yet chosen a contributor-rights agreement that fits those licenses and the
project's commercial-licensing goals. Until one exists, unsolicited pull
requests are closed without merging. An issue that describes the change is the
best way to propose it.

## Working locally

Requires Node.js `22.13`–`22.x`, `24.x`, or `26` or later.

```bash
npm ci
npm run dev        # the app at http://localhost:5173
npm run check      # everything CI runs
npm run test:e2e   # the browser scenarios (needs `npx playwright install chromium`)
```

Korean screen copy lives in `src/i18n/ko.ts` and ends its sentences in "~다";
`npm run lint:ko-copy` checks that, and that components carry no copy of their
own.

## History

Nabi Markdown started as an individual entry in OpenAI Build Week (July 2026),
whose rules required the submission to stay the entrant's own work. That was the
original reason outside contributions were closed.
