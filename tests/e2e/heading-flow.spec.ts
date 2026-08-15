import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"

type RuntimeProblemSource = {
  id: string
  target: string
}

const runtimeProjection = JSON.parse(
  readFileSync(
    new URL(
      "../../curriculum/problem-bank/runtime-projections.generated.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { levels: Record<string, RuntimeProblemSource[]> }

const runtimeProblemById = new Map(
  Object.values(runtimeProjection.levels)
    .flat()
    .map((problem) => [problem.id, problem]),
)

const levelLabels = [
  "Level 1 — Learn the syntax",
  "Level 2 — Rebuild real documents",
  "Level 3 — Write for people",
  "Level 4 — Write for work",
  "Level 5 — Write for developers",
] as const

const sessionSeedStorageKey = "nabimd.session-seed.v1"
const progressStorageKey = "nabimd.progress.v5"

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    if (window.sessionStorage.getItem(storageKey) === null) {
      window.sessionStorage.setItem(storageKey, "0")
    }
  }, sessionSeedStorageKey)
})

function cardBoxInput(page: Page): Locator {
  return page.getByRole("textbox", { name: /^Marks \d+ of \d+$/ }).first()
}

function practiceShell(page: Page): Locator {
  return page.locator("main.app-shell--practice")
}

async function currentProblemId(page: Page): Promise<string> {
  const problemId = await practiceShell(page).getAttribute("data-problem-id")
  if (!problemId) throw new Error("Practice must expose its current problem")
  return problemId
}

async function currentDraft(page: Page): Promise<string> {
  return (await practiceShell(page).getAttribute("data-draft")) ?? ""
}

async function enterLevel(page: Page, level: 1 | 2 | 3 | 4 | 5) {
  await page.getByRole("button", { name: levelLabels[level - 1] }).click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(cardBoxInput(page)).toBeFocused()
}

function slotMarksFor(target: string): string[] {
  return deriveSyntaxCheckpoints(target, "").map(
    (checkpoint) => checkpoint.canonicalInput,
  )
}

async function submitSlot(page: Page, marks: string) {
  const input = cardBoxInput(page)
  await expect(input).toBeVisible()
  if (!(await input.evaluate((element) => element === document.activeElement))) {
    await input.click()
  }
  await page.keyboard.type(marks)
  await page.keyboard.press("Enter")
}

async function completeProblem(page: Page) {
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")

  for (const marks of slotMarksFor(problem.target)) {
    await submitSlot(page, marks)
  }
}

async function completeProblemAndAdvance(page: Page) {
  const beforeId = await currentProblemId(page)
  await completeProblem(page)
  await expect.poll(() => currentProblemId(page)).not.toBe(beforeId)
}

async function resetToLanding(page: Page) {
  await page.goto("/")
  await page.evaluate((storageKey) => {
    window.sessionStorage.removeItem(storageKey)
  }, progressStorageKey)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Choose a chapter to begin." }),
  ).toBeVisible()
}

test("greets a fresh session with the definitive five-level ladder", async ({
  page,
}) => {
  await resetToLanding(page)

  await expect(page.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()
  for (const label of levelLabels) {
    await expect(page.getByRole("button", { name: label })).toBeVisible()
  }
  await expect(cardBoxInput(page)).toHaveCount(0)
})

test("opens third-party licenses in a new tab and keeps the landing open", async ({
  page,
}) => {
  await resetToLanding(page)
  const landingUrl = page.url()
  const popupPromise = page.waitForEvent("popup")

  await page.getByRole("link", { name: "Third-party licenses" }).click()
  const licensesPage = await popupPromise
  await licensesPage.waitForLoadState("domcontentloaded")

  expect(new URL(licensesPage.url()).pathname).toBe(
    "/third-party-licenses.html",
  )
  expect(page.url()).toBe(landingUrl)
  await licensesPage.close()
})

test("keeps every chapter reachable in a short landscape viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 812, height: 375 })
  await resetToLanding(page)

  for (const label of levelLabels) {
    await expect(page.getByRole("button", { name: label })).toBeVisible()
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(812)
})

test("keeps the landing inside a tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 })
  await resetToLanding(page)

  const metrics = await page
    .locator(".open-book-page--intro")
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth)
})

