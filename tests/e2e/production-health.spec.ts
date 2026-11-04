import { expect, test, type Page } from "@playwright/test"
import {
  collectRuntimeErrors,
  passCurrent,
  useLanguage,
} from "./support/practice"

/**
 * The scheduled and post-deploy browser check (docs/production-health-monitoring.md).
 * It behaves like a learner who chose "necessary only": no analytics beacon
 * loads, and nothing it writes leaves the browser.
 */

/** Uncaught errors, console errors and HTTP 5xx answers, in arrival order. */
function collectFailures(page: Page): string[] {
  const failures = collectRuntimeErrors(page)
  page.on("response", (response) => {
    if (response.status() >= 500) {
      failures.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })
  return failures
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem(
      "nabimd.consent.v1",
      JSON.stringify({ v: 1, analytics: false }),
    ),
  )
})

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

test("production: the map, today's five and the summary in Korean", async ({
  page,
}) => {
  test.setTimeout(90_000)
  const failures = collectFailures(page)
  await useLanguage(page, "ko")

  await page.goto("./")
  await expect(page.locator("html")).toHaveAttribute("lang", "ko")
  await expect(page.getByTestId("mark-map").getByRole("button")).toHaveCount(12)

  await page.getByTestId("start-run").click()
  await expect(page).toHaveURL(/\/practice$/)
  for (let index = 1; index <= 5; index += 1) {
    await expect(page.getByTestId("run-progress")).toHaveText(
      `오늘의 다섯 장 ${index}/5`,
    )
    await passCurrent(page)
    await page.getByTestId("next").click()
  }

  await expect(page).toHaveURL(/\/done$/)
  await expect(page.getByTestId("done")).toContainText("다섯 장을 썼다.")
  await expect(page.getByTestId("done-facts")).toContainText(
    "한 번에 통과한 장: 5장",
  )
  await expect(page.locator('[data-testid="done-cards"] > li')).toHaveCount(5)
  expect(failures).toEqual([])
})

test("production: one English document passes", async ({ page }) => {
  const failures = collectFailures(page)
  await useLanguage(page, "en")

  await page.goto("./practice?mark=heading")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  // The first English visit waits for that language's bank chunk.
  await expect(page.getByTestId("practice")).toHaveAttribute(
    "data-problem-id",
    /.+/,
    { timeout: 30_000 },
  )
  await expect(page.getByTestId("instruction")).toContainText("This time:")
  await passCurrent(page)
  expect(failures).toEqual([])
})
