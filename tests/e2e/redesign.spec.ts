import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { MARKS } from "../../src/app/marks"
import { getCurriculumElements } from "../../src/content/curriculumElements"
import { koSamples } from "../../src/content/ko/_samples"
import { derivePlaintextStarter } from "../../src/content/plaintextStarter"
import {
  check,
  editorContent,
  readDraft,
  replaceDraft,
  useLanguage,
} from "./support/practice"

/**
 * The redesigned Level 1 end to end (plan §6 G2). Each scenario is named by
 * the gate line it covers.
 */

type RuntimeProblem = {
  id: string
  level: number
  flavor: string
  skillIds: string[]
  syntaxTokens: string[]
  target: string
}

const runtime = JSON.parse(
  readFileSync(
    new URL(
      "../../curriculum/problem-bank/runtime-projections.generated.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { levels: Record<string, RuntimeProblem[]> }

const targetById = new Map<string, string>([
  ...Object.values(runtime.levels)
    .flat()
    .map((problem) => [problem.id, problem.target] as const),
  ...koSamples.map(({ problem }) => [problem.id, problem.target] as const),
])

async function currentProblemId(page: Page): Promise<string> {
  const practice = page.getByTestId("practice")
  await expect(practice).toHaveAttribute("data-problem-id", /.+/)
  return (await practice.getAttribute("data-problem-id"))!
}

async function passCurrent(page: Page) {
  const id = await currentProblemId(page)
  await replaceDraft(page, targetById.get(id)!)
  await check(page)
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
}

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}

async function expectNoCriticalAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()
  const critical = results.violations.filter(
    (violation) => violation.impact === "critical",
  )
  expect(critical.map((violation) => violation.id)).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await useLanguage(page, "ko")
})

test("① a first visit lands on the map of twelve marks", async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto("./")
  await expect(
    page.getByRole("heading", { level: 1, name: "실제 문서를 마크다운으로 직접 써 보는 연습이다." }),
  ).toBeVisible()
  const cells = page.getByTestId("mark-map").getByRole("button")
  await expect(cells).toHaveCount(12)
  await expect(page.getByTestId("start-run")).toBeEnabled()
  for (const mark of ["unordered-list", "ordered-list", "blockquote"]) {
    await expect(page.locator(`[data-mark="${mark}"]`)).toHaveAttribute(
      "data-state",
      "new",
    )
  }
  await expectNoCriticalAxe(page)
  expect(errors).toEqual([])
})

test("② a map cell opens a document; a miss is fixed in place and passes", async ({
  page,
}) => {
  const errors = collectRuntimeErrors(page)
  await page.goto("./")
  await page.locator('[data-mark="unordered-list"]').click()
  await expect(page).toHaveURL(/\/practice\?mark=unordered-list$/)
  await expect(page.getByTestId("instruction")).toContainText("이번 기호: 목록")

  // Fill mode: the editor starts with the goal's words, marks removed.
  const grocery = koSamples[0].problem
  await expect.poll(() => readDraft(page)).toBe(derivePlaintextStarter(grocery.target))

  await replaceDraft(page, "# 장보기 메모\n\n- 우유\n- 달걀\n식빵")
  await check(page)
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "retry")
  await expect(page.getByTestId("rd-status")).toContainText("3~5번째 줄:")
  await expect(page.locator(".cm-flagged-line").first()).toBeVisible()
  await expectNoCriticalAxe(page)

  // Fixing the draft keeps the editor; the verdict waits for the next check.
  await replaceDraft(page, grocery.target)
  await check(page)
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
  await expect(page.getByTestId("rd-mine")).toBeVisible()
  await expectNoCriticalAxe(page)
  expect(errors).toEqual([])
})

test("③ today's five end on the summary", async ({ page }) => {
  await page.goto("./")
  await page.getByTestId("start-run").click()
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByTestId("run-progress")).toHaveText(
      `오늘의 다섯 장 ${index}/5`,
    )
    await passCurrent(page)
    await page.getByTestId("next").click()
  }
  await expect(page).toHaveURL(/\/done$/)
  await expect(page.getByTestId("done")).toContainText("다섯 장을 썼다.")
  await expectNoCriticalAxe(page)
})

