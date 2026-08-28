import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { curriculumLevels } from "../../src/content/curriculumLevels"
import { getCurriculumElements } from "../../src/content/curriculumElements"
import { createTurnProblemIds } from "../../src/selection/runComposition"

// Regenerates the design QA evidence in docs/design/qa/ from the current
// styles. It writes files, so it stays out of the ordinary e2e run and is
// driven by `npm run design:card-qa:capture` instead.
const shouldCapture = process.env.NABI_WRITE_CARD_QA === "1"

const progressStorageKey = "nabimd.progress.v5"
const sessionSeedStorageKey = "nabimd.session-seed.v1"
const qaDirectory = fileURLToPath(
  new URL("../../docs/design/qa/", import.meta.url),
)

const captureProblemId = "l1-emphasis-new-arrival"

type RuntimeProblemSource = {
  flavor: "standard" | "transfer"
  id: string
  level: 1 | 2 | 3 | 4 | 5
  retryFamily: string
  skillIds: string[]
  syntaxTokens: string[]
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
const levelOne = curriculumLevels[0]
const levelOneProblems = Object.values(runtimeProjection.levels)
  .flat()
  .filter((problem) => {
    const elements = getCurriculumElements(problem)
    return (
      problem.flavor === "standard" &&
      elements.length > 0 &&
      elements.every((element) => levelOne.elements.includes(element))
    )
  })

function findCaptureRotation() {
  for (let seed = 0; seed < 1_000; seed += 1) {
    for (let runNumber = 0; runNumber < 80; runNumber += 1) {
      if (
        createTurnProblemIds(1, runNumber, levelOneProblems, seed)[0] ===
        captureProblemId
      ) {
        return { runNumber, seed }
      }
    }
  }
  throw new Error(`Expected ${captureProblemId} in Level 1`)
}

async function openSeededLevelOne(page: Page) {
  const { runNumber, seed } = findCaptureRotation()
  await page.goto("/")
  await page.evaluate(
    ({ progressKey, seedKey, seedValue, nextRunNumber }) => {
      const persisted = window.sessionStorage.getItem(progressKey)
      if (!persisted) throw new Error("Expected persisted landing progress")
      const savedProgress = JSON.parse(persisted) as {
        runNumber: number
        runSeed: number
      }
      savedProgress.runNumber = nextRunNumber
      savedProgress.runSeed = seedValue
      window.sessionStorage.setItem(seedKey, String(seedValue))
      window.sessionStorage.setItem(progressKey, JSON.stringify(savedProgress))
    },
    {
      progressKey: progressStorageKey,
      seedKey: sessionSeedStorageKey,
      seedValue: seed,
      nextRunNumber: runNumber,
    },
  )
  await page.reload()
  await page
    .getByRole("button", { name: levelOne.label })
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
    await openSeededLevelOne(page)
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
    await openSeededLevelOne(page)
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
