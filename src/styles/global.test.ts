/// <reference types="node" />

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const styles = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8")

function lastCssBlock(selector: string): string {
  const start = styles.lastIndexOf(selector)
  const openingBrace = styles.indexOf("{", start)
  let depth = 0

  expect(start).toBeGreaterThanOrEqual(0)
  expect(openingBrace).toBeGreaterThan(start)

  for (let index = openingBrace; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1
    if (styles[index] !== "}") continue
    depth -= 1
    if (depth === 0) return styles.slice(start, index + 1)
  }

  throw new Error(`Unclosed CSS block: ${selector}`)
}

describe("global responsive styles", () => {
  it("keeps each desktop Summary page internally scrollable", () => {
    const pageRule = styles.indexOf(".run-summary__page {")

    expect(pageRule).toBeGreaterThanOrEqual(0)
    expect(styles.slice(pageRule, styles.indexOf("}", pageRule) + 1)).toContain(
      "overflow-y: auto",
    )
  })

  it("removes animation delays for reduced-motion users", () => {
    const reducedMotion = lastCssBlock("@media (prefers-reduced-motion: reduce)")

    expect(reducedMotion).toMatch(
      /\*\s*,\s*\*::before,\s*\*::after\s*\{[^{}]*animation-delay:\s*0ms !important/,
    )
  })

  it("keeps the narrow Summary overrides after its desktop rules", () => {
    const desktopSummary = styles.indexOf(".run-summary.open-book-shell {")
    const narrowMedia = lastCssBlock("@media (max-width: 760px)")

    expect(desktopSummary).toBeGreaterThanOrEqual(0)
    expect(styles.lastIndexOf("@media (max-width: 760px)")).toBeGreaterThan(
      desktopSummary,
    )
    expect(narrowMedia).toMatch(
      /\.run-summary\.open-book-shell\s*\{[^{}]*overflow-y:\s*auto/,
    )
  })
})
