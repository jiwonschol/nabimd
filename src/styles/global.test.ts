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
    expect(tokens).toContain("--panel-header-height: 64px")
    expect(styles).toMatch(
      /\.cbt-workspace\s*\{[^{}]*--panel-header-height:\s*104px[^{}]*--panel-controls-height:\s*64px/s,
    )
    expect(styles).toMatch(
      /\.cbt-panel__header\s*\{[^{}]*min-height:\s*var\(--panel-header-height\)[^{}]*flex:\s*0 0 var\(--panel-header-height\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__scroll\s*\{[^{}]*overflow-x:\s*hidden[^{}]*overflow-y:\s*auto/s,
    )
    expect(styles).toMatch(
      /\.answer-panel\s*\{[^{}]*grid-template-rows:\s*var\(--panel-header-height\) minmax\(0, 1fr\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor__scroll:focus-visible\s*\{[^{}]*outline:\s*2px solid/s,
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
      /\.markdown-source-editor__mount \.cm-scroller\s*\{[^{}]*padding-left:\s*0[^{}]*overflow-x:\s*hidden[^{}]*overflow-y:\s*auto[^{}]*line-height:\s*var\(--sheet-row-height\)/s,
    )
    expect(styles).toMatch(
      /\.writing-processor\[data-engine="codemirror"\] > \.writing-processor__scroll\s*\{[^{}]*overflow:\s*hidden/s,
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
    expect(styles).toMatch(
      /\.writing-processor\[data-leading-blank-rows="2"\][\s\S]*?padding-top:\s*calc\(var\(--sheet-row-height\) \+ var\(--sheet-row-height\)\)/s,
    )
  })

  it("keeps compact practice progress in the right-side action sequence", () => {
    expect(styles).toMatch(
      /\.exercise-topbar__page--right\s*\{[^{}]*display:\s*grid[^{}]*grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto[^{}]*align-items:\s*center/s,
    )
    expect(styles).toMatch(
      /\.exercise-progress\s*\{[^{}]*display:\s*flex[^{}]*min-width:\s*0[^{}]*align-items:\s*center[^{}]*justify-content:\s*center/s,
    )
    expect(styles).not.toContain("exercise-progress__level-name")
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

  it("keeps rendered Goal styling inside the shared CodeMirror line box", () => {
    expect(styles).toMatch(
      /\.markdown-source-editor__mount \.cm-line\s*\{[^{}]*min-height:\s*var\(--sheet-row-height\)[^{}]*padding:\s*0/s,
    )
    expect(styles).toMatch(
      /\.markdown-word-processor\[data-presentation="rendered"\] \.cm-line\s*\{[^{}]*cursor:\s*default/s,
    )
    expect(styles).toMatch(
      /\.markdown-word-processor\[data-presentation="rendered"\]:focus-visible\s*\{[^{}]*outline:\s*2px solid/s,
    )
    expect(styles).toMatch(
      /\.cm-rendered-widget--conceal\s*\{[^{}]*width:\s*0[^{}]*overflow:\s*hidden/s,
    )
  })

  it("renders nested source markers without introducing another row engine", () => {
    expect(styles).toMatch(
      /\.cm-invisible-character\s*\{[^{}]*min-width:\s*0\.62em[^{}]*font-family:\s*var\(--mono\)[^{}]*user-select:\s*none/s,
    )
    expect(styles).toMatch(
      /\.cm-invisible-character--tab\s*\{[^{}]*min-width:\s*1\.4em/s,
    )
    expect(styles).toMatch(
      /\.cm-rendered-widget__measure\s*\{[^{}]*visibility:\s*hidden/s,
    )
    expect(styles).toMatch(
      /\.cm-rendered-widget__glyph\s*\{[^{}]*position:\s*absolute/s,
    )
    expect(styles).toMatch(
      /\.cm-rendered-widget--fence\s*\{[^{}]*width:\s*0/s,
    )
    expect(styles).not.toContain("rendered-document__body--source-guided")
    expect(styles).not.toContain("list-style-position: inside")
    expect(styles).not.toContain("--rendered-leading-indent")
    expect(styles).not.toMatch(/li li::before\s*\{[^{}]*content:\s*"→"/s)
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
      /\.app-shell\.open-book-shell\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 96rem\)/s,
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
    expect(styles).toMatch(
      /\.app-shell--practice\s*\{[^{}]*grid-template-rows:\s*108px minmax\(0, 1fr\)/s,
    )
    expect(styles).toMatch(/\.exercise-topbar\s*\{[^{}]*min-height:\s*108px/s)
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
    const practiceStack = lastCssBlock("@media (max-width: 760px) {")

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

  it("keeps the Landing and Practice pages in the same book geometry", () => {
    expect(styles).toMatch(
      /\.app-shell\.open-book-shell\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 96rem\)/s,
    )
    expect(styles).toMatch(
      /\.app-shell--practice\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 96rem\)/s,
    )
    expect(styles).not.toMatch(
      /\.app-shell--practice\s*\{[^{}]*max-width:\s*none/s,
    )
  })

  it("does not use deprecated word-break values", () => {
    expect(styles).not.toContain("word-break: break-word")
  })

  it("aligns the visible Goal instruction with the document text", () => {
    expect(styles).toMatch(
      /\.goal-panel > \.cbt-panel__header\s*\{[^{}]*justify-content:\s*flex-start[^{}]*padding-left:\s*calc\(42px \+ 57px \+ 23px\)/s,
    )
  })

  it("distributes the three answer modes across the answer page", () => {
    expect(styles).toMatch(
      /\.answer-tabs\s*\{[^{}]*width:\s*100%[^{}]*height:\s*var\(--panel-controls-height\)[^{}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)[^{}]*align-self:\s*flex-start[^{}]*padding-inline:\s*3%\s*7%[^{}]*transform:\s*translate\(4px,\s*0\)/s,
    )
    expect(styles).toMatch(
      /\.answer-tab\[aria-selected="true"\]::after\s*\{[^{}]*bottom:\s*3px[^{}]*left:\s*50%[^{}]*width:\s*6px[^{}]*height:\s*6px[^{}]*border-radius:\s*50%[^{}]*transform:\s*translateX\(-50%\)/s,
    )
  })

  it("keeps feedback on one keyboard-reachable reading scroller", () => {
    expect(styles).toMatch(
      /\.answer-panel__body--reading\s*\{[^{}]*overflow:\s*auto/s,
    )
    expect(styles).toMatch(
      /\.answer-panel__body--reading:focus-visible\s*\{[^{}]*(?:outline|box-shadow):/s,
    )
    expect(styles).toMatch(
      /\.answer-review__corrections[\s\S]*?list-style:\s*none/s,
    )
    expect(styles).not.toMatch(
      /\.answer-hint__corrections,[\s\S]*?\.answer-review__corrections\s*\{[^{}]*overflow-y:\s*auto/s,
    )
  })

  it("derives narrow Summary pages from the actual Practice chrome", () => {
    expect(tokens).toContain("--practice-topbar-height: 108px")
    const practiceStack = lastCssBlock("@media (max-width: 760px) {")
    const summaryStack = lastCssBlock("@media (max-width: 760px)")

    expect(practiceStack).toContain("--practice-topbar-height: 140px")
    expect(summaryStack).toMatch(
      /\.run-summary__page\s*\{[^{}]*min-height:\s*calc\(100svh - var\(--practice-topbar-height\) - 12px\)/s,
    )
    expect(summaryStack).not.toContain("100svh - 72px")
  })

  it("keeps each desktop Summary page internally scrollable", () => {
    const pageRule = styles.indexOf(".run-summary__page {")

    expect(pageRule).toBeGreaterThanOrEqual(0)
    expect(styles.slice(pageRule, styles.indexOf("}", pageRule) + 1)).toContain(
      "overflow-y: auto",
    )
    expect(styles).toMatch(
      /\.run-summary__closure-copy,[\s\S]*?\.run-summary__note-copy\s*\{[^{}]*align-self:\s*safe center/s,
    )
  })

  it("keeps the book spread side by side in narrow desktop windows", () => {
    const narrowDesktop = lastCssBlock(
      "@media (max-width: 1040px) and (min-width: 761px)",
    )

    expect(narrowDesktop).toMatch(
      /\.exercise-topbar\s*\{[^{}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
    )
    expect(narrowDesktop).toMatch(
      /\.cbt-workspace\.open-book-shell\s*\{[^{}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[^{}]*grid-template-rows:\s*minmax\(0, 1fr\)/s,
    )
    expect(narrowDesktop).toMatch(
      /\.cbt-workspace\s*\{[^{}]*--panel-header-height:\s*104px/s,
    )
    expect(narrowDesktop).toMatch(
      /\.run-summary__metrics > div\s*\{[^{}]*min-width:\s*0[^{}]*flex:\s*1 1 0/s,
    )
  })

  it("compacts the fixed book chrome in short desktop windows", () => {
    const shortDesktop = lastCssBlock(
      "@media (max-height: 680px) and (min-width: 761px)",
    )

    expect(shortDesktop).toMatch(
      /\.app-shell--practice\s*\{[^{}]*grid-template-rows:\s*88px minmax\(0, 1fr\)/s,
    )
    expect(shortDesktop).toMatch(
      /\.exercise-topbar\s*\{[^{}]*min-height:\s*88px/s,
    )
    expect(shortDesktop).toMatch(
      /\.open-book-page--chapters\s*\{[^{}]*padding-top:\s*4rem/s,
    )
    expect(shortDesktop).toMatch(
      /\.run-summary__closure-copy,[\s\S]*?\.run-summary__note-copy\s*\{[^{}]*align-self:\s*start/s,
    )
    expect(shortDesktop).toMatch(
      /\.run-summary__page\s*\{[^{}]*grid-template-rows:\s*auto auto[^{}]*align-content:\s*start/s,
    )
    expect(shortDesktop).toMatch(
      /\.run-summary__sprig\s*\{[^{}]*display:\s*none/s,
    )
    expect(styles.lastIndexOf("@media (max-height: 680px) and (min-width: 761px)")).toBeGreaterThan(
      styles.indexOf(".open-book-why__support"),
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
