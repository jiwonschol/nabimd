// Production can be behind main for several unrelated reasons, and they do not
// deserve the same alarm. Before this script the workflow collapsed all of them
// into one red check that asserted a lost Git connection, which on 2026-08-29
// was wrong ten times in a row: the real cause was Vercel's daily deployment
// rate limit, and the evidence was already sitting in the commit's Vercel
// status the whole time.
//
// Deciding from the status rather than from the gap itself is the point. An
// unrecognised failure is never quietly downgraded — anything this script
// cannot positively identify as the self-clearing rate limit calls a person.

export const FRESHNESS_MARKER = "<!-- nabimd-deployment-freshness -->"

// Vercel publishes one commit status per deployment attempt. The context has
// carried a project suffix in the past ("Vercel – nabimd"), so match the
// vendor prefix rather than one exact string.
const VERCEL_CONTEXT = /^vercel\b/i

// Nineteen times the slowest production deployment this project has recorded
// (28 samples: min 6.6s, median 9.0s, max 16.0s). Wide enough that a genuinely
// running deployment is never called stalled, narrow enough that an abandoned
// status does not sit green for a day.
export const PENDING_GRACE_MS = 5 * 60 * 1000

function stampOf(status) {
  const value = Date.parse(status?.updated_at ?? status?.created_at ?? "")
  return Number.isFinite(value) ? value : null
}

// Vercel attaches one status per deployment attempt, and a retry does not
// remove the attempt it replaces. Judging by "the worst one still standing"
// meant a stale rate limit outranked a redeploy that was actively running, and
// a build failure outranked the successful retry that followed it. The current
// attempt is the newest one; the older entries are history.
//
// Ties and missing timestamps keep the earliest position in the array, which
// is the order the GitHub API already returns newest-first.
export function newestStatus(relevant) {
  let best = relevant[0]
  let bestStamp = stampOf(best)
  for (const status of relevant.slice(1)) {
    const stamp = stampOf(status)
    if (stamp !== null && (bestStamp === null || stamp > bestStamp)) {
      best = status
      bestStamp = stamp
    }
  }
  return best
}

function ageMs(status, now) {
  const stamp = stampOf(status)
  // No timestamp means no evidence of age. Treating that as stalled would page
  // a human over a missing field, so it stays in-flight and the next run,
  // which will have one, decides.
  if (stamp === null || !Number.isFinite(now)) return null
  return now - stamp
}

// Only this phrasing is treated as the known, self-clearing limit. Everything
// else falls through to build-failed, which pages a human. Widening this
// pattern trades a real alert for silence, so it must stay narrow.
const RATE_LIMIT = /\brate[ -]?limit(?:ed|ing)?\b/i

export function vercelStatuses(statuses) {
  return (statuses ?? []).filter((status) =>
    VERCEL_CONTEXT.test(String(status?.context ?? "")),
  )
}

/**
 * @param {{
 *   statuses?: Array<{ context?: string, state?: string, description?: string, target_url?: string }>,
 *   expectedSha: string,
 *   deployedSha?: string | null,
 *   eventName?: string,
 *   now?: number,
 * }} input
 */
