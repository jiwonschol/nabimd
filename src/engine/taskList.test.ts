import { describe, expect, it } from "vitest"
import { koSamples } from "../content/ko/_samples"
import type { NormalizedProblem } from "../content/types"
import { evaluateProblem } from "./evaluateProblem"

/**
 * The task list is already graded by `list-shape` with `requireTaskItems`
 * (plan §3.2). This Korean sample pins that before the Korean bank arrives.
 */
const todo: NormalizedProblem = {
  ...koSamples[0].problem,
  id: "ko-test-task-list",
  skillIds: ["heading-h1", "task-list"],
  syntaxTokens: ["#", "- [ ]"],
  title: "이번 주 할 일",
  target: "# 이번 주 할 일\n\n- [x] 시안 고르기\n- [ ] 비교표 쓰기\n- [ ] 회의 잡기",
  matchChecks: [
    {
      id: "three-tasks",
      kind: "list-shape",
      scope: { kind: "document" },
      ordered: false,
      minItems: 3,
      maxItems: 3,
      requireNonemptyItems: true,
      requireTaskItems: true,
      priority: 40,
      feedback: "할 일 세 개를 - [ ] 와 공백으로 시작하는 목록으로 쓴다.",
    },
  ],
}

describe("task list grading", () => {
  it("passes checked and unchecked items, in either letter case", () => {
    expect(evaluateProblem(todo, todo.target).status).toBe("matched")
    expect(
      evaluateProblem(todo, todo.target.replace("[x]", "[X]")).status,
    ).toBe("matched")
  })

  it("fails a plain bullet list where tasks were asked for", () => {
    expect(
      evaluateProblem(todo, todo.target.replace(/\[[ x]\] /g, "")),
    ).toMatchObject({ status: "fail", feedbackId: "three-tasks" })
  })
})
