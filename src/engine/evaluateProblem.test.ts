import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import { headingProblemFixtures } from "../content/problemFixtures"
import { evaluateProblem } from "./evaluateProblem"

describe("evaluateProblem", () => {
  it.each(headingProblemFixtures)("grades $problemId $kind", (fixture) => {
    const result = evaluateProblem(
      getHeadingProblem(fixture.problemId),
      fixture.source,
    )

    expect(result.status).toBe(fixture.expectedStatus)
    if (result.status === "fail") {
      const expectedFeedbackId =
        "expectedFeedbackId" in fixture
          ? fixture.expectedFeedbackId
          : undefined
      expect(result.feedbackId).toBe(expectedFeedbackId)
    }

    if (result.status !== "fail") {
      const expectedReviewIds =
        "expectedReviewIds" in fixture ? fixture.expectedReviewIds : []
      expect(result.reviewItems.map((item) => item.id)).toEqual(
        expectedReviewIds,
      )
    }
  })

  it("protects the required title text", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "# Weekly notes",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "preserve-apple",
      message: "Keep the word ‘Apple’ in your answer.",
    })
  })

  it("prioritizes malformed heading spacing", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "#Apple",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("prioritizes malformed heading spacing with trailing whitespace", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "#Apple   ",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "space-after-hash",
      message: "Add one space after the hash symbol.",
    })
  })

  it("encourages a real Setext heading while requiring the taught hash form", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "Apple\n=====",
    )

    expect(result).toEqual({
      status: "fail",
      feedbackId: "use-hash-heading-style",
      message:
        "That's a real heading! Markdown has two heading styles — this quest practices the hash style. Try: # Apple",
    })
  })

  it("never turns an editorial refinement into a failure", () => {
    const result = evaluateProblem(
      getHeadingProblem("heading-apple"),
      "# Apple\n\n# Details",
    )

    expect(result.status).toBe("matched")
  })

  describe("requested hash-H1 matching", () => {
    it.each([
      ["canonical", "# Apple"],
      ["closing ATX marker", "# Apple #"],
      ["one leading space", " # Apple"],
      ["two leading spaces", "  # Apple"],
      ["three leading spaces", "   # Apple"],
      ["tab separator", "#\tApple"],
      ["multiple separator spaces", "#   Apple"],
      ["trailing whitespace", "# Apple   "],
    ])("grades a faithful %s answer Perfect", (_label, source) => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), source)).toEqual({
        status: "perfect",
        reviewItems: [],
      })
    })

    it.each([
      ["four-space-indented code", "    # Apple"],
      ["fullwidth hash", "＃ Apple"],
      ["raw HTML H1", "<h1>Apple</h1>"],
      ["H2", "## Apple"],
      ["escaped hash", "\\# Apple"],
      ["blockquote-nested H1", "> # Apple"],
    ])("keeps %s outside the requested top-level hash H1", (_label, source) => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), source)).toEqual({
        status: "fail",
        feedbackId: "use-h1-heading",
        message: "Start the title with one hash symbol and one space.",
      })
    })

    it("fails empty input without weakening protected text", () => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), "")).toEqual({
        status: "fail",
        feedbackId: "preserve-apple",
        message: "Keep the word ‘Apple’ in your answer.",
      })
    })

    it.each(["#Apple today", "#apple", " #Apple today", "   #apple"])(
      "prioritizes the missing separator in %s",
      (source) => {
        expect(evaluateProblem(getHeadingProblem("heading-apple"), source)).toEqual({
          status: "fail",
          feedbackId: "space-after-hash",
          message: "Add one space after the hash symbol.",
        })
      },
    )

    it("diagnoses an NBSP separator as a visible spacing trap", () => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), "#\u00a0Apple")).toEqual({
        status: "fail",
        feedbackId: "space-after-hash",
        message: "Add one space after the hash symbol.",
      })
    })

    it("gives case-specific feedback before the protected-text check", () => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), "# apple")).toEqual({
        status: "fail",
        feedbackId: "match-apple-capitalization",
        message: "Close — match the capitalization: the goal says 'Apple'.",
      })
    })

    it("acknowledges a matching Setext H1 before requesting hash style", () => {
      expect(
        evaluateProblem(getHeadingProblem("heading-rainy-day"), "Rainy day\n========="),
      ).toEqual({
        status: "fail",
        feedbackId: "use-hash-heading-style",
        message:
          "That's a real heading! Markdown has two heading styles — this quest practices the hash style. Try: # Rainy day",
      })
    })
  })

  describe("rendered-semantic exactness", () => {
    it.each([
      ["emphasis", "# **Apple**"],
      ["inline code", "# `Apple`"],
      ["link", "# [Apple](https://example.com)"],
      ["extra paragraph", "# Apple\n\nExtra context."],
      ["extra H2", "# Apple\n\n## Details"],
    ])("grades %s as Matched with exactness review", (_label, source) => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), source)).toEqual({
        status: "matched",
        reviewItems: [
          {
            id: "matches-target-exactly",
            message:
              "Your document renders more than the goal — remove the extra emphasis/content to match it exactly.",
          },
        ],
      })
    })

    it("adds the existing title review for a duplicate same-text H1", () => {
      expect(
        evaluateProblem(getHeadingProblem("heading-apple"), "# Apple\n\n# Apple"),
      ).toEqual({
        status: "matched",
        reviewItems: [
          {
            id: "matches-target-exactly",
            message:
              "Your document renders more than the goal — remove the extra emphasis/content to match it exactly.",
          },
          {
            id: "one-document-title",
            message:
              "Keep one H1 as the document title; use lower heading levels for sections.",
          },
        ],
      })
    })

    it("treats malformed-only input as Fail with spacing guidance", () => {
      expect(evaluateProblem(getHeadingProblem("heading-apple"), "#Apple")).toMatchObject({
        status: "fail",
        feedbackId: "space-after-hash",
      })
    })

    it("treats malformed plus correct input as Matched", () => {
      expect(
        evaluateProblem(getHeadingProblem("heading-apple"), "#Apple\n\n# Apple"),
      ).toEqual({
        status: "matched",
        reviewItems: [
          {
            id: "matches-target-exactly",
            message:
              "Your document renders more than the goal — remove the extra emphasis/content to match it exactly.",
          },
        ],
      })
    })

    it.each(["# Rainy  day", "# Rainy\u00a0day"])(
      "normalizes supported internal whitespace in %s",
      (source) => {
        expect(
          evaluateProblem(getHeadingProblem("heading-rainy-day"), source),
        ).toEqual({ status: "perfect", reviewItems: [] })
      },
    )
  })
})
