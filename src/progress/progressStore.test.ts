import { beforeEach, describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import {
  PROGRESS_STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  saveProgress,
} from "./progressStore"
import { MemoryStorage } from "../test/MemoryStorage"

const validProblemIds = new Set(
  headingProblems.map((problem) => problem.id),
)

describe("progressStore", () => {
  let storage: Storage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it("returns an independent default for fresh storage", () => {
    const first = loadProgress(storage, validProblemIds)
    first.completedProblemIds.push("heading-project-notes")

    const second = loadProgress(storage, validProblemIds)

    expect(second).toEqual(createDefaultProgress("heading-project-notes"))
  })

  it("round-trips valid progress", () => {
    const progress = createDefaultProgress("heading-project-notes")
    progress.draftByProblemId["heading-project-notes"] = "# Project notes"
    progress.completedProblemIds.push("heading-project-notes")
    progress.recentProblemIds.push("heading-project-notes")
    progress.pendingTransferFamily = "heading-h1"

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("recovers from corrupt JSON", () => {
    storage.setItem(PROGRESS_STORAGE_KEY, "{not-json")

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-project-notes"),
    )
  })

  it("recovers from an unknown schema version", () => {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 2 }),
    )

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-project-notes"),
    )
  })

  it("recovers when persisted progress references an unknown problem", () => {
    const progress = createDefaultProgress("heading-project-notes")
    progress.currentProblemId = "heading-unknown"
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-project-notes"),
    )
  })

  it("recovers when a saved ID list contains an unknown problem", () => {
    const progress = createDefaultProgress("heading-project-notes")
    progress.recentProblemIds.push("heading-unknown")
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-project-notes"),
    )
  })

  it("clears saved progress", () => {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(createDefaultProgress("heading-project-notes")),
    )

    clearProgress(storage)

    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
  })
})
