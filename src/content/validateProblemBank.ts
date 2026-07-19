import { normalizeProblem } from "./normalizeProblem"
import type {
  FixtureKind,
  FixtureRole,
  GradableProblem,
  MatchCheck,
  ProblemFixture,
  VocabularyProfile,
} from "./types"

const requiredLegacyFixtureKinds: readonly FixtureKind[] = [
  "canonical",
  "alternate",
  "missing",
  "malformed",
  "matched-with-refinement",
]

const requiredFixtureRoles: readonly FixtureRole[] = [
  "canonical",
  "different-prose",
  "case-spelling-variation",
  "missing",
  "malformed",
  "matched-with-review",
]

const profileByLevel: Readonly<Record<number, VocabularyProfile>> = {
  1: "everyday",
  2: "everyday-recall",
  3: "workplace-document",
  4: "development-spec",
  5: "agent-workflow",
}

const supportedMatchCheckKinds = new Set<string>([
  "heading-spacing",
  "hash-heading-style",
  "has-heading",
  "block-count",
  "inline-presence",
  "heading-depth-order",
  "list-shape",
  "blockquote-shape",
  "inline-code-shape",
  "code-block",
  "block-sequence",
  "document-limits",
])

const supportedInlineKinds = new Set<string>([
  "emphasis",
  "strong",
  "inline-code",
  "link",
  "image",
])

const supportedBlockKinds = new Set<string>([
  "heading",
  "paragraph",
  "list",
  "code",
  "blockquote",
  "thematic-break",
])

