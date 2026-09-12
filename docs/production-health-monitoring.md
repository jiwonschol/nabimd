# Production health monitoring

Nabi Markdown uses an external synthetic browser check instead of runtime
error instrumentation. The check opens the public deployment and behaves like
a learner; the application bundle has no monitoring SDK.

## What it verifies

Once an hour at minute 17, and on manual dispatch after a production deploy, a
Playwright browser:

1. opens `https://onsoonlabs.com/nabimd/`;
2. shows all `3` levels, with levels that have fewer than `5` implemented
   syntax elements marked Coming soon and disabled;
3. selects each available level and confirms that every problem belongs to
   that level, with four distinct single-syntax exercises plus one mixed exercise;
4. enters the required Markdown marks for all `5` problems;
5. reaches Summary with a `5 / 5` result and `5` completed pages; and
6. fails on uncaught page errors, console errors, or HTTP 5xx responses.

The hourly check reads `data-build-sha` from the running app in a browser, checks
out that exact revision, and derives exercise answers from the matching problem
bank. It does not depend on the route publishing `X-Nabi-Build-Sha`.

The manual post-deploy check receives the deployed SHA explicitly, checks out
that exact revision before deriving exercise answers, and verifies the bundle's
`data-build-sha`. The deployment command separately requires the public
`X-Nabi-Build-Sha` response header to match that SHA. This keeps deployment
identity strict without making the hourly health monitor depend on header
routing.

The check retries three times so that normal propagation does not create an
immediate false alarm. It does not deploy production: a maintainer deploys the
reviewed `main` commit, then explicitly dispatches the workflow so the check
compares production with that exact commit. A `main` push does not start the
check before the manual deployment exists.

## Before deployment

Check out the reviewed commit and finish the local verification before changing
production:

```bash
git rev-parse HEAD
npm ci
npm run check
NABI_BUILD_SHA="$(git rev-parse HEAD)" npm run build:cloudflare
```

The local build proves that the Worker and its assets can be produced. It does
not prove that the public route reaches that Worker.

## Deploy, live verification, and rollback

Keep the Vercel deployment available until the Cloudflare production check has
passed for the reviewed `main` commit. After deployment is approved, use the
same clean checkout:

```bash
git rev-parse HEAD
npx playwright install --with-deps chromium
NABI_BUILD_SHA="$(git rev-parse HEAD)" npm run deploy:cloudflare
E2E_BASE_URL=https://onsoonlabs.com/nabimd/ \
  EXPECTED_SHA="$(git rev-parse HEAD)" npm run test:e2e:production
gh workflow run production-health.yml --ref main \
  -f expected_sha="$(git rev-parse HEAD)"
```

`deploy:cloudflare` builds the assets, applies pending D1 migrations to the
`NABIMD_DB` binding, and only then deploys the Worker. The command stops before
the Worker deployment if a migration fails, so new code cannot begin using a
schema that was not applied. It then polls the public route and requires a
successful response whose `X-Nabi-Build-Sha` exactly matches the deployed
commit. A missing header catches a route that still bypasses the Worker; a
different header catches a stale Worker deployment. Only after this live check
succeeds should the browser check and manual workflow dispatch run.

Before deploying, record the current version with
`npx wrangler deployments list --config wrangler.jsonc`. If the new Worker code
or assets break production, restore that version with
`npx wrangler rollback <version-id> --config wrangler.jsonc`, then repeat the
production browser check. A version rollback does not prove that route or
binding changes were restored; for a configuration failure, deploy the last
known-good repository commit and verify the public route again. Do not retire
the Vercel project until this rollback path and the Cloudflare check both pass.
D1 migrations are not reversed by a Worker rollback. Keep schema changes
backward-compatible with the previous Worker or use a separately reviewed D1
rollback plan.

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

Summary feedback rows expire after 89 days. The daily 03:00 UTC cleanup removes
them by the next run, keeping the user-facing maximum below 90 days even for a
note created immediately after cleanup.

Sentry and similar client instrumentation remain deliberately out of scope.
