import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import {
  buildReviewManifest,
  buildTracker,
  compileAcceptedBank,
  createRuntimeProjections,
  evaluateBatchEvidence,
  evaluateBankGate,
  loadBatchDirectories,
  normalizeBatch,
  sealEditorial,
  sealReview,
  validateAppendOnly,
  verifyLegacyEvidence,
  verifyBatchFixtures,
} from "./batchPipeline.mjs"

function rawCandidate(overrides = {}) {
  return {
    id: "heading-garden-notes",
    level: 1,
    familyId: "headings",
    skillIds: ["heading-h1"],
    difficulty: "warmup",
    teachingMode: "introduce",
    vocabulary: {
      profile: "everyday",
      domains: ["home"],
      terms: ["garden", "notes"],
    },
    teaching: {
      concept: "A main heading names the document.",
      howTo: "Type one hash and one space.",
      example: "# Picnic list",
    },
    syntaxTokens: ["#", "Space", "Title"],
    title: "Main heading",
    prompt: "Write a main heading.",
    target: "# Garden notes",
    starterText: "",
    matchChecks: [
      {
        id: "has-h1",
        kind: "has-heading",
        priority: 10,
        feedback: "Add a main heading.",
      },
    ],
    editorialChecks: [],
    hints: ["Use a heading.", "Start with a hash.", "Example: `# Picnic list`"],
    retryFamily: "heading-h1",
    contentVariant: "garden-notes",
    reviewTags: [],
    ...overrides,
  }
}

function rawBatch(overrides = {}) {
  return {
    schemaVersion: 2,
    batchId: "2026-07-19-l1-headings-001",
    sequence: 1,
    curriculumVersion: "2026-07-19",
    generatedBy: "gpt-5.6-build-time-agent",
    generatedOn: "2026-07-19",
    candidates: [rawCandidate()],
    ...overrides,
  }
}

function fixtures(
  candidateId = "heading-garden-notes",
  batchId = "2026-07-19-l1-headings-001",
  problemRevision = 1,
) {
  const passing = ["canonical", "alternate-prose", "case-or-spelling"]
    .map((role, index) => ({
      id: `${candidateId}-${role}`,
      problemId: candidateId,
      problemRevision,
      role,
      source: index === 0 ? "# Garden notes" : index === 1 ? "# Picnic plans" : "# gardn NOTES",
      expectedStatus: "matched",
      expectedReviewIds: [],
    }))
  return {
    schemaVersion: 2,
    batchId,
    fixtures: [
      ...passing,
      {
        id: `${candidateId}-missing`,
        problemId: candidateId,
        problemRevision,
        role: "missing-required",
        exercisesCheckId: "has-h1",
        source: "Garden notes",
        expectedStatus: "fail",
        expectedFeedbackId: "has-h1",
      },
      {
        id: `${candidateId}-malformed`,
        problemId: candidateId,
        problemRevision,
        role: "malformed-required",
        exercisesCheckId: "has-h1",
        source: "#Garden notes",
        expectedStatus: "fail",
        expectedFeedbackId: "has-h1",
      },
      {
        id: `${candidateId}-matched-with-review`,
        problemId: candidateId,
        problemRevision,
        role: "matched-with-review",
        source: "# Garden notes",
        expectedStatus: "matched",
        expectedReviewIds: [],
      },
    ],
  }
}

