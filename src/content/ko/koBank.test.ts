import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { validateProblemBank } from "../validateProblemBank"
import { koSamples } from "./_samples"
import { KO_DOC_TYPES, KO_MARKS } from "./build"
import { koFixtures } from "./fixtures"
import { koCards, koCardsByMark, koMixedCards, koProblems } from "./index"
import { lintKoCard } from "./lint"

describe("한국어 문제은행 v1", () => {
  it("기호 12개마다 8장 이상이고 혼합이 24장이다", () => {
    expect(Object.keys(koCardsByMark).sort()).toEqual([...KO_MARKS].sort())
    for (const mark of KO_MARKS) {
      expect(koCardsByMark[mark].length, mark).toBeGreaterThanOrEqual(8)
      expect(koCardsByMark[mark].every((card) => card.marks.join() === mark), mark).toBe(true)
    }
    expect(koMixedCards).toHaveLength(24)
    for (const card of koMixedCards) {
      expect(card.marks.length, card.problem.id).toBeGreaterThanOrEqual(2)
      expect(card.marks.length, card.problem.id).toBeLessThanOrEqual(3)
    }
  })

  it("표가 든 장마다 본문 행이 빠진 표와 머리 칸 수가 다른 표가 실패한다", () => {
    const tableCards = koCards.filter((card) => card.marks.includes("table"))
    expect(tableCards.length).toBeGreaterThanOrEqual(8)
    for (const card of tableCards) {
      const byId = (suffix: string) =>
        koFixtures.find((fixture) => fixture.id === `${card.problem.id}--table-${suffix}`)
      for (const suffix of ["no-body-rows", "fewer-header-cells"]) {
        const fixture = byId(suffix)
        expect(fixture, `${card.problem.id} ${suffix}`).toBeDefined()
        const evaluation = evaluateProblem(card.problem, fixture!.source)
        expect(evaluation.status).toBe("fail")
        if (evaluation.status === "fail") expect(evaluation.feedbackId).toBe("shaped-table")
      }
    }
  })

  it("정한 문서 유형이 모두 나온다", () => {
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
