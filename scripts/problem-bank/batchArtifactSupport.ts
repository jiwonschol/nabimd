import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { normalizeProblem } from "../../src/content/normalizeProblem"
import type {
  NormalizedProblem,
  ProblemFixture,
  ProblemInput,
} from "../../src/content/types"
import { validateProblemBank } from "../../src/content/validateProblemBank"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import {
  buildReviewManifest,
  buildTracker,
  compileAcceptedBank,
  createRuntimeProjections,
  evaluateBatchEvidence,
  loadBatchDirectories,
  normalizeBatch,
  verifyBatchFixtures,
} from "./batchPipeline.mjs"
import { canonicalJson, sha256 } from "./pipeline.mjs"

const DEFAULT_BANK_ROOT = "curriculum/problem-bank"
const DEFAULT_POLICY_FILE = `${DEFAULT_BANK_ROOT}/engine-contract-policy.json`

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

export type AuthoredBatchConfig = {
  batchId: string
  sequence: number
  curriculumVersion: string
  generatedBy: string
  generatedOn: string
  bankRoot?: string
  policyFile?: string
  requiredIndependentReviews?: number
}

type LoadedBatch = {
  normalized?: JsonRecord
  fixtureArtifact?: JsonRecord
  verification?: JsonRecord
  manifest?: JsonRecord
  reviews?: JsonRecord[]
  editorial?: JsonRecord | null
  loaderErrors?: string[]
}

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

function withoutDigest(value: JsonRecord, field: string) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field))
}

