import { createHash } from "node:crypto"

export const EXPECTED_FAMILIES = [
  "headings",
  "emphasis",
  "lists",
  "blockquotes",
  "inline-code",
  "horizontal-rules",
  "links",
  "images",
]

function canonicalValue(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cannot canonicalize a non-finite number")
    return value
  }
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => {
          if (value[key] === undefined) throw new Error(`Cannot canonicalize undefined at ${key}`)
          return [key, canonicalValue(value[key])]
        }),
    )
  }
  throw new Error(`Cannot canonicalize ${typeof value}`)
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalValue(value))
}

export function sha256(value) {
  return createHash("sha256").update(
    typeof value === "string" ? value : canonicalJson(value),
  ).digest("hex")
}

export function createFixtureReviewDigest({
  candidateDigest,
  problem,
  results,
}) {
  return sha256({ candidateDigest, problem, results })
}

export function validateRawArtifact(raw) {
  const errors = []
  const families = Array.isArray(raw?.families) ? raw.families : []
  const ids = new Set()
  const familyIds = families.map((family) => family.id)

  for (const expected of EXPECTED_FAMILIES) {
    if (familyIds.filter((id) => id === expected).length !== 1) {
      errors.push(`Expected exactly one ${expected} family`)
    }
  }
  for (const family of families) {
    if (!EXPECTED_FAMILIES.includes(family.id)) {
      errors.push(`Unknown family: ${family.id}`)
    }
    if (!Array.isArray(family.candidates) || family.candidates.length !== 16) {
      errors.push(`Family ${family.id} must contain exactly 16 candidates`)
    }
    const shouldBeSupported = family.id === "headings"
    if (family.engineSupported !== shouldBeSupported) {
      errors.push(`Family ${family.id} has an invalid engineSupported value`)
    }
    for (const field of ["concept", "howTo", "example"]) {
      if (typeof family.teaching?.[field] !== "string" || !family.teaching[field].trim()) {
        errors.push(`Family ${family.id} has blank teaching ${field}`)
      }
    }
    for (const field of ["expectedSkill", "likelyMalformedTrap", "editorialNote"]) {
      if (typeof family.defaults?.[field] !== "string" || !family.defaults[field].trim()) {
        errors.push(`Family ${family.id} has blank default ${field}`)
      }
    }
    for (const candidate of family.candidates ?? []) {
      if (ids.has(candidate.id)) errors.push(`Duplicate candidate id: ${candidate.id}`)
      ids.add(candidate.id)
      for (const field of ["id", "text", "targetMarkdown"]) {
        if (typeof candidate[field] !== "string" || !candidate[field].trim()) {
          errors.push(`Candidate ${candidate.id ?? "<unknown>"} has blank ${field}`)
        }
      }
    }
  }
  if (ids.size !== 128) errors.push(`Expected 128 unique candidates, found ${ids.size}`)
  return errors
}

export function normalizeArtifact(raw, promptText) {
  const errors = validateRawArtifact(raw)
  if (errors.length) throw new Error(errors.join("\n"))

  const candidates = raw.families.flatMap((family) =>
    family.candidates.map((candidate) => {
      const normalized = {
        id: candidate.id,
        familyId: family.id,
        engineSupported: family.engineSupported,
        text: candidate.text,
        targetMarkdown: candidate.targetMarkdown,
        teaching: family.teaching,
        expectedSkill: candidate.expectedSkill ?? family.defaults.expectedSkill,
        likelyMalformedTrap:
          candidate.likelyMalformedTrap ?? family.defaults.likelyMalformedTrap,
        editorialNote: candidate.editorialNote ?? family.defaults.editorialNote,
      }
      return { ...normalized, candidateDigest: sha256(normalized) }
    }),
  )
  const artifact = {
    schemaVersion: 1,
    generatedBy: raw.generatedBy,
    generatedOn: raw.generatedOn,
    promptSha256: sha256(promptText),
    candidateCount: candidates.length,
    perFamilyCounts: Object.fromEntries(
      EXPECTED_FAMILIES.map((familyId) => [
        familyId,
        candidates.filter((candidate) => candidate.familyId === familyId).length,
      ]),
    ),
    candidates,
  }

  return { ...artifact, artifactDigest: sha256(artifact) }
}

function duplicates(values) {
  const seen = new Set()
  return [...new Set(values.filter((value) => seen.size === seen.add(value).size))]
}

export function createInitialEditorialQueue(normalized) {
  return {
    schemaVersion: 1,
    decisions: normalized.candidates.map((candidate) => ({
      candidateId: candidate.id,
      candidateDigest: candidate.candidateDigest,
      fixtureResultsDigest: null,
      status: candidate.engineSupported ? "pending" : "blocked",
      reason: candidate.engineSupported
        ? "awaiting-independent-review"
        : "engine-family-not-supported",
      editorialActor: null,
    })),
  }
}