const scopeRequiredMatchCheckKinds = new Set<string>([
  "block-count",
  "inline-presence",
  "list-shape",
  "blockquote-shape",
  "inline-code-shape",
  "code-block",
  "block-sequence",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function validateEditorialScope(
  problemId: string,
  label: string,
  scope: unknown,
  errors: string[],
) {
  if (!isRecord(scope)) {
    errors.push(
      `Problem ${problemId} editorial check ${label} has invalid scope`,
    )
    return
  }
  if (scope.kind === "document") return
  if (scope.kind !== "section") {
    errors.push(
      `Problem ${problemId} editorial check ${label} has unsupported scope kind: ${String(scope.kind)}`,
    )
    return
  }
  if (
    !Number.isInteger(scope.headingDepth) ||
    Number(scope.headingDepth) < 1 ||
    Number(scope.headingDepth) > 6
  ) {
    errors.push(
      `Problem ${problemId} editorial check ${label} has invalid section heading depth`,
    )
  }
  if (!Number.isInteger(scope.occurrence) || Number(scope.occurrence) < 0) {
    errors.push(
      `Problem ${problemId} editorial check ${label} has invalid section occurrence`,
    )
  }
}

function validateRange(
  problemId: string,
  check: MatchCheck,
  min: number | undefined,
  max: number | undefined,
  errors: string[],
) {
  if (min !== undefined && (!Number.isInteger(min) || min < 0)) {
    errors.push(`Problem ${problemId} check ${check.id} has invalid min`)
  }
  if (max !== undefined && (!Number.isInteger(max) || max < 0)) {
    errors.push(`Problem ${problemId} check ${check.id} has invalid max`)
  }
  if (min !== undefined && max !== undefined && min > max) {
    errors.push(`Problem ${problemId} check ${check.id} has min greater than max`)
  }
}

function validateScope(problemId: string, check: MatchCheck, errors: string[]) {
  if (!("scope" in check)) {
    if (scopeRequiredMatchCheckKinds.has(check.kind)) {
      errors.push(`Problem ${problemId} check ${check.id} requires a scope`)
    }
    return
  }
  const runtimeScope = (check as unknown as Record<string, unknown>).scope
  if (!isRecord(runtimeScope)) {
    errors.push(`Problem ${problemId} check ${check.id} has invalid scope`)
    return
  }
  if (runtimeScope.kind === "document") return
  if (runtimeScope.kind !== "section") {
    errors.push(
      `Problem ${problemId} check ${check.id} has unsupported scope kind: ${String(runtimeScope.kind)}`,
    )
    return
  }
  if (
    !Number.isInteger(runtimeScope.headingDepth) ||
    Number(runtimeScope.headingDepth) < 1 ||
    Number(runtimeScope.headingDepth) > 6
  ) {
    errors.push(
      `Problem ${problemId} check ${check.id} has invalid section heading depth`,
    )
  }
  if (
    !Number.isInteger(runtimeScope.occurrence) ||
    Number(runtimeScope.occurrence) < 0
  ) {
    errors.push(
      `Problem ${problemId} check ${check.id} has invalid section occurrence`,
    )
  }
}

function validateMatchChecks(problem: GradableProblem, errors: string[]) {
  const checkIds = new Set<string>()
  if (problem.matchChecks.length === 0) {
    errors.push(`Problem ${problem.id} must provide at least one match check`)
  }

  for (const check of problem.matchChecks) {
    if (!check.id.trim()) {
      errors.push(`Problem ${problem.id} has blank match check id`)
    } else if (checkIds.has(check.id)) {
      errors.push(`Problem ${problem.id} has duplicate match check id: ${check.id}`)
    }
    checkIds.add(check.id)

    if (!Number.isInteger(check.priority) || check.priority < 0) {
      errors.push(`Problem ${problem.id} check ${check.id} has invalid priority`)
    }
    if (!check.feedback.trim()) {
      errors.push(`Problem ${problem.id} check ${check.id} has blank feedback`)
    }

    if (!supportedMatchCheckKinds.has(check.kind)) {
      errors.push(
        `Problem ${problem.id} has unsupported match check kind: ${String(check.kind)}`,
      )
      continue
    }

    validateScope(problem.id, check, errors)
    switch (check.kind) {
      case "heading-spacing":
      case "hash-heading-style":
      case "has-heading":
      case "heading-depth-order":
        break
      case "block-count":
      case "inline-presence":
        validateRange(problem.id, check, check.min, check.max, errors)
        if (check.min === undefined && check.max === undefined) {
          errors.push(`Problem ${problem.id} check ${check.id} requires a range`)
        }
        if (check.kind === "block-count") {
          const runtimeCheck = check as unknown as Record<string, unknown>
          if (!supportedBlockKinds.has(String(runtimeCheck.block))) {
            errors.push(
              `Problem ${problem.id} check ${check.id} has unsupported block kind: ${String(runtimeCheck.block)}`,
            )
          }
          if (
            runtimeCheck.depth !== undefined &&
            (!Number.isInteger(runtimeCheck.depth) ||
              Number(runtimeCheck.depth) < 1 ||
              Number(runtimeCheck.depth) > 6)
          ) {
            errors.push(
              `Problem ${problem.id} check ${check.id} has invalid heading depth`,
            )
          }
          if (
            runtimeCheck.depth !== undefined &&
            runtimeCheck.block !== "heading"
          ) {
            errors.push(
              `Problem ${problem.id} check ${check.id} can only use depth with heading blocks`,
            )
          }
        }
        break
      case "list-shape": {
        const runtimeCheck = check as unknown as Record<string, unknown>
        validateRange(problem.id, check, check.minItems, check.maxItems, errors)
        if (!Number.isInteger(runtimeCheck.minItems) || Number(runtimeCheck.minItems) < 1) {
          errors.push(
            `Problem ${problem.id} check ${check.id} requires at least one item`,
          )
        }
        if (
          runtimeCheck.ordered !== true &&
          runtimeCheck.ordered !== false &&
          runtimeCheck.ordered !== "either"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has unsupported ordered value: ${String(runtimeCheck.ordered)}`,
          )
        }
        if (
          runtimeCheck.recursive !== undefined &&
          typeof runtimeCheck.recursive !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has invalid recursive flag`,
          )
        }
        if (
          runtimeCheck.requireNonemptyItems !== undefined &&
          typeof runtimeCheck.requireNonemptyItems !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has invalid nonempty-items flag`,
          )
        }
        break
      }
      case "blockquote-shape": {
        const runtimeCheck = check as unknown as Record<string, unknown>
        if (
          runtimeCheck.recursive !== undefined &&
          typeof runtimeCheck.recursive !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has invalid recursive flag`,
          )
        }
        if (
          runtimeCheck.requireNonemptyContent !== undefined &&
          typeof runtimeCheck.requireNonemptyContent !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has invalid nonempty-content flag`,
          )
        }
        break
      }
      case "inline-code-shape": {
        const runtimeCheck = check as unknown as Record<string, unknown>
        validateRange(problem.id, check, check.min, check.max, errors)
        if (check.min === undefined && check.max === undefined) {
          errors.push(`Problem ${problem.id} check ${check.id} requires a range`)
        }
        if (
          runtimeCheck.requireNonemptyContent !== undefined &&
          typeof runtimeCheck.requireNonemptyContent !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} check ${check.id} has invalid nonempty-content flag`,
          )
        }
        break
      }
      case "code-block":
        validateRange(problem.id, check, check.min, check.max, errors)
        break
      case "block-sequence":
        if (check.sequence.length === 0) {
          errors.push(`Problem ${problem.id} check ${check.id} has empty sequence`)
        }
        break
      case "document-limits": {
        const ranges = [
          [check.minBlocks, check.maxBlocks],
          [check.minLines, check.maxLines],
          [check.minSourceCharacters, check.maxSourceCharacters],
        ] as const
        if (ranges.every(([min, max]) => min === undefined && max === undefined)) {
          errors.push(`Problem ${problem.id} check ${check.id} requires a limit`)
        }
        for (const [min, max] of ranges) {
          validateRange(problem.id, check, min, max, errors)
        }
        break
      }
    }
  }
}