async function acceptedBatch({ raw = rawBatch(), prompt = "Generate guided headings.\n" } = {}) {
  const normalized = normalizeBatch(raw, prompt)
  const fixtureArtifact = fixtures(
    normalized.candidates[0].id,
    normalized.batchId,
    normalized.candidates[0].revision,
  )
  const verification = await verifyBatchFixtures({
    normalized,
    fixtureArtifact,
    engineContractDigest: "engine-contract-v1",
    evaluate: async (_problem, source) =>
      /^#\s/.test(source)
        ? { status: "matched", reviewItems: [] }
        : { status: "fail", feedbackId: "has-h1", message: "Add a heading." },
  })
  assert.deepEqual(verification.errors, [])
  const manifest = buildReviewManifest({ normalized, fixtureArtifact, verification })
  const verdict = {
    candidateId: normalized.candidates[0].id,
    revision: normalized.candidates[0].revision,
    candidateDigest: normalized.candidates[0].candidateDigest,
    fixtureResultsDigest: verification.candidates[0].fixtureResultsDigest,
    verdict: "pass",
    notes: "Recomputed the real-engine fixtures and inspected the grammar-only contract.",
  }
  const reviews = ["atlas", "orchid"].map((reviewerId) =>
    sealReview({
      schemaVersion: 2,
      batchId: normalized.batchId,
      reviewerId,
      reviewRunId: `${reviewerId}-run-001`,
      declaredIndependent: true,
      manifestDigest: manifest.manifestDigest,
      verdicts: [verdict],
    }),
  )
  const editorial = sealEditorial(
    {
      schemaVersion: 2,
      batchId: normalized.batchId,
      editorialActor: "editorial-agent-001",
      manifestDigest: manifest.manifestDigest,
      decisions: [
        {
          candidateId: normalized.candidates[0].id,
          revision: normalized.candidates[0].revision,
          candidateDigest: normalized.candidates[0].candidateDigest,
          fixtureResultsDigest: verification.candidates[0].fixtureResultsDigest,
          status: "accepted",
          checks: {
            levelFit: "pass",
            vocabularyFit: "pass",
            ambiguity: "pass",
            goalQuality: "pass",
            duplication: "pass",
            licensing: "pass",
            flavor: "pass",
            runtimeAiBoundary: "pass",
          },
          notes: "Guided everyday vocabulary fits Level 1.",
        },
      ],
    },
    reviews,
  )
  return { normalized, fixtureArtifact, verification, manifest, reviews, editorial }
}

test("normalization defaults standard flavor and binds prompt and candidate content", () => {
  const first = normalizeBatch(rawBatch(), "prompt one\n")
  const same = normalizeBatch(rawBatch(), "prompt one\n")
  const changedPrompt = normalizeBatch(rawBatch(), "prompt two\n")
  const changedCandidate = normalizeBatch(
    rawBatch({ candidates: [rawCandidate({ title: "Changed title" })] }),
    "prompt one\n",
  )

  assert.equal(first.candidates[0].flavor, "standard")
  assert.deepEqual(first.candidates[0].protectedContent, [])
  assert.equal(first.artifactDigest, same.artifactDigest)
  assert.notEqual(first.artifactDigest, changedPrompt.artifactDigest)
  assert.notEqual(first.candidates[0].candidateDigest, changedCandidate.candidates[0].candidateDigest)
})

test("normalization rejects invalid level metadata and non-standard flavor", () => {
  assert.throws(
    () => normalizeBatch(rawBatch({ candidates: [rawCandidate({ level: 2 })] }), "prompt\n"),
    /Level 2 requires vocabulary profile everyday-recall/,
  )
  assert.throws(
    () => normalizeBatch(rawBatch({ candidates: [rawCandidate({ flavor: "gfm" })] }), "prompt\n"),
    /unsupported flavor gfm/,
  )
  assert.throws(
    () => normalizeBatch(rawBatch({ candidates: [rawCandidate({ level: 5, teachingMode: "recall", vocabulary: { profile: "agent-workflow", domains: ["agents"], terms: ["guardrail"] } })] }), "prompt\n"),
    /Level 5 requires convention metadata/,
  )
})

