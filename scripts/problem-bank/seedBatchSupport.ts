import { readFile, readdir, mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { normalizeProblem } from "../../src/content/normalizeProblem"
import { level12SeedFixtures } from "../../src/content/level12SeedFixtures"
import { level12SeedProblems } from "../../src/content/level12SeedProblems"
import { level35SeedFixtures } from "../../src/content/level35SeedFixtures"
import { level35SeedProblems } from "../../src/content/level35SeedProblems"
import type { ProblemFixture, ProblemInput } from "../../src/content/types"
import { validateProblemBank } from "../../src/content/validateProblemBank"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import {
  buildReviewManifest,
  buildTracker,
  compileAcceptedBank,
  createRuntimeProjections,
  evaluateBatchEvidence,
  normalizeBatch,
  verifyBatchFixtures,
} from "./batchPipeline.mjs"
import { canonicalJson, sha256 } from "./pipeline.mjs"

export const SEED_BATCH_ID = "2026-07-19-milestone-1-foundation-001"

const BANK_ROOT = "curriculum/problem-bank"
const BATCH_ROOT = `${BANK_ROOT}/batches/${SEED_BATCH_ID}`
const POLICY_FILE = `${BANK_ROOT}/engine-contract-policy.json`

const fixtureRoleMap = {
  canonical: "canonical",
  "different-prose": "alternate-prose",
  "case-spelling-variation": "case-or-spelling",
  missing: "missing-required",
  malformed: "malformed-required",
  "matched-with-review": "matched-with-review",
  "edge-case": "edge-case",
} as const

type JsonRecord = Record<string, unknown>

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8"))
}