function validateEditorialChecks(
  problem: GradableProblem,
  errors: string[],
) {
  const checkIds = new Set<string>()
  for (const check of problem.editorialChecks) {
    const label = check.id.trim() || "<blank>"
    if (!check.id.trim()) {
      errors.push(`Problem ${problem.id} has blank editorial check id`)
    } else if (checkIds.has(check.id)) {
      errors.push(
        `Problem ${problem.id} has duplicate editorial check id: ${check.id}`,
      )
    }
    checkIds.add(check.id)

    if (!check.review.trim()) {
      errors.push(
        `Problem ${problem.id} editorial check ${label} has blank review`,
      )
    }

    switch (check.kind) {
      case "single-h1":
        break
      case "max-inline-count": {
        const runtimeCheck = check as unknown as Record<string, unknown>
        validateEditorialScope(problem.id, label, runtimeCheck.scope, errors)
        if (!supportedInlineKinds.has(String(runtimeCheck.inline))) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has unsupported inline kind: ${String(runtimeCheck.inline)}`,
          )
        }
        if (!Number.isInteger(check.max) || check.max < 0) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has invalid max`,
          )
        }
        break
      }
      case "max-block-count": {
        const runtimeCheck = check as unknown as Record<string, unknown>
        validateEditorialScope(problem.id, label, runtimeCheck.scope, errors)
        if (!supportedBlockKinds.has(String(runtimeCheck.block))) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has unsupported block kind: ${String(runtimeCheck.block)}`,
          )
        }
        if (
          runtimeCheck.depth !== undefined &&
          (!Number.isInteger(runtimeCheck.depth) ||
            Number(runtimeCheck.depth) < 1 ||
            Number(runtimeCheck.depth) > 6)
        ) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has invalid heading depth`,
          )
        }
        if (
          runtimeCheck.depth !== undefined &&
          runtimeCheck.block !== "heading"
        ) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} can only use depth with heading blocks`,
          )
        }
        if (
          runtimeCheck.recursive !== undefined &&
          typeof runtimeCheck.recursive !== "boolean"
        ) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has invalid recursive flag`,
          )
        }
        if (!Number.isInteger(runtimeCheck.max) || Number(runtimeCheck.max) < 0) {
          errors.push(
            `Problem ${problem.id} editorial check ${label} has invalid max`,
          )
        }
        break
      }
      default:
        errors.push(
          `Problem ${problem.id} has unsupported editorial check kind: ${String((check as { kind?: unknown }).kind)}`,
        )
    }
  }
}