test("keeps release details inside the desktop and mobile chapter page", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await resetToLanding(page)

    const chapterPage = await page
      .locator(".open-book-page--chapters")
      .boundingBox()
    const releaseDetails = await page
      .locator(".open-book-release")
      .boundingBox()

    expect(chapterPage).not.toBeNull()
    expect(releaseDetails).not.toBeNull()
    expect(releaseDetails!.x).toBeGreaterThanOrEqual(chapterPage!.x)
    expect(releaseDetails!.x + releaseDetails!.width).toBeLessThanOrEqual(
      chapterPage!.x + chapterPage!.width + 1,
    )
    expect(releaseDetails!.y + releaseDetails!.height).toBeLessThanOrEqual(
      chapterPage!.y + chapterPage!.height + 1,
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width)

    await page.getByText("Changelog").click()
    await expect(
      page.getByRole("heading", { name: "What's changed" }),
    ).toBeVisible()
  }
})

test("keeps the landing wordmark clear of the motto in a short book", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 500 })
  await resetToLanding(page)

  const [wordmark, motto] = await Promise.all([
    page.locator(".open-book-page--intro > .wordmark").boundingBox(),
    page.locator(".open-book-motto").boundingBox(),
  ])
  expect(wordmark).not.toBeNull()
  expect(motto).not.toBeNull()
  expect(wordmark!.y + wordmark!.height + 8).toBeLessThanOrEqual(motto!.y)
})

test("keeps the same book spread geometry across the page turn", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1800, height: 1000 })
  await resetToLanding(page)
  const landing = await page.locator(".app-shell.open-book-shell").boundingBox()

  await enterLevel(page, 5)
  const practice = await practiceShell(page).boundingBox()

  expect(landing).not.toBeNull()
  expect(practice).not.toBeNull()
  expect(Math.abs(practice!.x - landing!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(practice!.width - landing!.width)).toBeLessThanOrEqual(1)
})

test("every level opens the same card-first practice surface", async ({
  page,
}) => {
  for (const index of levelLabels.keys()) {
    await resetToLanding(page)
    await enterLevel(page, (index + 1) as 1 | 2 | 3 | 4 | 5)

    await expect(page.getByLabel("Practice details")).toContainText(
      `Level ${index + 1}`,
    )
    await expect(
      page.getByRole("region", { name: "Markdown syntax practice" }),
    ).toBeVisible()
    await expect(page.getByRole("region", { name: "Goal" })).toHaveCount(0)
    await expect(page.getByRole("tab")).toHaveCount(0)
  }
})

test("re-entering a level starts a different run", async ({ page }) => {
  await resetToLanding(page)
  await enterLevel(page, 1)
  const firstProblemId = await currentProblemId(page)

  await page.getByRole("button", { name: "Nabi Markdown home" }).click()
  await enterLevel(page, 1)

  expect(await currentProblemId(page)).not.toBe(firstProblemId)
})

test("browser history moves between problems and the level picker", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 1)
  const firstProblemId = await currentProblemId(page)

  await completeProblemAndAdvance(page)
  const secondProblemId = await currentProblemId(page)

  await page.goBack()
  await expect.poll(() => currentProblemId(page)).toBe(firstProblemId)
  await page.goBack()
  await expect(
    page.getByRole("heading", { name: "Choose a chapter to begin." }),
  ).toBeVisible()
  await page.goForward()
  await expect.poll(() => currentProblemId(page)).toBe(firstProblemId)
  await page.goForward()
  await expect.poll(() => currentProblemId(page)).toBe(secondProblemId)
})

test("a wrong mark opens the exact Hint, clears the boxes, and refocuses", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 1)

  await submitSlot(page, "@")

  await expect(page.getByRole("status")).toContainText("Try again")
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()
  await expect(cardBoxInput(page)).toHaveValue("")
  await expect(cardBoxInput(page)).toBeFocused()
})