async function optionalJson(path: string) {
  try {
    return await readJson(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
    throw error
  }
}

function prettyJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function toBatchFixture(fixture: ProblemFixture) {
  if (!fixture.id || !fixture.role) {
    throw new Error(`Seed fixture for ${fixture.problemId} lacks schema-v2 identity metadata`)
  }
  return {
    id: fixture.id,
    problemId: fixture.problemId,
    problemRevision: fixture.problemRevision ?? 1,
    role: fixtureRoleMap[fixture.role],
    ...(fixture.exercisesCheckId
      ? { exercisesCheckId: fixture.exercisesCheckId }
      : {}),
    source: fixture.source,
    expectedStatus: fixture.expectedStatus,
    ...(fixture.expectedFeedbackId
      ? { expectedFeedbackId: fixture.expectedFeedbackId }
      : {}),
    ...(fixture.expectedReviewIds
      ? { expectedReviewIds: [...fixture.expectedReviewIds] }
      : {}),
  }
}

function toBatchCandidate(problem: (typeof level12SeedProblems)[number]) {
  const { sourceBatchId: _sourceBatchId, ...candidate } = structuredClone(problem)
  return candidate
}

async function buildEngineContract(repositoryRoot: string) {
  const policy = await readJson(resolve(repositoryRoot, POLICY_FILE))
  const files = await Promise.all(
    policy.files.map(async (path: string) => ({
      path,
      sha256: sha256(await readFile(resolve(repositoryRoot, path), "utf8")),
    })),
  )
  const packageJson = await readJson(resolve(repositoryRoot, "package.json"))
  const dependencies = policy.dependencies.map(
    ({ name, version }: { name: string; version: string }) => {
      const actual = packageJson.dependencies?.[name]
      if (actual !== version) {
        throw new Error(
          `Engine dependency ${name} must be pinned to ${version}; received ${String(actual)}`,
        )
      }
      return { name, version }
    },
  )
  const policyDigest = sha256(policy)
  const artifact = {
    schemaVersion: 2,
    policyId: policy.policyId,
    policyDigest,
    files,
    dependencies,
  }
  return { ...artifact, engineContractDigest: sha256(artifact) }
}

export async function buildSeedBatchArtifacts({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  const prompt = await readFile(
    resolve(repositoryRoot, BATCH_ROOT, "generation-prompt.md"),
    "utf8",
  )
  const fixtures = [...level12SeedFixtures, ...level35SeedFixtures]
  const seedProblems = [...level12SeedProblems, ...level35SeedProblems]
  const sourceValidationErrors = validateProblemBank(seedProblems, fixtures)
  if (sourceValidationErrors.length > 0) {
    throw new Error(`Schema-v2 seed validation failed:\n${sourceValidationErrors.join("\n")}`)
  }

  const raw = {
    schemaVersion: 2,
    batchId: SEED_BATCH_ID,
    sequence: 1,
    curriculumVersion: "2026-07-19",
    generatedBy: "codex-build-time-seed-materializer",
    generatedOn: "2026-07-19",
    candidates: seedProblems.map(toBatchCandidate),
  }
  const normalized = normalizeBatch(raw, prompt)
  const fixtureArtifact = {
    schemaVersion: 2,
    batchId: SEED_BATCH_ID,
    fixtures: fixtures.map(toBatchFixture).sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  }
  const engineContract = await buildEngineContract(repositoryRoot)
  const verification = await verifyBatchFixtures({
    normalized,
    fixtureArtifact,
    engineContractDigest: engineContract.engineContractDigest,
    materialize: (candidate: JsonRecord) => {
      const { candidateDigest: _candidateDigest, sourceBatch, ...input } = candidate
      return normalizeProblem({
        ...input,
        sourceBatchId: sourceBatch,
      } as ProblemInput)
    },
    evaluate: evaluateProblem,
  })
  const manifest = buildReviewManifest({
    normalized,
    fixtureArtifact,
    verification,
  })

  const pendingCompiled = compileAcceptedBank([])
  const runtimeProjections = createRuntimeProjections(pendingCompiled)
  const tracker = buildTracker(pendingCompiled)
  const preparedSummaryBase = {
    schemaVersion: 2,
    batchId: SEED_BATCH_ID,
    status: "awaiting-independent-review",
    candidateCount: normalized.candidateCount,
    fixtureCount: fixtureArtifact.fixtures.length,
    passingCandidateCount: verification.candidates.filter(
      (candidate: { passed: boolean }) => candidate.passed,
    ).length,
    normalizedArtifactDigest: normalized.artifactDigest,
    verificationDigest: verification.verificationDigest,
    manifestDigest: manifest.manifestDigest,
    engineContractDigest: engineContract.engineContractDigest,
    requiredIndependentReviews: 2,
    committedIndependentReviews: 0,
    editorialPresent: false,
    publishedAcceptedTotal: 0,
  }
  const preparedSummary = {
    ...preparedSummaryBase,
    preparedSummaryDigest: sha256(preparedSummaryBase),
  }

  return {
    raw,
    normalized,
    fixtureArtifact,
    engineContract,
    verification,
    manifest,
    runtimeProjections,
    tracker,
    preparedSummary,
  }
}

export async function writeSeedBatchArtifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
}) {
  const batchDir = resolve(repositoryRoot, BATCH_ROOT)
  await mkdir(resolve(batchDir, "reviews"), { recursive: true })
  const artifacts = [
    ["candidates.raw.json", computed.raw],
    ["candidates.normalized.json", computed.normalized],
    ["fixtures.json", computed.fixtureArtifact],
    ["engine-contract.json", computed.engineContract],
    ["verification.json", computed.verification],
    ["review-manifest.json", computed.manifest],
    ["prepared-summary.generated.json", computed.preparedSummary],
  ] as const
  const reviewFiles = (await readdir(resolve(batchDir, "reviews"), {
    withFileTypes: true,
  })).filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  if (reviewFiles.length > 0 || (await optionalJson(resolve(batchDir, "editorial.json")))) {
    throw new Error(
      `Batch ${SEED_BATCH_ID} is immutable after review or editorial evidence exists`,
    )
  }
  for (const [file, expected] of artifacts) {
    const existing = await optionalJson(resolve(batchDir, file))
    if (existing !== null && canonicalJson(existing) !== canonicalJson(expected)) {
      throw new Error(
        `Batch ${SEED_BATCH_ID} is immutable; create a new batch instead of replacing ${file}`,
      )
    }
  }
  await Promise.all(
    artifacts.map(([file, value]) =>
      writeFile(resolve(batchDir, file), prettyJson(value), "utf8"),
    ),
  )
  await Promise.all([
    writeFile(
      resolve(repositoryRoot, BANK_ROOT, "runtime-projections.generated.json"),
      prettyJson(computed.runtimeProjections),
      "utf8",
    ),
    writeFile(
      resolve(repositoryRoot, BANK_ROOT, "tracker.generated.json"),
      prettyJson(computed.tracker),
      "utf8",
    ),
  ])
}

