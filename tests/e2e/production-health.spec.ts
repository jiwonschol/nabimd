import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"

type RuntimeProblemSource = {
  id: string
  target: string
}

type RuntimeProblem = RuntimeProblemSource & {
  level: number
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

const runtimeProblemById = new Map<string, RuntimeProblem>(
  Object.entries(runtimeProjection.levels).flatMap(([level, problems]) =>
    problems.map((problem) => [
      problem.id,
      { ...problem, level: Number(level) },
    ] as const),
  ),
)

const levels = [
  { label: "Level 1 — Learn the syntax", level: 1 },
  {
    label: "Level 2 — Rebuild real documents",
    level: 2,
  },
  { label: "Level 3 — Write for people", level: 3 },
  { label: "Level 4 — Write for work", level: 4 },
  {
    label: "Level 5 — Write for developers",
    level: 5,
  },
] as const satisfies readonly {
  label: string
  level: number
}[]

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"

function cardBoxInput(page: Page): Locator {
  return page.getByRole("textbox", { name: /^Marks \d+ of \d+$/ }).first()
}

function practiceShell(page: Page): Locator {
  return page.locator("main.app-shell--practice")
}

async function resetFreshSession(page: Page) {
  await page.goto("/")
  await page.evaluate(
    ({ progressKey, seedKey }) => {
      window.sessionStorage.removeItem(progressKey)
      window.sessionStorage.setItem(seedKey, "0")
    },
    {
      progressKey: progressStorageKey,
      seedKey: sessionSeedStorageKey,
    },
  )
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Choose a chapter to begin." }),
  ).toBeVisible()
}

async function submitMarks(page: Page, marks: string) {
  const input = cardBoxInput(page)
  await expect(input).toBeVisible()
  await input.fill(marks)
  await input.press("Enter")
}

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

  await page.goto("/")

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
      "the Vercel project's Git connection.",
  ).toBe(expected)
})

test("production serves the expected six-problem run for every level", async ({
  page,
}) => {
  test.setTimeout(120_000)
  const runtimeFailures: string[] = []

  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeFailures.push(`console: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => {
    runtimeFailures.push(`pageerror: ${error.message}`)
  })
  page.on("response", (response) => {
    if (response.status() >= 500) {
      runtimeFailures.push(`${response.status()}: ${response.url()}`)
    }
  })

  for (const entry of levels) {
    await test.step(entry.label, async () => {
      await resetFreshSession(page)

      await page.getByRole("button", { name: entry.label }).click()
      await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
      await expect(page.getByLabel("Practice details")).toContainText(
        `Level ${entry.level}`,
      )

      for (let exercise = 0; exercise < 6; exercise += 1) {
        const problemId =
          await practiceShell(page).getAttribute("data-problem-id")
        expect(
          problemId,
          `problem ${exercise + 1} for Level ${entry.level}`,
        ).toBeTruthy()
        if (!problemId) {
          throw new Error(
            `Missing problem ${exercise + 1} for Level ${entry.level}`,
          )
        }
        const problem = runtimeProblemById.get(problemId)
        if (!problem) {
          throw new Error(`Missing runtime source for ${problemId}`)
        }
        if (exercise === 0) {
          expect(problem.level).toBe(entry.level)
        } else {
          expect([entry.level, Math.min(entry.level + 1, 5)]).toContain(
            problem.level,
          )
        }
        const marks = deriveSyntaxCheckpoints(problem.target, "").map(
          (checkpoint) => checkpoint.canonicalInput,
        )
        expect(
          marks.length,
          `syntax checkpoints for ${problemId}`,
        ).toBeGreaterThan(0)

        for (const mark of marks) {
          await submitMarks(page, mark)
        }
        if (exercise < 5) {
          await expect(practiceShell(page)).not.toHaveAttribute(
            "data-problem-id",
            problemId,
          )
        }
      }

      await expect(
        page.getByRole("heading", { name: "Well done." }),
      ).toBeVisible()
      await expect(page.getByLabel("Score")).toContainText("6 / 6")
      await expect(
        page.getByRole("region", { name: "Your work" }).getByRole("article"),
      ).toHaveCount(6)
    })
  }

  expect(runtimeFailures, "browser runtime failures").toEqual([])
})