function validateVocabulary(problem: GradableProblem, errors: string[]) {
  const normalized = normalizeProblem(problem)
  const expectedProfile = profileByLevel[normalized.level]
  if (!expectedProfile) {
    errors.push(`Problem ${problem.id} has invalid level: ${normalized.level}`)
    return
  }
  if (normalized.vocabulary.profile !== expectedProfile) {
    errors.push(
      `Problem ${problem.id} level ${normalized.level} requires vocabulary profile ${expectedProfile}`,
    )
  }
  const expectedTeachingMode = normalized.level === 1 ? "introduce" : "recall"
  if (normalized.teachingMode !== expectedTeachingMode) {
    errors.push(
      `Problem ${problem.id} level ${normalized.level} requires teaching mode ${expectedTeachingMode}`,
    )
  }

  const terms = new Set<string>()
  for (const domain of normalized.vocabulary.domains) {
    if (!domain.trim()) errors.push(`Problem ${problem.id} has blank vocabulary domain`)
  }
  for (const term of normalized.vocabulary.terms) {
    if (!term.trim()) errors.push(`Problem ${problem.id} has blank vocabulary term`)
    if (terms.has(term)) {
      errors.push(`Problem ${problem.id} has duplicate vocabulary term: ${term}`)
    }
    terms.add(term)
  }
  if (normalized.vocabulary.domains.length === 0) {
    errors.push(`Problem ${problem.id} requires a vocabulary domain`)
  }
  if (normalized.vocabulary.terms.length === 0) {
    errors.push(`Problem ${problem.id} requires a vocabulary term`)
  }
}

function validConvention(problem: GradableProblem): boolean {
  const convention = problem.convention
  return Boolean(
    convention &&
      typeof convention.id === "string" &&
      convention.id.trim() &&
      typeof convention.version === "string" &&
      convention.version.trim() &&
      typeof convention.reviewedOn === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(convention.reviewedOn),
  )
}

