import type { ProblemFixture } from "../types"
import { tableBatch030Fixtures } from "./tableBatch030Fixtures"
import { tableBatch031Problems } from "./tableBatch031Problems"

const targetById = new Map(
  tableBatch031Problems.map((problem) => [problem.id, problem.target]),
)

export const tableBatch031Fixtures: readonly ProblemFixture[] =
  tableBatch030Fixtures.map((fixture) => ({
    ...fixture,
    problemRevision: 2,
    source:
      fixture.role === "canonical"
        ? targetById.get(fixture.problemId)!
        : fixture.source,
  }))
