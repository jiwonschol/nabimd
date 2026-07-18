import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  canonicalJson,
  createInitialEditorialQueue,
  evaluateWorkflow,
  normalizeArtifact,
  sha256,
  validateRawArtifact,
} from "./pipeline.mjs"

const root = process.cwd()
const bankDir = resolve(root, "curriculum/problem-bank")
const raw = JSON.parse(await readFile(resolve(bankDir, "candidates.raw.json"), "utf8"))
const prompt = await readFile(resolve(bankDir, "generation-prompt.md"), "utf8")
const normalized = normalizeArtifact(raw, prompt)
const headingCandidates = normalized.candidates.filter(
  (candidate) => candidate.familyId === "headings",
)
const runtime = headingCandidates.map((candidate) => ({
  id: candidate.id,
  text: candidate.text,
  targetMarkdown: candidate.targetMarkdown,
  teaching: candidate.teaching,
}))
const fixtureDigests = Object.fromEntries(runtime.map(({ id }) => [id, sha256(`fixtures:${id}`)]))
const fixtureCounts = Object.fromEntries(runtime.map(({ id }) => [id, 29]))

function acceptedWorkflow() {
  const editorialQueue = createInitialEditorialQueue(normalized)
  const reviews = []
  for (const candidate of headingCandidates) {
    for (const reviewerId of ["reviewer-a", "reviewer-b"]) {
      reviews.push({
        reviewerId,
        reviewRunId: `${reviewerId}-run`,
        candidateId: candidate.id,
        candidateDigest: candidate.candidateDigest,
        fixtureResultsDigest: fixtureDigests[candidate.id],
        fixtureCount: fixtureCounts[candidate.id],
        verdict: "pass",
        notes: "Fixture and editorial review passed.",
      })
    }
    const decision = editorialQueue.decisions.find(
      (item) => item.candidateId === candidate.id,
    )
    Object.assign(decision, {
      fixtureResultsDigest: fixtureDigests[candidate.id],
      status: "accepted",
      reason: "fixture-and-independent-review-passed",
      editorialActor: "test-editor",
    })
  }
  return { editorialQueue, reviews }
}

function evaluate(overrides = {}) {
  const accepted = acceptedWorkflow()
  return evaluateWorkflow({
    normalized,
    runtimeHeadingBank: runtime,
    fixtureDigests,
    fixtureCounts,
    ...accepted,
    ...overrides,
  })
}

describe("problem-bank pipeline", () => {
  it("normalizes exactly 128 candidates across eight families", () => {
    expect(validateRawArtifact(raw)).toEqual([])
    expect(normalized.candidateCount).toBe(128)
    expect(Object.values(normalized.perFamilyCounts)).toEqual(Array(8).fill(16))
    expect(normalized.promptSha256).toBe(sha256(prompt))
    expect(
      normalized.candidates.every(
        (candidate) =>
          candidate.teaching.concept &&
          candidate.expectedSkill &&
          candidate.likelyMalformedTrap &&
          candidate.editorialNote,
      ),
    ).toBe(true)
  })

  it("uses deterministic canonical digests", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}')
    expect(sha256({ a: 1, b: 2 })).toBe(sha256({ b: 2, a: 1 }))
  })

  it("rejects duplicate candidate IDs and family count drift", () => {
    const invalid = structuredClone(raw)
    invalid.families[0].candidates.pop()
    invalid.families[1].candidates[0].id = invalid.families[0].candidates[0].id
    expect(validateRawArtifact(invalid)).toEqual(
      expect.arrayContaining([
        "Family headings must contain exactly 16 candidates",
        `Duplicate candidate id: ${invalid.families[0].candidates[0].id}`,
      ]),
    )
  })

  it("accepts a complete, unanimous, digest-bound workflow", () => {
    expect(evaluate()).toEqual([])
  })

  it("blocks a missing independent reviewer", () => {
    const { reviews } = acceptedWorkflow()
    expect(evaluate({ reviews: reviews.filter((review) => review.reviewerId === "reviewer-a") }))
      .toContain("Candidate heading-apple requires two independent reviews")
  })

  it("blocks reviewer disagreement and stale digests", () => {
    const { reviews } = acceptedWorkflow()
    reviews[0].verdict = "fail"
    reviews[1].candidateDigest = "stale"
    expect(evaluate({ reviews })).toEqual(
      expect.arrayContaining([
        "Reviewer disagreement: heading-apple/reviewer-a",
        "Stale review digest: heading-apple/reviewer-b",
      ]),
    )
  })

  it("does not ignore a third disagreeing review or stale fixture count", () => {
    const { reviews } = acceptedWorkflow()
    reviews.push({
      ...reviews[0],
      reviewerId: "reviewer-c",
      reviewRunId: "reviewer-c-run",
      verdict: "fail",
    })
    reviews[1].fixtureCount = 28
    expect(evaluate({ reviews })).toEqual(
      expect.arrayContaining([
        "Reviewer disagreement: heading-apple/reviewer-c",
        "Stale review digest: heading-apple/reviewer-b",
      ]),
    )
  })

  it("rejects duplicate reviewer and review-run IDs", () => {
    const { reviews } = acceptedWorkflow()
    reviews.push({
      ...reviews[0],
      reviewRunId: "reviewer-a-second-run",
    })
    expect(evaluate({ reviews })).toContain(
      "Candidate heading-apple has duplicate reviewer or run IDs",
    )
  })

  it("blocks missing editorial acceptance", () => {
    const { editorialQueue } = acceptedWorkflow()
    const decision = editorialQueue.decisions.find(
      (item) => item.candidateId === "heading-apple",
    )
    decision.status = "pending"
    expect(evaluate({ editorialQueue })).toEqual(
      expect.arrayContaining([
        "Candidate heading-apple lacks digest-bound editorial acceptance",
        "Runtime publish set does not equal the accepted editorial set",
      ]),
    )
  })

  it("blocks unsupported publication and runtime drift", () => {
    const unsupported = normalized.candidates.find(
      (candidate) => candidate.familyId === "emphasis",
    )
    const changedRuntime = [
      ...runtime,
      {
        id: unsupported.id,
        text: unsupported.text,
        targetMarkdown: unsupported.targetMarkdown,
      },
    ]
    expect(evaluate({ runtimeHeadingBank: changedRuntime })).toEqual(
      expect.arrayContaining([
        `Unsupported candidate entered runtime: ${unsupported.id}`,
        `Runtime content drift: ${unsupported.id}`,
      ]),
    )
  })

  it("blocks publish-set and unknown editorial drift", () => {
    const { editorialQueue } = acceptedWorkflow()
    editorialQueue.decisions.push({
      candidateId: "unknown-candidate",
      candidateDigest: "unknown",
      fixtureResultsDigest: null,
      status: "blocked",
      reason: "unknown",
      editorialActor: null,
    })
    expect(evaluate({
      runtimeHeadingBank: runtime.slice(1),
      editorialQueue,
    })).toEqual(
      expect.arrayContaining([
        "Unknown editorial candidate: unknown-candidate",
        "Runtime publish set does not equal the accepted editorial set",
      ]),
    )
  })
})