test("manual Hint clears partial input and stays open while typing", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 1)

  await page.keyboard.type("@")
  await page.getByRole("button", { name: "Hint" }).click()

  await expect(cardBoxInput(page)).toHaveValue("")
  await expect(cardBoxInput(page)).toBeFocused()
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()

  await page.keyboard.type("#")
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()
})

test("empty Enter opens the exact Hint and keeps the box focused", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 1)

  await page.keyboard.press("Enter")

  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()
  await expect(cardBoxInput(page)).toBeFocused()
})

test("requires both Level 1 italic marks and never autocompletes the closer", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "23")
  }, sessionSeedStorageKey)
  await resetToLanding(page)
  await enterLevel(page, 1)

  expect(await currentProblemId(page)).toBe("l1-italic-paper-boat")
  await expect(
    page.getByRole("textbox", { name: /Marks \d of 2/ }),
  ).toHaveCount(2)

  await page.keyboard.type("_")
  await page.keyboard.press("Enter")
  await expect(page.getByRole("status")).toContainText("Try again")
  expect(await currentDraft(page)).toBe("")

  await submitSlot(page, "__")

  await expect(page.getByRole("status")).toContainText("Matched")
  expect(await currentDraft(page)).toBe("_Paper boat_")
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toHaveCount(0)
})

test("supports Previous and Next across accepted marks", async ({ page }) => {
  await resetToLanding(page)
  await enterLevel(page, 2)
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")
  const marks = slotMarksFor(problem.target)
  expect(marks.length).toBeGreaterThan(1)

  await submitSlot(page, marks[0]!)
  const previous = page.getByRole("button", { name: "Previous mark" })
  const next = page.getByRole("button", { name: "Next mark" })
  await expect(previous).toBeEnabled()
  await expect(next).toBeDisabled()

  await previous.click()
  await expect(previous).toBeDisabled()
  await expect(next).toBeEnabled()
  await expect(cardBoxInput(page)).not.toHaveValue("")

  await next.click()
  await expect(previous).toBeEnabled()
  await expect(next).toBeDisabled()
})

test("the visible Enter control submits marks with a pointer", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 1)
  const problem = runtimeProblemById.get(await currentProblemId(page))
  if (!problem) throw new Error("Expected the current runtime problem")

  await page.keyboard.type(slotMarksFor(problem.target)[0]!)
  await page.getByRole("button", { name: "Check marks" }).click()

  await expect(page.getByRole("status")).toContainText("Matched")
})

// The exercise is an open book: you read the left leaf and write on the right
// one, with the fold between them. This replaces the single centred card, whose
// narrow column left the right-hand leaf empty and read as a void on a wide
// screen. What must hold now is that each half stays on its own leaf and that
// the entry line keeps its controls beside it.
test("lays the exercise across both leaves of the spread", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const [readLeaf, writeLeaf, line, firstBox, submit] = await Promise.all([
    page.locator(".center-card__leaf--read").boundingBox(),
    page.locator(".center-card__leaf--write").boundingBox(),
    page.locator(".center-card__line").boundingBox(),
    page.locator(".center-card__box").first().boundingBox(),
    page.getByRole("button", { name: "Check marks" }).boundingBox(),
  ])

  for (const box of [readLeaf, writeLeaf, line, firstBox, submit]) {
    expect(box).not.toBeNull()
  }

  // Two leaves of comparable width, side by side.
  expect(Math.abs(readLeaf!.width - writeLeaf!.width)).toBeLessThanOrEqual(4)
  expect(writeLeaf!.x).toBeGreaterThanOrEqual(readLeaf!.x + readLeaf!.width - 4)

  // The entry line belongs to the writing leaf and stays inside it.
  expect(line!.x).toBeGreaterThanOrEqual(writeLeaf!.x - 1)
  expect(line!.x + line!.width).toBeLessThanOrEqual(
    writeLeaf!.x + writeLeaf!.width + 1,
  )

  // The action stays with its input rather than being stranded at the far edge
  // of the sheet: that gap is what made the eye cross the whole spread.
  expect(submit!.y - (line!.y + line!.height)).toBeLessThanOrEqual(768 * 0.15)

  expect(firstBox!.width).toBeGreaterThanOrEqual(40)
  expect(firstBox!.height).toBeGreaterThanOrEqual(44)
})

