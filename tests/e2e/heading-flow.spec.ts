import { expect, test } from "@playwright/test"

test("fails, repairs, transfers, and restores a heading session", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("#Apple")
  await page.getByRole("button", { name: "Check", exact: true }).click()
  await expect(
    page.getByText("Add one space after the hash symbol."),
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0)

  await page.getByRole("button", { name: "Hint", exact: true }).click()
  await expect(
    page.getByRole("complementary", { name: "Coach" }),
  ).toBeVisible()
  await expect(editor).toHaveValue("#Apple")

  await editor.fill("# Apple")
  await page.getByRole("button", { name: "Check again" }).click()
  await expect(page.getByText(/^Perfect\./)).toBeVisible()
  await page.getByRole("button", { name: "Next" }).click()

  await expect(editor).toHaveValue("")
  const transferTitle = await page
    .getByRole("region", { name: "Target" })
    .getByRole("heading")
    .innerText()
  await editor.fill(`# ${transferTitle}`)
  const savedTransferDraft = await editor.inputValue()
  await page.reload()
  await expect(editor).toHaveValue(savedTransferDraft)
})

test("completes a first-attempt Perfect answer from the keyboard", async ({
  page,
}) => {
  await page.goto("/")
  const editor = page.getByRole("textbox", { name: "Your Markdown" })

  await editor.fill("# Apple")
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

  await editor.fill("# Apple\n\n# Details")
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

  await editor.fill("#Apple")
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

test("loads without a runtime API or learner-media request", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4173").origin
  const runtimeRequests: string[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== appOrigin) {
      runtimeRequests.push(request.url())
    }
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Nabi Markdown" }),
  ).toBeVisible()

  const editor = page.getByRole("textbox", { name: "Your Markdown" })
  await editor.fill("![tracking pixel](https://example.com/pixel.png)")
  await expect(page.getByText("[Image: tracking pixel]")).toBeVisible()
  await expect(page.getByRole("img")).toHaveCount(0)
  expect(runtimeRequests).toEqual([])
})
