# Production health monitoring

Nabi Markdown uses an external synthetic browser check instead of runtime
error instrumentation. The check opens the public deployment and behaves like
a learner; the application bundle has no monitoring SDK.

## What it verifies

On every push to `main`, once an hour at minute 17, and on manual dispatch, a
Playwright browser:

1. opens `https://onsoonlabs.com/nabimd/`;
2. shows all `3` levels, with levels that have fewer than `5` implemented
   syntax elements marked Coming soon and disabled;
3. selects each available level and confirms that every problem belongs to
   that level, with four distinct single-syntax exercises plus one mixed exercise;
4. enters the required Markdown marks for all `5` problems;
5. reaches Summary with a `5 / 5` result and `5` completed pages; and
6. fails on uncaught page errors, console errors, or HTTP 5xx responses.

The push check waits for the Cloudflare Worker and retries three times so that
normal deployment propagation does not create an immediate false alarm. It
does not deploy production: a maintainer deploys the reviewed `main` commit,
then confirms the manual or rerun health check reports that exact commit.

## Deploy and rollback

Keep the Vercel deployment available until the Cloudflare production check has
passed for the reviewed `main` commit. From a clean checkout of that commit:

```bash
git rev-parse HEAD
NABI_BUILD_SHA="$(git rev-parse HEAD)" npm run deploy:cloudflare
E2E_BASE_URL=https://onsoonlabs.com/nabimd/ \
  EXPECTED_SHA="$(git rev-parse HEAD)" npm run test:e2e:production
```

Before deploying, record the current version with
`npx wrangler deployments list --config wrangler.jsonc`. If the new Worker code
or assets break production, restore that version with
`npx wrangler rollback <version-id> --config wrangler.jsonc`, then repeat the
production browser check. A version rollback does not prove that route or
binding changes were restored; for a configuration failure, deploy the last
known-good repository commit and verify the public route again. Do not retire
the Vercel project until this rollback path and the Cloudflare check both pass.

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
