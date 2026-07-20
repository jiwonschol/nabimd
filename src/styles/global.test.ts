/// <reference types="node" />

import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const styles = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8")
const tokens = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8")
const landing = readFileSync(
  resolve(process.cwd(), "src/components/OpenBookLanding.tsx"),
  "utf8",
)
const editorialDesk = readFileSync(
  resolve(process.cwd(), "src/components/EditorialDesk.tsx"),
  "utf8",
)
const runSummary = readFileSync(
  resolve(process.cwd(), "src/components/RunSummary.tsx"),
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
  it("uses one motionless open-book image for both sheets and the center fold", () => {
    expect(
      existsSync(resolve(process.cwd(), "public/images/nabi-open-book-spread.webp")),
    ).toBe(true)
    expect(
      statSync(resolve(process.cwd(), "public/images/nabi-open-book-spread.webp"))
        .size,
    ).toBeLessThan(300_000)
    expect(
      existsSync(resolve(process.cwd(), "public/images/nabi-open-book-spread.png")),
    ).toBe(false)
    expect(
      existsSync(resolve(process.cwd(), "public/images/nabi-book-spine.png")),
    ).toBe(false)
    expect(styles).toContain('url("/images/nabi-open-book-spread.webp")')
    expect(styles).not.toContain('url("/images/nabi-writing-rule.png")')
    expect(styles).not.toContain("background-repeat: repeat-y")
    expect(styles).not.toContain("nabi-book-spine.png")
    expect(styles).not.toContain(".book-spine")
    expect(landing).not.toContain("BookSpine")
    expect(editorialDesk).not.toContain("BookSpine")
    expect(runSummary).not.toContain("BookSpine")
    expect(styles).toMatch(
      /\.app-shell\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-open-book-spread\.webp"\)[^{}]*background-size:\s*100% 100%/s,
    )
    expect(styles).toMatch(
      /\.open-book-page\s*\{[^{}]*background:\s*transparent/s,
    )
    expect(styles).not.toMatch(
      /\.open-book-shell\s*\{[^{}]*background:\s*transparent/s,
    )
  })

  it("shares one panel-header height across the embedded word processors", () => {
    expect(tokens).toContain("--panel-header-height: 74px")
    expect(styles).toMatch(
      /\.cbt-panel__header\s*\{[^{}]*min-height:\s*var\(--panel-header-height\)[^{}]*flex:\s*0 0 var\(--panel-header-height\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__scroll\s*\{[^{}]*overflow-x:\s*hidden[^{}]*overflow-y:\s*auto/s,
    )
    expect(styles).toMatch(
      /\.answer-panel\s*\{[^{}]*grid-template-rows:\s*var\(--panel-header-height\) minmax\(0, 1fr\)/s,
    )
  })

  it("aligns both writing sheets to one row and gutter contract", () => {
    expect(styles).toMatch(
      /\.cbt-workspace\s*\{[^{}]*--sheet-row-height:\s*40px[^{}]*--sheet-gutter-offset:[^;]+;[^{}]*--sheet-gutter-width:\s*3\.25rem[^{}]*--sheet-text-gap:/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__row\s*\{[^{}]*height:\s*var\(--sheet-row-height\)[^{}]*grid-template-columns:\s*57px minmax\(0, 1fr\)[^{}]*border-bottom:/s,
    )
    expect(styles).toMatch(
      /\.goal-panel > \.writing-processor\s*\{[^{}]*margin:\s*0 52px 0 42px/s,
    )
    expect(styles).toMatch(
      /\.markdown-source-editor__mount \.cm-scroller\s*\{[^{}]*padding-left:\s*0[^{}]*overflow:\s*visible[^{}]*line-height:\s*var\(--sheet-row-height\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__content\s*\{[^{}]*margin-left:\s*57px[^{}]*padding:\s*0 25px 0 23px/s,
    )
    expect(styles).toMatch(
      /\.markdown-source-editor__mount \.cm-content\s*\{[^{}]*padding:\s*0/s,
    )
    expect(styles).toMatch(
      /\.markdown-source-editor__mount \.cm-line\s*\{[^{}]*min-height:\s*var\(--sheet-row-height\)[^{}]*padding:\s*0/s,
    )
  })

  it("gives both processor modes one selected font and one row implementation", () => {
    expect(styles).toMatch(
      /\.writing-processor\s*\{[^{}]*font-family:\s*var\(--serif\)[^{}]*font-size:\s*1\.08rem/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__row\s*\{[^{}]*height:\s*var\(--sheet-row-height\)[^{}]*grid-template-columns:\s*57px minmax\(0, 1fr\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__content\s*\{[^{}]*margin-left:\s*57px[^{}]*padding:\s*0 25px 0 23px/s,
    )
    expect(styles).not.toContain(".cm-sheet-row")
    expect(styles).not.toContain(".writing-sheet-row")
  })

  it("keeps Goal formatting marks out of the rendered line box", () => {
    expect(styles).toMatch(
      /\.writing-processor__content > \.rendered-document__body h1::after,[\s\S]*?\.writing-processor__content > \.rendered-document__body li::after\s*\{[^{}]*line-height:\s*0/s,
    )
  })

  it("renders the authored blank row after a level-two heading", () => {
    expect(styles).toMatch(
      /\.writing-processor__content > \.rendered-document__body h2\s*\{[^{}]*margin:\s*0 0 var\(--sheet-row-height\)/s,
    )
  })

  it("keeps nested list rows consecutive with the authored source", () => {
    expect(styles).toMatch(
      /\.writing-processor__content > \.rendered-document__body li > ul,[\s\S]*?\.writing-processor__content > \.rendered-document__body li > ol\s*\{[^{}]*margin-bottom:\s*0/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__content\s*>\s*\.rendered-document__body\s*li:has\(> ul, > ol\)::after\s*\{[^{}]*content:\s*none/s,
    )
  })

  it("uses a genuinely transparent wordmark asset", () => {
    const wordmark = readFileSync(
      resolve(process.cwd(), "public/brand/bfly-wordmark.png"),
    )

    expect(wordmark.subarray(1, 4).toString()).toBe("PNG")
    expect(wordmark[25]).toBe(6)
  })

  it("locks the Greeting wordmark to the Practice and Summary coordinates", () => {
    expect(styles).toMatch(
      /\.app-shell\.open-book-shell\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 104rem\)/s,
    )
    expect(styles).toMatch(
      /\.open-book-page--intro > \.wordmark\s*\{[^{}]*position:\s*absolute[^{}]*top:\s*26\.5px[^{}]*left:\s*42px[^{}]*min-height:\s*48px[^{}]*font-size:\s*clamp\(1\.35rem, 1\.8vw, 1\.75rem\)/s,
    )
  })

  it("uses page-local running heads without a rule across the binding", () => {
    expect(styles).toMatch(
      /\.exercise-topbar\s*\{[^{}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^{}]*border:\s*0/s,
    )
    expect(styles).not.toMatch(/\.exercise-topbar\s*\{[^{}]*border-bottom:/s)
    expect(styles).toMatch(/\.exercise-topbar__page--left\s*\{[^{}]*padding-right:\s*52px/s)
    expect(styles).toMatch(/\.exercise-topbar__page--right\s*\{[^{}]*padding-left:\s*52px/s)
  })

  it("turns one broad opaque leaf while the Practice spread lights from above", () => {
    expect(styles).toMatch(
      /\.page-turn-stage--active \.page-turn-receiver\s*\{[^{}]*animation:\s*practice-paper-light-on/s,
    )
    expect(styles).toMatch(
      /\.page-turn-stage--active \.page-turn-receiver::after\s*\{[^{}]*animation:\s*practice-light-sweep/s,
    )
    expect(styles).toMatch(
      /\.open-book-shell--turning\s*\{[^{}]*background:\s*transparent/s,
    )
    expect(styles).toMatch(
      /\.open-book-shell--turning \.open-book-page--intro\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-book-paper\.png"\)[^{}]*opacity:\s*1[^{}]*\}/s,
    )
    expect(styles).not.toMatch(
      /\.open-book-shell--turning \.open-book-page--intro\s*\{[^{}]*animation:/s,
    )
    const turnKeyframes = styles.slice(
      styles.indexOf("@keyframes turn-page-forward"),
      styles.indexOf("@keyframes release-previous-page"),
    )
    expect(turnKeyframes).toContain("clip-path: polygon(")
    expect(turnKeyframes).toMatch(/82%\s*\{[^{}]*opacity:\s*1/s)
    expect(turnKeyframes).toContain("rotateY(-104deg)")
    expect(turnKeyframes).not.toContain("translateX(-106%)")
    expect(styles).toMatch(
      /animation:\s*turn-page-forward var\(--page-turn-duration\)\s+linear both/,
    )
    expect(styles).toMatch(
      /\.open-book-shell--turning \.open-book-page--chapters::after\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-book-paper\.png"\)[^{}]*animation:\s*reveal-page-back/s,
    )
    expect(styles).toContain("@keyframes practice-paper-light-on")
    expect(styles).toContain("@keyframes practice-light-sweep")
    expect(styles).toContain("ellipse(0% 0% at 50% 0%)")
  })

  it("removes the two-page fold when the responsive layout stacks", () => {
    const landingStack = styles.slice(
      styles.indexOf("@media (max-width: 760px)"),
      styles.indexOf("@media (prefers-reduced-motion: reduce)"),
    )
    const practiceStack = lastCssBlock("@media (max-width: 900px)")

    expect(landingStack).toMatch(
      /\.app-shell\.open-book-shell:not\(\.open-book-shell--turning\)\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-book-paper\.png"\)[^{}]*background-repeat:\s*repeat/s,
    )
    expect(landingStack).not.toMatch(
      /\.app-shell\.open-book-shell\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-book-paper\.png"\)/s,
    )
    expect(practiceStack).toMatch(
      /\.app-shell--practice\s*\{[^{}]*background-image:\s*url\("\/images\/nabi-book-paper\.png"\)[^{}]*background-repeat:\s*repeat/s,
    )
  })

  it("keeps Landing, Practice, and Summary on the same wide-screen geometry", () => {
    expect(styles).toMatch(
      /\.app-shell--practice\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 104rem\)/s,
    )
    expect(styles).not.toMatch(
      /\.app-shell--practice\s*\{[^{}]*max-width:\s*none/s,
    )
  })

  it("places the Goal marker at the inner page edge like the approved spread", () => {
    expect(styles).toMatch(
      /\.goal-panel > \.cbt-panel__header\s*\{[^{}]*justify-content:\s*flex-end/s,
    )
  })

  it("distributes the three answer modes across the answer page", () => {
    expect(styles).toMatch(
      /\.answer-tabs\s*\{[^{}]*width:\s*100%[^{}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[^{}]*padding-inline:\s*3%\s*7%/s,
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