function toBatchFixture(fixture: ProblemFixture) {
  if (!fixture.id || !fixture.role) {
    throw new Error(`Fixture for ${fixture.problemId} lacks schema-v2 identity metadata`)
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

function toBatchCandidate(problem: NormalizedProblem) {
  const { sourceBatchId: _sourceBatchId, ...candidate } = structuredClone(problem)
  return candidate
}

async function buildEngineContract({
  repositoryRoot,
  policyFile,
}: {
  repositoryRoot: string
  policyFile: string
}) {
  const policy = await readJson(resolve(repositoryRoot, policyFile))
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

function batchDirectory(config: AuthoredBatchConfig) {
  return `${config.bankRoot ?? DEFAULT_BANK_ROOT}/batches/${config.batchId}`
}

function bankDirectory(config: AuthoredBatchConfig) {
  return config.bankRoot ?? DEFAULT_BANK_ROOT
}

async function loadPreviousBatches({
  repositoryRoot,
  config,
}: {
  repositoryRoot: string
  config: AuthoredBatchConfig
}) {
  const bankRoot = resolve(repositoryRoot, bankDirectory(config))
  const batches = (await loadBatchDirectories(bankRoot)) as LoadedBatch[]
  const otherBatches = batches.filter(
    (batch) => batch.normalized?.batchId !== config.batchId,
  )
  const invalidOtherBatches = otherBatches.flatMap((batch) =>
    (batch.loaderErrors ?? []).map(
      (error) => `${String(batch.normalized?.batchId ?? "<unknown>")}: ${error}`,
    ),
  )
  if (invalidOtherBatches.length > 0) {
    throw new Error(
      `Cannot prepare ${config.batchId} while another batch is invalid:\n${invalidOtherBatches.join("\n")}`,
    )
  }
  const sameSequence = otherBatches.filter(
    (batch) => batch.normalized?.sequence === config.sequence,
  )
  if (sameSequence.length > 0) {
    throw new Error(
      `Batch sequence ${config.sequence} is already used by ${sameSequence
        .map((batch) => String(batch.normalized?.batchId))
        .join(", ")}`,
    )
  }
  const previousBatches = otherBatches.filter(
    (batch) =>
      typeof batch.normalized?.sequence === "number" &&
      batch.normalized.sequence < config.sequence,
  )
  const laterBatches = otherBatches.filter(
    (batch) =>
      typeof batch.normalized?.sequence === "number" &&
      batch.normalized.sequence > config.sequence,
  )
  const compiled = compileAcceptedBank(previousBatches)
  if (compiled.errors.length > 0) {
    throw new Error(
      `Cannot prepare ${config.batchId} while prior batch evidence is invalid:\n${compiled.errors.join("\n")}`,
    )
  }
  return {
    previousBatches,
    laterBatches,
    compiled,
    runtimeProjections: createRuntimeProjections(compiled),
    tracker: buildTracker(compiled),
  }
}

export async function buildAuthoredBatchArtifacts({
  repositoryRoot,
  config,
  problems,
  fixtures,
}: {
  repositoryRoot: string
  config: AuthoredBatchConfig
  problems: readonly NormalizedProblem[]
  fixtures: readonly ProblemFixture[]
}) {
  const requiredIndependentReviews = config.requiredIndependentReviews ?? 2
  if (requiredIndependentReviews < 2) {
    throw new Error("Authored batches require at least two independent reviews")
  }
  const sourceBatchMismatches = problems
    .filter((problem) => problem.sourceBatchId !== config.batchId)
    .map((problem) => problem.id)
  if (sourceBatchMismatches.length > 0) {
    throw new Error(
      `Source batch metadata must match ${config.batchId}: ${sourceBatchMismatches.join(", ")}`,
    )
  }

  const sourceValidationErrors = validateProblemBank(problems, fixtures)
  if (sourceValidationErrors.length > 0) {
    throw new Error(
      `Schema-v2 authored batch validation failed:\n${sourceValidationErrors.join("\n")}`,
    )
  }

  const prompt = await readFile(
    resolve(repositoryRoot, batchDirectory(config), "generation-prompt.md"),
    "utf8",
  )
  const raw = {
    schemaVersion: 2,
    batchId: config.batchId,
    sequence: config.sequence,
    curriculumVersion: config.curriculumVersion,
    generatedBy: config.generatedBy,
    generatedOn: config.generatedOn,
    candidates: problems.map(toBatchCandidate),
  }
  const normalized = normalizeBatch(raw, prompt)
  const fixtureArtifact = {
    schemaVersion: 2,
    batchId: config.batchId,
    fixtures: fixtures.map(toBatchFixture).sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  }
  const engineContract = await buildEngineContract({
    repositoryRoot,
    policyFile: config.policyFile ?? DEFAULT_POLICY_FILE,
  })
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
  const manifest = buildReviewManifest({ normalized, fixtureArtifact, verification })
  const previous = await loadPreviousBatches({ repositoryRoot, config })
  const preparedSummaryBase = {
    schemaVersion: 2,
    batchId: config.batchId,
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
    requiredIndependentReviews,
    committedIndependentReviews: 0,
    editorialPresent: false,
    publishedAcceptedTotal: previous.tracker.acceptedTotal,
  }
  const preparedSummary = {
    ...preparedSummaryBase,
    preparedSummaryDigest: sha256(preparedSummaryBase),
  }

  return {
    config: { ...config, requiredIndependentReviews },
    raw,
    normalized,
    fixtureArtifact,
    engineContract,
    verification,
    manifest,
    preparedSummary,
    previousBatches: previous.previousBatches,
    laterBatches: previous.laterBatches,
    priorRuntimeProjections: previous.runtimeProjections,
    priorTracker: previous.tracker,
  }
}

export async function writeAuthoredBatchArtifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
}) {
  const batchDir = resolve(repositoryRoot, batchDirectory(computed.config))
  const reviewsDir = resolve(batchDir, "reviews")
  await mkdir(reviewsDir, { recursive: true })
  const reviewFiles = (await readdir(reviewsDir, { withFileTypes: true })).filter(
    (entry) => entry.isFile() && entry.name.endsWith(".json"),
  )
  if (reviewFiles.length > 0 || (await optionalJson(resolve(batchDir, "editorial.json")))) {
    throw new Error(
      `Batch ${computed.config.batchId} is immutable after review or editorial evidence exists`,
    )
  }

  const artifacts = [
    ["candidates.raw.json", computed.raw],
    ["candidates.normalized.json", computed.normalized],
    ["fixtures.json", computed.fixtureArtifact],
    ["engine-contract.json", computed.engineContract],
    ["verification.json", computed.verification],
    ["review-manifest.json", computed.manifest],
    ["prepared-summary.generated.json", computed.preparedSummary],
  ] as const
  for (const [file, expected] of artifacts) {
    const existing = await optionalJson(resolve(batchDir, file))
    if (existing !== null && canonicalJson(existing) !== canonicalJson(expected)) {
      throw new Error(
        `Batch ${computed.config.batchId} is immutable; create a new batch instead of replacing ${file}`,
      )
    }
  }
  await Promise.all(
    artifacts.map(([file, value]) =>
      writeFile(resolve(batchDir, file), prettyJson(value), "utf8"),
    ),
  )
}

export async function readCommittedAuthoredBatch({
  repositoryRoot,
  config,
}: {
  repositoryRoot: string
  config: AuthoredBatchConfig
}) {
  const batchDir = resolve(repositoryRoot, batchDirectory(config))
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
      resolve(repositoryRoot, bankDirectory(config), "runtime-projections.generated.json"),
    ),
    tracker: await readJson(
      resolve(repositoryRoot, bankDirectory(config), "tracker.generated.json"),
    ),
  }
}

