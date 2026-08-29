import { describe, expect, it } from "vitest"
import {
  FRESHNESS_MARKER,
  HEALTH_MARKER,
  reportProductionHealth,
} from "./reportProductionHealth.mjs"

const EXPECTED_SHA = "af16cbf50003441a92f1894600edda43f0458b6b"
const SERVED_SHA = "25e9b5e7601ff48de733274300758db5e5d5e91f"
const RATE_LIMIT = "Deployment rate limited — retry in 24 hours."

const context = {
  serverUrl: "https://github.com",
  repo: { owner: "jiwonschol", repo: "nabimd" },
  runId: 33248337830,
  eventName: "push",
  sha: EXPECTED_SHA,
}

function fakeGithub({ openIssues = [], statuses = [] } = {}) {
  const calls = { created: [], updated: [], comments: [] }
  return {
    calls,
    paginate: async () => openIssues,
    rest: {
      issues: {
        listForRepo: () => {},
        create: async (input) => calls.created.push(input),
        update: async (input) => calls.updated.push(input),
        createComment: async (input) => calls.comments.push(input),
      },
      repos: {
        getCombinedStatusForRef: async () => ({ data: { statuses } }),
      },
    },
  }
}

const botIssue = (number, marker, title) => ({
  number,
  title,
  body: `${marker}\nsomething happened`,
  user: { login: "github-actions[bot]" },
  assignees: [],
})

const run = (github, overrides = {}) =>
  reportProductionHealth({
    github,
    context,
    smokeOutcome: "success",
    freshnessOutcome: "success",
    readDeployedSha: () => SERVED_SHA,
    ...overrides,
  })

