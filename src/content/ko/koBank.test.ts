import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { koSamples } from "./_samples"
import { KO_DOC_TYPES } from "./build"
import { koFixtures } from "./fixtures"
import { koCards, koCardsByMark, koProblems } from "./index"
import { lintKoCard } from "./lint"

describe("한국어 문제은행 v1", () => {
  it("기호마다 8장 이상이다", () => {
    for (const [mark, cards] of Object.entries(koCardsByMark)) {
      expect(cards.length, mark).toBeGreaterThanOrEqual(8)
    }
  })

  it("문서 유형 열 가지가 모두 나온다", () => {
    const types = new Set(koCards.map((card) => card.docType))
    expect([...types].sort()).toEqual([...KO_DOC_TYPES].sort())
  })

  it("validateProblemBank를 통과한다", () => {
    expect(validateProblemBank(koProblems, koFixtures)).toEqual([])
  })

  it("장마다 픽스처가 4개 이상이고 정답·산문 변형·누락·오형을 모두 갖는다", () => {
    for (const problem of koProblems) {
      const fixtures = koFixtures.filter((fixture) => fixture.problemId === problem.id)
      expect(fixtures.length, problem.id).toBeGreaterThanOrEqual(4)
      const roles = new Set(fixtures.map((fixture) => fixture.role))
      for (const role of ["canonical", "different-prose", "missing", "malformed"] as const) {
        expect(roles.has(role), `${problem.id} ${role}`).toBe(true)
      }
    }
  })

  it("픽스처 전부가 실엔진에서 기대한 판정을 받는다", () => {
    const byId = new Map(koProblems.map((problem) => [problem.id, problem]))
    for (const fixture of koFixtures) {
      const evaluation = evaluateProblem(byId.get(fixture.problemId)!, fixture.source)
      expect(evaluation.status, fixture.id).toBe(fixture.expectedStatus)
      if (evaluation.status === "fail") {
        expect(evaluation.feedbackId, fixture.id).toBe(fixture.expectedFeedbackId)
      } else {
        expect(evaluation.reviewItems.map((item) => item.id), fixture.id).toEqual(
          fixture.expectedReviewIds,
        )
      }
    }
  })

  it("목표 원문이 서로, 그리고 표본과 겹치지 않는다", () => {
    const targets = [...koProblems, ...koSamples.map((sample) => sample.problem)].map(
      (problem) => problem.target,
    )
    expect(new Set(targets).size).toBe(targets.length)
    expect(new Set(koProblems.map((problem) => problem.id)).size).toBe(koProblems.length)
  })

  it("길이·해요체·금칙·문체 규칙을 지킨다", () => {
    expect(koCards.flatMap(lintKoCard)).toEqual([])
  })

  it("시작 글(기호를 뺀 산문)은 그대로는 통과하지 않는다", () => {
    for (const problem of koProblems) {
      expect(evaluateProblem(problem, "").status, problem.id).toBe("fail")
    }
  })
})
