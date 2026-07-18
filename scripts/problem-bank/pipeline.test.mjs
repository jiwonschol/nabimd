import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  canonicalJson,
  createFixtureReviewDigest,
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
      reason: "independent-review-and-editorial-pass",
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

  it("binds fixture review approval to the complete runtime problem", () => {
    const base = {
      candidateDigest: "candidate-digest",
      problem: {
        id: "heading-apple",
        prompt: "Rebuild the heading below in Markdown.",
        hints: ["Use one hash."],
      },
      results: [{ fixture: { kind: "canonical", source: "# Apple" }, actual: { status: "perfect" } }],
    }

    expect(createFixtureReviewDigest(base)).not.toBe(
      createFixtureReviewDigest({
        ...base,
        problem: { ...base.problem, prompt: "A changed learner prompt." },
      }),
    )
    expect(createFixtureReviewDigest(base)).not.toBe(
      createFixtureReviewDigest({
        ...base,
        results: [{ fixture: { kind: "canonical", source: "# Changed" }, actual: { status: "perfect" } }],
      }),
    )
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

  it("rejects malformed artifact, family, and candidate records safely", () => {
    expect(validateRawArtifact(null)).toEqual(
      expect.arrayContaining(["Artifact root must be an object"]),
    )

    const invalidMetadata = structuredClone(raw)
    invalidMetadata.generatedBy = "  "
    invalidMetadata.generatedOn = null
    invalidMetadata.promptFile = ""
    invalidMetadata.families[0] = null
    invalidMetadata.families[1].candidates[0] = null

    expect(() => validateRawArtifact(invalidMetadata)).not.toThrow()
    expect(validateRawArtifact(invalidMetadata)).toEqual(
      expect.arrayContaining([
        "Artifact has invalid generatedBy",
        "Artifact has invalid generatedOn",
        "Artifact has invalid promptFile",
        "Family at index 0 must be an object",
        "Family emphasis candidate at index 0 must be an object",
      ]),
    )
  })

  it("returns errors for non-array candidate collections instead of throwing", () => {
    const invalid = structuredClone(raw)
    invalid.families[0].candidates = {}
    invalid.families[1].candidates = "bad"

    expect(() => validateRawArtifact(invalid)).not.toThrow()
    expect(validateRawArtifact(invalid)).toEqual(
      expect.arrayContaining([
        "Family headings must contain exactly 16 candidates",
        "Family emphasis must contain exactly 16 candidates",
      ]),
    )
  })

  it("rejects candidate IDs that are not kebab-case", () => {
    const invalid = structuredClone(raw)
    invalid.families[0].candidates[0].id = "Heading_Apple"

    expect(validateRawArtifact(invalid)).toContain(
      "Candidate Heading_Apple must use a kebab-case ID",
    )
  })

  it("rejects malformed candidate metadata overrides", () => {
    const invalid = structuredClone(raw)
    Object.assign(invalid.families[0].candidates[0], {
      expectedSkill: "  ",
      likelyMalformedTrap: 42,
      editorialNote: null,
    })

    expect(validateRawArtifact(invalid)).toEqual(
      expect.arrayContaining([
        "Candidate heading-apple has invalid expectedSkill override",
        "Candidate heading-apple has invalid likelyMalformedTrap override",
        "Candidate heading-apple has invalid editorialNote override",
      ]),
    )
  })

  it("accepts a complete, unanimous, digest-bound workflow", () => {
    expect(evaluate()).toEqual([])
  })

  it("blocks a missing independent reviewer", () => {
    const { reviews } = acceptedWorkflow()
    expect(evaluate({ reviews: reviews.filter((review) => review.reviewerId === "reviewer-a") }))
      .toContain(
        "Candidate heading-apple requires two declared-independent reviews",
      )
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

  it("rejects missing or non-positive fixture counts", () => {
    const { reviews } = acceptedWorkflow()
    const missingCounts = { ...fixtureCounts }
    delete missingCounts["heading-apple"]
    reviews[0].fixtureCount = 0

    expect(evaluate({ fixtureCounts: missingCounts, reviews })).toEqual(
      expect.arrayContaining([
        "Invalid fixture count: heading-apple",
        "Stale review digest: heading-apple/reviewer-a",
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

  it("rejects blank reviewer provenance and editorial identity", () => {
    const { reviews, editorialQueue } = acceptedWorkflow()
    reviews[0].reviewerId = "  "
    const decision = editorialQueue.decisions.find(
      (item) => item.candidateId === "heading-apple",
    )
    decision.editorialActor = "  "

    expect(evaluate({ reviews, editorialQueue })).toEqual(
      expect.arrayContaining([
        "Review has blank reviewerId",
        "Candidate heading-apple lacks digest-bound editorial acceptance",
      ]),
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
