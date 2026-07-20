/// <reference types="node" />

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const styles = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8")
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8")
const bookSpine = readFileSync(
  resolve(process.cwd(), "src/components/BookSpine.tsx"),
  "utf8",
)

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
  it("uses the approved paper, ruled-sheet, and stitched-spine assets", () => {
    expect(styles).toContain('url("/images/nabi-book-paper.png")')
    expect(styles).toContain('url("/images/nabi-writing-rule.png")')
    expect(bookSpine).toContain('src="/images/nabi-book-spine.png"')
    expect(styles).toMatch(/\.book-spine\s*\{[^{}]*object-fit:\s*contain/s)
    expect(styles).not.toMatch(/\.open-book-shell::after\s*\{[^{}]*box-shadow:/s)
  })

  it("shares one panel-header height across the ruled writing sheets", () => {
    expect(tokens).toContain("--panel-header-height: 74px")
    expect(styles).toMatch(
      /\.cbt-panel__header\s*\{[^{}]*min-height:\s*var\(--panel-header-height\)[^{}]*flex:\s*0 0 var\(--panel-header-height\)/s,
    )
    expect(styles).toMatch(
      /\.writing-sheet__line-numbers\s*\{[^{}]*top:\s*var\(--panel-header-height\)/s,
    )
    expect(styles).toMatch(
      /\.answer-panel\s*\{[^{}]*grid-template-rows:\s*var\(--panel-header-height\) minmax\(0, 1fr\)/s,
    )
  })

  it("keeps the landing leaf opaque while a broad page crosses the spine", () => {
    expect(styles).toMatch(
      /\.open-book-shell--turning \.open-book-page--intro\s*\{[^{}]*animation:\s*none/s,
    )
    const turnKeyframes = styles.slice(
      styles.indexOf("@keyframes turn-page-forward"),
      styles.indexOf("@keyframes receive-next-page"),
    )
    expect(turnKeyframes).toContain("clip-path: polygon(")
    expect(turnKeyframes).toMatch(/88%\s*\{[^{}]*opacity:\s*1/s)
    expect(turnKeyframes).not.toContain("rotateY(-78deg)")
    expect(styles).toMatch(
      /animation:\s*turn-page-forward var\(--page-turn-duration\)\s+linear both/,
    )
  })

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
