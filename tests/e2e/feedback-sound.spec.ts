import { expect, test, type Locator, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { deriveSyntaxCheckpoints } from "../../src/guided/guidedSyntax"

type RuntimeProblemSource = {
  id: string
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

const runtimeProblemById = new Map(
  Object.values(runtimeProjection.levels)
    .flat()
    .map((problem) => [problem.id, problem]),
)

const sessionSeedStorageKey = "nabimd.session-seed.v1"

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

test("voices every accepted mark with matched and every rejected mark with try-again", async ({
  page,
}) => {
  await page.goto("/")
  // Chapter 2 problems carry several slots each, so the per-slot matched cue
  // is distinguishable from a once-per-problem completion cue.
  await page
    .getByRole("button", { name: "Chapter 2 — Lists" })
    .click()
  await expect(page.getByTestId("page-turn-transition")).toHaveCount(0)
  await expect(cardBoxInput(page)).toBeFocused()

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
