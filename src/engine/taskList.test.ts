import { describe, expect, it } from "vitest"
import { koCardsByMark } from "../content/ko"
import { evaluateProblem } from "./evaluateProblem"

/**
 * The task list is graded by `list-shape` with `requireTaskItems` (plan
 * §3.2). The Korean bank's task-list documents pin that behaviour.
 */
describe("task list grading", () => {
  const cards = koCardsByMark["task-list"]

  it.each(cards.map((card) => [card.problem.id, card.problem] as const))(
    "%s passes its answer, checked marks in either case, and fails plain bullets",
    (_id, problem) => {
      expect(evaluateProblem(problem, problem.target).status).toBe("matched")
      expect(
        evaluateProblem(problem, problem.target.replace(/\[x\]/g, "[X]")).status,
      ).toBe("matched")
      expect(
        evaluateProblem(problem, problem.target.replace(/\[[ xX]\] /g, "")).status,
      ).toBe("fail")
    },
  )
})
