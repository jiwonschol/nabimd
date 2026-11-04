import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { MARKS } from "../app/marks"
import { RUN_SIZE } from "../app/selection"

// Line breaks in the Markdown source are not part of the sentence.
const monitoringGuide = readFileSync(
  resolve(process.cwd(), "docs/production-health-monitoring.md"),
  "utf8",
).replace(/\s+/g, " ")

describe("production health monitoring guide", () => {
  it("tracks the live map size and today's-five length", () => {
    expect(monitoringGuide).toContain(`map of \`${MARKS.length}\` marks`)
    expect(monitoringGuide).toContain(
      `\`${RUN_SIZE}\` documents passed on the first try, and \`${RUN_SIZE}\` summary cards`,
    )
    expect(monitoringGuide).toContain("tests/e2e/production-health.spec.ts")
  })
})