export async function readCommittedSeedBatch({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  const batchDir = resolve(repositoryRoot, BATCH_ROOT)
  const reviewFiles = (await readdir(resolve(batchDir, "reviews"), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort()
  return {
    raw: await readJson(resolve(batchDir, "candidates.raw.json")),
    normalized: await readJson(resolve(batchDir, "candidates.normalized.json")),
    fixtureArtifact: await readJson(resolve(batchDir, "fixtures.json")),
    engineContract: await readJson(resolve(batchDir, "engine-contract.json")),
    verification: await readJson(resolve(batchDir, "verification.json")),
    manifest: await readJson(resolve(batchDir, "review-manifest.json")),
    preparedSummary: await readJson(
      resolve(batchDir, "prepared-summary.generated.json"),
    ),
    summary: await optionalJson(resolve(batchDir, "summary.generated.json")),
    reviews: await Promise.all(
      reviewFiles.map((file) => readJson(resolve(batchDir, "reviews", file))),
    ),
    editorial: await optionalJson(resolve(batchDir, "editorial.json")),
    runtimeProjections: await readJson(
      resolve(repositoryRoot, BANK_ROOT, "runtime-projections.generated.json"),
    ),
    tracker: await readJson(
      resolve(repositoryRoot, BANK_ROOT, "tracker.generated.json"),
    ),
  }
}

function mechanicalDriftErrors({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedSeedBatch>>
}) {
  const errors: string[] = []
  const comparisons = [
    ["raw candidates", computed.raw, committed.raw],
    ["normalized candidates", computed.normalized, committed.normalized],
    ["fixture artifact", computed.fixtureArtifact, committed.fixtureArtifact],
    ["engine contract", computed.engineContract, committed.engineContract],
    ["verification", computed.verification, committed.verification],
    ["review manifest", computed.manifest, committed.manifest],
    ["prepared summary", computed.preparedSummary, committed.preparedSummary],
  ] as const
  for (const [label, expected, actual] of comparisons) {
    if (canonicalJson(expected) !== canonicalJson(actual)) {
      errors.push(`Committed ${label} has deterministic drift`)
    }
  }
  return errors
}

function withoutDigest(value: JsonRecord, field: string) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== field),
  )
}