function mechanicalDriftErrors({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedAuthoredBatch>>
}) {
  const errors: string[] = []
  for (const [label, expected, actual] of [
    ["raw candidates", computed.raw, committed.raw],
    ["normalized candidates", computed.normalized, committed.normalized],
    ["fixture artifact", computed.fixtureArtifact, committed.fixtureArtifact],
    ["engine contract", computed.engineContract, committed.engineContract],
    ["verification", computed.verification, committed.verification],
    ["review manifest", computed.manifest, committed.manifest],
    ["prepared summary", computed.preparedSummary, committed.preparedSummary],
  ] as const) {
    if (canonicalJson(expected) !== canonicalJson(actual)) {
      errors.push(`Committed ${label} has deterministic drift`)
    }
  }
  return errors
}

function validateCommittedReviews({
  computed,
  reviews,
}: {
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
  reviews: JsonRecord[]
}) {
  const errors: string[] = []
  const reviewerIds = new Set<string>()
  const reviewRunIds = new Set<string>()
  const candidateKeys = new Set(
    computed.normalized.candidates.map(
      (candidate: { id: string; revision: number }) =>
        `${candidate.id}@${candidate.revision}`,
    ),
  )
  for (const review of reviews) {
    const reviewerId = review.reviewerId
    const reviewRunId = review.reviewRunId
    if (review.schemaVersion !== 2) {
      errors.push(`Invalid review schema: ${String(reviewerId ?? "<unknown>")}`)
    }
    if (review.declaredIndependent !== true) {
      errors.push(`Review must declare independence: ${String(reviewerId ?? "<unknown>")}`)
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

    const verdicts = Array.isArray(review.verdicts)
      ? (review.verdicts as JsonRecord[])
      : []
    for (const verdict of verdicts) {
      const key = `${String(verdict.candidateId)}@${String(verdict.revision)}`
      if (!candidateKeys.has(key)) {
        errors.push(`Unknown review verdict: ${key}/${String(reviewerId ?? "<unknown>")}`)
      }
    }
    for (const candidate of computed.normalized.candidates) {
      const evidence = computed.verification.candidates.find(
        (item: { candidateId: string; revision: number }) =>
          item.candidateId === candidate.id && item.revision === candidate.revision,
      )
      const matching = verdicts.filter(
        (verdict) =>
          verdict.candidateId === candidate.id &&
          verdict.revision === candidate.revision,
      )
      if (matching.length !== 1) {
        errors.push(
          `Review ${String(reviewerId ?? "<unknown>")} requires one verdict for ${candidate.id}`,
        )
        continue
      }
      const verdict = matching[0]!
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

function evidenceBatch(
  committed: Awaited<ReturnType<typeof readCommittedAuthoredBatch>>,
) {
  return {
    normalized: committed.normalized,
    fixtureArtifact: committed.fixtureArtifact,
    verification: committed.verification,
    manifest: committed.manifest,
    reviews: committed.reviews,
    editorial: committed.editorial,
  }
}

export function buildAuthoredBatchPublication({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedAuthoredBatch>>
}) {
  const errors = [
    ...mechanicalDriftErrors({ computed, committed }),
    ...validateCommittedReviews({ computed, reviews: committed.reviews }),
  ]
  const requiredReviews = computed.config.requiredIndependentReviews ?? 2
  if (committed.reviews.length < requiredReviews) {
    errors.push(
      `Batch ${computed.config.batchId} requires ${requiredReviews} independent reviews`,
    )
  }
  if (committed.editorial === null) {
    errors.push(`Batch ${computed.config.batchId} requires separate editorial evidence`)
  } else if (
    committed.reviews.some(
      (review) => review.reviewerId === committed.editorial?.editorialActor,
    )
  ) {
    errors.push("Editorial actor must differ from every reviewer")
  }

  for (const review of committed.reviews) {
    for (const verdict of Array.isArray(review.verdicts) ? review.verdicts : []) {
      if (verdict.verdict !== "pass") {
        errors.push(
          `Batch ${computed.config.batchId} is fail-closed after reviewer disagreement: ${String(verdict.candidateId)}/${String(review.reviewerId)}`,
        )
      }
    }
  }
  if (committed.editorial !== null) {
    for (const decision of Array.isArray(committed.editorial.decisions)
      ? committed.editorial.decisions
      : []) {
      if (decision.status !== "accepted") {
        errors.push(
          `Batch ${computed.config.batchId} is fail-closed after editorial rejection: ${String(decision.candidateId)}`,
        )
      }
    }
  }

  const currentBatch = evidenceBatch(committed)
  const evaluated = evaluateBatchEvidence(currentBatch)
  errors.push(...evaluated.errors)
  const compiled = compileAcceptedBank([...computed.previousBatches, currentBatch])
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
  expected: ReturnType<typeof buildAuthoredBatchPublication>
  committed: Awaited<ReturnType<typeof readCommittedAuthoredBatch>>
}) {
  const errors: string[] = []
  for (const [label, expectedValue, committedValue] of [
    ["batch summary", expected.summary, committed.summary],
  ] as const) {
    if (canonicalJson(expectedValue) !== canonicalJson(committedValue)) {
      errors.push(`Published ${label} is stale; run the batch publication command`)
    }
  }
  return errors
}

export function checkAuthoredBatchState({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
  committed: Awaited<ReturnType<typeof readCommittedAuthoredBatch>>
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
    if (
      canonicalJson(computed.priorRuntimeProjections) !==
      canonicalJson(committed.runtimeProjections)
    ) {
      errors.push("Runtime projections must preserve the prior published bank before editorial acceptance")
    }
    if (canonicalJson(computed.priorTracker) !== canonicalJson(committed.tracker)) {
      errors.push("Tracker must preserve the prior published bank before editorial acceptance")
    }
    if (committed.summary !== null) {
      errors.push("Batch summary must be absent before editorial acceptance")
    }
    const requiredReviews = computed.config.requiredIndependentReviews ?? 2
    const status =
      committedIndependentReviews === 0
        ? "awaiting-independent-review"
        : committedIndependentReviews < requiredReviews
          ? "awaiting-second-independent-review"
          : "awaiting-editorial"
    return { status, errors, committedIndependentReviews }
  }

  const publication = buildAuthoredBatchPublication({ computed, committed })
  if (publication.errors.length > 0) {
    return {
      status: "invalid-editorial-evidence",
      errors: publication.errors,
      committedIndependentReviews,
    }
  }
  const publicationErrors = publicationDriftErrors({ expected: publication, committed })
  if (computed.laterBatches.length === 0) {
    for (const [label, expectedValue, committedValue] of [
      ["runtime projections", publication.runtimeProjections, committed.runtimeProjections],
      ["tracker", publication.tracker, committed.tracker],
    ] as const) {
      if (canonicalJson(expectedValue) !== canonicalJson(committedValue)) {
        publicationErrors.push(
          `Published ${label} is stale; run the batch publication command`,
        )
      }
    }
  }
  return {
    status: publicationErrors.length > 0 ? "ready-to-publish" : "published",
    errors: publicationErrors,
    committedIndependentReviews,
  }
}

export async function publishAuthoredBatchArtifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildAuthoredBatchArtifacts>>
}) {
  if (computed.laterBatches.length > 0) {
    throw new Error(
      `Cannot republish ${computed.config.batchId} after later batches exist; publish the latest batch instead`,
    )
  }
  const committed = await readCommittedAuthoredBatch({
    repositoryRoot,
    config: computed.config,
  })
  const publication = buildAuthoredBatchPublication({ computed, committed })
  if (publication.errors.length > 0) {
    throw new Error(
      `Cannot publish ${computed.config.batchId}:\n${publication.errors.join("\n")}`,
    )
  }
  await Promise.all([
    writeFile(
      resolve(repositoryRoot, bankDirectory(computed.config), "runtime-projections.generated.json"),
      prettyJson(publication.runtimeProjections),
      "utf8",
    ),
    writeFile(
      resolve(repositoryRoot, bankDirectory(computed.config), "tracker.generated.json"),
      prettyJson(publication.tracker),
      "utf8",
    ),
    writeFile(
      resolve(repositoryRoot, batchDirectory(computed.config), "summary.generated.json"),
      prettyJson(publication.summary),
      "utf8",
    ),
  ])
}