export function evaluateWorkflow({
  normalized,
  runtimeHeadingBank,
  fixtureDigests,
  fixtureCounts,
  reviews,
  editorialQueue,
}) {
  const errors = []
  const candidates = new Map(normalized.candidates.map((candidate) => [candidate.id, candidate]))
  const runtimeIds = runtimeHeadingBank.map((entry) => entry.id)
  const decisionIds = editorialQueue.decisions.map((decision) => decision.candidateId)
  const reviewKeys = reviews.map(
    (review) => `${review.candidateId}:${review.reviewerId}:${review.reviewRunId}`,
  )

  for (const id of duplicates(runtimeIds)) errors.push(`Duplicate runtime problem: ${id}`)
  for (const id of duplicates(decisionIds)) errors.push(`Duplicate editorial decision: ${id}`)
  for (const key of duplicates(reviewKeys)) errors.push(`Duplicate review record: ${key}`)
  for (const review of reviews) {
    if (!candidates.has(review.candidateId)) {
      errors.push(`Unknown reviewed candidate: ${review.candidateId}`)
    }
  }
  for (const decision of editorialQueue.decisions) {
    const candidate = candidates.get(decision.candidateId)
    if (!candidate) {
      errors.push(`Unknown editorial candidate: ${decision.candidateId}`)
      continue
    }
    if (decision.candidateDigest !== candidate.candidateDigest) {
      errors.push(`Stale editorial candidate digest: ${candidate.id}`)
    }
    if (!candidate.engineSupported) {
      if (decision.status !== "blocked" || decision.reason !== "engine-family-not-supported") {
        errors.push(`Unsupported candidate must remain engine-family-not-supported: ${candidate.id}`)
      }
      if (runtimeIds.includes(candidate.id)) {
        errors.push(`Unsupported candidate entered runtime: ${candidate.id}`)
      }
    }
  }
  for (const candidate of normalized.candidates) {
    if (decisionIds.filter((id) => id === candidate.id).length !== 1) {
      errors.push(`Candidate ${candidate.id} requires exactly one editorial decision`)
    }
  }

  for (const runtime of runtimeHeadingBank) {
    const candidate = candidates.get(runtime.id)
    if (!candidate) {
      errors.push(`Unknown runtime candidate: ${runtime.id}`)
      continue
    }
    if (
      !candidate.engineSupported ||
      candidate.familyId !== "headings" ||
      runtime.text !== candidate.text ||
      runtime.targetMarkdown !== candidate.targetMarkdown ||
      canonicalJson(runtime.teaching) !== canonicalJson(candidate.teaching)
    ) {
      errors.push(`Runtime content drift: ${runtime.id}`)
    }
    const fixtureResultsDigest = fixtureDigests[runtime.id]
    if (!fixtureResultsDigest) {
      errors.push(`Missing fixture result digest: ${runtime.id}`)
      continue
    }
    const candidateReviews = reviews.filter((review) => review.candidateId === runtime.id)
    const reviewers = new Set(candidateReviews.map((review) => review.reviewerId))
    const runs = new Set(candidateReviews.map((review) => review.reviewRunId))
    if (
      reviewers.size !== candidateReviews.length ||
      runs.size !== candidateReviews.length
    ) {
      errors.push(`Candidate ${runtime.id} has duplicate reviewer or run IDs`)
    }
    if (reviewers.size < 2 || runs.size < 2) {
      errors.push(`Candidate ${runtime.id} requires two independent reviews`)
    }
    for (const review of candidateReviews) {
      if (
        review.candidateDigest !== candidate.candidateDigest ||
        review.fixtureResultsDigest !== fixtureResultsDigest ||
        review.fixtureCount !== fixtureCounts[runtime.id]
      ) {
        errors.push(`Stale review digest: ${runtime.id}/${review.reviewerId}`)
      }
      if (review.verdict !== "pass") {
        errors.push(`Reviewer disagreement: ${runtime.id}/${review.reviewerId}`)
      }
    }
    const decision = editorialQueue.decisions.find(
      (item) => item.candidateId === runtime.id,
    )
    if (
      !decision ||
      decision.status !== "accepted" ||
      !decision.editorialActor ||
      decision.candidateDigest !== candidate.candidateDigest ||
      decision.fixtureResultsDigest !== fixtureResultsDigest
    ) {
      errors.push(`Candidate ${runtime.id} lacks digest-bound editorial acceptance`)
    }
  }

  const acceptedIds = editorialQueue.decisions
    .filter((decision) => decision.status === "accepted")
    .map((decision) => decision.candidateId)
    .sort()
  const publishedIds = [...runtimeIds].sort()
  if (canonicalJson(acceptedIds) !== canonicalJson(publishedIds)) {
    errors.push("Runtime publish set does not equal the accepted editorial set")
  }

  return errors
}
