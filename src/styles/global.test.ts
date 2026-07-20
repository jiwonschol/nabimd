/// <reference types="node" />

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const styles = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8")

describe("global responsive styles", () => {
  it("keeps the narrow Summary overrides after its desktop rules", () => {
    const desktopSummary = styles.indexOf(".run-summary.open-book-shell {")
    const narrowMedia = styles.lastIndexOf("@media (max-width: 760px)")
    const narrowSummary = styles.lastIndexOf(".run-summary.open-book-shell {")

    expect(desktopSummary).toBeGreaterThanOrEqual(0)
    expect(narrowMedia).toBeGreaterThan(desktopSummary)
    expect(narrowSummary).toBeGreaterThan(narrowMedia)
    expect(
      styles.slice(narrowSummary, styles.indexOf("}", narrowSummary) + 1),
    ).toContain("overflow-y: auto")
  })
})
