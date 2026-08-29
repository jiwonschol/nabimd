import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { curriculumLevels } from "../../src/content/curriculumLevels"
import { getCurriculumElements } from "../../src/content/curriculumElements"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"
import { createTurnProblemIds } from "../../src/selection/runComposition"

type RuntimeProblemSource = {
  flavor: "standard" | "transfer"
  id: string
  level: 1 | 2 | 3 | 4 | 5
  retryFamily: string
  skillIds: string[]
  syntaxTokens: string[]
  target: string
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

const runtimeProblems = Object.values(runtimeProjection.levels).flat()
const runtimeProblemById = new Map(
  runtimeProblems.map((problem) => [problem.id, problem]),
)
const levelOne = curriculumLevels[0]
const levelOneProblems = runtimeProblems.filter((problem) => {
  const elements = getCurriculumElements(problem)
  return (
    problem.flavor === "standard" &&
    elements.length > 0 &&
    elements.every((element) => levelOne.elements.includes(element))
  )
})

const sessionSeedStorageKey = "nabimd.session-seed.v1"
const progressStorageKey = "nabimd.progress.v5"

type RecordedPlay = {
  src: string
  muted: boolean
  rejected?: boolean
}

declare global {
  interface Window {
    __audioPlays: RecordedPlay[]
  }
}

test.use({
  launchOptions: {
    args: ["--autoplay-policy=no-user-gesture-required"],
  },
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    if (window.sessionStorage.getItem(storageKey) === null) {
      window.sessionStorage.setItem(storageKey, "0")
    }
    window.__audioPlays = []
    const originalPlay = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      const entry: Window["__audioPlays"][number] = {
        src: this.src,
        muted: this.muted,
      }
      window.__audioPlays.push(entry)
      const playback = originalPlay.call(this)
      playback?.then(
        () => {
          entry.rejected = false
        },
        () => {
          entry.rejected = true
        },
      )
      return playback
    }
  }, sessionSeedStorageKey)
})

function cardBoxInput(page: Page): Locator {
  return page.getByRole("textbox", { name: /^Marks \d+ of \d+$/ }).first()
}

async function currentProblemId(page: Page): Promise<string> {
  const problemId = await page
    .locator("main.app-shell--practice")
    .getAttribute("data-problem-id")
  if (!problemId) throw new Error("Practice must expose its current problem")
  return problemId
}

async function submitSlot(page: Page, marks: string) {
  const input = cardBoxInput(page)
  await expect(input).toBeVisible()
  if (!(await input.evaluate((element) => element === document.activeElement))) {
    await input.click()
  }
  await page.keyboard.type(marks)
  await page.keyboard.press("Enter")
}

function unmutedPlays(plays: RecordedPlay[], asset: string): RecordedPlay[] {
  return plays.filter((play) => play.src.includes(asset) && !play.muted)
}

async function openMultiSlotLevelOne(page: Page) {
  for (let seed = 0; seed < 1_000; seed += 1) {
    for (let runNumber = 0; runNumber < 80; runNumber += 1) {
      const firstProblemId = createTurnProblemIds(
        1,
        runNumber,
        levelOneProblems,
        seed,
      )[0]!
      const problem = runtimeProblemById.get(firstProblemId)!
      // A card holds one syntax, so a list of any length is a single slot.
      // The per-slot cue is only distinguishable from a once-per-problem cue
      // on a problem that teaches more than one syntax.
      if (deriveSyntaxCheckpoints(problem.target, "").length < 2) continue

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
          window.sessionStorage.setItem(
            progressKey,
            JSON.stringify(savedProgress),
          )
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
      await expect(cardBoxInput(page)).toBeFocused()
      return
    }
  }
  throw new Error("Expected a multi-slot Level 1 problem")
}

test("voices every accepted mark with matched and every rejected mark with try-again", async ({
  page,
}) => {
  // The selected Level 1 problem carries several cards, so the per-slot matched
  // cue is distinguishable from a once-per-problem completion cue.
  await openMultiSlotLevelOne(page)

  // A rejected mark chirps try-again.
  await submitSlot(page, "@@@")
  await expect
    .poll(async () =>
      unmutedPlays(await page.evaluate(() => window.__audioPlays), "try-again")
        .length,
    )
    .toBe(1)

  // Two cleanly completed problems chirp matched once per accepted slot.
  let expectedMatched = 0
  for (let round = 0; round < 2; round += 1) {
    const beforeId = await currentProblemId(page)
    const problem = runtimeProblemById.get(beforeId)
    if (!problem) throw new Error("Expected the current runtime problem")
    const slotMarks = deriveSyntaxCheckpoints(problem.target, "").map(
      (checkpoint) => checkpoint.canonicalInput,
    )
    for (const marks of slotMarks) {
      await submitSlot(page, marks)
    }
    expectedMatched += slotMarks.length
    await expect.poll(() => currentProblemId(page)).not.toBe(beforeId)
  }

  // With fewer slots than this the per-slot cue would be indistinguishable
  // from a once-per-problem completion cue and the guard would lose its bite.
  expect(expectedMatched).toBeGreaterThan(2)

  const plays = await page.evaluate(() => window.__audioPlays)
  const matchedPlays = unmutedPlays(plays, "matched")
  expect(matchedPlays.length).toBe(expectedMatched)
  expect(matchedPlays.every((play) => play.rejected !== true)).toBe(true)
  // The wrong attempt stayed a single try-again chirp.
  expect(unmutedPlays(plays, "try-again").length).toBe(1)
})
