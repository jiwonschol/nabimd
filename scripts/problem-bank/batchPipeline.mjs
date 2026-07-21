import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { canonicalJson, sha256 } from "./pipeline.mjs"

export const BATCH_SCHEMA_VERSION = 2
export const STANDARD_FLAVOR = "standard"

export const VOCABULARY_PROFILE_BY_LEVEL = Object.freeze({
  1: "everyday",
  2: "everyday-recall",
  3: "workplace-document",
  4: "development-spec",
  5: "agent-workflow",
})

export const REQUIRED_FIXTURE_ROLES = Object.freeze([
  "canonical",
  "alternate-prose",
  "case-or-spelling",
  "missing-required",
  "malformed-required",
  "matched-with-review",
])

export const REQUIRED_EDITORIAL_CHECKS = Object.freeze([
  "levelFit",
  "vocabularyFit",
  "ambiguity",
  "goalQuality",
  "duplication",
  "licensing",
  "flavor",
  "runtimeAiBoundary",
])

const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const CURRENT_AUTHORING_POLICY_SEQUENCE = 18
const AUTHORING_BUDGET_BY_LEVEL = Object.freeze({
  1: { maxLines: 3, maxWords: 10 },
  2: { maxLines: 14, maxWords: 60 },
  3: { maxLines: 28, maxWords: 150 },
  4: { maxLines: 40, maxWords: 165 },
  5: { maxLines: 40, maxWords: 165 },
})
const PROSE_GRADING_FIELDS = new Set([
  "caseSensitive",
  "expectedText",
  "prose",
  "requiredText",
  "spelling",
  "targetText",
])

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function withoutFields(value, fields) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, item]) => !fields.includes(key) && item !== undefined,
    ),
  )
}

function countDuplicates(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates].sort()
}

function candidateKey(id, revision = 1) {
  return `${String(id)}@${String(revision)}`
}

function requireString(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} must be a non-empty string`)
}

function requireStringArray(value, label, errors, { allowEmpty = false } = {}) {
  if (
    !Array.isArray(value) ||
    (!allowEmpty && value.length === 0) ||
    value.some((item) => typeof item !== "string" || !item.trim())
  ) {
    errors.push(`${label} must be ${allowEmpty ? "an" : "a non-empty"} array of strings`)
  }
}

function findForbiddenGradingField(value, path = "matchChecks") {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findForbiddenGradingField(item, `${path}[${index}]`)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  for (const [key, item] of Object.entries(value)) {
    if (PROSE_GRADING_FIELDS.has(key)) return `${path}.${key}`
    const found = findForbiddenGradingField(item, `${path}.${key}`)
    if (found) return found
  }
  return null
}

function authoredLineCount(source) {
  return source.length === 0 ? 0 : source.split(/\r?\n/).length
}

function authoredWordCount(source) {
  return source.match(/[A-Za-z0-9][A-Za-z0-9'`.:/-]*/g)?.length ?? 0
}

function validateCurrentAuthoringBudget(candidate, batch, id, errors) {
  if (
    !Number.isInteger(batch.sequence) ||
    batch.sequence < CURRENT_AUTHORING_POLICY_SEQUENCE ||
    !Number.isInteger(candidate.level) ||
    typeof candidate.target !== "string"
  ) {
    return
  }

  const budget = AUTHORING_BUDGET_BY_LEVEL[candidate.level]
  if (!budget) return

  const lineCount = authoredLineCount(candidate.target)
  const wordCount = authoredWordCount(candidate.target)
  if (lineCount > budget.maxLines) {
    errors.push(
      `Candidate ${id} target has ${lineCount} lines; Level ${candidate.level} allows at most ${budget.maxLines}`,
    )
  }
  if (wordCount > budget.maxWords) {
    errors.push(
      `Candidate ${id} target has ${wordCount} words; Level ${candidate.level} allows at most ${budget.maxWords}`,
    )
  }

  if (candidate.level < 3) return

  const documentLimits = Array.isArray(candidate.matchChecks)
    ? candidate.matchChecks.filter(
        (check) => isRecord(check) && check.kind === "document-limits",
      )
    : []
  if (documentLimits.length !== 1) {
    errors.push(
      `Candidate ${id} Level ${candidate.level} requires exactly one document-limits check`,
    )
    return
  }

  const maxLines = documentLimits[0].maxLines
  if (!Number.isInteger(maxLines) || maxLines < 0) {
    errors.push(
      `Candidate ${id} document-limits requires a non-negative integer maxLines`,
    )
    return
  }
  if (maxLines > budget.maxLines) {
    errors.push(
      `Candidate ${id} document-limits maxLines ${maxLines} exceeds Level ${candidate.level} ceiling ${budget.maxLines}`,
    )
  }
  if (lineCount > maxLines) {
    errors.push(
      `Candidate ${id} target has ${lineCount} lines but document-limits allows ${maxLines}`,
    )
  }
}

