import { beforeEach, describe, expect, it } from "vitest"
import { createRunProblemIds } from "../content/entryChoices"
import { getProblem, problemBank, problemBankRevision } from "../content/problemBank"
import { MemoryStorage } from "../test/MemoryStorage"
import {
  PROGRESS_STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  saveProgress,
} from "./progressStore"

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

const validProblemIds = new Set(problemBank.map((problem) => problem.id))
const replacementMap = new Map(
  problemBank.map((problem) => [
    problem.id,
    new Set(
      problemBank
        .filter(
          (candidate) =>
            candidate.id !== problem.id &&
            candidate.level === problem.level &&
            candidate.flavor === problem.flavor &&
            candidate.retryFamily === problem.retryFamily &&
            candidate.contentVariant !== problem.contentVariant,
        )
        .map((candidate) => candidate.id),
    ),
  ]),
)

describe("progressStore v3", () => {
  let storage: Storage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it("binds persisted progress to the compiled bank revision", () => {
    const progress = createDefaultProgress(problemBank[0].id)
    expect(PROGRESS_STORAGE_KEY).toBe("nabimd.progress.v3")
    expect(progress).toMatchObject({
      version: 3,
      bankRevision: problemBankRevision,
    })
  })

  it("round-trips a valid deterministic run", () => {
    const ids = createRunProblemIds("level-4", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-4"
    progress.runProblemIds = ids
    progress.draftByProblemId[ids[0]!] = "# Draft"
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, replacementMap),
    ).toEqual(progress)
  })

  it("resets safely when the bank revision changes", () => {
    const progress = createDefaultProgress(problemBank[0].id, "old-bank")
    saveProgress(storage, progress)

    expect(
      loadProgress(
        storage,
        validProblemIds,
        replacementMap,
        problemBankRevision,
      ),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("restores an allowed same-level replacement", () => {
    const baseline = createRunProblemIds("level-3", 0)
    const replacement = problemBank.find(
      (candidate) =>
        candidate.level === 3 &&
        candidate.retryFamily === getProblem(baseline[0]!).retryFamily &&
        !baseline.includes(candidate.id),
    )!
    const progress = createDefaultProgress(replacement.id)
    progress.entryId = "level-3"
    progress.runProblemIds = [replacement.id, baseline[1]!, baseline[2]!]
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, replacementMap),
    ).toEqual(progress)
  })

  it("rejects a known cross-level substitution", () => {
    const baseline = createRunProblemIds("level-3", 0)
    const wrongLevel = createRunProblemIds("level-4", 0)[0]!
    const progress = createDefaultProgress(wrongLevel)
    progress.entryId = "level-3"
    progress.runProblemIds = [wrongLevel, ...baseline.slice(1)]
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, replacementMap),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("restores a bounded same-level transfer insertion", () => {
    const baseline = createRunProblemIds("level-2", 0)
    const transfer = baseline[2]!
    const progress = createDefaultProgress(transfer)
    progress.entryId = "level-2"
    progress.runProblemIds = [baseline[0]!, transfer, baseline[1]!]
    progress.runStepIndex = 1
    progress.currentIsTransfer = true
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, replacementMap),
    ).toEqual(progress)
  })

  it("recovers from corrupt or unknown records", () => {
    storage.setItem(PROGRESS_STORAGE_KEY, "{not-json")
    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress(problemBank[0].id),
    )

    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 2 }))
    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress(problemBank[0].id),
    )
  })

  it("clears and treats unavailable storage as best effort", () => {
    saveProgress(storage, createDefaultProgress(problemBank[0].id))
    clearProgress(storage)
    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()

    expect(loadProgress(new ThrowingStorage("get"), validProblemIds)).toEqual(
      createDefaultProgress(problemBank[0].id),
    )
    expect(() =>
      saveProgress(
        new ThrowingStorage("set"),
        createDefaultProgress(problemBank[0].id),
      ),
    ).not.toThrow()
    expect(() => clearProgress(new ThrowingStorage("remove"))).not.toThrow()
  })
})