test("verifier adapter runs committed fixtures through the supplied real engine", async () => {
  const normalized = normalizeBatch(rawBatch(), "prompt\n")
  const seen = []
  const verification = await verifyBatchFixtures({
    normalized,
    fixtureArtifact: fixtures(),
    engineContractDigest: "engine-contract-v1",
    evaluate: async (problem, source) => {
      seen.push([problem.id, source])
      return /^#\s/.test(source)
        ? { status: "matched", reviewItems: [] }
        : { status: "fail", feedbackId: "has-h1", message: "Add a heading." }
    },
  })

  assert.equal(seen.length, 6)
  assert.deepEqual(verification.errors, [])
  assert.equal(verification.candidates[0].fixtureCount, 6)
  assert.match(verification.candidates[0].fixtureResultsDigest, /^[a-f0-9]{64}$/)
})

test("verifier binds reviews to the complete materialized runtime problem", async () => {
  const normalized = normalizeBatch(rawBatch(), "prompt\n")
  const base = await verifyBatchFixtures({
    normalized,
    fixtureArtifact: fixtures(),
    engineContractDigest: "engine-contract-v1",
    materialize: (candidate) => ({ ...candidate, runtimePrompt: "First runtime prompt" }),
    evaluate: async (_problem, source) =>
      /^#\s/.test(source)
        ? { status: "matched", reviewItems: [] }
        : { status: "fail", feedbackId: "has-h1" },
  })
  const changed = await verifyBatchFixtures({
    normalized,
    fixtureArtifact: fixtures(),
    engineContractDigest: "engine-contract-v1",
    materialize: (candidate) => ({ ...candidate, runtimePrompt: "Changed runtime prompt" }),
    evaluate: async (_problem, source) =>
      /^#\s/.test(source)
        ? { status: "matched", reviewItems: [] }
        : { status: "fail", feedbackId: "has-h1" },
  })

  assert.notEqual(base.candidates[0].problemDigest, changed.candidates[0].problemDigest)
  assert.notEqual(
    base.candidates[0].fixtureResultsDigest,
    changed.candidates[0].fixtureResultsDigest,
  )
})

test("review disagreement and stale editorial evidence block acceptance", async () => {
  const evidence = await acceptedBatch()
  evidence.reviews[1] = sealReview({
    ...evidence.reviews[1],
    reviewDigest: undefined,
    verdicts: evidence.reviews[1].verdicts.map((item) => ({ ...item, verdict: "fail" })),
  })
  evidence.editorial = sealEditorial(
    { ...evidence.editorial, editorialDigest: undefined, reviewDigests: undefined },
    evidence.reviews,
  )

  const evaluated = evaluateBatchEvidence(evidence)
  assert.ok(evaluated.errors.some((error) => error.includes("Reviewer disagreement")))
  assert.equal(evaluated.acceptedProblems.length, 0)

  const stale = await acceptedBatch()
  stale.editorial.decisions[0].candidateDigest = "stale"
  assert.ok(
    evaluateBatchEvidence(stale).errors.some((error) => error.includes("Stale editorial evidence")),
  )
})

test("one reviewer cannot satisfy independence with duplicate verdict records", async () => {
  const evidence = await acceptedBatch()
  evidence.reviews = [
    sealReview({
      ...evidence.reviews[0],
      reviewDigest: undefined,
      verdicts: [evidence.reviews[0].verdicts[0], evidence.reviews[0].verdicts[0]],
    }),
  ]
  evidence.editorial = sealEditorial(
    { ...evidence.editorial, editorialDigest: undefined, reviewDigests: undefined },
    evidence.reviews,
  )

  assert.ok(
    evaluateBatchEvidence(evidence).errors.some((error) =>
      error.includes("requires two declared-independent reviews"),
    ),
  )
})

test("incomplete verification or editorial artifacts fail closed without throwing", async () => {
  const missingVerification = await acceptedBatch()
  missingVerification.verification.candidates = []
  assert.doesNotThrow(() => evaluateBatchEvidence(missingVerification))
  assert.ok(
    evaluateBatchEvidence(missingVerification).errors.some((error) =>
      error.includes("Missing verification evidence"),
    ),
  )

  const missingEditorial = await acceptedBatch()
  missingEditorial.editorial = null
  assert.doesNotThrow(() => evaluateBatchEvidence(missingEditorial))
  assert.ok(
    evaluateBatchEvidence(missingEditorial).errors.some((error) =>
      error.includes("Editorial artifact is invalid"),
    ),
  )
})