function validateCandidate(candidate, batch) {
  const id = typeof candidate?.id === "string" ? candidate.id : "<unknown>"
  const errors = []
  if (!isRecord(candidate)) return ["Candidate must be an object"]

  requireString(candidate.id, `Candidate ${id} id`, errors)
  if (typeof candidate.id === "string" && !KEBAB_CASE.test(candidate.id)) {
    errors.push(`Candidate ${id} must use a kebab-case ID`)
  }
  if (!Number.isInteger(candidate.level) || candidate.level < 1 || candidate.level > 5) {
    errors.push(`Candidate ${id} has invalid level`)
  }
  if (candidate.flavor !== undefined && candidate.flavor !== STANDARD_FLAVOR) {
    errors.push(`Candidate ${id} has unsupported flavor ${String(candidate.flavor)}`)
  }

  const expectedProfile = VOCABULARY_PROFILE_BY_LEVEL[candidate.level]
  if (expectedProfile && candidate.vocabulary?.profile !== expectedProfile) {
    errors.push(`Level ${candidate.level} requires vocabulary profile ${expectedProfile}`)
  }
  const expectedTeachingMode = candidate.level === 1 ? "introduce" : "recall"
  if (Number.isInteger(candidate.level) && candidate.teachingMode !== expectedTeachingMode) {
    errors.push(`Level ${candidate.level} requires teaching mode ${expectedTeachingMode}`)
  }
  if (candidate.level === 5) {
    if (
      !isRecord(candidate.convention) ||
      typeof candidate.convention.id !== "string" ||
      !candidate.convention.id.trim() ||
      typeof candidate.convention.version !== "string" ||
      !candidate.convention.version.trim() ||
      typeof candidate.convention.reviewedOn !== "string" ||
      !ISO_DATE.test(candidate.convention.reviewedOn)
    ) {
      errors.push(`Level 5 requires convention metadata for ${id}`)
    }
  } else if (candidate.convention !== undefined) {
    errors.push(`Only Level 5 may declare convention metadata for ${id}`)
  }

  for (const field of [
    "familyId",
    "difficulty",
    "teachingMode",
    "title",
    "prompt",
    "target",
    "retryFamily",
    "contentVariant",
  ]) {
    requireString(candidate[field], `Candidate ${id} ${field}`, errors)
  }
  requireStringArray(candidate.skillIds, `Candidate ${id} skillIds`, errors)
  requireStringArray(candidate.syntaxTokens, `Candidate ${id} syntaxTokens`, errors)
  requireStringArray(candidate.reviewTags, `Candidate ${id} reviewTags`, errors, { allowEmpty: true })
  if (candidate.protectedContent !== undefined) {
    requireStringArray(
      candidate.protectedContent,
      `Candidate ${id} protectedContent`,
      errors,
      { allowEmpty: true },
    )
  }
  requireStringArray(candidate.vocabulary?.domains, `Candidate ${id} vocabulary domains`, errors)
  requireStringArray(candidate.vocabulary?.terms, `Candidate ${id} vocabulary terms`, errors)

  for (const field of ["concept", "howTo", "example"]) {
    requireString(candidate.teaching?.[field], `Candidate ${id} teaching ${field}`, errors)
  }
  if (
    !Array.isArray(candidate.hints) ||
    candidate.hints.length !== 3 ||
    candidate.hints.some((hint) => typeof hint !== "string" || !hint.trim())
  ) {
    errors.push(`Candidate ${id} must provide exactly three non-empty hints`)
  }

  if (!Array.isArray(candidate.matchChecks) || candidate.matchChecks.length === 0) {
    errors.push(`Candidate ${id} requires at least one match check`)
  } else {
    const checkIds = []
    for (const check of candidate.matchChecks) {
      if (!isRecord(check)) {
        errors.push(`Candidate ${id} match check must be an object`)
        continue
      }
      requireString(check.id, `Candidate ${id} match check id`, errors)
      requireString(check.kind, `Candidate ${id} match check kind`, errors)
      requireString(check.feedback, `Candidate ${id} match check feedback`, errors)
      if (!Number.isInteger(check.priority)) {
        errors.push(`Candidate ${id} match check priority must be an integer`)
      }
      if (typeof check.id === "string") checkIds.push(check.id)
    }
    for (const duplicate of countDuplicates(checkIds)) {
      errors.push(`Candidate ${id} has duplicate match check ${duplicate}`)
    }
    const forbidden = findForbiddenGradingField(candidate.matchChecks)
    if (forbidden) errors.push(`Candidate ${id} uses forbidden prose-grading field ${forbidden}`)
  }

  if (!Array.isArray(candidate.editorialChecks)) {
    errors.push(`Candidate ${id} editorialChecks must be an array`)
  }
  if (candidate.starterText !== undefined && typeof candidate.starterText !== "string") {
    errors.push(`Candidate ${id} starterText must be a string`)
  }
  if (!Number.isInteger(candidate.revision ?? 1) || (candidate.revision ?? 1) < 1) {
    errors.push(`Candidate ${id} revision must be a positive integer`)
  }
  if (batch.curriculumVersion !== candidate.curriculumVersion && candidate.curriculumVersion !== undefined) {
    errors.push(`Candidate ${id} curriculumVersion must match its batch`)
  }
  validateCurrentAuthoringBudget(candidate, batch, id, errors)
  return errors
}

