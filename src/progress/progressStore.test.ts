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

  it("falls back when reading storage throws", () => {
    expect(loadProgress(new ThrowingStorage("get"), validProblemIds)).toEqual(
      createDefaultProgress("heading-project-notes"),
    )
  })

  it("treats unavailable write storage as best effort", () => {
    const progress = createDefaultProgress("heading-project-notes")

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
