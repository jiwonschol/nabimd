// The reporting half of the production health workflow. It lives here rather
// than inline in the YAML so its branches can be exercised by unit tests: an
// alerting rule nobody can run is a rule nobody knows the shape of, and this
// one decides whether a human gets called.

import { classifyDeploymentGap, FRESHNESS_MARKER } from "./classifyDeploymentGap.mjs"

export const HEALTH_MARKER = "<!-- nabimd-production-health -->"
export { FRESHNESS_MARKER }

const HEALTH_TITLE = "Production health check is failing"

/**
 * @param {{
 *   github: any,
 *   context: any,
 *   smokeOutcome: string,
 *   freshnessOutcome: string,
 *   readDeployedSha: () => string | null,
 * }} input
 */
export async function reportProductionHealth({
  github,
  context,
  smokeOutcome,
  freshnessOutcome,
  readDeployedSha,
}) {
  const runUrl =
    `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}` +
    `/actions/runs/${context.runId}`

  const openIssues = await github.paginate(github.rest.issues.listForRepo, {
    ...context.repo,
    state: "open",
    per_page: 100,
  })

  // Matched on the marker alone. Matching on the title as well meant that
  // rewording a report opened a second issue beside the first one.
  const findByMarker = (marker) =>
    openIssues.find(
      (issue) =>
        !issue.pull_request &&
        issue.user?.login === "github-actions[bot]" &&
        issue.body?.includes(marker),
    )

  async function raise({ marker, title, body }) {
    const existing = findByMarker(marker)
    if (existing) {
      const assignees = new Set(
        existing.assignees?.map(({ login }) => login) ?? [],
      )
      assignees.add(context.repo.owner)
      await github.rest.issues.update({
        ...context.repo,
        issue_number: existing.number,
        title,
        assignees: [...assignees],
      })
      await github.rest.issues.createComment({
        ...context.repo,
        issue_number: existing.number,
        body,
      })
      return
    }
    await github.rest.issues.create({
      ...context.repo,
      title,
      body,
      assignees: [context.repo.owner],
    })
  }

  async function resolve({ marker, note }) {
    const existing = findByMarker(marker)
    if (!existing) return
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: existing.number,
      body: [marker, `${note} ${runUrl}`].join("\n"),
    })
    await github.rest.issues.update({
      ...context.repo,
      issue_number: existing.number,
      state: "closed",
      state_reason: "completed",
    })
  }

  const summary = []
  let failWorkflow = false
  let verdict = null

  if (smokeOutcome === "failure") {
    failWorkflow = true
    summary.push("**Production could not complete the learning flow.**")
    await raise({
      marker: HEALTH_MARKER,
      title: HEALTH_TITLE,
      body: [
        HEALTH_MARKER,
        "The automated browser could not complete Nabi Markdown's production " +
          "learning flow.",
        "",
        `- Event: \`${context.eventName}\``,
        `- Commit: \`${context.sha}\``,
        `- Evidence: ${runUrl}`,
        "",
        "The check uses authored problem-bank text only. It does not inspect " +
          "or collect learner input.",
      ].join("\n"),
    })
  } else {
    summary.push("Production completed the full learning flow.")
    await resolve({
      marker: HEALTH_MARKER,
      note: "Production completed the full browser check again:",
    })
  }

  if (freshnessOutcome === "failure") {
    const deployedSha = readDeployedSha() || null
    const { data: status } = await github.rest.repos.getCombinedStatusForRef({
      ...context.repo,
      ref: context.sha,
    })
    verdict = classifyDeploymentGap({
      statuses: status.statuses,
      expectedSha: context.sha,
      deployedSha,
      eventName: context.eventName,
    })

    failWorkflow = failWorkflow || verdict.failWorkflow
    summary.push(`**${verdict.title}** (\`${verdict.kind}\`)`, "", verdict.summary)

    if (verdict.openIssue) {
      await raise({
        marker: FRESHNESS_MARKER,
        title: verdict.title,
        body: [
          FRESHNESS_MARKER,
          verdict.summary,
          "",
          `- Event: \`${context.eventName}\``,
          `- Expected commit: \`${context.sha}\``,
          `- Served commit: \`${deployedSha ?? "unknown"}\``,
          `- Classification: \`${verdict.kind}\``,
          `- Evidence: ${runUrl}`,
        ].join("\n"),
      })
    }
  } else {
    summary.push("Production serves the commit this run expected.")
    await resolve({
      marker: FRESHNESS_MARKER,
      note: "Production is serving the expected commit again:",
    })
  }

  return { failWorkflow, summary: summary.join("\n"), verdict }
}
