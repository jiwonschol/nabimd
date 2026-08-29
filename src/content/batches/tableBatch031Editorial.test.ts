import { describe, expect, it } from "vitest"
import { describeCheckpoint } from "../../components/CenterCard"
import { deriveSyntaxCheckpoints } from "../../guided/guidedSyntax"
import { derivePlaintextStarter } from "../plaintextStarter"
import { tableBatch030Problems } from "./tableBatch030Problems"
import {
  tableBatch031Id,
  tableBatch031Problems,
} from "./tableBatch031Problems"

describe("Level 1 table batch 031 editorial replacement", () => {
  it("replaces all twelve sealed candidates at revision two", () => {
    expect(tableBatch031Id).toBe("2026-08-29-l1-tables-031")
    expect(tableBatch031Problems).toHaveLength(12)
    expect(
      tableBatch031Problems.every(
        (problem) =>
          problem.sourceBatchId === tableBatch031Id && problem.revision === 2,
      ),
    ).toBe(true)
  })

  it("changes only the reviewed copy and the one travel label", () => {
    expect(tableBatch031Problems.map((problem) => problem.id)).toEqual(
      tableBatch030Problems.map((problem) => problem.id),
    )

    for (const [index, replacement] of tableBatch031Problems.entries()) {
      const prior = tableBatch030Problems[index]!
      const expected = {
        ...prior,
        teaching: {
          concept: "A Markdown table lines up related values in rows and columns.",
          howTo:
            "Put a bar between the cells in every row — the divider row under the headers needs one too.",
          example: "Name | Age\n--- | ---\nAda | 31",
        },
        hints: [
          "Every row takes a bar, including the one made of dashes.",
          "Type one vertical bar between the two cells.",
          "Example: `Name | Age`",
        ],
        matchChecks: prior.matchChecks.map((check) =>
          check.id === "use-table"
            ? {
                ...check,
                feedback:
                  "Type a vertical bar between the two cells in each of the three rows.",
              }
            : check,
        ),
        sourceBatchId: tableBatch031Id,
        revision: 2,
        ...(prior.id === "l1-table-bus-time"
          ? {
              target: "Route | Time\n--- | ---\nGreen | Noon",
              contentVariant: "route-time",
              vocabulary: {
                profile: "everyday" as const,
                domains: ["local-travel"],
                terms: ["route", "time", "green", "noon"],
              },
            }
          : {}),
      }

      expect(replacement, replacement.id).toEqual(expected)
    }
  })

  it("keeps the shared example outside every candidate answer", () => {
    const targets = new Set(tableBatch031Problems.map((problem) => problem.target))
    const headerRows = new Set(
      tableBatch031Problems.map((problem) => problem.target.split("\n")[0]),
    )

    for (const problem of tableBatch031Problems) {
      expect(targets.has(problem.teaching.example), problem.id).toBe(false)
      expect(problem.teaching.example, problem.id).toBe(
        "Name | Age\n--- | ---\nAda | 31",
      )
      expect(problem.hints[2], problem.id).toBe("Example: `Name | Age`")
      expect(headerRows.has("Name | Age"), problem.id).toBe(false)
    }
  })

  it("tells the learner to type the three visible bars and nothing locked", () => {
    for (const problem of tableBatch031Problems) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        derivePlaintextStarter(problem.target),
      )
      expect(
        checkpoints.map((checkpoint) =>
          checkpoint.segments
            .filter((segment) => segment.kind === "input")
            .map((segment) => segment.value),
        ),
        problem.id,
      ).toEqual([["|"], ["|"], ["|"]])
      expect(
        checkpoints.map((checkpoint) => describeCheckpoint(checkpoint).term),
        problem.id,
      ).toEqual(["table row", "column headers", "table row"])
      expect(problem.teaching.howTo, problem.id).toBe(
        "Put a bar between the cells in every row — the divider row under the headers needs one too.",
      )
      expect(problem.matchChecks[0]?.feedback, problem.id).toBe(
        "Type a vertical bar between the two cells in each of the three rows.",
      )
      expect(problem.hints[0], problem.id).toBe(
        "Every row takes a bar, including the one made of dashes.",
      )
    }
  })

  it("uses a concrete route label for the noon travel example", () => {
    const travel = tableBatch031Problems.find(
      (problem) => problem.id === "l1-table-bus-time",
    )

    expect(travel).toMatchObject({
      target: "Route | Time\n--- | ---\nGreen | Noon",
      contentVariant: "route-time",
      vocabulary: {
        domains: ["local-travel"],
        terms: ["route", "time", "green", "noon"],
      },
    })
  })
})
