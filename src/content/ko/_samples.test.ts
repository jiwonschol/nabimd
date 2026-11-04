import { describe, expect, it } from "vitest"
import { evaluateProblem } from "../../engine/evaluateProblem"
import { derivePlaintextStarter } from "../plaintextStarter"
import { getKoSample, koSamples } from "./_samples"

describe("한국어 표본 문서 세 장", () => {
  it("정답 소스가 실엔진을 통과하고 리뷰 지적이 없다", () => {
    for (const { problem } of koSamples) {
      const evaluation = evaluateProblem(problem, problem.target)
      expect(evaluation, problem.id).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
  })

  it("채우기 모드의 시작 글(기호를 뺀 산문)은 그대로는 통과하지 않는다", () => {
    for (const { problem } of koSamples) {
      const starter = derivePlaintextStarter(problem.target)
      expect(starter, problem.id).not.toContain("#")
      expect(evaluateProblem(problem, starter).status, problem.id).toBe("fail")
    }
  })

  it("기호 하나가 빠지면 그 기호의 피드백으로 실패한다", () => {
    const cases: readonly [string, string, string][] = [
      [
        "ko-sample-grocery-memo",
        "# 장보기 메모\n\n- 우유\n- 달걀\n식빵",
        "three-bullet-items",
      ],
      [
        "ko-sample-meeting-memo",
        "# 11월 기획 회의\n\n결정: 금요일에 시안을 고른다.\n\n1. 시안 세 개를 캡처한다\n2. 비교표를 쓴다\n3. 금요일에 고른다",
        "bold-decision",
      ],
      [
        "ko-sample-ai-request",
        "# 요청: 회의 메모 정리\n\n- 아래 메모를 세 줄로 요약한다\n- 결정 사항은 굵게 표시한다\n\n결과는 마크다운으로 준다",
        "quoted-output-rule",
      ],
      ["ko-sample-grocery-memo", "장보기 메모\n\n- 우유\n- 달걀\n- 식빵", "use-h1-heading"],
      ["ko-sample-grocery-memo", "#장보기 메모\n\n- 우유\n- 달걀\n- 식빵", "space-after-hash"],
    ]
    for (const [id, source, feedbackId] of cases) {
      const { problem } = koSamples.find((sample) => sample.problem.id === id)!
      const evaluation = evaluateProblem(problem, source)
      expect(evaluation.status, `${id}: ${feedbackId}`).toBe("fail")
      if (evaluation.status === "fail") {
        expect(evaluation.feedbackId).toBe(feedbackId)
        expect(evaluation.message).toMatch(/다\.$/)
      }
    }
  })

  it("길이와 문체 규칙(계획서 §4.3)을 지킨다", () => {
    for (const { problem } of koSamples) {
      const lines = problem.target.split("\n")
      expect(lines.length, problem.id).toBeLessThanOrEqual(10)
      for (const line of lines) expect(line.length, problem.id).toBeLessThanOrEqual(60)
      expect(problem.target.length, problem.id).toBeLessThanOrEqual(150)
      const copy = [
        problem.prompt,
        problem.teaching.concept,
        problem.teaching.howTo,
        ...problem.hints,
        ...problem.matchChecks.map((check) => check.feedback),
        ...problem.editorialChecks.map((check) => check.review),
      ]
      for (const sentence of copy) {
        expect(sentence, problem.id).not.toMatch(/요[.?!]?$/)
      }
    }
  })

  it("표본 번호는 세 장을 순환한다", () => {
    expect(getKoSample(0).problem.id).toBe("ko-sample-grocery-memo")
    expect(getKoSample(3).problem.id).toBe("ko-sample-grocery-memo")
    expect(getKoSample(-1).problem.id).toBe("ko-sample-ai-request")
  })
})