// The slot controls act on the entry line, so they live on the leaf the line
// lives on (issue #140). Containment of their boxes in the writing leaf's box
// is what "on the leaf" means; the read leaf carries no slot controls at all.
test("keeps the mark controls on the writing leaf", async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
  ] as const

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await resetToLanding(page)
    await enterLevel(page, 1)

    const [writeLeaf, previous, next] = await Promise.all([
      page.locator(".center-card__leaf--write").boundingBox(),
      page.getByRole("button", { name: "Previous mark" }).boundingBox(),
      page.getByRole("button", { name: "Next mark" }).boundingBox(),
    ])

    const label = `at ${viewport.width}x${viewport.height}`
    expect(writeLeaf, label).not.toBeNull()
    for (const control of [previous, next]) {
      expect(control, label).not.toBeNull()
      expect(control!.x, label).toBeGreaterThanOrEqual(writeLeaf!.x - 1)
      expect(control!.x + control!.width, label).toBeLessThanOrEqual(
        writeLeaf!.x + writeLeaf!.width + 1,
      )
      expect(control!.y, label).toBeGreaterThanOrEqual(writeLeaf!.y - 1)
      expect(control!.y + control!.height, label).toBeLessThanOrEqual(
        writeLeaf!.y + writeLeaf!.height + 1,
      )
    }
  }
})

// The instruction once had to reserve width against controls floated over its
// own header; those controls are gone from the reading leaf (issue #140), but
// the prose must stay clear of whatever chrome the product renders. Measuring
// the glyphs against every button on the page keeps this guard meaningful
// after the move instead of pinning one hard-coded pair.
test("keeps the instruction clear of every control", async ({ page }) => {
  const viewports = [
    { width: 800, height: 900 },
    { width: 390, height: 844 },
  ] as const

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await resetToLanding(page)
    await enterLevel(page, 1)

    const collision = await page.evaluate(() => {
      const instruction = document.querySelector(".center-card__instruction")
      if (!instruction) return null
      const range = document.createRange()
      range.selectNodeContents(instruction)
      const lines = Array.from(range.getClientRects())

      let worst = 0
      for (const button of document.querySelectorAll("button")) {
        const box = button.getBoundingClientRect()
        if (box.width === 0 && box.height === 0) continue
        for (const line of lines) {
          const x = Math.min(line.right, box.right) - Math.max(line.left, box.left)
          const y = Math.min(line.bottom, box.bottom) - Math.max(line.top, box.top)
          if (x > 0 && y > 0) worst = Math.max(worst, Math.min(x, y))
        }
      }
      return worst
    })

    const label = `at ${viewport.width}x${viewport.height}`
    expect(collision, label).not.toBeNull()
    expect(collision, label).toBe(0)
  }
})

test("makes the rendered Goal more prominent than the locked source phrase", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const goal = page.locator(
    ".center-card__context-row--current .rendered-document__body > :first-child",
  )
  const locked = page.locator(".center-card__locked").first()
  const [goalSize, lockedSize] = await Promise.all([
    goal.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
    locked.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
  ])

  expect(goalSize).toBeGreaterThan(lockedSize)
})

// Seed 10 serves `###### Dog leash`, the deepest heading in Level 1. Headings
// keep the small context size unless the current-row rule names them, so this
// pins the case a paragraph Goal cannot catch.
test("makes a heading Goal more prominent than the locked source phrase", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "10")
  }, sessionSeedStorageKey)
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  expect(await currentProblemId(page)).toBe("l1-heading-depth-dog-leash")

  const goal = page.locator(
    ".center-card__context-row--current .rendered-document__body > :first-child",
  )
  const locked = page.locator(".center-card__locked").first()

  await expect(goal).toHaveJSProperty("tagName", "H6")

  const [goalSize, lockedSize] = await Promise.all([
    goal.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
    locked.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
  ])

  expect(goalSize).toBeGreaterThan(lockedSize)
})