describe("reportProductionHealth", () => {
  it("stays green and closes both reports when production is current", async () => {
    const github = fakeGithub({
      openIssues: [
        botIssue(193, HEALTH_MARKER, "Production health check is failing"),
        botIssue(210, FRESHNESS_MARKER, "Production is behind main"),
      ],
    })

    const result = await run(github)

    expect(result.failWorkflow).toBe(false)
    expect(github.calls.created).toHaveLength(0)
    expect(
      github.calls.updated.map(({ issue_number, state }) => [issue_number, state]),
    ).toEqual([
      [193, "closed"],
      [210, "closed"],
    ])
  })

  it("does not fail the workflow when production is merely rate limited", async () => {
    // The whole point of the split. On 2026-08-29 this exact state turned the
    // check red ten times while the learning flow passed every attempt.
    const github = fakeGithub({
      statuses: [
        { context: "Vercel", state: "failure", description: RATE_LIMIT },
      ],
    })

    const result = await run(github, { freshnessOutcome: "failure" })

    expect(result.failWorkflow).toBe(false)
    expect(result.verdict.kind).toBe("rate-limited")
    expect(github.calls.created).toHaveLength(1)
    expect(github.calls.created[0].body).toContain(FRESHNESS_MARKER)
    expect(github.calls.created[0].body).toContain(RATE_LIMIT)
    expect(github.calls.created[0].body).toContain(SERVED_SHA)
  })

  it("passes the triggering event through, so a schedule run is not called self-clearing", async () => {
    // Without this the classifier always sees `undefined` and every rate limit
    // reads as the merge-time case. The wiring is one property; nothing else
    // would notice if it were dropped.
    const github = fakeGithub({
      statuses: [
        { context: "Vercel", state: "failure", description: RATE_LIMIT },
      ],
    })

    const result = await reportProductionHealth({
      github,
      context: { ...context, eventName: "schedule" },
      smokeOutcome: "success",
      freshnessOutcome: "failure",
      readDeployedSha: () => SERVED_SHA,
    })

    expect(result.verdict.kind).toBe("rate-limited")
    expect(result.failWorkflow).toBe(true)
    expect(github.calls.created[0].body).toContain("does not retry")
  })

  it("closes the health report even while the freshness one is open", async () => {
    // A stale deployment is not a broken one. Leaving the health issue open
    // here is what made "production is failing" mean nothing.
    const github = fakeGithub({
      openIssues: [
        botIssue(193, HEALTH_MARKER, "Production health check is failing"),
      ],
      statuses: [
        { context: "Vercel", state: "failure", description: RATE_LIMIT },
      ],
    })

    await run(github, { freshnessOutcome: "failure" })

    expect(
      github.calls.updated.find(({ issue_number }) => issue_number === 193).state,
    ).toBe("closed")
    expect(github.calls.created).toHaveLength(1)
  })

  it("fails the workflow when the learning flow itself breaks", async () => {
    const github = fakeGithub()

    const result = await run(github, { smokeOutcome: "failure" })

    expect(result.failWorkflow).toBe(true)
    expect(github.calls.created).toHaveLength(1)
    expect(github.calls.created[0].title).toBe(
      "Production health check is failing",
    )
    expect(github.calls.created[0].body).toContain(HEALTH_MARKER)
  })

  it("fails the workflow when Vercel never saw the commit", async () => {
    const github = fakeGithub({ statuses: [] })

    const result = await run(github, { freshnessOutcome: "failure" })

    expect(result.failWorkflow).toBe(true)
    expect(result.verdict.kind).toBe("not-triggered")
  })

  it("files nothing while a deployment is still building", async () => {
    const github = fakeGithub({
      statuses: [{ context: "Vercel", state: "pending", description: "Deploying" }],
    })

    const result = await run(github, { freshnessOutcome: "failure" })

    expect(result.failWorkflow).toBe(false)
    expect(github.calls.created).toHaveLength(0)
    expect(github.calls.comments).toHaveLength(0)
  })

  it("comments on the existing report instead of opening a second one", async () => {
    const github = fakeGithub({
      openIssues: [botIssue(210, FRESHNESS_MARKER, "An older wording")],
      statuses: [
        { context: "Vercel", state: "failure", description: RATE_LIMIT },
      ],
    })

    await run(github, { freshnessOutcome: "failure" })

    expect(github.calls.created).toHaveLength(0)
    expect(github.calls.comments).toHaveLength(1)
    const update = github.calls.updated.find(
      ({ issue_number }) => issue_number === 210,
    )
    // The title follows the classification, so a report that changes cause
    // stops advertising the old one.
    expect(update.title).toBe(
      "Production is behind main — Vercel is rate limiting deployments",
    )
    expect(update.assignees).toContain("jiwonschol")
  })

  it("leaves issues opened by people alone", async () => {
    const human = {
      number: 42,
      title: "Production health check is failing",
      body: `${HEALTH_MARKER} filed by hand`,
      user: { login: "jiwonschol" },
      assignees: [],
    }
    const github = fakeGithub({ openIssues: [human] })

    await run(github, { smokeOutcome: "failure" })

    expect(github.calls.updated).toHaveLength(0)
    expect(github.calls.created).toHaveLength(1)
  })

  it("does not mistake a pull request for its report", async () => {
    const pull = {
      number: 200,
      title: "Production health check is failing",
      body: `${HEALTH_MARKER} quoted in a PR body`,
      user: { login: "github-actions[bot]" },
      pull_request: { url: "https://api.github.com/…" },
      assignees: [],
    }
    const github = fakeGithub({ openIssues: [pull] })

    await run(github, { smokeOutcome: "failure" })

    expect(github.calls.created).toHaveLength(1)
    expect(github.calls.updated).toHaveLength(0)
  })

  it("reports an unknown served commit rather than inventing one", async () => {
    const github = fakeGithub({ statuses: [] })

    await run(github, {
      freshnessOutcome: "failure",
      readDeployedSha: () => null,
    })

    expect(github.calls.created[0].body).toContain("`unknown`")
  })

  it("keeps the two reports on separate markers", async () => {
    const github = fakeGithub({ statuses: [] })

    await run(github, { smokeOutcome: "failure", freshnessOutcome: "failure" })

    expect(github.calls.created).toHaveLength(2)
    const markers = github.calls.created.map(({ body }) =>
      body.includes(HEALTH_MARKER) ? "health" : "freshness",
    )
    expect(new Set(markers).size).toBe(2)
    expect(HEALTH_MARKER).not.toBe(FRESHNESS_MARKER)
  })
})
