import { expect, test } from "@playwright/test"
import { check, replaceDraft, useLanguage } from "./support/practice"

// Every other check here passes just as happily against a build from last
// week, so on its own the suite cannot tell "production is healthy" from
// "production stopped receiving deployments". In July 2026 the Vercel project
// lost its Git connection and this workflow reported success for two days
// while production served a commit that was two merges behind.
test("production serves the commit this workflow expects", async ({ page }) => {
  const expected = process.env.EXPECTED_SHA?.trim()

  test.skip(
    !expected,
    "Set EXPECTED_SHA to the commit that should be live (CI supplies it)",
  )

  await page.goto("./")

  const deployed = await page
    .locator("html")
    .getAttribute("data-build-sha")

  expect(
    deployed,
    "The deployed bundle does not publish data-build-sha. Either the build " +
      "predates that attribute, or the deployment is stale.",
  ).toBeTruthy()

  expect(
    deployed,
    `Production serves ${deployed}, but ${expected} should be live. The most ` +
      "likely cause is that deployments are no longer being triggered — check " +
      "the Cloudflare Worker deployment.",
  ).toBe(expected)
})

// The full flow check (home → five → summary in both languages) is the
// release session's job (plan appendix D); this keeps one document passing.
test("production opens the map and passes one document", async ({ page }) => {
  const runtimeFailures: string[] = []
  page.on("pageerror", (error) => runtimeFailures.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") runtimeFailures.push(message.text())
  })

  await useLanguage(page, "en")
  await page.goto("./")
  await expect(page.getByTestId("mark-map").getByRole("button")).toHaveCount(12)
  await expect(page.getByTestId("start-run")).toBeEnabled()

  await page.goto("./practice?doc=l1-heading-apple")
  await expect(page.getByTestId("practice")).toHaveAttribute(
    "data-problem-id",
    "l1-heading-apple",
  )
  await replaceDraft(page, "# Apple")
  await check(page)
  await expect(page.getByTestId("rd-bar")).toHaveAttribute("data-tone", "pass")
  expect(runtimeFailures).toEqual([])
})
