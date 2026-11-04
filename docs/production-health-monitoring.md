# Production health monitoring

Nabi Markdown has an external synthetic browser check and optional Sentry
client error reporting. The check opens the public deployment and behaves like
a learner. Client reporting is enabled when the build supplies a Sentry DSN;
it is a separate path from the scheduled health check.

## What it verifies

Once an hour at minute 17, and on manual dispatch after a production deploy, a
Playwright browser runs
[`tests/e2e/production-health.spec.ts`](../tests/e2e/production-health.spec.ts)
against `https://onsoonlabs.com/nabimd/`. It:

1. checks that the page's `data-build-sha` is the expected commit (skipped
   when no commit is given, which never happens in the workflow);
2. in Korean, opens the home page and sees the map of `12` marks;
3. starts today's five, writes each document's authored answer, and sees each
   one pass;
4. reaches the summary at `/nabimd/done` with "다섯 장을 썼다.", `5` documents
   passed on the first try, and `5` summary cards;
5. in English, opens one heading document (the English bank loads as its own
   chunk) and passes it; and
6. fails on uncaught page errors, console errors, or HTTP 5xx responses.

Before each page loads, the check stores "necessary only" in
`nabimd.consent.v1`, so the consent banner stays closed and the Cloudflare Web
Analytics beacon never loads. Synthetic runs therefore do not appear in the
visit, `/practice` or `/done` counts.

The hourly check reads `data-build-sha` from the running app in a browser, checks
out that exact revision, and derives exercise answers from the matching problem
banks (the English runtime projection and the Korean cards). It does not depend on the route publishing `X-Nabi-Build-Sha`.

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

The synthetic monitor enters only test-authored Markdown marks derived from
the public problem bank. It does not observe real visitors, read learner sessions, capture
real learner input, or set analytics identifiers. Its browser loads the deployed
app, so a build with client reporting enabled can send synthetic-session errors
to Sentry. Failure artifacts contain only the synthetic browser session and are
retained in GitHub Actions for seven days. These properties of the test do not
describe error reporting from real visitors.

Summary feedback rows expire after 89 days. When the daily 03:00 UTC cleanup
runs successfully, it removes them by the next run, keeping retention below
the user-facing 90-day maximum even for a note created immediately after
cleanup. Expiry is a timestamp, not automatic database deletion. A failed or
missed cleanup can exceed that policy and requires investigation; the browser
health check above does not verify cleanup execution.

## Client error reporting

[`src/main.tsx`](../src/main.tsx) starts
[`errorMonitoring.ts`](../src/monitoring/errorMonitoring.ts) before the first
React render. A truthy build-time `VITE_SENTRY_DSN` enables the dynamically
imported SDK. There is no production-mode or hostname check: development and
preview builds also enable it if given a DSN, and every enabled client is
labelled `production`. Leave the variable unset for builds that should not
report. A missing DSN or SDK load failure disables reporting without blocking
the app. The root-element check happens before initialization, so that failure
is not captured by this path.

[`sentryClient.ts`](../src/monitoring/sentryClient.ts) retains the SDK's global
error and unhandled-rejection handlers. The app also reports React render
failures from [`ErrorBoundary`](../src/components/ErrorBoundary.tsx); a
grading failure on the practice screen reaches Sentry through that boundary or
the global handlers. At most three explicit reports are queued while the SDK loads. The `beforeSend`
hook allows at most five scrubbed error events per page load; delivery can still
fail. This is not a limit on all SDK network requests.

The client sets `sendDefaultPii: false` and `tracesSampleRate: 0`, does not add
replay or tracing integrations, and removes `Breadcrumbs`, `HttpContext`, and
`BrowserSession`. It also drops every breadcrumb. The event filter in
[`scrubEvent.ts`](../src/monitoring/scrubEvent.ts) rebuilds error events from
allowed fields: event identity/time, platform/severity, release/environment,
exception type and allowed message, mechanism, up to 40 stack frames per
exception, and selected problem/boundary/level tags and context. No current
caller attaches draft context, and the filter would drop it anyway: with the
pinned `@sentry/browser` 10.75.0 and `normalizeDepth: 1`, the SDK converts the
nested `nabi` context to a string before `beforeSend`. Problem/boundary tags
survive.
Unrecognized messages are redacted; allowed messages are capped at 300
characters. Request/user objects, arbitrary extra fields, frame variables and
source excerpts are dropped.

The filter is a field allowlist, not complete anonymization of retained strings.
The SDK can add its own metadata after filtering and has discarded-event
diagnostic reporting enabled by default. Neither those reports nor network
metadata are covered by the five-error-event limit. `sendDefaultPii: false`
does not establish how every receiving infrastructure layer handles requests.

This document describes repository behavior, not proof that a deployed build
has a DSN or that Sentry accepted any events. Sentry project settings, retention,
server-side scrubbing, and access controls require separate operational
verification. The feedback retention period above and the synthetic artifact
retention period do not apply to Sentry. The public data notice is in
[`SECURITY.md`](../SECURITY.md#scope); the current app screens have no dedicated
Sentry notice or consent control.
