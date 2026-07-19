import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { developmentSpecBatch012PrototypeProblems } from "./developmentSpecBatch012Problems"

function expectFailure(
  problem: (typeof developmentSpecBatch012PrototypeProblems)[number],
  source: string,
  suffix: string,
) {
  expect(evaluateProblem(problem, source), suffix).toMatchObject({
    status: "fail",
    feedbackId: `${problem.id}-${suffix}`,
  })
}

function transformH2Section(
  source: string,
  occurrence: number,
  transform: (section: string) => string,
) {
  const headings = [...source.matchAll(/^## .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) throw new Error(`Missing H2 occurrence ${occurrence}`)
  const end = headings[occurrence + 1]?.index ?? source.length
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function transformH3Section(
  source: string,
  occurrence: number,
  transform: (section: string) => string,
) {
  const headings = [...source.matchAll(/^### .+$/gm)]
  const start = headings[occurrence]?.index
  if (start === undefined) throw new Error(`Missing H3 occurrence ${occurrence}`)
  const nextH3 = headings[occurrence + 1]?.index
  const nextH2 = source.slice(start).match(/^## .+$/m)
  const nextH2Index = nextH2?.index === undefined ? undefined : start + nextH2.index
  const end = Math.min(
    nextH3 ?? source.length,
    nextH2Index ?? source.length,
  )
  return `${source.slice(0, start)}${transform(source.slice(start, end))}${source.slice(end)}`
}

function toOrdered(source: string) {
  let item = 0
  return source.replace(/^- /gm, () => `${(item += 1)}. `)
}

function toUnordered(source: string) {
  return source.replace(/^\d+\. /gm, "- ")
}

describe("Level 4 development-spec batch 012 prototypes", () => {
  it("matches one real-engine prototype from each retry family", () => {
    expect(developmentSpecBatch012PrototypeProblems).toHaveLength(3)

    for (const problem of developmentSpecBatch012PrototypeProblems) {
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("reaches every feature-interface check without outline shadowing", () => {
    const problem = developmentSpecBatch012PrototypeProblems[0]!
    const target = problem.target

    expectFailure(problem, target.replace(/^# /, ""), "outline")
    expectFailure(problem, `${target}\n\n## Extra section`, "sections")
    expectFailure(
      problem,
      target.replace(/^(# .+)$/m, "$1\n\n#### Skipped depth"),
      "hierarchy",
    )
    expectFailure(problem, transformH2Section(target, 0, toOrdered), "scope")
    expectFailure(
      problem,
      transformH2Section(target, 1, (section) =>
        section.replace(/\[([^\]]+)\]\([^)]+\)/, "$1"),
      ),
      "dependency-link",
    )
    expectFailure(
      problem,
      transformH2Section(target, 1, (section) => section.replace(/`([^`]+)`/, "$1")),
      "dependency-code",
    )
    expectFailure(
      problem,
      transformH2Section(target, 2, (section) => section.replace(/^> /m, "")),
      "constraint",
    )
    expectFailure(
      problem,
      transformH2Section(target, 3, toUnordered),
      "implementation",
    )
    expectFailure(problem, transformH2Section(target, 4, toOrdered), "acceptance")
    expectFailure(
      problem,
      transformH2Section(target, 5, (section) =>
        section.replace(/\n```/, "\nA verification note.\n\n```"),
      ),
      "verification-section",
    )
    expectFailure(
      problem,
      transformH2Section(target, 5, (section) => section.replace("```sh", "```")),
      "verification-code",
    )
  })

  it("reaches every bug-investigation check without outline shadowing", () => {
    const problem = developmentSpecBatch012PrototypeProblems[1]!
    const target = problem.target

    expectFailure(problem, target.replace(/^# /, ""), "outline")
    expectFailure(problem, `${target}\n\n## Extra section`, "sections")
    expectFailure(
      problem,
      target.replace(/^(# .+)$/m, "$1\n\n#### Skipped depth"),
      "hierarchy",
    )
    expectFailure(
      problem,
      transformH2Section(target, 0, (section) => `${section.trimEnd()}\n\nExtra evidence.\n\n`),
      "evidence-section",
    )
    expectFailure(
      problem,
      transformH2Section(target, 0, (section) => section.replace(/^> .+$/m, ">")),
      "evidence",
    )
    expectFailure(problem, transformH2Section(target, 1, toUnordered), "reproduction")
    expectFailure(problem, transformH2Section(target, 2, toOrdered), "constraints")
    expectFailure(problem, transformH2Section(target, 3, toUnordered), "fix-plan")
    expectFailure(
      problem,
      transformH2Section(target, 4, toOrdered),
      "regression-acceptance",
    )
    expectFailure(
      problem,
      transformH2Section(target, 5, (section) => section.replace(/^> .+$/m, ">")),
      "open-decision",
    )
    expectFailure(
      problem,
      transformH2Section(target, 6, (section) => `${section.trimEnd()}\n\nExtra note.\n`),
      "verification-section",
    )
    expectFailure(
      problem,
      transformH2Section(target, 6, toOrdered),
      "verification-list",
    )
    expectFailure(
      problem,
      transformH2Section(target, 6, (section) => section.replace(/`/g, "")),
      "verification-code",
    )
  })

  it("reaches every staged-migration check without outline shadowing", () => {
    const problem = developmentSpecBatch012PrototypeProblems[2]!
    const target = problem.target

    expectFailure(problem, target.replace(/^# /, ""), "outline")
    expectFailure(problem, `${target}\n\n## Extra section`, "sections")
    expectFailure(
      problem,
      target.replace(/^(# .+)$/m, "$1\n\n#### Skipped depth"),
      "hierarchy",
    )
    expectFailure(
      problem,
      transformH2Section(target, 1, (section) =>
        section.replace(/^(### .+)$/m, "$1\n\n### Extra stage\n\n- One\n- Two"),
      ),
      "stage-count",
    )
    expectFailure(problem, transformH2Section(target, 0, toOrdered), "preconditions")
    expectFailure(
      problem,
      transformH2Section(target, 1, (section) =>
        section.replace(/^(### .+)$/m, "Stage note.\n\n$1"),
      ),
      "migration-section",
    )
    for (const occurrence of [0, 1, 2] as const) {
      expectFailure(
        problem,
        transformH3Section(target, occurrence, toOrdered),
        `stage-${occurrence + 1}`,
      )
    }
    expectFailure(problem, transformH2Section(target, 2, toUnordered), "rollback")
    expectFailure(problem, transformH2Section(target, 3, toOrdered), "acceptance")
    expectFailure(
      problem,
      transformH2Section(target, 4, (section) => section.replace(/^> .+$/m, ">")),
      "open-decision",
    )
    expectFailure(
      problem,
      transformH2Section(target, 5, (section) =>
        section.replace(/\n```/, "\nA verification note.\n\n```"),
      ),
      "verification-section",
    )
    expectFailure(
      problem,
      transformH2Section(target, 5, (section) => section.replace("```sh", "```")),
      "verification-code",
    )
  })
})