function validateCommittedReviews({
  computed,
  reviews,
}: {
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
  reviews: JsonRecord[]
}) {
  const errors: string[] = []
  const reviewerIds = new Set<string>()
  const reviewRunIds = new Set<string>()
  for (const review of reviews) {
    const reviewerId = review.reviewerId
    const reviewRunId = review.reviewRunId
    if (review.schemaVersion !== 2) {
      errors.push(`Invalid review schema: ${String(reviewerId ?? "<unknown>")}`)
    }
    if (review.declaredIndependent !== true) {
      errors.push(
        `Review must declare independence: ${String(reviewerId ?? "<unknown>")}`,
      )
    }
    if (typeof reviewerId !== "string" || !reviewerId.trim()) {
      errors.push("Review reviewerId must be a non-empty string")
    } else if (reviewerIds.has(reviewerId)) {
      errors.push(`Duplicate reviewer identity: ${reviewerId}`)
    } else {
      reviewerIds.add(reviewerId)
    }
    if (typeof reviewRunId !== "string" || !reviewRunId.trim()) {
      errors.push("Review reviewRunId must be a non-empty string")
    } else if (reviewRunIds.has(reviewRunId)) {
      errors.push(`Duplicate review run: ${reviewRunId}`)
    } else {
      reviewRunIds.add(reviewRunId)
    }
    if (
      review.batchId !== computed.normalized.batchId ||
      review.manifestDigest !== computed.manifest.manifestDigest
    ) {
      errors.push(`Stale review scope: ${String(reviewerId ?? "<unknown>")}`)
    }
    if (
      typeof review.reviewDigest !== "string" ||
      review.reviewDigest !== sha256(withoutDigest(review, "reviewDigest"))
    ) {
      errors.push(`Stale review digest: ${String(reviewerId ?? "<unknown>")}`)
    }
    const verdicts = Array.isArray(review.verdicts) ? review.verdicts : []
    for (const candidate of computed.normalized.candidates) {
      const evidence = computed.verification.candidates.find(
        (item: { candidateId: string; revision: number }) =>
          item.candidateId === candidate.id && item.revision === candidate.revision,
      )
      const matching = verdicts.filter(
        (verdict: JsonRecord) =>
          verdict.candidateId === candidate.id &&
          verdict.revision === candidate.revision,
      )
      if (matching.length !== 1) {
        errors.push(
          `Review ${String(reviewerId ?? "<unknown>")} requires one verdict for ${candidate.id}`,
        )
        continue
      }
      const verdict = matching[0]
      if (
        verdict.candidateDigest !== candidate.candidateDigest ||
        verdict.fixtureResultsDigest !== evidence?.fixtureResultsDigest
      ) {
        errors.push(
          `Stale review evidence: ${candidate.id}/${String(reviewerId ?? "<unknown>")}`,
        )
      }
      if (!["pass", "fail"].includes(String(verdict.verdict))) {
        errors.push(
          `Invalid review verdict: ${candidate.id}/${String(reviewerId ?? "<unknown>")}`,
        )
      }
    }
  }
  return errors
}

function evidenceBatch(committed: Awaited<ReturnType<typeof readCommittedSeedBatch>>) {
  return {
    normalized: committed.normalized,
    fixtureArtifact: committed.fixtureArtifact,
    verification: committed.verification,
    manifest: committed.manifest,
    reviews: committed.reviews,
    editorial: committed.editorial,
  }
}

export function buildSeedBatchPublication({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedSeedBatch>>
}) {
  const errors = [
    ...mechanicalDriftErrors({ computed, committed }),
    ...validateCommittedReviews({ computed, reviews: committed.reviews }),
  ]
  if (committed.reviews.length < 2) {
    errors.push("Foundation seed batch requires two independent reviews")
  }
  if (committed.editorial === null) {
    errors.push("Foundation seed batch requires separate editorial evidence")
  } else if (
    committed.reviews.some(
      (review) => review.reviewerId === committed.editorial?.editorialActor,
    )
  ) {
    errors.push("Foundation editorial actor must differ from every reviewer")
  }
  const batch = evidenceBatch(committed)
  const evaluated = evaluateBatchEvidence(batch)
  errors.push(...evaluated.errors)
  const compiled = compileAcceptedBank([batch])
  errors.push(...compiled.errors)
  const runtimeProjections = createRuntimeProjections(compiled)
  const tracker = buildTracker(compiled)
  const summaryBase = {
    schemaVersion: 2,
    batchId: computed.normalized.batchId,
    status: "published",
    batchDigest: evaluated.batchDigest,
    bankDigest: compiled.bankDigest,
    projectionDigest: runtimeProjections.projectionDigest,
    trackerDigest: tracker.trackerDigest,
    generated: evaluated.summary.generated,
    accepted: evaluated.summary.accepted,
    rejected: evaluated.summary.rejected,
    blocked: evaluated.summary.blocked,
    counts: {
      byLevel: tracker.counts.byLevel,
      byFamily: tracker.counts.byFamily,
      byLevelAndFamily: tracker.counts.byLevelAndFamily,
      byFlavor: tracker.counts.byFlavor,
    },
    manifestDigest: computed.manifest.manifestDigest,
    reviewDigests: committed.reviews
      .map((review) => review.reviewDigest)
      .sort(),
    editorialDigest: committed.editorial?.editorialDigest ?? null,
  }
  const summary = { ...summaryBase, summaryDigest: sha256(summaryBase) }
  return {
    errors: [...new Set(errors)],
    runtimeProjections,
    tracker,
    summary,
  }
}