export function normalizeBatch(rawBatch, promptText) {
  if (!isRecord(rawBatch)) throw new Error("Batch root must be an object")
  const errors = []
  if (rawBatch.schemaVersion !== BATCH_SCHEMA_VERSION) errors.push("Batch has invalid schemaVersion")
  requireString(rawBatch.batchId, "Batch batchId", errors)
  if (!Number.isInteger(rawBatch.sequence) || rawBatch.sequence <= 0) {
    errors.push("Batch sequence must be a positive integer")
  }
  requireString(rawBatch.curriculumVersion, "Batch curriculumVersion", errors)
  requireString(rawBatch.generatedBy, "Batch generatedBy", errors)
  requireString(rawBatch.generatedOn, "Batch generatedOn", errors)
  if (typeof rawBatch.generatedOn === "string" && !ISO_DATE.test(rawBatch.generatedOn)) {
    errors.push("Batch generatedOn must use YYYY-MM-DD")
  }
  if (typeof promptText !== "string" || !promptText.trim()) errors.push("Generation prompt must not be blank")

  const rawCandidates = Array.isArray(rawBatch.candidates) ? rawBatch.candidates : []
  if (!Array.isArray(rawBatch.candidates) || rawCandidates.length === 0) {
    errors.push("Batch candidates must be a non-empty array")
  }
  for (const candidate of rawCandidates) errors.push(...validateCandidate(candidate, rawBatch))
  const recordKeys = rawCandidates
    .filter(isRecord)
    .map((candidate) => candidateKey(candidate.id, candidate.revision ?? 1))
  for (const duplicate of countDuplicates(recordKeys)) {
    errors.push(`Duplicate candidate revision: ${duplicate}`)
  }
  if (errors.length) throw new Error(errors.join("\n"))

  const candidates = rawCandidates
    .map((candidate) => {
      const normalized = {
        ...candidate,
        schemaVersion: BATCH_SCHEMA_VERSION,
        sourceBatch: rawBatch.batchId,
        curriculumVersion: rawBatch.curriculumVersion,
        revision: candidate.revision ?? 1,
        flavor: candidate.flavor ?? STANDARD_FLAVOR,
        starterText: candidate.starterText ?? "",
        protectedContent: candidate.protectedContent ?? [],
      }
      return { ...normalized, candidateDigest: sha256(normalized) }
    })
    .sort((left, right) =>
      left.id.localeCompare(right.id) || left.revision - right.revision,
    )

  const artifact = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    batchId: rawBatch.batchId,
    sequence: rawBatch.sequence,
    curriculumVersion: rawBatch.curriculumVersion,
    generatedBy: rawBatch.generatedBy,
    generatedOn: rawBatch.generatedOn,
    promptSha256: sha256(promptText),
    rawArtifactDigest: sha256(rawBatch),
    candidateCount: candidates.length,
    candidates,
  }
  return { ...artifact, artifactDigest: sha256(artifact) }
}

function validateFixtureArtifact(normalized, fixtureArtifact) {
  const errors = []
  if (!isRecord(fixtureArtifact) || fixtureArtifact.schemaVersion !== BATCH_SCHEMA_VERSION) {
    return ["Fixture artifact has invalid schemaVersion"]
  }
  if (fixtureArtifact.batchId !== normalized.batchId) {
    errors.push(`Fixture artifact batchId does not match ${normalized.batchId}`)
  }
  const allFixtures = Array.isArray(fixtureArtifact.fixtures) ? fixtureArtifact.fixtures : []
  if (!Array.isArray(fixtureArtifact.fixtures)) errors.push("Fixture artifact fixtures must be an array")
  for (const duplicate of countDuplicates(allFixtures.map((fixture) => fixture?.id))) {
    errors.push(`Duplicate fixture id: ${duplicate}`)
  }
  const candidateKeys = new Set(
    normalized.candidates.map((candidate) =>
      candidateKey(candidate.id, candidate.revision),
    ),
  )
  for (const fixture of allFixtures) {
    if (!isRecord(fixture)) {
      errors.push("Fixture must be an object")
      continue
    }
    for (const field of ["id", "problemId", "role", "source"]) {
      if (typeof fixture[field] !== "string" || (field !== "source" && !fixture[field].trim())) {
        errors.push(`Fixture ${fixture.id ?? "<unknown>"} has invalid ${field}`)
      }
    }
    if (!Number.isInteger(fixture.problemRevision) || fixture.problemRevision < 1) {
      errors.push(`Fixture ${fixture.id ?? "<unknown>"} has invalid problemRevision`)
    }
    if (!candidateKeys.has(candidateKey(fixture.problemId, fixture.problemRevision))) {
      errors.push(
        `Unknown fixture problem: ${candidateKey(fixture.problemId, fixture.problemRevision)}`,
      )
    }
    if (!["fail", "matched"].includes(fixture.expectedStatus)) {
      errors.push(`Fixture ${fixture.id ?? "<unknown>"} has invalid expected result`)
    }
  }

  for (const candidate of normalized.candidates) {
    const problemFixtures = allFixtures.filter(
      (fixture) =>
        fixture.problemId === candidate.id &&
        fixture.problemRevision === candidate.revision,
    )
    const roles = new Set(problemFixtures.map((fixture) => fixture.role))
    for (const role of REQUIRED_FIXTURE_ROLES) {
      if (!roles.has(role)) errors.push(`Candidate ${candidate.id} is missing fixture role ${role}`)
    }
    const exercisedChecks = new Set(
      problemFixtures.map((fixture) => fixture.exercisesCheckId).filter(Boolean),
    )
    for (const check of candidate.matchChecks) {
      if (!exercisedChecks.has(check.id)) {
        errors.push(`Candidate ${candidate.id} has no direct fixture for check ${check.id}`)
      }
    }
  }
  return errors
}

