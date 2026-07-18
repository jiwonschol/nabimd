import { beforeEach, describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { createRunProblemIds } from "../content/entryChoices"
import {
  PROGRESS_STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  saveProgress,
} from "./progressStore"
import { MemoryStorage } from "../test/MemoryStorage"

class ThrowingStorage extends MemoryStorage {
  constructor(private readonly operation: "get" | "set" | "remove") {
    super()
  }

  override getItem(key: string): string | null {
    if (this.operation === "get") throw new Error("Storage is unavailable")
    return super.getItem(key)
  }

  override setItem(key: string, value: string): void {
    if (this.operation === "set") throw new Error("Storage is unavailable")
    super.setItem(key, value)
  }

  override removeItem(key: string): void {
    if (this.operation === "remove") throw new Error("Storage is unavailable")
    super.removeItem(key)
  }
}

const validProblemIds = new Set(
  headingProblems.map((problem) => problem.id),
)

describe("progressStore", () => {
  let storage: Storage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it("uses a new version for replayable session progress", () => {
    expect(PROGRESS_STORAGE_KEY).toBe("nabimd.progress.v2")
    expect(createDefaultProgress("heading-apple").version).toBe(2)
  })

  it("returns an independent default for fresh storage", () => {
    const first = loadProgress(storage, validProblemIds)
    first.completedProblemIds.push("heading-apple")

    const second = loadProgress(storage, validProblemIds)

    expect(second).toEqual(createDefaultProgress("heading-apple"))
  })

  it("round-trips valid progress", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.draftByProblemId["heading-apple"] = "# Apple"
    progress.completedProblemIds.push("heading-apple")
    progress.recentProblemIds.push("heading-apple")
    progress.pendingTransferFamily = "heading-h1"

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("restores a deterministic run sequence", () => {
    const runProblemIds = createRunProblemIds("basics", 0)
    const progress = createDefaultProgress(runProblemIds[0]!)
    progress.entryId = "basics"
    progress.runProblemIds = runProblemIds

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("restores a run with one bounded transfer insertion", () => {
    const expectedRunProblemIds = createRunProblemIds("level-1", 0)
    const transferProblemId = "heading-weekend-forecast"
    const progress = createDefaultProgress(transferProblemId)
    progress.entryId = "level-1"
    progress.runProblemIds = [
      expectedRunProblemIds[0]!,
      transferProblemId,
      ...expectedRunProblemIds.slice(1),
    ]
    progress.runStepIndex = 1
    progress.currentIsTransfer = true

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("restores a same-length run after a later problem becomes the transfer", () => {
    const expectedRunProblemIds = createRunProblemIds("basics", 0)
    const transferProblemId = expectedRunProblemIds[2]!
    const progress = createDefaultProgress(transferProblemId)
    progress.entryId = "basics"
    progress.runProblemIds = [
      expectedRunProblemIds[0]!,
      transferProblemId,
      expectedRunProblemIds[1]!,
    ]
    progress.runStepIndex = 1
    progress.currentIsTransfer = true

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("restores the bounded maximum of one transfer per normal problem", () => {
    const expectedRunProblemIds = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress("heading-product-roadmap")
    progress.entryId = "level-1"
    progress.runProblemIds = [
      expectedRunProblemIds[0]!,
      "heading-weekend-forecast",
      expectedRunProblemIds[1]!,
      "heading-team-handbook",
      expectedRunProblemIds[2]!,
      "heading-product-roadmap",
    ]
    progress.runStepIndex = 5
    progress.currentIsTransfer = true

    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("rejects an oversized restored run sequence", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.entryId = "level-1"
    progress.runProblemIds = Array.from(
      { length: 1000 },
      () => "heading-apple",
    )

    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("rejects a restored run shorter than its deterministic window", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.entryId = "level-1"
    progress.runProblemIds = ["heading-apple", "heading-study-tools"]

    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("rejects oversized completed and recent ID lists", () => {
    for (const field of ["completedProblemIds", "recentProblemIds"] as const) {
      const progress = createDefaultProgress("heading-apple")
      progress[field] = Array.from(
        { length: validProblemIds.size + 1 },
        () => "heading-apple",
      )
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

      expect(loadProgress(storage, validProblemIds)).toEqual(
        createDefaultProgress("heading-apple"),
      )
    }
  })

  it("recovers from corrupt JSON", () => {
    storage.setItem(PROGRESS_STORAGE_KEY, "{not-json")

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("recovers from an unknown schema version", () => {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 3 }),
    )

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("recovers when persisted progress references an unknown problem", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.currentProblemId = "heading-unknown"
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("recovers when a saved ID list contains an unknown problem", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.recentProblemIds.push("heading-unknown")
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("recovers when the saved problem disagrees with the active run step", () => {
    const progress = createDefaultProgress("heading-rainy-day")
    progress.entryId = "basics"
    progress.runProblemIds = [
      "heading-rainy-day",
      "heading-study-tools",
      "heading-apple",
    ]
    progress.runStepIndex = 1
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))

    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("clears saved progress", () => {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(createDefaultProgress("heading-apple")),
    )

    clearProgress(storage)

    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
  })

  it("falls back when reading storage throws", () => {
    expect(loadProgress(new ThrowingStorage("get"), validProblemIds)).toEqual(
      createDefaultProgress("heading-apple"),
    )
  })

  it("treats unavailable write storage as best effort", () => {
    const progress = createDefaultProgress("heading-apple")

    expect(() =>
      saveProgress(new ThrowingStorage("set"), progress),
    ).not.toThrow()
  })

  it("treats unavailable removal storage as best effort", () => {
    expect(() =>
      clearProgress(new ThrowingStorage("remove")),
    ).not.toThrow()
  })
})
