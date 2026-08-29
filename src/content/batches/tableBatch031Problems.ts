import type { NormalizedProblem } from "../types"
import { tableBatch030Problems } from "./tableBatch030Problems"

export const tableBatch031Id = "2026-08-29-l1-tables-031"

const teaching = {
  concept: "A Markdown table lines up related values in rows and columns.",
  howTo:
    "Put a bar between the cells in every row — the divider row under the headers needs one too.",
  example: "Name | Age\n--- | ---\nAda | 31",
} as const

const hints = [
  "Every row takes a bar, including the one made of dashes.",
  "Type one vertical bar between the two cells.",
  "Example: `Name | Age`",
] as const

function replaceEditorialCopy(problem: NormalizedProblem): NormalizedProblem {
  const replacement = {
    ...problem,
    teaching,
    hints,
    matchChecks: problem.matchChecks.map((check) =>
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
  }

  if (problem.id !== "l1-table-bus-time") return replacement

  return {
    ...replacement,
    target: "Route | Time\n--- | ---\nGreen | Noon",
    contentVariant: "route-time",
    vocabulary: {
      profile: "everyday",
      domains: ["local-travel"],
      terms: ["route", "time", "green", "noon"],
    },
  }
}

export const tableBatch031Problems: readonly NormalizedProblem[] =
  tableBatch030Problems.map(replaceEditorialCopy)