test("compiler publishes only accepted current records and tracker is deterministic", async () => {
  const evidence = await acceptedBatch()
  const compiled = compileAcceptedBank([evidence])
  assert.deepEqual(compiled.errors, [])
  assert.equal(compiled.problems.length, 1)
  assert.equal(compiled.problems[0].id, "heading-garden-notes")

  const tracker = buildTracker(compiled)
  assert.deepEqual(tracker, buildTracker(compiled))
  assert.equal(tracker.acceptedTotal, 1)
  assert.deepEqual(tracker.counts.byLevel, { "1": 1, "2": 0, "3": 0, "4": 0, "5": 0 })
  assert.deepEqual(tracker.counts.byFlavor, { standard: 1 })
  assert.equal(tracker.batches[0].accepted, 1)

  const duplicate = await acceptedBatch({
    raw: rawBatch({ batchId: "2026-07-19-l1-headings-002", sequence: 2 }),
  })
  assert.ok(
    compileAcceptedBank([evidence, duplicate]).errors.some((error) =>
      error.includes("Duplicate current problem revision: heading-garden-notes@1"),
    ),
  )

  const revised = await acceptedBatch({
    raw: rawBatch({
      batchId: "2026-07-19-l1-headings-003",
      sequence: 3,
      candidates: [rawCandidate({ revision: 2, title: "Revised main heading" })],
    }),
  })
  const withRevision = compileAcceptedBank([evidence, revised])
  assert.deepEqual(withRevision.errors, [])
  assert.equal(withRevision.problems.length, 1)
  assert.equal(withRevision.problems[0].revision, 2)
})

test("bank gate checks exact publish projections and committed tracker", async () => {
  const evidence = await acceptedBatch()
  const compiled = compileAcceptedBank([evidence])
  const projections = createRuntimeProjections(compiled)
  const tracker = buildTracker(compiled)

  assert.deepEqual(
    evaluateBankGate({
      batches: [evidence],
      published: projections,
      committedTracker: tracker,
    }).errors,
    [],
  )
  assert.equal(projections.levels[1].length, 1)
  assert.equal(projections.levels[1][0].sourceBatchId, evidence.normalized.batchId)
  assert.equal(JSON.stringify(projections).includes("fixtureResultsDigest"), false)

  const stalePublished = structuredClone(projections)
  stalePublished.levels[1] = []
  assert.ok(
    evaluateBankGate({
      batches: [evidence],
      published: stalePublished,
      committedTracker: tracker,
    }).errors.some((error) => error.includes("Runtime publish projection is stale")),
  )

  const staleTracker = { ...tracker, acceptedTotal: 999 }
  assert.ok(
    evaluateBankGate({
      batches: [evidence],
      published: projections,
      committedTracker: staleTracker,
    }).errors.some((error) => error.includes("Committed tracker is stale")),
  )
})

test("append-only validation rejects removed or mutated accepted batch evidence", async () => {
  const evidence = await acceptedBatch()
  const compiled = compileAcceptedBank([evidence])
  const baseline = buildTracker(compiled)

  assert.deepEqual(validateAppendOnly([evidence], baseline), [])
  assert.ok(validateAppendOnly([], baseline).some((error) => error.includes("Removed batch")))

  const changed = await acceptedBatch({ prompt: "changed prompt\n" })
  assert.ok(
    validateAppendOnly([changed], baseline).some((error) => error.includes("Mutated batch")),
  )
})

