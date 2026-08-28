import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { entryChoices } from "./entryChoices"
import { RUN_POLICY } from "../selection/runPolicy"

const monitoringGuide = readFileSync(
  resolve(process.cwd(), "docs/production-health-monitoring.md"),
  "utf8",
)

describe("production health monitoring guide", () => {
  it("tracks the live level and turn-size contract", () => {
    expect(monitoringGuide).toContain(`shows all \`${entryChoices.length}\` levels`)
    expect(monitoringGuide).toContain(
      `fewer than \`${RUN_POLICY.turnSize}\` implemented`,
    )
    expect(monitoringGuide).toContain(
      `all \`${RUN_POLICY.turnSize}\` problems`,
    )
    expect(monitoringGuide).toContain(
      `a \`${RUN_POLICY.turnSize} / ${RUN_POLICY.turnSize}\` result`,
    )
    expect(monitoringGuide).toContain(
      `and \`${RUN_POLICY.turnSize}\` completed pages`,
    )
    expect(monitoringGuide).toContain(
      "four distinct single-syntax exercises plus one mixed exercise",
    )
  })
})
