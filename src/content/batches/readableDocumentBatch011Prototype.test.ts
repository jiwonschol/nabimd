import { expect, describe, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { readableDocumentBatch011PrototypeProblems } from "./readableDocumentBatch011Problems"

describe("Level 3 composite-document batch 011 prototypes", () => {
  it("proves one target for each proposed retry family through the real engine", () => {
    expect(readableDocumentBatch011PrototypeProblems).toHaveLength(3)

    for (const problem of readableDocumentBatch011PrototypeProblems) {
      expect(evaluateProblem(problem, problem.target), problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("reaches the meeting divider check without an outline shadow", () => {
    const problem = readableDocumentBatch011PrototypeProblems[0]!
    const withoutDivider = problem.target.replace("\n\n---\n", "")

    expect(evaluateProblem(problem, withoutDivider)).toMatchObject({
      status: "fail",
      feedbackId: `${problem.id}-divider`,
    })
  })

  it("reaches the reference link check without an outline shadow", () => {
    const problem = readableDocumentBatch011PrototypeProblems[1]!
    const withoutLink = problem.target.replace(/\[([^\]]+)\]\([^)]+\)/, "$1")

    expect(evaluateProblem(problem, withoutLink)).toMatchObject({
      status: "fail",
      feedbackId: `${problem.id}-reference-link`,
    })
  })

  it("distinguishes recommendation options from ordered next steps", () => {
    const problem = readableDocumentBatch011PrototypeProblems[2]!
    let option = 0
    const orderedOptions = problem.target
      .split("\n")
      .map((line) => {
        if (!line.startsWith("- ") || option === 3) return line
        option += 1
        return `${option}. ${line.slice(2)}`
      })
      .join("\n")

    expect(evaluateProblem(problem, orderedOptions)).toMatchObject({
      status: "fail",
      feedbackId: `${problem.id}-options`,
    })
  })
})