// Seed 7 serves a fenced code block. A `pre` Goal sits outside the paragraph
// and heading rules, so it is the third shape the prominence claim has to hold
// for.
test("makes a fenced code Goal more prominent than the locked source phrase", async ({
  page,
}) => {
  await page.addInitScript((storageKey) => {
    window.sessionStorage.setItem(storageKey, "7")
  }, sessionSeedStorageKey)
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  expect(await currentProblemId(page)).toBe("l1-code-block-door-sign")

  const goal = page.locator(
    ".center-card__context-row--current .rendered-document__body > :first-child",
  )
  const locked = page.locator(".center-card__locked").first()

  await expect(goal).toHaveJSProperty("tagName", "PRE")
  // Prose on a book leaf sets flush left. What matters is the size relationship
  // below, not the alignment the single centred card used to need.
  await expect(goal).toHaveCSS("text-align", "left")

  const [goalSize, lockedSize] = await Promise.all([
    goal.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
    locked.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    ),
  ])

  expect(goalSize).toBeGreaterThan(lockedSize)
})

test("keeps phone mark boxes at the documented touch size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const box = await page.locator(".center-card__box").first().boundingBox()

  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(40)
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test("anchors the phone card so the exact hint expands downward", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const card = page.locator(".center-card")
  const before = await card.boundingBox()
  await page.getByRole("button", { name: "Hint" }).click()
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()
  const after = await card.boundingBox()

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2)
  expect(after!.height).toBeGreaterThan(before!.height)
})

test("expands the exact hint below the anchored practice card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const line = page.locator(".center-card__line")
  const before = await line.boundingBox()
  await page.getByRole("button", { name: "Hint" }).click()
  const hint = page.getByRole("region", { name: "Exact Markdown hint" })
  await expect(hint).toBeVisible()
  const [after, hintBox, writeLeaf] = await Promise.all([
    line.boundingBox(),
    hint.boundingBox(),
    page.locator(".center-card__leaf--write").boundingBox(),
  ])

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  // The spread is a fixed opening, so the card can no longer grow taller. The
  // invariant that still matters is that opening Hint does not shove the entry
  // line: the hint unfolds beneath it, inside the writing leaf.
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2)
  expect(hintBox!.y).toBeGreaterThanOrEqual(after!.y + after!.height - 1)
  expect(hintBox!.y + hintBox!.height).toBeLessThanOrEqual(
    writeLeaf!.y + writeLeaf!.height + 1,
  )
})

test("keeps the visible Enter key compact before a verdict", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const enter = await page
    .getByRole("button", { name: "Check marks" })
    .boundingBox()

  expect(enter).not.toBeNull()
  expect(enter!.width).toBeGreaterThanOrEqual(96)
  expect(enter!.width).toBeLessThanOrEqual(140)
  expect(enter!.height).toBeGreaterThanOrEqual(44)
})

test("underlines only the requested syntax term", async ({ page }) => {
  await resetToLanding(page)
  await enterLevel(page, 1)

  const instruction = page.locator(".center-card__instruction")
  const syntaxTerm = instruction.locator("strong")

  await expect(syntaxTerm).toHaveCSS("font-weight", "700")
  await expect(syntaxTerm).toHaveCSS("text-decoration-line", "underline")
  await expect(instruction).not.toHaveCSS("text-decoration-line", "underline")
})

test("Try another stays in the level and serves different content", async ({
  page,
}) => {
  await resetToLanding(page)
  await enterLevel(page, 3)
  const before = await currentProblemId(page)

  await page.getByRole("button", { name: "Try another" }).click()

  await expect.poll(() => currentProblemId(page)).not.toBe(before)
  await expect(page.getByLabel("Practice details")).toContainText("Level 3")
  await expect(cardBoxInput(page)).toBeFocused()
})