test("evidence requires declared-independent reviewers and a separate editorial actor", async () => {
  const evidence = await acceptedBatch()

  const undeclared = structuredClone(evidence)
  delete undeclared.reviews[0].declaredIndependent
  undeclared.reviews[0] = sealReview(undeclared.reviews[0])
  undeclared.editorial = sealEditorial(undeclared.editorial, undeclared.reviews)
  assert.ok(
    evaluateBatchEvidence(undeclared).errors.some((error) =>
      error.includes("Review must declare independence"),
    ),
  )

  const sameActor = structuredClone(evidence)
  sameActor.editorial = sealEditorial(
    { ...sameActor.editorial, editorialActor: sameActor.reviews[0].reviewerId },
    sameActor.reviews,
  )
  assert.ok(
    evaluateBatchEvidence(sameActor).errors.some((error) =>
      error.includes("Editorial actor must differ from reviewers"),
    ),
  )
})

test("editorial evidence rejects decisions for unknown candidates", async () => {
  const evidence = await acceptedBatch()
  evidence.editorial = sealEditorial(
    {
      ...evidence.editorial,
      decisions: [
        ...evidence.editorial.decisions,
        {
          candidateId: "not-in-this-batch",
          status: "rejected",
          checks: {},
        },
      ],
    },
    evidence.reviews,
  )

  assert.ok(
    evaluateBatchEvidence(evidence).errors.some((error) =>
      error.includes("Unknown editorial decision"),
    ),
  )
})

test("bank compilation reports loader errors without dereferencing partial batches", () => {
  const partial = {
    normalized: { batchId: "broken-batch" },
    loaderErrors: ["Cannot load broken-batch: missing fixtures.json"],
  }

  assert.doesNotThrow(() => compileAcceptedBank([partial]))
  assert.ok(
    compileAcceptedBank([partial]).errors.some((error) =>
      error.includes("missing fixtures.json"),
    ),
  )
})

test("legacy index freezes the schema-v1 evidence without promoting its counts", async () => {
  const repositoryRoot = process.cwd()
  const index = JSON.parse(
    await readFile(
      join(repositoryRoot, "curriculum/problem-bank/legacy/v1-128.index.json"),
      "utf8",
    ),
  )
  assert.equal(index.countsTowardSchemaV2, false)
  assert.deepEqual(await verifyLegacyEvidence({ repositoryRoot, index }), [])

  const stale = structuredClone(index)
  stale.artifacts[0].sha256 = "0".repeat(64)
  assert.ok(
    (await verifyLegacyEvidence({ repositoryRoot, index: stale })).some((error) =>
      error.includes("Legacy evidence digest drift"),
    ),
  )
})

test("filesystem loader discovers lexically ordered schema-v2 batch directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "nabimd-batches-"))
  const batchesDir = join(root, "batches")
  await mkdir(join(batchesDir, "batch-b", "reviews"), { recursive: true })
  await mkdir(join(batchesDir, "batch-a", "reviews"), { recursive: true })

  for (const batchId of ["batch-b", "batch-a"]) {
    const dir = join(batchesDir, batchId)
    const raw = rawBatch({ batchId, sequence: batchId === "batch-a" ? 1 : 2 })
    const normalized = normalizeBatch(raw, "prompt\n")
    await writeFile(join(dir, "generation-prompt.md"), "prompt\n")
    await writeFile(join(dir, "candidates.raw.json"), JSON.stringify(raw))
    await writeFile(join(dir, "candidates.normalized.json"), JSON.stringify(normalized))
    await writeFile(join(dir, "fixtures.json"), JSON.stringify(fixtures()))
    await writeFile(join(dir, "verification.json"), JSON.stringify({ schemaVersion: 2, batchId }))
    await writeFile(join(dir, "review-manifest.json"), JSON.stringify({ schemaVersion: 2, batchId }))
    await writeFile(join(dir, "editorial.json"), JSON.stringify({ schemaVersion: 2, batchId }))
  }

  const loaded = await loadBatchDirectories(root)
  assert.deepEqual(loaded.map((batch) => batch.normalized.batchId), ["batch-a", "batch-b"])
  assert.deepEqual(loaded.flatMap((batch) => batch.loaderErrors), [])
})