function publicationDriftErrors({
  expected,
  committed,
}: {
  expected: ReturnType<typeof buildSeedBatchPublication>
  committed: Awaited<ReturnType<typeof readCommittedSeedBatch>>
}) {
  const errors: string[] = []
  for (const [label, expectedValue, committedValue] of [
    ["runtime projections", expected.runtimeProjections, committed.runtimeProjections],
    ["tracker", expected.tracker, committed.tracker],
    ["batch summary", expected.summary, committed.summary],
  ] as const) {
    if (canonicalJson(expectedValue) !== canonicalJson(committedValue)) {
      errors.push(
        `Published ${label} is stale; run npm run bank:batch:publish`,
      )
    }
  }
  return errors
}

export function checkSeedBatchState({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedSeedBatch>>
}) {
  const errors = [
    ...mechanicalDriftErrors({ computed, committed }),
    ...validateCommittedReviews({ computed, reviews: committed.reviews }),
  ]
  const committedIndependentReviews = committed.reviews.length
  if (errors.length > 0) {
    return { status: "invalid-review-evidence", errors, committedIndependentReviews }
  }
  if (committed.editorial === null) {
    if (canonicalJson(computed.runtimeProjections) !== canonicalJson(committed.runtimeProjections)) {
      errors.push("Runtime projections must remain empty before editorial acceptance")
    }
    if (canonicalJson(computed.tracker) !== canonicalJson(committed.tracker)) {
      errors.push("Tracker must remain empty before editorial acceptance")
    }
    if (committed.summary !== null) {
      errors.push("Batch summary must be absent before editorial acceptance")
    }
    const status =
      committedIndependentReviews === 0
        ? "awaiting-independent-review"
        : committedIndependentReviews === 1
          ? "awaiting-second-independent-review"
          : "awaiting-editorial"
    return { status, errors, committedIndependentReviews }
  }

  const publication = buildSeedBatchPublication({ computed, committed })
  if (publication.errors.length > 0) {
    return {
      status: "invalid-editorial-evidence",
      errors: publication.errors,
      committedIndependentReviews,
    }
  }
  const publicationErrors = publicationDriftErrors({
    expected: publication,
    committed,
  })
  return {
    status: publicationErrors.length > 0 ? "ready-to-publish" : "published",
    errors: publicationErrors,
    committedIndependentReviews,
  }
}

export async function publishSeedBatchArtifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildSeedBatchArtifacts>>
}) {
  const committed = await readCommittedSeedBatch({ repositoryRoot })
  const publication = buildSeedBatchPublication({ computed, committed })
  if (publication.errors.length > 0) {
    throw new Error(
      `Cannot publish ${SEED_BATCH_ID}:\n${publication.errors.join("\n")}`,
    )
  }
  await Promise.all([
    writeFile(
      resolve(repositoryRoot, BANK_ROOT, "runtime-projections.generated.json"),
      prettyJson(publication.runtimeProjections),
      "utf8",
    ),
    writeFile(
      resolve(repositoryRoot, BANK_ROOT, "tracker.generated.json"),
      prettyJson(publication.tracker),
      "utf8",
    ),
    writeFile(
      resolve(repositoryRoot, BATCH_ROOT, "summary.generated.json"),
      prettyJson(publication.summary),
      "utf8",
    ),
  ])
}
