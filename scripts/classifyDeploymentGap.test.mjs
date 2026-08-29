import { describe, expect, it } from "vitest"
import {
  classifyDeploymentGap,
  vercelStatuses,
} from "./classifyDeploymentGap.mjs"

// Observed on jiwonschol/nabimd@af16cbf5 on 2026-08-29. Ten main merges that
// day carried exactly this status while preview builds kept succeeding.
const OBSERVED_RATE_LIMIT = "Deployment rate limited — retry in 24 hours."

const gap = (statuses, eventName = "push") =>
  classifyDeploymentGap({
    statuses,
    expectedSha: "af16cbf50003441a92f1894600edda43f0458b6b",
    deployedSha: "25e9b5e7601ff48de733274300758db5e5d5e91f",
    eventName,
  })

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
    const result = gap([
      { context: "Vercel", state: "pending", description: "Deploying" },
    ])

    expect(result.kind).toBe("in-flight")
    expect(result.failWorkflow).toBe(false)
    expect(result.openIssue).toBe(false)
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
      gap([{ context: "Vercel", state: "pending", description: "Deploying" }]),
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
      gap([{ context: "Vercel", state: "pending", description: "Deploying" }]),
      gap([{ context: "Vercel", state: "success", description: "Ready" }]),
    ]) {
      expect(result.summary).not.toContain("Git connection")
    }
    expect(gap([]).summary).toContain("Git connection")
  })
})
