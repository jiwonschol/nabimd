import { describe, expect, it } from "vitest"
import {
  classifyDeploymentGap,
  PENDING_GRACE_MS,
  vercelStatuses,
} from "./classifyDeploymentGap.mjs"

// Observed on jiwonschol/nabimd@af16cbf5 on 2026-08-29. Ten main merges that
// day carried exactly this status while preview builds kept succeeding.
const OBSERVED_RATE_LIMIT = "Deployment rate limited — retry in 24 hours."

const NOW = Date.parse("2026-08-29T15:00:00Z")

const gap = (statuses, eventName = "push", now = NOW) =>
  classifyDeploymentGap({
    statuses,
    expectedSha: "af16cbf50003441a92f1894600edda43f0458b6b",
    deployedSha: "25e9b5e7601ff48de733274300758db5e5d5e91f",
    eventName,
    now,
  })

const pendingFor = (ms) => [
  {
    context: "Vercel",
    state: "pending",
    description: "Deploying",
    updated_at: new Date(NOW - ms).toISOString(),
  },
]

describe("classifyDeploymentGap", () => {
  it("holds a rate limit on the merge itself, where a later merge can carry it", () => {
    const result = gap([
      {
        context: "Vercel",
        state: "failure",
        description: OBSERVED_RATE_LIMIT,
        target_url: "https://vercel.com/example?upgradeToPro=build-rate-limit",
      },
    ])

    expect(result.kind).toBe("rate-limited")
    expect(result.failWorkflow).toBe(false)
    // It still files a report. Silence would let production age unnoticed for
    // as long as the account keeps spending its daily deployments.
    expect(result.openIssue).toBe(true)
    expect(result.summary).toContain(OBSERVED_RATE_LIMIT)
    expect(result.summary).toContain("the next merge to land")
  })

  it("pages a human once the same commit is still un-deployed on a schedule run", () => {
    // Codex caught the original of this: Vercel does not re-attempt a refused
    // deployment when the quota resets. Calling it self-clearing on a schedule
    // run — where no push is coming — is how production would stay old
    // indefinitely behind a green check.
    for (const eventName of ["schedule", "workflow_dispatch"]) {
      const result = gap(
        [{ context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT }],
        eventName,
      )

      expect(result.kind).toBe("rate-limited")
      expect(result.failWorkflow, `${eventName} should page a human`).toBe(true)
      expect(result.openIssue).toBe(true)
      // And it must say what actually closes the gap.
      expect(result.summary).toContain("does not retry")
      expect(result.summary).toMatch(/merges again or redeploys/)
    }
  })

  it("never tells anyone the deployment catches up on its own", () => {
    // The exact claim that was wrong. Kept as a negative assertion so a
    // reworded summary cannot quietly restore it.
    for (const eventName of ["push", "schedule", "workflow_dispatch"]) {
      const result = gap(
        [{ context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT }],
        eventName,
      )
      expect(result.summary).not.toMatch(/catches up on its own/)
    }
  })

  it("pages a human when Vercel published no status for the commit", () => {
    const result = gap([])

    expect(result.kind).toBe("not-triggered")
    expect(result.failWorkflow).toBe(true)
    expect(result.openIssue).toBe(true)
  })

  it("ignores statuses from other reporters when deciding", () => {
    const result = gap([
      { context: "Verify", state: "success", description: "All good" },
      { context: "codecov/project", state: "success", description: "No change" },
    ])

    // None of those are Vercel, so this is still "Vercel never saw it".
    expect(result.kind).toBe("not-triggered")
  })

  it("matches Vercel contexts that carry a project suffix", () => {
    expect(
      vercelStatuses([
        { context: "Vercel – nabimd", state: "failure" },
        { context: "vercel/preview", state: "success" },
        { context: "Verify", state: "success" },
      ]).map((status) => status.context),
    ).toEqual(["Vercel – nabimd", "vercel/preview"])
  })

  it("does not let a Verify status masquerade as a Vercel one", () => {
    expect(vercelStatuses([{ context: "Verify", state: "failure" }])).toEqual([])
  })

  it("pages a human on a deployment failure it cannot explain", () => {
    const result = gap([
      {
        context: "Vercel",
        state: "failure",
        description: "Build failed: command exited with 1",
        target_url: "https://vercel.com/example/deployment",
      },
    ])

    expect(result.kind).toBe("build-failed")
    expect(result.failWorkflow).toBe(true)
    expect(result.summary).toContain("command exited with 1")
    expect(result.summary).toContain("https://vercel.com/example/deployment")
  })

  it("pages a human when one attempt was rate limited and another was not", () => {
    // Downgrading here would hide a real build failure behind an excuse that
    // only covers one of the two attempts.
    const result = gap([
      { context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT },
      { context: "Vercel", state: "error", description: "Internal error" },
    ])

    expect(result.kind).toBe("build-failed")
    expect(result.failWorkflow).toBe(true)
    expect(result.summary).toContain("Internal error")
  })

  it("waits rather than alerting while a deployment is still building", () => {
    const result = gap(pendingFor(5_000))

    expect(result.kind).toBe("in-flight")
    expect(result.failWorkflow).toBe(false)
    expect(result.openIssue).toBe(false)
  })

  it("stops waiting on a pending status that outlived any real deployment", () => {
    // Codex caught the original: a commit status never expires, so one Vercel
    // abandons keeps every run green and silent while production stays behind
    // indefinitely. Bounded by the deployment, not by the trigger — measured
    // over this project's 28 most recent production deployments, the slowest
    // took 16.0s, and the grace is nineteen times that.
    for (const eventName of ["push", "schedule", "workflow_dispatch"]) {
      const result = gap(pendingFor(PENDING_GRACE_MS + 60_000), eventName)

      expect(result.kind, eventName).toBe("pending-stalled")
      expect(result.failWorkflow, eventName).toBe(true)
      expect(result.openIssue, eventName).toBe(true)
      expect(result.summary).toMatch(/stopped rather than still running/)
      expect(result.summary).toMatch(/pending for \d+ minutes/)
    }
  })

  it("leaves a deployment that is genuinely still running alone", () => {
    // The passing side. A guard measured only by what it blocks hides the case
    // where it blocks everything.
    for (const age of [1_000, PENDING_GRACE_MS - 1_000]) {
      const result = gap(pendingFor(age), "schedule")

      expect(result.kind, `${age}ms`).toBe("in-flight")
      expect(result.failWorkflow).toBe(false)
      expect(result.openIssue).toBe(false)
    }
  })

  it("ages a retried deployment from its newest attempt, not its oldest", () => {
    // A one-element fixture cannot tell Math.max from Math.min: swapping them
    // left every other pending case green. Vercel attaches a status per
    // attempt, so a stale first try sitting beside a fresh retry is the real
    // shape, and reading the oldest would call a running deployment stalled.
    const retried = [
      ...pendingFor(PENDING_GRACE_MS + 60_000),
      ...pendingFor(30_000),
    ]

    expect(gap(retried, "schedule").kind).toBe("in-flight")

    // And the reverse still stalls: both attempts old means nothing is running.
    const abandoned = [
      ...pendingFor(PENDING_GRACE_MS + 60_000),
      ...pendingFor(PENDING_GRACE_MS + 10_000),
    ]

    expect(gap(abandoned, "schedule").kind).toBe("pending-stalled")
  })

  it("does not call a pending status stalled when it carries no timestamp", () => {
    // No timestamp is no evidence of age. Paging a human over a missing field
    // would make the report about our parsing rather than about production.
    const result = gap(
      [{ context: "Vercel", state: "pending", description: "Deploying" }],
      "schedule",
    )

    expect(result.kind).toBe("in-flight")
    expect(result.failWorkflow).toBe(false)
  })

  it("leaves no outcome permanently green once the deployment has stopped", () => {
    // If some state stayed green forever, it is the one a stuck deployment
    // settles into.
    const terminal = [
      [],
      [{ context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT }],
      [{ context: "Vercel", state: "failure", description: "Build failed" }],
      pendingFor(PENDING_GRACE_MS + 60_000),
      [{ context: "Vercel", state: "success", description: "Ready" }],
    ]
    for (const statuses of terminal) {
      const scheduled = gap(statuses, "schedule")
      expect(
        scheduled.failWorkflow,
        `${scheduled.kind} stays green on a schedule run`,
      ).toBe(true)
    }
  })

  it("pages a human when the expected commit deployed but is not being served", () => {
    const result = gap([
      { context: "Vercel", state: "success", description: "Deployment ready" },
    ])

    expect(result.kind).toBe("deployed-elsewhere")
    expect(result.failWorkflow).toBe(true)
    expect(result.openIssue).toBe(true)
  })

  it("keeps a green retry from erasing the failure that left production behind", () => {
    const result = gap([
      { context: "Vercel", state: "success", description: "Deployment ready" },
      {
        context: "Vercel",
        state: "failure",
        description: "Build failed: out of memory",
      },
    ])

    expect(result.kind).toBe("build-failed")
    expect(result.summary).toContain("out of memory")
  })

  it("names both commits in every outcome so the report stands alone", () => {
    const outcomes = [
      gap([]),
      gap([{ context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT }]),
      gap([{ context: "Vercel", state: "failure", description: "Build failed" }]),
      gap(pendingFor(5_000)),
      gap([{ context: "Vercel", state: "success", description: "Ready" }]),
    ]

    expect(new Set(outcomes.map((outcome) => outcome.kind)).size).toBe(
      outcomes.length,
    )
    for (const outcome of outcomes) {
      expect(outcome.summary).toContain("25e9b5e7")
      expect(outcome.summary).toContain("af16cbf5")
      expect(outcome.title.length).toBeGreaterThan(0)
    }
  })

  it("never claims a lost Git connection for a cause it did not observe", () => {
    // The message this replaced asserted exactly that, ten times, wrongly.
    for (const result of [
      gap([{ context: "Vercel", state: "failure", description: OBSERVED_RATE_LIMIT }]),
      gap([{ context: "Vercel", state: "failure", description: "Build failed" }]),
      gap(pendingFor(5_000)),
      gap([{ context: "Vercel", state: "success", description: "Ready" }]),
    ]) {
      expect(result.summary).not.toContain("Git connection")
    }
    expect(gap([]).summary).toContain("Git connection")
  })
})