function normalizeEvaluation(actual) {
  if (actual?.status === "fail") {
    return { status: "fail", feedbackId: actual.feedbackId }
  }
  if (actual?.status === "matched") {
    return {
      status: "matched",
      reviewIds: Array.isArray(actual.reviewItems)
        ? actual.reviewItems.map((item) => item.id)
        : Array.isArray(actual.reviewIds)
          ? actual.reviewIds
          : [],
    }
  }
  return { status: "invalid" }
}

function expectedEvaluation(fixture) {
  return fixture.expectedStatus === "fail"
    ? { status: "fail", feedbackId: fixture.expectedFeedbackId }
    : { status: "matched", reviewIds: fixture.expectedReviewIds ?? [] }
}

export async function verifyBatchFixtures({
  normalized,
  fixtureArtifact,
  engineContractDigest,
  materialize = (candidate) => candidate,
  evaluate,
}) {
  // Stage 1 owns candidate -> GradableProblem materialization and Stage 2 owns
  // evaluateProblem. Keeping both callbacks injected prevents this build-time
  // pipeline from importing runtime engine/content modules or creating a
  // parallel grading implementation.
  if (typeof evaluate !== "function") throw new Error("A real-engine evaluate adapter is required")
  if (typeof materialize !== "function") throw new Error("The materialize adapter must be a function")
  const errors = validateFixtureArtifact(normalized, fixtureArtifact)
  requireString(engineContractDigest, "Engine contract digest", errors)
  const results = []
  const runtimeProblems = new Map()

  for (const candidate of normalized.candidates) {
    try {
      runtimeProblems.set(
        candidateKey(candidate.id, candidate.revision),
        await materialize(candidate),
      )
    } catch (error) {
      errors.push(
        `Candidate ${candidate.id} materialization error: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  for (const fixture of fixtureArtifact.fixtures ?? []) {
    const problem = runtimeProblems.get(
      candidateKey(fixture.problemId, fixture.problemRevision),
    )
    if (!problem) continue
    let actual
    try {
      actual = normalizeEvaluation(await evaluate(problem, fixture.source))
    } catch (error) {
      errors.push(`Fixture ${fixture.id} engine error: ${error instanceof Error ? error.message : String(error)}`)
      actual = { status: "engine-error" }
    }
    const expected = expectedEvaluation(fixture)
    const passed = canonicalJson(actual) === canonicalJson(expected)
    if (!passed) errors.push(`Fixture ${fixture.id} expected ${canonicalJson(expected)}, received ${canonicalJson(actual)}`)
    results.push({
      fixtureId: fixture.id,
      problemId: fixture.problemId,
      problemRevision: fixture.problemRevision,
      expected,
      actual,
      passed,
    })
  }

  const candidates = normalized.candidates.map((candidate) => {
    const problem = runtimeProblems.get(candidateKey(candidate.id, candidate.revision))
    const candidateFixtures = (fixtureArtifact.fixtures ?? [])
      .filter(
        (fixture) =>
          fixture.problemId === candidate.id &&
          fixture.problemRevision === candidate.revision,
      )
      .sort((left, right) => left.id.localeCompare(right.id))
    const candidateResults = results
      .filter(
        (result) =>
          result.problemId === candidate.id &&
          result.problemRevision === candidate.revision,
      )
      .sort((left, right) => left.fixtureId.localeCompare(right.fixtureId))
    const problemDigest = problem === undefined ? null : sha256(problem)
    const fixtureDefinitionDigest = sha256(candidateFixtures)
    const fixtureResultsDigest = sha256({
      candidateDigest: candidate.candidateDigest,
      problemDigest,
      fixtureDefinitionDigest,
      engineContractDigest,
      results: candidateResults,
    })
    return {
      candidateId: candidate.id,
      revision: candidate.revision,
      candidateDigest: candidate.candidateDigest,
      problemDigest,
      fixtureDefinitionDigest,
      fixtureResultsDigest,
      fixtureCount: candidateFixtures.length,
      passed:
        problem !== undefined &&
        candidateResults.length > 0 &&
        candidateResults.every((result) => result.passed),
    }
  })
  const artifact = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    batchId: normalized.batchId,
    engineContractDigest,
    candidates,
    results: results.sort((left, right) => left.fixtureId.localeCompare(right.fixtureId)),
    errors,
  }
  return { ...artifact, verificationDigest: sha256(artifact) }
}

export function buildReviewManifest({ normalized, fixtureArtifact, verification }) {
  const entries = normalized.candidates.map((candidate) => {
    const verified = verification.candidates?.find(
      (item) => item.candidateId === candidate.id && item.revision === candidate.revision,
    )
    return {
      candidateId: candidate.id,
      revision: candidate.revision,
      candidateDigest: candidate.candidateDigest,
      problemDigest: verified?.problemDigest ?? null,
      fixtureDefinitionDigest: verified?.fixtureDefinitionDigest ?? null,
      fixtureResultsDigest: verified?.fixtureResultsDigest ?? null,
      fixtureCount: verified?.fixtureCount ?? null,
      engineContractDigest: verification.engineContractDigest ?? null,
    }
  })
  const artifact = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    batchId: normalized.batchId,
    normalizedArtifactDigest: normalized.artifactDigest,
    fixtureArtifactDigest: sha256(fixtureArtifact),
    verificationDigest: verification.verificationDigest,
    entries,
  }
  return { ...artifact, manifestDigest: sha256(artifact) }
}

export function sealReview(review) {
  const artifact = withoutFields(review, ["reviewDigest"])
  return { ...artifact, reviewDigest: sha256(artifact) }
}

export function sealEditorial(editorial, reviews) {
  const reviewDigests = reviews.map((review) => review.reviewDigest).sort()
  const artifact = {
    ...withoutFields(editorial, ["editorialDigest", "reviewDigests"]),
    reviewDigests,
  }
  return { ...artifact, editorialDigest: sha256(artifact) }
}

function currentDigest(value, digestField) {
  return sha256(withoutFields(value, [digestField]))
}

function sortedStatuses(decisions, status) {
  return decisions.filter((decision) => decision.status === status)
}

export function evaluateBatchEvidence({
  normalized,
  fixtureArtifact,
  verification,
  manifest,
  reviews,
  editorial,
}) {
  const errors = []
  const editorialArtifact = isRecord(editorial) ? editorial : {}
  if (!isRecord(editorial)) errors.push(`Editorial artifact is invalid: ${normalized.batchId}`)
  const expectedNormalizedDigest = currentDigest(normalized, "artifactDigest")
  if (normalized.artifactDigest !== expectedNormalizedDigest) {
    errors.push(`Stale normalized artifact: ${normalized.batchId}`)
  }
  if (verification.verificationDigest !== currentDigest(verification, "verificationDigest")) {
    errors.push(`Stale verification artifact: ${normalized.batchId}`)
  }
  errors.push(...(verification.errors ?? []).map((error) => `Verification failed: ${error}`))

  const expectedManifest = buildReviewManifest({ normalized, fixtureArtifact, verification })
  if (canonicalJson(manifest) !== canonicalJson(expectedManifest)) {
    errors.push(`Stale review manifest: ${normalized.batchId}`)
  }
  const reviewArray = Array.isArray(reviews) ? reviews : []
  for (const review of reviewArray) {
    if (review.schemaVersion !== BATCH_SCHEMA_VERSION) {
      errors.push(`Invalid review schema: ${review.reviewerId ?? "<unknown>"}`)
    }
    if (review.declaredIndependent !== true) {
      errors.push(`Review must declare independence: ${review.reviewerId ?? "<unknown>"}`)
    }
    if (review.batchId !== normalized.batchId || review.manifestDigest !== expectedManifest.manifestDigest) {
      errors.push(`Stale review scope: ${review.reviewerId ?? "<unknown>"}`)
    }
    if (review.reviewDigest !== currentDigest(review, "reviewDigest")) {
      errors.push(`Stale review digest: ${review.reviewerId ?? "<unknown>"}`)
    }
    requireString(review.reviewerId, "Review reviewerId", errors)
    requireString(review.reviewRunId, "Review reviewRunId", errors)
  }
  const reviewerIds = reviewArray.map((review) => review.reviewerId)
  const runIds = reviewArray.map((review) => review.reviewRunId)
  for (const duplicate of countDuplicates(reviewerIds)) errors.push(`Duplicate reviewer identity: ${duplicate}`)
  for (const duplicate of countDuplicates(runIds)) errors.push(`Duplicate review run: ${duplicate}`)

  const expectedReviewDigests = reviewArray.map((review) => review.reviewDigest).sort()
  if (editorialArtifact.schemaVersion !== BATCH_SCHEMA_VERSION) {
    errors.push(`Invalid editorial schema: ${normalized.batchId}`)
  }
  if (
    editorialArtifact.batchId !== normalized.batchId ||
    editorialArtifact.manifestDigest !== expectedManifest.manifestDigest ||
    canonicalJson(editorialArtifact.reviewDigests ?? []) !== canonicalJson(expectedReviewDigests)
  ) {
    errors.push(`Stale editorial scope: ${normalized.batchId}`)
  }
  if (
    editorialArtifact.editorialDigest !==
    currentDigest(editorialArtifact, "editorialDigest")
  ) {
    errors.push(`Stale editorial digest: ${normalized.batchId}`)
  }
  requireString(editorialArtifact.editorialActor, "Editorial actor", errors)
  if (reviewerIds.includes(editorialArtifact.editorialActor)) {
    errors.push(`Editorial actor must differ from reviewers: ${editorialArtifact.editorialActor}`)
  }

  const decisions = Array.isArray(editorialArtifact.decisions) ? editorialArtifact.decisions : []
  const candidateKeys = new Set(
    normalized.candidates.map((candidate) =>
      candidateKey(candidate.id, candidate.revision),
    ),
  )
  for (const decision of decisions) {
    const key = candidateKey(decision.candidateId, decision.revision)
    if (!candidateKeys.has(key)) {
      errors.push(`Unknown editorial decision: ${key}`)
    }
  }
  for (const duplicate of countDuplicates(
    decisions.map((decision) => candidateKey(decision.candidateId, decision.revision)),
  )) {
    errors.push(`Duplicate editorial decision: ${duplicate}`)
  }
  const acceptedProblems = []
  for (const candidate of normalized.candidates) {
    const verified = verification.candidates?.find(
      (item) => item.candidateId === candidate.id && item.revision === candidate.revision,
    )
    if (!verified) errors.push(`Missing verification evidence: ${candidate.id}`)
    const decision = decisions.find(
      (item) =>
        item.candidateId === candidate.id && item.revision === candidate.revision,
    )
    if (!decision) {
      errors.push(`Missing editorial decision: ${candidate.id}`)
      continue
    }
    if (
      decision.candidateDigest !== candidate.candidateDigest ||
      decision.fixtureResultsDigest !== verified?.fixtureResultsDigest
    ) {
      errors.push(`Stale editorial evidence: ${candidate.id}`)
    }
    if (!["accepted", "rejected", "blocked"].includes(decision.status)) {
      errors.push(`Invalid editorial status: ${candidate.id}`)
      continue
    }
    if (decision.status !== "accepted") continue

    if (!verified?.passed) errors.push(`Candidate ${candidate.id} lacks passing verification`)
    for (const check of REQUIRED_EDITORIAL_CHECKS) {
      if (decision.checks?.[check] !== "pass") {
        errors.push(`Candidate ${candidate.id} failed editorial check ${check}`)
      }
    }
    const verdicts = reviewArray.flatMap((review) =>
      (review.verdicts ?? [])
        .filter(
          (verdict) =>
            verdict.candidateId === candidate.id &&
            verdict.revision === candidate.revision,
        )
        .map((verdict) => ({ ...verdict, reviewerId: review.reviewerId, reviewRunId: review.reviewRunId })),
    )
    const verdictReviewers = new Set(verdicts.map((verdict) => verdict.reviewerId))
    const verdictRuns = new Set(verdicts.map((verdict) => verdict.reviewRunId))
    if (verdictReviewers.size < 2 || verdictRuns.size < 2) {
      errors.push(`Candidate ${candidate.id} requires two declared-independent reviews`)
    }
    for (const verdict of verdicts) {
      if (
        verdict.candidateDigest !== candidate.candidateDigest ||
        verdict.fixtureResultsDigest !== verified?.fixtureResultsDigest
      ) {
        errors.push(`Stale review evidence: ${candidate.id}/${verdict.reviewerId}`)
      }
      if (verdict.verdict !== "pass") {
        errors.push(`Reviewer disagreement: ${candidate.id}/${verdict.reviewerId}`)
      }
    }
    const candidateErrors = errors.filter((error) => error.includes(candidate.id))
    if (candidateErrors.length === 0) acceptedProblems.push(candidate)
  }

  const batchArtifact = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    batchId: normalized.batchId,
    sequence: normalized.sequence,
    normalizedArtifactDigest: normalized.artifactDigest,
    fixtureArtifactDigest: sha256(fixtureArtifact),
    verificationDigest: verification.verificationDigest,
    manifestDigest: expectedManifest.manifestDigest,
    reviewDigests: expectedReviewDigests,
    editorialDigest: editorialArtifact.editorialDigest ?? null,
    accepted: sortedStatuses(decisions, "accepted")
      .map((item) => candidateKey(item.candidateId, item.revision))
      .sort(),
    rejected: sortedStatuses(decisions, "rejected")
      .map((item) => candidateKey(item.candidateId, item.revision))
      .sort(),
    blocked: sortedStatuses(decisions, "blocked")
      .map((item) => candidateKey(item.candidateId, item.revision))
      .sort(),
  }
  return {
    errors,
    batchDigest: sha256(batchArtifact),
    acceptedProblems,
    summary: {
      batchId: normalized.batchId,
      sequence: normalized.sequence,
      batchDigest: sha256(batchArtifact),
      generated: normalized.candidateCount,
      accepted: acceptedProblems.length,
      rejected: batchArtifact.rejected.length,
      blocked: batchArtifact.blocked.length,
    },
  }
}

export function compileAcceptedBank(batches) {
  const errors = []
  const currentProblems = new Map()
  const summaries = []
  const ordered = [...batches].sort(
    (left, right) => (left.normalized?.sequence ?? Number.MAX_SAFE_INTEGER) -
      (right.normalized?.sequence ?? Number.MAX_SAFE_INTEGER) ||
      String(left.normalized?.batchId ?? "").localeCompare(
        String(right.normalized?.batchId ?? ""),
      ),
  )

  const sequenceOwners = new Map()
  const revisionOwners = new Map()
  const revisionHistory = new Map()
  for (const batch of ordered.filter((candidate) => !candidate.loaderErrors?.length)) {
    const { batchId, sequence, candidates = [] } = batch.normalized ?? {}
    const sequenceOwner = sequenceOwners.get(sequence)
    if (sequenceOwner) {
      errors.push(
        `Duplicate batch sequence ${String(sequence)}: ${sequenceOwner} and ${String(batchId)}`,
      )
    } else {
      sequenceOwners.set(sequence, batchId)
    }

    const batchCandidateIds = new Set()
    for (const candidate of candidates) {
      if (batchCandidateIds.has(candidate.id)) {
        errors.push(`Duplicate candidate ID in ${String(batchId)}: ${candidate.id}`)
      }
      batchCandidateIds.add(candidate.id)

      const key = candidateKey(candidate.id, candidate.revision)
      const revisionOwner = revisionOwners.get(key)
      if (revisionOwner) {
        errors.push(
          `Duplicate candidate revision ${key}: ${revisionOwner} and ${String(batchId)}`,
        )
      } else {
        revisionOwners.set(key, batchId)
      }
      const history = revisionHistory.get(candidate.id) ?? []
      history.push({ revision: candidate.revision, sequence, batchId })
      revisionHistory.set(candidate.id, history)
    }
  }

  for (const [id, history] of revisionHistory) {
    history.sort(
      (left, right) => left.sequence - right.sequence || left.revision - right.revision,
    )
    const first = history[0]
    const isGrandfatheredFoundationRevision =
      first?.sequence === 1 &&
      first?.batchId === "2026-07-19-milestone-1-foundation-001"
    if (first?.revision !== 1 && !isGrandfatheredFoundationRevision) {
      errors.push(`First revision for ${id} must be 1`)
    }
    for (let index = 1; index < history.length; index += 1) {
      const previous = history[index - 1]
      const current = history[index]
      if (current.sequence <= previous.sequence) {
        errors.push(`Revision ${candidateKey(id, current.revision)} must use a later batch sequence`)
      }
      if (current.revision !== previous.revision + 1) {
        errors.push(
          `Revision history for ${id} must be contiguous; received ${previous.revision} then ${current.revision}`,
        )
      }
    }
  }

  for (const batch of ordered) {
    if (batch.loaderErrors?.length) {
      errors.push(
        ...batch.loaderErrors.map(
          (error) => `${batch.normalized?.batchId ?? "<unknown>"}: ${error}`,
        ),
      )
      continue
    }
    const evaluated = evaluateBatchEvidence(batch)
    summaries.push(evaluated.summary)
    errors.push(...evaluated.errors.map((error) => `${batch.normalized.batchId}: ${error}`))
    if (evaluated.errors.length) continue
    for (const problem of evaluated.acceptedProblems) {
      const current = currentProblems.get(problem.id)
      if (current?.revision === problem.revision) {
        errors.push(
          `Duplicate current problem revision: ${candidateKey(problem.id, problem.revision)}`,
        )
        continue
      }
      if (!current || problem.revision > current.revision) {
        currentProblems.set(problem.id, problem)
      }
    }
  }
  const problems = [...currentProblems.values()]
  problems.sort((left, right) => left.level - right.level || left.id.localeCompare(right.id))
  const artifact = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    problems,
    sourceBatches: summaries.map(({ batchId, batchDigest }) => ({ batchId, batchDigest })),
  }
  return { ...artifact, bankDigest: sha256(artifact), batches: summaries, errors }
}

function orderedCounts(entries) {
  return Object.fromEntries([...entries].sort(([left], [right]) => left.localeCompare(right)))
}

export function buildTracker(compiled) {
  const byLevel = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  const familyCounts = new Map()
  const levelFamilyCounts = new Map()
  const flavorCounts = new Map()
  for (const problem of compiled.problems) {
    byLevel[String(problem.level)] += 1
    familyCounts.set(problem.familyId, (familyCounts.get(problem.familyId) ?? 0) + 1)
    const levelFamily = `${problem.level}/${problem.familyId}`
    levelFamilyCounts.set(levelFamily, (levelFamilyCounts.get(levelFamily) ?? 0) + 1)
    flavorCounts.set(problem.flavor, (flavorCounts.get(problem.flavor) ?? 0) + 1)
  }
  const tracker = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    targetAccepted: 512,
    bankDigest: compiled.bankDigest,
    acceptedTotal: compiled.problems.length,
    counts: {
      byLevel,
      byFamily: orderedCounts(familyCounts.entries()),
      byLevelAndFamily: orderedCounts(levelFamilyCounts.entries()),
      byFlavor: orderedCounts(flavorCounts.entries()),
      rejected: compiled.batches.reduce((total, batch) => total + batch.rejected, 0),
      blocked: compiled.batches.reduce((total, batch) => total + batch.blocked, 0),
    },
    batches: compiled.batches.map((batch) => ({ ...batch })),
  }
  return { ...tracker, trackerDigest: sha256(tracker) }
}

function runtimeProblem(candidate) {
  const { sourceBatch, ...problem } = withoutFields(candidate, ["candidateDigest"])
  return { ...problem, sourceBatchId: sourceBatch }
}

export function createRuntimeProjections(compiled) {
  const levels = { 1: [], 2: [], 3: [], 4: [], 5: [] }
  for (const problem of compiled.problems) levels[problem.level].push(runtimeProblem(problem))
  const index = {
    schemaVersion: BATCH_SCHEMA_VERSION,
    bankDigest: compiled.bankDigest,
    counts: Object.fromEntries(
      Object.entries(levels).map(([level, problems]) => [level, problems.length]),
    ),
  }
  const artifact = { schemaVersion: BATCH_SCHEMA_VERSION, index, levels }
  return { ...artifact, projectionDigest: sha256(artifact) }
}

const COMPLETION_FLOORS = Object.freeze({ 1: 128, 2: 128, 3: 96, 4: 80, 5: 80 })

export function evaluateBankGate({
  batches,
  published,
  committedTracker,
  baselineTracker,
  enforceCompletion = false,
}) {
  const compiled = compileAcceptedBank(batches)
  const expectedPublished = createRuntimeProjections(compiled)
  const expectedTracker = buildTracker(compiled)
  const errors = [...compiled.errors, ...validateAppendOnly(batches, baselineTracker)]
  if (canonicalJson(published) !== canonicalJson(expectedPublished)) {
    errors.push("Runtime publish projection is stale")
  }
  if (canonicalJson(committedTracker) !== canonicalJson(expectedTracker)) {
    errors.push("Committed tracker is stale")
  }
  if (enforceCompletion) {
    for (const [level, floor] of Object.entries(COMPLETION_FLOORS)) {
      if ((expectedTracker.counts.byLevel[level] ?? 0) < floor) {
        errors.push(`Level ${level} requires at least ${floor} accepted problems`)
      }
    }
    if (expectedTracker.acceptedTotal < 512) {
      errors.push("Closing gate requires at least 512 accepted problems")
    }
    if (Object.keys(expectedTracker.counts.byFlavor).some((flavor) => flavor !== STANDARD_FLAVOR)) {
      errors.push("Closing gate permits only standard flavor")
    }
  }
  return { errors, compiled, expectedPublished, expectedTracker }
}

export function validateAppendOnly(batches, baselineTracker) {
  const errors = []
  const current = new Map(
    batches
      .filter((batch) => !batch.loaderErrors?.length)
      .map((batch) => {
        const evaluated = evaluateBatchEvidence(batch)
        return [evaluated.summary.batchId, evaluated.summary.batchDigest]
      }),
  )
  for (const baseline of baselineTracker?.batches ?? []) {
    const digest = current.get(baseline.batchId)
    if (!digest) errors.push(`Removed batch: ${baseline.batchId}`)
    else if (digest !== baseline.batchDigest) errors.push(`Mutated batch: ${baseline.batchId}`)
  }
  return errors
}

export async function verifyLegacyEvidence({ repositoryRoot, index }) {
  const errors = []
  if (!isRecord(index) || index.status !== "frozen-legacy-evidence") {
    return ["Legacy evidence index is invalid"]
  }
  if (index.countsTowardSchemaV2 !== false) {
    errors.push("Legacy evidence must not count toward schema v2")
  }
  if (!Array.isArray(index.artifacts) || index.artifacts.length === 0) {
    errors.push("Legacy evidence index requires artifacts")
    return errors
  }
  for (const artifact of index.artifacts) {
    if (
      !isRecord(artifact) ||
      typeof artifact.path !== "string" ||
      !artifact.path.trim() ||
      typeof artifact.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256)
    ) {
      errors.push("Legacy evidence artifact entry is invalid")
      continue
    }
    try {
      const contents = await readFile(resolve(repositoryRoot, artifact.path), "utf8")
      if (sha256(contents) !== artifact.sha256) {
        errors.push(`Legacy evidence digest drift: ${artifact.path}`)
      }
    } catch (error) {
      errors.push(
        `Cannot read legacy evidence ${artifact.path}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  return errors
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"))
}

async function loadBatchDirectory(batchDir, directoryName) {
  const loaderErrors = []
  let prompt = ""
  let raw
  let normalized
  let fixtureArtifact
  let engineContract
  let verification
  let manifest
  let editorial
  let reviews = []
  try {
    normalized = await readJson(resolve(batchDir, "candidates.normalized.json"))
  } catch (error) {
    loaderErrors.push(`Cannot load ${directoryName}: ${error instanceof Error ? error.message : String(error)}`)
    return { normalized: { batchId: directoryName }, loaderErrors }
  }
  try {
    ;[prompt, raw, fixtureArtifact, engineContract, verification, manifest, editorial] = await Promise.all([
      readFile(resolve(batchDir, "generation-prompt.md"), "utf8"),
      readJson(resolve(batchDir, "candidates.raw.json")),
      readJson(resolve(batchDir, "fixtures.json")),
      readJson(resolve(batchDir, "engine-contract.json")),
      readJson(resolve(batchDir, "verification.json")),
      readJson(resolve(batchDir, "review-manifest.json")),
      readJson(resolve(batchDir, "editorial.json")),
    ])
  } catch (error) {
    loaderErrors.push(`Cannot load ${directoryName}: ${error instanceof Error ? error.message : String(error)}`)
    return { normalized, loaderErrors }
  }
  try {
    const reviewDir = resolve(batchDir, "reviews")
    const reviewFiles = (await readdir(reviewDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort()
    reviews = await Promise.all(reviewFiles.map((file) => readJson(resolve(reviewDir, file))))
  } catch (error) {
    loaderErrors.push(`Cannot load ${directoryName} reviews: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    const regenerated = normalizeBatch(raw, prompt)
    if (canonicalJson(regenerated) !== canonicalJson(normalized)) {
      loaderErrors.push(`Normalized artifact is stale: ${directoryName}`)
    }
    if (normalized.batchId !== directoryName) {
      loaderErrors.push(`Batch directory ${directoryName} does not match ${normalized.batchId}`)
    }
    if (
      !isRecord(engineContract) ||
      engineContract.schemaVersion !== BATCH_SCHEMA_VERSION ||
      engineContract.engineContractDigest !==
        currentDigest(engineContract, "engineContractDigest")
    ) {
      loaderErrors.push(`Engine contract is stale: ${directoryName}`)
    } else if (
      verification.engineContractDigest !== engineContract.engineContractDigest
    ) {
      loaderErrors.push(`Verification engine contract does not match ${directoryName}`)
    }
  } catch (error) {
    loaderErrors.push(`Cannot normalize ${directoryName}: ${error instanceof Error ? error.message : String(error)}`)
  }
  return {
    normalized,
    fixtureArtifact,
    engineContract,
    verification,
    manifest,
    reviews,
    editorial,
    loaderErrors,
  }
}

export async function loadBatchDirectories(bankRoot) {
  const batchesDir = resolve(bankRoot, "batches")
  let entries
  try {
    entries = await readdir(batchesDir, { withFileTypes: true })
  } catch (error) {
    if (error?.code === "ENOENT") return []
    throw error
  }
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  return Promise.all(
    directories.map((directory) =>
      loadBatchDirectory(resolve(batchesDir, directory), directory),
    ),
  )
}
