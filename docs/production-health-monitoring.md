# Production health monitoring

Nabi Markdown uses an external synthetic browser check instead of runtime
error instrumentation. The check opens the public deployment and behaves like
a learner; the application bundle has no monitoring SDK.

## Two checks, two questions

The workflow asks two things that fail for unrelated reasons, and keeps them
apart. Collapsing them is what made "Production health check is failing" mean
nothing on 2026-08-29: it fired ten times in a day while the learning flow
passed every attempt, and the message named a cause that was never true.

| Check | Question | Report |
|---|---|---|
| `Exercise the deployed app` | Can a browser finish the learning flow? | `Production health check is failing` |
| `Check production serves this commit` | Is the expected commit the one being served? | a title that follows the classification |

## What the learning-flow check verifies

On every push to `main`, once an hour at minute 17, and on manual dispatch, a
Playwright browser:

1. opens `https://nabimd.vercel.app`;
2. shows all `3` levels, with levels that have fewer than `5` implemented
   syntax elements marked Coming soon and disabled;
3. selects each available level and confirms that every problem belongs to
   that level, with four distinct single-syntax exercises plus one mixed exercise;
4. enters the required Markdown marks for all `5` problems;
5. reaches Summary with a `5 / 5` result and `5` completed pages; and
6. fails on uncaught page errors, console errors, or HTTP 5xx responses.

The push check waits for Vercel and retries three times so that normal
deployment propagation does not create an immediate false alarm.

## What the freshness check verifies

The deployed bundle publishes the commit it was built from, and the check
compares that with the commit the run expected. On a schedule run that is the
tip of `main`, so a mismatch means deployments have stopped arriving. This
check exists because of a real outage: in July 2026 the Vercel project lost its
Git connection and everything above kept passing for two days while production
served a commit two merges old.

A mismatch on its own does not say why, so the report reads the commit's Vercel
status rather than guessing:

| Classification | What was observed | Workflow | Files a report |
|---|---|---|---|
| `rate-limited` | Vercel refused it for the daily quota | red except on the merge run | yes |
| `not-triggered` | Vercel published no status at all | red | yes |
| `build-failed` | any other Vercel failure | red | yes |
| `deployed-elsewhere` | Vercel succeeded but is not being served | red | yes |
| `pending-stalled` | pending for longer than any real deployment takes | red | yes |
| `in-flight` | pending, recently | green | no |

Anything the classifier cannot positively identify as the quota limit calls a
person; widening that recognition trades a real alert for silence.

**A pending status does not expire.** If Vercel abandons one, nothing ever
changes it, so "still building" would stay true and green forever while
production sat behind. The line between the two pending classifications is the
deployment itself, not the clock on the wall: over this project's 28 most
recent production deployments the slowest took 16 seconds, and a status is
called stalled only after five minutes — nineteen times that. A pending status
with no timestamp is left as in-flight, because a missing field is not evidence
that anything is wrong.

**A refused deployment is not retried.** When the daily quota resets, Vercel
does not re-attempt what it turned away — a new deployment has to be asked for.
On a push run the next merge is a plausible asker, so that case stays green. On
a schedule run the same commit has already sat un-deployed and nothing is
coming, so it turns the workflow red and the report says what closes the gap:
merge again, or redeploy that commit by hand. Preview builds are what spend the
quota.

## Alert and recovery

A failed check keeps its Playwright screenshots and traces for seven days. Each
check writes to its own output directory — Playwright empties its output
directory at the start of every run, so sharing one would mean the second check
deleted the first one's evidence before it was uploaded.

Each of the two questions owns a separate deduplicated GitHub issue, matched by
a hidden marker rather than by title, and assigned to the repository owner. The
freshness report retitles its issue to match the current classification. Either
issue is commented on and closed by the next run that finds its question
answered — so a stale deployment no longer holds the health issue open, and a
broken learning flow no longer hides behind a fresh one.

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
