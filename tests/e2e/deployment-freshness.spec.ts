import { expect, test } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

// Every check in production-health.spec.ts passes just as happily against a
// build from last week, so on its own that suite cannot tell "production is
// healthy" from "production stopped receiving deployments". In July 2026 the
// Vercel project lost its Git connection and the workflow reported success for
// two days while production served a commit that was two merges behind.
//
// This file owns that second question and nothing else. It deliberately does
// not name a cause: on 2026-08-29 the message here asserted a lost Git
// connection while the real cause was Vercel's daily deployment rate limit,
// and the evidence for that was already sitting in the commit's Vercel status.
// The workflow reads that status and names the cause; this test only reports
// which commit is live.
test("production serves the commit this workflow expects", async ({ page }) => {
  const expected = process.env.EXPECTED_SHA?.trim()

  test.skip(
    !expected,
    "Set EXPECTED_SHA to the commit that should be live (CI supplies it)",
  )

  await page.goto("/")

  const deployed = await page.locator("html").getAttribute("data-build-sha")

  // The workflow needs the served commit whether this assertion passes or
  // fails: on failure it reads the commit's Vercel status to name the cause.
  // Parsing it back out of Playwright's error text would couple the report to
  // the wording of an assertion message.
  const receipt = process.env.DEPLOYED_SHA_RECEIPT?.trim()
  if (receipt) {
    mkdirSync(dirname(receipt), { recursive: true })
    writeFileSync(receipt, `${deployed ?? ""}\n`, "utf8")
  }

  expect(
    deployed,
    "The deployed bundle does not publish data-build-sha. Either the build " +
      "predates that attribute, or the deployment is stale.",
  ).toBeTruthy()

  expect(
    deployed,
    `Production serves ${deployed}, but ${expected} should be live.`,
  ).toBe(expected)
})
