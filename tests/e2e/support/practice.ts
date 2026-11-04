import { expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { koCards } from "../../../src/content/ko"

/**
 * Starts the context in the given screen language (the hub-wide key). Only
 * an empty store is seeded, so a switch made on the page survives reloads.
 */
export async function useLanguage(page: Page, lang: "ko" | "en") {
  await page.addInitScript((value) => {
    if (window.localStorage.getItem("onsoon-lang") === null) {
      window.localStorage.setItem("onsoon-lang", value)
    }
  }, lang)
}

export function editorContent(page: Page) {
  return page.locator('[data-testid="rd-editor"] .cm-content')
}

/** Reads the editor's document through the webdriver-only bridge. */
export async function readDraft(page: Page): Promise<string> {
  return page
    .locator(".markdown-source-editor__mount")
    .evaluate((mount) =>
      (mount as unknown as { __nabimdReadDocumentForE2E: () => string })
        .__nabimdReadDocumentForE2E(),
    )
}

/**
 * Replaces the whole draft. Selecting through execCommand avoids Ctrl+A,
 * which the editor maps to "line start" on Linux.
 */
export async function replaceDraft(page: Page, text: string) {
  await editorContent(page).click()
  await page.evaluate((value) => {
    document.execCommand("selectAll")
    document.execCommand("insertText", false, value)
  }, text)
  await expect.poll(() => readDraft(page)).toBe(text)
}

export async function check(page: Page) {
  await page.getByTestId("check").click()
}

type RuntimeProblem = {
  id: string
  level: number
  flavor: string
  skillIds: string[]
  syntaxTokens: string[]
  target: string
}

/** The English bank as the app serves it (the same generated projection). */
export const runtime = JSON.parse(
  readFileSync(
    new URL(
      "../../../curriculum/problem-bank/runtime-projections.generated.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { levels: Record<string, RuntimeProblem[]> }

/** Every document's answer, English and Korean, by problem id. */
export const targetById = new Map<string, string>([
  ...Object.values(runtime.levels)
    .flat()
    .map((problem) => [problem.id, problem.target] as const),
  ...koCards.map(({ problem }) => [problem.id, problem.target] as const),
])

export async function currentProblemId(page: Page): Promise<string> {
  const practice = page.getByTestId("practice")
  await expect(practice).toHaveAttribute("data-problem-id", /.+/)
  return (await practice.getAttribute("data-problem-id"))!
}

/** Writes the open document's answer and waits for the pass verdict. */
export async function passCurrent(page: Page) {
  const id = await currentProblemId(page)
  const target = targetById.get(id)
  expect(target, `No answer known for ${id}`).toBeDefined()
  await replaceDraft(page, target!)
  await check(page)
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
}

export function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  return errors
}
