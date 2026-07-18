import { expect, test } from "@playwright/test"

test("fails, repairs, transfers, and restores a heading session", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("#Project notes")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await expect(
    page.getByText("Add one space after the hash symbol."),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)

  await page.getByRole("button", { name: "Hint", exact: true }).click()
  await expect(
    page.getByRole("complementary", { name: "Coach" }),
  ).toBeVisible()
  await expect(editor).toHaveValue("#Project notes")

  await editor.fill("# Project notes")
  await page.getByRole("button", { name: "Check again" }).click()
  await expect(page.getByText(/^Perfect\./)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(editor).not.toHaveValue("# Project notes")
  const transferDraft = await editor.inputValue()
  await editor.fill(`# ${transferDraft}`)
  const savedTransferDraft = await editor.inputValue()
  await page.reload()
  await expect(editor).toHaveValue(savedTransferDraft)
})

test("completes a first-attempt Perfect answer from the keyboard", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("# Project notes")
  await editor.press("Control+Enter")

  await expect(page.getByText(/^Perfect\./)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()
  await expect(
    page.getByRole("heading", { name: "Heading practice complete." }),
  ).toBeVisible()
})

test("keeps Matched review optional", async ({ page }) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("# Project notes\n\n# Details")
  await page.getByRole("button", { name: "Check", exact: true }).click()

  await expect(page.getByText(/^Matched\./)).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "Coach" }),
  ).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()

  await page.getByRole("button", { name: "Review" }).click()
  await expect(
    page.getByRole("complementary", { name: "Coach" }),
  ).toContainText("Keep one H1 as the document title")
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible()
})

test("keeps the mobile coach readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("#Project notes")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await page.getByRole("button", { name: "Hint", exact: true }).click()

  await expect(
    page.getByRole("complementary", { name: "Coach" }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Nabi Markdown" })).toBeVisible()

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
})
