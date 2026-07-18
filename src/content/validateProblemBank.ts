import type {
  FixtureKind,
  Problem,
  ProblemFixture,
} from "./types"

const requiredFixtureKinds: readonly FixtureKind[] = [
  "canonical",
  "alternate",
  "missing",
  "malformed",
  "matched-with-refinement",
]

export function validateProblemBank(
  problems: readonly Problem[],
  fixtures: readonly ProblemFixture[],
): string[] {
  const errors: string[] = []
  const problemIds = new Set<string>()
  const protectedTexts = new Set<string>()
  const retryFamilies = new Map<string, Set<string>>()

  for (const problem of problems) {
    if (problemIds.has(problem.id)) {
      errors.push(`Duplicate problem id: ${problem.id}`)
    }
    problemIds.add(problem.id)

    const firstProtectedText = problem.protectedContent.at(0)
    if (firstProtectedText) {
      if (protectedTexts.has(firstProtectedText)) {
        errors.push(`Duplicate protected content: ${firstProtectedText}`)
      }
      protectedTexts.add(firstProtectedText)
    }

    if (problem.hints.length !== 3) {
      errors.push(
        `Problem ${problem.id} must provide exactly three hints`,
      )
    }

    for (const field of ["concept", "howTo", "example"] as const) {
      if (!problem.teaching[field].trim()) {
        errors.push(`Problem ${problem.id} has blank teaching ${field}`)
      }
    }

    const familyIds = retryFamilies.get(problem.retryFamily) ?? new Set()
    familyIds.add(problem.id)
    retryFamilies.set(problem.retryFamily, familyIds)

    const problemFixtures = fixtures.filter(
      (fixture) => fixture.problemId === problem.id,
    )
    const fixtureKinds = new Set(problemFixtures.map((fixture) => fixture.kind))
    const fixtureCounts = new Map<FixtureKind, number>()
    for (const fixture of problemFixtures) {
      fixtureCounts.set(fixture.kind, (fixtureCounts.get(fixture.kind) ?? 0) + 1)
    }
    for (const [kind, count] of fixtureCounts) {
      if (count > 1) {
        errors.push(`Duplicate fixture kind ${kind} for ${problem.id}`)
      }
    }

    for (const requiredKind of requiredFixtureKinds) {
      if (!fixtureKinds.has(requiredKind)) {
        errors.push(`Missing fixture kind ${requiredKind} for ${problem.id}`)
      }
    }
  }

  for (const fixture of fixtures) {
    if (!problemIds.has(fixture.problemId)) {
      errors.push(`Unknown fixture problem id: ${fixture.problemId}`)
    }
  }

  for (const [retryFamily, ids] of retryFamilies) {
    if (ids.size < 2) {
      errors.push(
        `Retry family ${retryFamily} requires at least two distinct problems`,
      )
    }
  }

  return errors
}
