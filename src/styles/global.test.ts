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

function cssBlocks(selector: string): string[] {
  const blocks: string[] = []
  let searchFrom = 0

  while (searchFrom < styles.length) {
    const start = styles.indexOf(selector, searchFrom)
    if (start < 0) break

    const openingBrace = styles.indexOf("{", start)
    let depth = 0

    for (let index = openingBrace; index < styles.length; index += 1) {
      if (styles[index] === "{") depth += 1
      if (styles[index] !== "}") continue
      depth -= 1
      if (depth !== 0) continue

      blocks.push(styles.slice(start, index + 1))
      searchFrom = index + 1
      break
    }
  }

  return blocks
}

/**
 * The declarations for one selector inside the phone media query, and nothing
 * else. Asserting against the whole media query would let an unrelated later
 * rule satisfy a check the target rule no longer meets.
 */
function phoneRule(selector: string): string {
  const phoneStack = lastCssBlock("@media (max-width: 760px) {")
  const indentedSelector = `\n  ${selector} {`
  const start = phoneStack.indexOf(indentedSelector)
  const openingBrace = phoneStack.indexOf("{", start)

  expect(start).toBeGreaterThanOrEqual(0)

  const closingBrace = phoneStack.indexOf("}", openingBrace)
  expect(closingBrace).toBeGreaterThan(openingBrace)

  return phoneStack.slice(start + 3, closingBrace + 1)
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

  it("keeps the remaining word-processor helpers internally sized", () => {
    expect(tokens).toContain("--panel-header-height: 64px")
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

  it("keeps compact practice progress in the right-side action sequence", () => {
    expect(styles).toMatch(
      /\.exercise-topbar__page--right\s*\{[^{}]*display:\s*grid[^{}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto[^{}]*align-items:\s*center/s,
    )
    expect(styles).toMatch(
      /\.exercise-progress\s*\{[^{}]*display:\s*flex[^{}]*min-width:\s*0[^{}]*flex-direction:\s*column[^{}]*align-items:\s*center[^{}]*justify-content:\s*center/s,
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
      /\.cm-invisible-character\s*\{[^{}]*color:\s*rgb\(168 92 92 \/ 62%\)/s,
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

  it("gives rendered Markdown headings a descending size scale", () => {
    expect(styles).toMatch(/\.cm-rendered-heading--1\s*\{[^{}]*font-size:/s)
    expect(styles).toMatch(/\.cm-rendered-heading--2\s*\{[^{}]*font-size:/s)
    expect(styles).toMatch(/\.cm-rendered-heading--3\s*\{[^{}]*font-size:/s)
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
      /\.app-shell--practice\s*\{[^{}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s,
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

  it("turns the actual completed Practice leaves without moving the Summary book", () => {
    expect(styles).toMatch(
      /\.summary-page-turn-overlay\s*\{[^{}]*position:\s*absolute[^{}]*pointer-events:\s*none[^{}]*perspective:/s,
    )
    expect(styles).toMatch(
      /\.summary-page-turn-overlay \.center-card__leaf--write\s*\{[^{}]*animation:\s*turn-summary-page-forward var\(--page-turn-duration\)/s,
    )
    expect(styles).toMatch(
      /\.summary-page-turn-overlay \.center-card__leaf--read\s*\{[^{}]*animation:\s*release-summary-left-page var\(--page-turn-duration\)/s,
    )
    expect(styles).not.toContain(".cbt-")
  })

  it("uses a 250ms card transition and animates Hint height", () => {
    expect(tokens).toContain("--problem-transition-duration: 250ms")
    expect(styles).toMatch(
      /\.card-practice\s*\{[^{}]*transition:\s*height var\(--problem-transition-duration\)/s,
    )
    expect(styles).toMatch(
      /\.card-practice\[data-transition="problem"\] \.center-card\s*\{[^{}]*animation:\s*problem-card-in var\(--problem-transition-duration\)/s,
    )
  })

  it("reveals complete Summary elements without clipping words or reflowing text", () => {
    const summaryInkStart = styles.indexOf(".summary-ink {")
    const summaryInk = styles.slice(
      summaryInkStart,
      styles.indexOf("}", summaryInkStart) + 1,
    )
    expect(summaryInk).toContain("opacity: 0")
    expect(summaryInk).toContain("transform: translateY(2px)")
    expect(summaryInk).toContain("260ms")
    expect(summaryInk).not.toContain("clip-path")
    expect(summaryInk).not.toContain("width:")
    expect(styles).toMatch(
      /\.summary-ink--actions\s*\{[^{}]*animation-delay:\s*1180ms/s,
    )
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

  it("narrows Practice without changing the Landing book geometry", () => {
    expect(styles).toMatch(
      /\.app-shell\.open-book-shell\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 96rem\)/s,
    )
    expect(styles).toMatch(
      /\.app-shell\.app-shell--practice\s*\{[^{}]*width:\s*min\(calc\(100% - 12px\), 84rem\)/s,
    )
    expect(styles).not.toMatch(/(?:^|\n)\.open-book-shell\s*\{[^{}]*104rem/s)
    expect(styles).not.toMatch(
      /\.app-shell--practice\s*\{[^{}]*max-width:\s*none/s,
    )
  })

  it("does not use deprecated word-break values", () => {
    expect(styles).not.toContain("word-break: break-word")
  })

  it("emphasizes the requested syntax term with weight and an underline", () => {
    const instructionTerm = lastCssBlock(".center-card__instruction strong")

    expect(instructionTerm).toContain("font-weight: 700")
    expect(instructionTerm).toContain("text-decoration: underline")
    expect(instructionTerm).toContain("text-underline-offset")
    expect(instructionTerm).toContain("white-space: nowrap")
  })

  it("keeps the rendered Goal centered without a left-edge marker", () => {
    // The trailing brace pins this to the base row rule. Without it lastIndexOf
    // lands on a later descendant selector, and the assertion passes even when
    // the marker is still there.
    const currentGoal = lastCssBlock(".center-card__context-row--current {")

    expect(currentGoal).not.toContain("border-inline-start")
  })

  it("lifts every rendered Goal above the locked source phrase", () => {
    const currentGoal = lastCssBlock(
      ".center-card__context-row--current .rendered-document__body h1,",
    )

    for (const tag of [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "li",
      "pre",
      "pre code",
    ]) {
      expect(currentGoal).toContain(
        `.center-card__context-row--current .rendered-document__body ${tag}`,
      )
    }
    expect(currentGoal).toContain("font-size: clamp(1.35rem, 2.25vw, 1.7rem)")
  })

  it("keeps the phone mark boxes at the documented 40 x 44px floor", () => {
    const phoneBox = phoneRule(".center-card__box")

    expect(phoneBox).toContain("width: 2.5rem")
    expect(phoneBox).toContain("height: 2.75rem")
  })

  it("anchors the phone card to the top so Hint expands downward", () => {
    expect(phoneRule(".card-practice")).toContain("place-items: start stretch")
    expect(phoneRule(".center-card")).toContain("align-self: start")
    expect(phoneRule(".center-card")).not.toContain("align-self: center")
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
      /\.run-summary__metrics > div\s*\{[^{}]*min-width:\s*0[^{}]*flex:\s*1 1 0/s,
    )
  })

  it("compacts the fixed book chrome in short desktop windows", () => {
    const shortDesktop = lastCssBlock(
      "@media (max-height: 680px) and (min-width: 761px)",
    )

    expect(shortDesktop).toMatch(
      /\.app-shell--practice\s*\{[^{}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s,
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

  it("removes spatial transitions and keyframes for reduced-motion users", () => {
    const reducedMotionBlocks = cssBlocks(
      "@media (prefers-reduced-motion: reduce)",
    )
    const [landingReducedMotion, practiceReducedMotion] = reducedMotionBlocks

    expect(reducedMotionBlocks).toHaveLength(2)

    expect(landingReducedMotion).toMatch(
      /\.open-book-shell--turning \.open-book-page--chapters\s*\{[^{}]*animation:\s*summary-overlay-fade 120ms/s,
    )
    expect(landingReducedMotion).not.toContain("release-left-page")
    expect(landingReducedMotion).toMatch(
      /\.page-turn-stage--active \.page-turn-receiver::after\s*\{[^{}]*display:\s*none/s,
    )

    expect(practiceReducedMotion).toMatch(
      /\*\s*,\s*\*::before,\s*\*::after\s*\{[^{}]*animation-delay:\s*0ms !important[^{}]*animation-duration:\s*120ms !important[^{}]*transition-duration:\s*0ms !important/,
    )
    expect(practiceReducedMotion).toMatch(
      /\.card-practice\s*\{[^{}]*transition:\s*none !important/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.summary-page-turn-overlay\s*\{[^{}]*animation:\s*summary-overlay-fade 120ms/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.summary-page-turn-overlay \.center-card__leaf\s*\{[^{}]*animation:\s*none !important/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.verdict-notice:not\(\.verdict-notice--holding\)\s*\{[^{}]*animation:\s*problem-card-fade-in 120ms[^{}]*!important/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.verdict-notice--holding\s*\{[^{}]*opacity:\s*1/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.verdict-notice--holding\s*\{[^{}]*animation:\s*none !important/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.card-practice\[data-transition="problem"\] \.center-card\s*\{[^{}]*animation:\s*problem-card-fade-in 120ms[^{}]*!important/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.summary-ink\s*\{[^{}]*transform:\s*none[^{}]*animation:\s*problem-card-fade-in 120ms/s,
    )
    expect(practiceReducedMotion).toMatch(
      /\.run-summary__title::after\s*\{[^{}]*transform:\s*none[^{}]*animation:\s*none !important/s,
    )

    const reducedAnimations = reducedMotionBlocks.flatMap((block) =>
      [...block.matchAll(/animation(?:-name)?:\s*([a-z][\w-]*)/g)]
        .map((match) => match[1])
        .filter((name) => name !== "none"),
    )

    for (const animationName of new Set(reducedAnimations)) {
      const keyframes = lastCssBlock(`@keyframes ${animationName}`)
      expect(keyframes, animationName).not.toMatch(
        /\b(?:transform|translate|clip-path)\s*:/,
      )
    }
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