test("⑥ the language switch changes every word, both ways", async ({ page }) => {
  await page.goto("./practice?doc=ko-sample-grocery-memo")
  await expect(page.getByTestId("instruction")).toContainText("이번 기호")

  await page.getByTestId("lang-toggle").click()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.getByTestId("instruction")).toContainText("This time:")
  await expect(page).toHaveURL(/\?mark=unordered-list$/)
  const english = await page.locator("body").innerText()
  expect(english.replace("한국어", "")).not.toMatch(/[가-힣]/)
  expect(english).not.toMatch(/\b(?:home|mark|practice|bar|editor|verdict)\.[a-zA-Z-]+/)

  await page.goto("./")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await page.getByTestId("lang-toggle").click()
  await expect(page.locator("html")).toHaveAttribute("lang", "ko")
  const korean = await page.locator("body").innerText()
  expect(korean).not.toMatch(/\b(?:home|mark|practice|bar|editor|verdict)\.[a-zA-Z-]+/)
  await expect(page.getByTestId("start-run")).toHaveText("오늘의 다섯 장 시작")
})

test("⑧ a document can be opened, written and passed with the keyboard alone", async ({
  page,
}) => {
  await page.goto("./")
  const focusedMark = () =>
    page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.mark)
  for (let step = 0; step < 20 && (await focusedMark()) !== "blockquote"; step += 1) {
    await page.keyboard.press("Tab")
  }
  expect(await focusedMark()).toBe("blockquote")
  await page.keyboard.press("Enter")
  await expect(page.getByTestId("instruction")).toContainText("이번 기호: 인용")

  // Start from a blank page, then write the whole document by keys.
  const focusedTestId = () =>
    page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.testid)
  for (let step = 0; step < 20 && (await focusedTestId()) !== "blank-page-toggle"; step += 1) {
    await page.keyboard.press("Tab")
  }
  await page.keyboard.press("Space")
  await expect.poll(() => readDraft(page)).toBe("")
  const editorFocused = () =>
    page.evaluate(() => document.activeElement?.classList.contains("cm-content") ?? false)
  for (let step = 0; step < 5 && !(await editorFocused()); step += 1) {
    await page.keyboard.press("Tab")
  }
  await expect(editorContent(page)).toBeFocused()

  const lines = koSamples[2].problem.target.split("\n")
  for (const [index, line] of lines.entries()) {
    if (line) await page.keyboard.type(line)
    if (index < lines.length - 1) await page.keyboard.press("Enter")
  }
  await expect.poll(() => readDraft(page)).toBe(koSamples[2].problem.target)
  await page.keyboard.press("Control+Enter")
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")

  // The same shortcut moves on after a pass, and typing carries on in the
  // next document's editor.
  await page.keyboard.press("Control+Enter")
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "idle")
  await expect(editorContent(page)).toBeFocused()
})

test("English mode opens 20 random Level 1 documents in fill mode and passes their answers", async ({
  page,
}) => {
  test.setTimeout(120_000)
  const marks = new Set<string>(MARKS)
  const levelOne = Object.values(runtime.levels)
    .flat()
    .filter((problem) => {
      const elements = getCurriculumElements(problem)
      return (
        problem.level === 1 &&
        problem.flavor === "standard" &&
        elements.length > 0 &&
        elements.every((element) => marks.has(element))
      )
    })
  // A fixed seed keeps a failure reproducible while still sampling widely.
  let seed = 20_261_104
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
    return seed / 2_147_483_648
  }
  const sample = [...levelOne].sort(() => random() - 0.5).slice(0, 20)
  expect(sample).toHaveLength(20)

  // The shared setup seeds Korean; this test needs English on every load.
  await page.addInitScript(() => window.localStorage.setItem("onsoon-lang", "en"))
  for (const problem of sample) {
    await test.step(problem.id, async () => {
      await page.goto(`./practice?doc=${problem.id}`)
      // The first visit waits for the English bank chunk.
      await expect(page.getByTestId("practice")).toHaveAttribute(
        "data-problem-id",
        problem.id,
        { timeout: 30_000 },
      )
      await expect.poll(() => readDraft(page)).toBe(derivePlaintextStarter(problem.target))
      await replaceDraft(page, problem.target)
      await check(page)
      await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
    })
  }
})
