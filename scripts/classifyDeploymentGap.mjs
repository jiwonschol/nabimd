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
 * }} input
 */
export function classifyDeploymentGap({
  statuses,
  expectedSha,
  deployedSha,
  eventName,
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

  // A commit can carry several attempts. Judge by the worst one still standing:
  // one green retry does not undo a failure that left production behind.
  const failures = relevant.filter((status) => status.state === "failure")
  const errored = relevant.filter((status) => status.state === "error")
  const blocking = [...failures, ...errored]

  if (blocking.length > 0) {
    const rateLimited = blocking.filter((status) =>
      RATE_LIMIT.test(String(status.description ?? "")),
    )
    if (rateLimited.length === blocking.length) {
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
          `"${rateLimited[0].description}". Preview builds are what spend the ` +
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
    const unexplained = blocking.find(
      (status) => !RATE_LIMIT.test(String(status.description ?? "")),
    )
    return {
      kind: "build-failed",
      failWorkflow: true,
      openIssue: true,
      title: "Production is behind main because its deployment failed",
      summary:
        `${gap} Vercel reported \`${unexplained.state}\`: ` +
        `"${unexplained.description ?? "no description"}". ` +
        (unexplained.target_url ? `Evidence: ${unexplained.target_url}` : ""),
    }
  }

  if (relevant.some((status) => status.state === "pending")) {
    return {
      kind: "in-flight",
      failWorkflow: false,
      openIssue: false,
      title: "Production is behind main while a deployment is still building",
      summary:
        `${gap} A Vercel deployment for it is still pending, so this run is ` +
        "too early rather than wrong. The next scheduled run decides.",
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
