import { expect, type Page } from "@playwright/test"

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