export function validateProblemBank(
  problems: readonly GradableProblem[],
  fixtures: readonly ProblemFixture[],
): string[] {
  const errors: string[] = []
  const problemIds = new Set<string>()
  const protectedTexts = new Set<string>()
  const legacyRetryFamilies = new Map<string, Set<string>>()
  const retryVariants = new Map<string, Set<string>>()

  for (const problem of problems) {
    const isSchemaV2 = problem.schemaVersion === 2
    const normalized = normalizeProblem(problem)

    if (problemIds.has(problem.id)) {
      errors.push(`Duplicate problem id: ${problem.id}`)
    }
    problemIds.add(problem.id)

    if (isSchemaV2) {
      if (normalized.flavor !== "standard") {
        errors.push(`Problem ${problem.id} has unsupported flavor: ${normalized.flavor}`)
      }
      validateVocabulary(problem, errors)
      if (!normalized.sourceBatchId.trim()) {
        errors.push(`Problem ${problem.id} has blank source batch`)
      }
      if (!Number.isInteger(normalized.revision) || normalized.revision < 1) {
        errors.push(`Problem ${problem.id} has invalid revision`)
      }
      if (!normalized.curriculumVersion.trim()) {
        errors.push(`Problem ${problem.id} has blank curriculum version`)
      }
      if (!normalized.contentVariant.trim()) {
        errors.push(`Problem ${problem.id} has blank content variant`)
      }
      if (normalized.level === 5 && !validConvention(problem)) {
        errors.push(`Problem ${problem.id} requires Level 5 convention metadata`)
      } else if (problem.convention && !validConvention(problem)) {
        errors.push(`Problem ${problem.id} has invalid convention metadata`)
      }
      const retryKey = `${normalized.level}/${normalized.flavor}/${normalized.retryFamily}`
      const variants = retryVariants.get(retryKey) ?? new Set<string>()
      variants.add(normalized.contentVariant)
      retryVariants.set(retryKey, variants)
    } else {
      const firstProtectedText = problem.protectedContent.at(0)
      if (firstProtectedText) {
        if (protectedTexts.has(firstProtectedText)) {
          errors.push(`Duplicate protected content: ${firstProtectedText}`)
        }
        protectedTexts.add(firstProtectedText)
      }
      const familyIds = legacyRetryFamilies.get(problem.retryFamily) ?? new Set()
      familyIds.add(problem.id)
      legacyRetryFamilies.set(problem.retryFamily, familyIds)
    }

    if (problem.hints.length !== 3) {
      errors.push(`Problem ${problem.id} must provide exactly three hints`)
    }
    for (const field of ["concept", "howTo", "example"] as const) {
      if (!problem.teaching[field].trim()) {
        errors.push(`Problem ${problem.id} has blank teaching ${field}`)
      }
    }
    validateMatchChecks(problem, errors)
    validateEditorialChecks(problem, errors)

    const problemFixtures = fixtures.filter(
      (fixture) => fixture.problemId === problem.id,
    )
    if (isSchemaV2) {
      const roles = new Set(problemFixtures.map((fixture) => fixture.role))
      const exercisedCheckIds = new Set(
        problemFixtures
          .map((fixture) => fixture.exercisesCheckId)
          .filter((checkId): checkId is string => Boolean(checkId)),
      )
      for (const fixture of problemFixtures) {
        if (!fixture.id?.trim()) {
          errors.push(`Problem ${problem.id} has fixture without an id`)
        }
        if (!fixture.role) {
          errors.push(`Problem ${problem.id} has fixture without a role`)
        }
      }
      for (const role of requiredFixtureRoles) {
        if (!roles.has(role)) {
          errors.push(`Missing fixture role ${role} for ${problem.id}`)
        }
      }
      for (const check of problem.matchChecks) {
        if (!exercisedCheckIds.has(check.id)) {
          errors.push(
            `Problem ${problem.id} has no direct fixture for check ${check.id}`,
          )
        }
      }
    } else {
      const fixtureKinds = new Set(problemFixtures.map((fixture) => fixture.kind))
      const fixtureCounts = new Map<FixtureKind, number>()
      for (const fixture of problemFixtures) {
        fixtureCounts.set(fixture.kind, (fixtureCounts.get(fixture.kind) ?? 0) + 1)
      }
      for (const [kind, count] of fixtureCounts) {
        if (count > 1) errors.push(`Duplicate fixture kind ${kind} for ${problem.id}`)
      }
      for (const requiredKind of requiredLegacyFixtureKinds) {
        if (!fixtureKinds.has(requiredKind)) {
          errors.push(`Missing fixture kind ${requiredKind} for ${problem.id}`)
        }
      }
    }
  }

  const fixtureIds = new Set<string>()
  for (const fixture of fixtures) {
    if (!problemIds.has(fixture.problemId)) {
      errors.push(`Unknown fixture problem id: ${fixture.problemId}`)
    }
    if (fixture.id) {
      if (fixtureIds.has(fixture.id)) errors.push(`Duplicate fixture id: ${fixture.id}`)
      fixtureIds.add(fixture.id)
    }
  }

  for (const [retryFamily, ids] of legacyRetryFamilies) {
    if (ids.size < 2) {
      errors.push(`Retry family ${retryFamily} requires at least two distinct problems`)
    }
  }
  for (const [retryKey, variants] of retryVariants) {
    if (variants.size < 2) {
      errors.push(
        `Retry family ${retryKey} requires at least two distinct content variants`,
      )
    }
  }

  return errors
}
