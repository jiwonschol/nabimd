import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

// Regenerates the design QA evidence in docs/design/qa/ from the current
// styles. It writes files, so it stays out of the ordinary e2e run and is
// driven by `npm run design:card-qa:capture` instead.
const shouldCapture = process.env.NABI_WRITE_CARD_QA === "1"

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"
const qaDirectory = fileURLToPath(
  new URL("../../docs/design/qa/", import.meta.url),
)

// Seed 1 serves `**New arrival**`, so the capture matches the bold-text
// exercise the selected reference mock shows.
const captureSeed = "1"

async function openSeededChapterOne(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      window.sessionStorage.setItem(key as string, value as string)
    },
    [sessionSeedStorageKey, captureSeed],
  )
  await page.goto("/")
  await page.evaluate((storageKey) => {
    window.sessionStorage.removeItem(storageKey)
  }, progressStorageKey)
  await page.reload()
  await page
    .getByRole("button", { name: "Chapter 1 — Headings & emphasis" })
    .click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(page.locator(".center-card__boxinput").first()).toBeFocused()
}

async function expandHint(page: Page) {
  await page.getByRole("button", { name: "Hint" }).click()
  await expect(
    page.getByRole("region", { name: "Exact Markdown hint" }),
  ).toBeVisible()
}

test.describe("center card design QA captures", () => {
  test.skip(
    !shouldCapture,
    "Set NABI_WRITE_CARD_QA=1 to rewrite the design QA captures",
  )

  test("captures the desktop card", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await openSeededChapterOne(page)
    await page.screenshot({
      path: `${qaDirectory}center-card-b2-implementation-1024x768.png`,
    })

    await expandHint(page)
    await page.screenshot({
      path: `${qaDirectory}center-card-b2-implementation-hint-1024x768.png`,
    })
  })

  test("captures the phone card", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openSeededChapterOne(page)
    await page.screenshot({
      path: `${qaDirectory}center-card-b2-implementation-390x844.png`,
    })

    await expandHint(page)
    await page.screenshot({
      path: `${qaDirectory}center-card-b2-implementation-hint-390x844.png`,
    })
  })

  test("composes the reference comparison", async ({ page }) => {
    const asDataUri = (file: string) =>
      `data:image/png;base64,${readFileSync(`${qaDirectory}${file}`).toString("base64")}`

    await page.setViewportSize({ width: 2048, height: 768 })
    await page.setContent(
      `<body style="margin:0;display:flex">
         <img src="${asDataUri("center-card-b2-reference-1448x1086.png")}"
              style="width:1024px;height:768px;object-fit:fill;display:block">
         <img src="${asDataUri("center-card-b2-implementation-1024x768.png")}"
              style="width:1024px;height:768px;display:block">
       </body>`,
    )
    await page.waitForFunction(() =>
      Array.from(document.images).every((image) => image.complete),
    )
    await page.screenshot({
      path: `${qaDirectory}center-card-b2-comparison-2048x768.png`,
    })
  })
})