test("keeps the card and browser chrome inside 1280 by 800", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await resetToLanding(page)
  await enterLevel(page, 5)

  const [topbar, card] = await Promise.all([
    page.locator(".exercise-topbar").boundingBox(),
    page.locator(".center-card").boundingBox(),
  ])
  for (const box of [topbar, card]) {
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(1280)
    expect(box!.y + box!.height).toBeLessThanOrEqual(800)
  }
  const pageMetrics = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
    width: document.documentElement.scrollWidth,
  }))
  expect(pageMetrics.height).toBeLessThanOrEqual(pageMetrics.viewport)
  expect(pageMetrics.width).toBeLessThanOrEqual(1280)
})

// The spread's height must follow the problem's content (issue #139). The leaf
// container stretches to whatever height it is given, so measuring its own box
// always passes; the honest measure is the bottom of its lowest direct child.
// Bottom padding is part of the page margin and counts as empty here, which is
// what keeps this a real ceiling rather than a formality.
test("keeps both leaves close to their content height", async ({ page }) => {
  const conditions = [
    { width: 1440, height: 900, level: 1 },
    { width: 1280, height: 800, level: 1 },
    { width: 1280, height: 800, level: 5 },
  ] as const

  for (const condition of conditions) {
    await page.setViewportSize({
      width: condition.width,
      height: condition.height,
    })
    await resetToLanding(page)
    await enterLevel(page, condition.level)

    for (const leaf of ["read", "write"] as const) {
      const emptyRatio = await page.evaluate((leafName) => {
        const element = document.querySelector(
          `.center-card__leaf--${leafName}`,
        )
        if (!element) return null
        const rect = element.getBoundingClientRect()
        let lowestBottom = rect.top
        for (const child of element.children) {
          const childRect = child.getBoundingClientRect()
          if (childRect.height === 0 && childRect.width === 0) continue
          lowestBottom = Math.max(lowestBottom, childRect.bottom)
        }
        return (rect.bottom - lowestBottom) / rect.height
      }, leaf)

      expect(emptyRatio, `${leaf} leaf at ${condition.width}x${condition.height} Level ${condition.level}`).not.toBeNull()
      expect(
        emptyRatio!,
        `${leaf} leaf at ${condition.width}x${condition.height} Level ${condition.level}`,
      ).toBeGreaterThanOrEqual(0)
      expect(
        emptyRatio!,
        `${leaf} leaf at ${condition.width}x${condition.height} Level ${condition.level}`,
      ).toBeLessThanOrEqual(0.25)
    }
  }
})

test("uses the same card without horizontal overflow at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await resetToLanding(page)
  await enterLevel(page, 5)

  await expect(
    page.getByRole("region", { name: "Markdown syntax practice" }),
  ).toBeVisible()
  const metrics = await page.evaluate(() => ({
    card: document.querySelector(".center-card")?.getBoundingClientRect().toJSON(),
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(metrics.card).toBeTruthy()
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth)
})

test("completes a run and reveals full documents only from Summary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await resetToLanding(page)
  await page.keyboard.press("Tab")
  await expect(page.getByRole("button", { name: levelLabels[0] })).toBeFocused()
  await page.keyboard.press("Enter")

  for (let exercise = 0; exercise < 6; exercise += 1) {
    if (exercise < 5) {
      await completeProblemAndAdvance(page)
    } else {
      await completeProblem(page)
    }
  }

  await expect(
    page.getByRole("heading", { name: "Well done." }),
  ).toBeFocused()
  await expect(page.getByLabel("Score")).toContainText("6 / 6")
  await expect(page.getByRole("textbox")).toHaveCount(0)
  const work = page.getByRole("region", { name: "Your work" })
  await expect(work.getByRole("article")).toHaveCount(6)
  await expect(
    page.getByRole("button", { name: "View completed pages" }),
  ).toHaveCount(0)
  await expect(page.getByRole("dialog")).toHaveCount(0)

  await page.setViewportSize({ width: 390, height: 844 })
  const teacherNote = page.getByRole("region", { name: "Well done." })
  await teacherNote.scrollIntoViewIfNeeded()
  await expect(teacherNote).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
})
