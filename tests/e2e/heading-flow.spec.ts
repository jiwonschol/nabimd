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

test("keeps the mark entry stage at the visual center", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await resetToLanding(page)
  await enterLevel(page, 1)

  const [card, line, firstBox] = await Promise.all([
    page.locator(".center-card").boundingBox(),
    page.locator(".center-card__line").boundingBox(),
    page.locator(".center-card__box").first().boundingBox(),
  ])

  expect(card).not.toBeNull()
  expect(line).not.toBeNull()
  expect(firstBox).not.toBeNull()
  expect(card!.x).toBeGreaterThanOrEqual(48)
  expect(card!.x + card!.width).toBeLessThanOrEqual(1024 - 48)
  expect(card!.width).toBeLessThanOrEqual(720)
  expect(line!.width).toBeLessThanOrEqual(560)
  expect(
    Math.abs(
      line!.x + line!.width / 2 - (card!.x + card!.width / 2),
    ),
  ).toBeLessThanOrEqual(2)
  expect(firstBox!.width).toBeGreaterThanOrEqual(40)
  expect(firstBox!.height).toBeGreaterThanOrEqual(44)
  expect(
    Math.abs(firstBox!.y + firstBox!.height / 2 - 768 / 2),
  ).toBeLessThanOrEqual(80)
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
  await expect(goal).toHaveCSS("text-align", "center")

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

  const card = page.locator(".center-card")
  const before = await card.boundingBox()
  await page.getByRole("button", { name: "Hint" }).click()
  await expect(page.getByRole("region", { name: "Exact Markdown hint" })).toBeVisible()
  const after = await card.boundingBox()

  expect(before).not.toBeNull()
  expect(after).not.toBeNull()
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(2)
  expect(after!.height).toBeGreaterThan(before!.height)
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
