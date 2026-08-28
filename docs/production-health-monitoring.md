# Production health monitoring

Nabi Markdown uses an external synthetic browser check instead of runtime
error instrumentation. The check opens the public deployment and behaves like
a learner; the application bundle has no monitoring SDK.

## What it verifies

On every push to `main`, once an hour at minute 17, and on manual dispatch, a
Playwright browser:

1. opens `https://nabimd.vercel.app`;
2. shows all `3` levels, with levels that have fewer than `5` implemented
   syntax elements marked Coming soon and disabled;
3. selects each available level and confirms that every problem belongs to
   that level with no syntax element repeated in the turn;
4. enters the required Markdown marks for all `5` problems;
5. reaches Summary with a `5 / 5` result and `5` completed pages; and
6. fails on uncaught page errors, console errors, or HTTP 5xx responses.

The push check waits for Vercel and retries three times so that normal
deployment propagation does not create an immediate false alarm.

## Alert and recovery

A failed check keeps its Playwright screenshot and trace for seven days. It
also opens, or comments on, one deduplicated GitHub issue named
`Production health check is failing` and assigns it to the repository owner.
The next successful check comments on and closes that issue.

GitHub's own Actions notifications are a second channel. The repository owner
can enable web or email notifications, optionally for failed workflows only,
under GitHub notification settings.

## Privacy boundary

The monitor sends only test-authored Markdown marks derived from the public
problem bank. It does not observe real visitors, read learner sessions, capture
learner input, set analytics identifiers, or send application data to an
external monitoring vendor. Failure artifacts contain only the synthetic
browser session and are retained in GitHub Actions for seven days.

Sentry and similar client instrumentation remain deliberately out of scope.