export function classifyDeploymentGap({
  statuses,
  expectedSha,
  deployedSha,
  eventName,
  now = Date.now(),
}) {
  const relevant = vercelStatuses(statuses)
  const short = (sha) => (sha ? String(sha).slice(0, 8) : "an unknown commit")
  const gap =
    `Production serves ${short(deployedSha)} while ${short(expectedSha)} ` +
    "is the commit this run expected."

  if (relevant.length === 0) {
    return {
      kind: "not-triggered",
      failWorkflow: true,
      openIssue: true,
      title: "Production is behind main and Vercel never saw the commit",
      summary:
        `${gap} Vercel published no commit status for it at all, so the ` +
        "deployment was never attempted. Check the Vercel project's Git " +
        "connection — this is how the July 2026 outage looked.",
    }
  }

  // Everything below judges the current attempt only. See newestStatus.
  const current = newestStatus(relevant)

  if (current.state === "failure" || current.state === "error") {
    if (RATE_LIMIT.test(String(current.description ?? ""))) {
      // Vercel does not re-attempt a refused deployment when the quota
      // resets. Something has to ask for a new one. On a push there is a
      // plausible asker — the next merge carries this code forward — but on a
      // schedule run this commit has already sat un-deployed, so the gap
      // closes only when a person acts. Reporting "it catches up on its own"
      // in that state is how production would quietly stay old forever.
      const somethingWillRetry = eventName === "push"
      return {
        kind: "rate-limited",
        failWorkflow: !somethingWillRetry,
        openIssue: true,
        title: "Production is behind main — Vercel is rate limiting deployments",
        summary:
          `${gap} Vercel refused the deployment: ` +
          `"${current.description}". Preview builds are what spend the ` +
          "daily quota. " +
          (somethingWillRetry
            ? "This ran on the merge itself, so the next merge to land will " +
              "carry this code into a fresh deployment attempt."
            : "Vercel does not retry a refused deployment when the quota " +
              "resets, and no push has followed this one. Production stays on " +
              "the older commit until someone merges again or redeploys this " +
              "commit by hand."),
      }
    }
    return {
      kind: "build-failed",
      failWorkflow: true,
      openIssue: true,
      title: "Production is behind main because its deployment failed",
      summary:
        `${gap} Vercel reported \`${current.state}\`: ` +
        `"${current.description ?? "no description"}". ` +
        (current.target_url ? `Evidence: ${current.target_url}` : ""),
    }
  }

  if (current.state === "pending") {
    // A commit status does not expire. If Vercel abandons a pending one,
    // "the next scheduled run decides" is a promise nothing keeps: every
    // hourly run reports in-flight while production stays behind forever.
    //
    // The bound is the deployment itself rather than the trigger. Measured
    // over the 28 most recent production deployments of this project:
    // min 6.6s, median 9.0s, max 16.0s. PENDING_GRACE_MS is nineteen times
    // that maximum, so a status still pending past it stopped — including on
    // a push run, where the trigger axis would have called it healthy.
    const age = ageMs(current, now)
    if (age === null || age < PENDING_GRACE_MS) {
      return {
        kind: "in-flight",
        failWorkflow: false,
        openIssue: false,
        title: "Production is behind main while a deployment is still building",
        summary:
          `${gap} A Vercel deployment for it is still pending, so this run is ` +
          "too early rather than wrong. The next run decides.",
      }
    }
    return {
      kind: "pending-stalled",
      failWorkflow: true,
      openIssue: true,
      title: "Production is behind main and its deployment never finished",
      summary:
        `${gap} Vercel's status for it has been pending for ` +
        `${Math.round(age / 60_000)} minutes. Deployments here finish in ` +
        "seconds and a commit status never expires on its own, so this one " +
        "stopped rather than still running. Check the deployment in Vercel " +
        "and redeploy the commit.",
    }
  }

  // The check can fail without ever learning what production serves — three
  // failed page loads leave no receipt. Reading a successful Vercel status in
  // that state and reporting "a build exists but is not the one being served"
  // states something about the alias that was never observed, and it does it
  // at the one moment the site might simply have been unreachable.
  if (!deployedSha) {
    return {
      kind: "unobserved",
      failWorkflow: true,
      openIssue: true,
      title: "The freshness check could not read what production serves",
      summary:
        `Vercel reports \`${current.state}\` for ` +
        `${short(expectedSha)}, but the check never read a commit from the ` +
        "deployed page, so whether production is behind is unknown. The page " +
        "may have been unreachable, or the build may predate the attribute " +
        "that publishes its commit. Open the site and check before treating " +
        "this as a deployment problem.",
    }
  }

  return {
    kind: "deployed-elsewhere",
    failWorkflow: true,
    openIssue: true,
    title: "Production is behind main even though its deployment succeeded",
    summary:
      `${gap} Vercel reported success for the expected commit, so a build ` +
      "exists but is not the one being served. Check which deployment holds " +
      "the production alias.",
  }
}
