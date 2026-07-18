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
  "perfect",
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

    const familyIds = retryFamilies.get(problem.retryFamily) ?? new Set()
    familyIds.add(problem.id)
    retryFamilies.set(problem.retryFamily, familyIds)

    const fixtureKinds = new Set(
      fixtures
        .filter((fixture) => fixture.problemId === problem.id)
        .map((fixture) => fixture.kind),
    )

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
