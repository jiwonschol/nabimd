import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type {
  EditorialCheck,
  GradableProblem,
  MatchCheck,
} from "../content/types"
import { evaluateProblem } from "./evaluateProblem"

const strongPresence = {
  id: "use-bold-emphasis",
  kind: "inline-presence",
  scope: { kind: "document" },
  inline: "strong",
  min: 1,
  priority: 10,
  feedback: "Wrap a phrase with two asterisks on each side.",
} as const satisfies MatchCheck

const focusedStrong = {
  id: "one-bold-focus",
  kind: "max-inline-count",
  scope: { kind: "document" },
  inline: "strong",
  max: 1,
  review: "Keep one bold phrase as the main point in this short exercise.",
} as unknown as EditorialCheck

function problem({ editorial = false }: { editorial?: boolean } = {}): GradableProblem {
  return {
    ...normalizeProblem(headingProblems[0]),
    id: "bold-emphasis-test",
    familyId: "emphasis",
    skillIds: ["bold-emphasis"],
    matchChecks: [strongPresence],
    editorialChecks: editorial ? [focusedStrong] : [],
    retryFamily: "bold-emphasis",
    reviewTags: editorial ? ["one-bold-focus"] : [],
  }
}

describe("bold emphasis predicates", () => {
  it("requires parsed bold emphasis without grading the valid marker style", () => {
    expect(evaluateProblem(problem(), "**Completely different words**")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(problem(), "__Different words__")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(problem(), "***Different words***")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(problem(), "*Different words*")).toMatchObject({
      status: "fail",
      feedbackId: "use-bold-emphasis",
    })
    expect(evaluateProblem(problem(), "`**Different words**`")).toMatchObject({
      status: "fail",
      feedbackId: "use-bold-emphasis",
    })
  })

  it("keeps extra bold phrases Matched while offering one restraint review", () => {
    expect(evaluateProblem(problem({ editorial: true }), "**One point**")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(
      evaluateProblem(
        problem({ editorial: true }),
        "**One point** and **another point**",
      ),
    ).toEqual({
      status: "matched",
      reviewItems: [
        {
          id: "one-bold-focus",
          message: "Keep one bold phrase as the main point in this short exercise.",
        },
      ],
    })
  })
})
