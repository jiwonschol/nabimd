import { beforeEach, describe, expect, it } from "vitest"
import { createRunProblemIds } from "../content/entryChoices"
import {
  flattenedStarterProjectionProblemBankRevision,
  getProblem,
  preStarterProjectionProblemBankRevision,
  problemBank,
  problemBankRevision,
} from "../content/problemBank"
import { deriveLegacyPlaintextStarter } from "../content/plaintextStarter"
import {
  isEligibleTransferProblem,
  selectTransferProblem,
} from "../selection/selectTransferProblem"
import { MemoryStorage } from "../test/MemoryStorage"
import { createLearningSession } from "../session/learningSession"
import {
  MAX_PERSISTED_RUN_NUMBER,
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
const legacyStarterlessBankRevision =
  preStarterProjectionProblemBankRevision
function isEligibleTransferProblemId(
  currentProblemId: string,
  candidateProblemId: string,
): boolean {
  const currentProblem = getProblem(currentProblemId)
  return isEligibleTransferProblem(
    currentProblem,
    getProblem(candidateProblemId),
    currentProblem.retryFamily,
  )
}

describe("progressStore v5", () => {
  let storage: Storage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it("binds persisted progress to the compiled bank revision", () => {
    const progress = createDefaultProgress(problemBank[0].id)
    expect(PROGRESS_STORAGE_KEY).toBe("nabimd.progress.v5")
    expect(progress).toMatchObject({
      version: 5,
      bankRevision: problemBankRevision,
      scheduledStepIndex: 0,
      failedScheduledStepIndexes: [],
      failedProblemIds: [],
      runStartedAtMs: null,
      runCompletedAtMs: null,
    })
  })

  it("round-trips a valid deterministic run", () => {
    const ids = createRunProblemIds("level-4", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-4"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    progress.draftByProblemId[ids[0]!] = "# Draft"
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("rejects a persisted run that was generated for another session seed", () => {
    const ids = createRunProblemIds("level-4", 0, 17)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-4"
    progress.runSeed = 17
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(
        storage,
        validProblemIds,
        isEligibleTransferProblemId,
        problemBankRevision,
        18,
      ),
    ).toEqual(createDefaultProgress(problemBank[0].id, problemBankRevision, 18))
  })

  it("round-trips the greeting state without an active timer", () => {
    const progress = createDefaultProgress(problemBank[0].id)
    saveProgress(storage, progress)

    expect(loadProgress(storage, validProblemIds)).toEqual(progress)
  })

  it("round-trips score facts and a frozen completion time", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids.at(-1)!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStepIndex = ids.length
    progress.scheduledStepIndex = ids.length
    progress.failedScheduledStepIndexes = [0]
    progress.failedProblemIds = [ids[0]!]
    progress.runStartedAtMs = 5_000
    progress.runCompletedAtMs = 72_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("rejects impossible timing and score metadata", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 10_000

    saveProgress(storage, {
      ...progress,
      runCompletedAtMs: 9_999,
    })
    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))

    saveProgress(storage, {
      ...progress,
      failedScheduledStepIndexes: [ids.length],
    })
    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))

    saveProgress(storage, {
      ...progress,
      scheduledStepIndex: ids.length,
      failedScheduledStepIndexes: [ids.length - 1],
    })
    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("resets safely when the bank revision changes", () => {
    const progress = createDefaultProgress(problemBank[0].id, "old-bank")
    saveProgress(storage, progress)

    expect(
      loadProgress(
        storage,
        validProblemIds,
        isEligibleTransferProblemId,
        problemBankRevision,
      ),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("migrates only legacy auto-generated drafts to Goal-derived starters", () => {
    const ids = createRunProblemIds("level-3", 0)
    const currentProblemId = ids[1]!
    const genuineDraftProblemId = ids[2]!
    const lowLevelProblemId = problemBank.find(
      (problem) => problem.level === 1,
    )!.id
    const legacyProjectedProblemId =
      "l1-thematic-break-breakfast-dessert"
    const progress = createDefaultProgress(
      currentProblemId,
      legacyStarterlessBankRevision,
    )
    progress.entryId = "level-3"
    progress.runProblemIds = ids
    progress.runStepIndex = 1
    progress.scheduledStepIndex = 1
    progress.runStartedAtMs = 1_000
    progress.draftByProblemId = {
      [currentProblemId]: "",
      [genuineDraftProblemId]: "## Genuine learner draft",
      [lowLevelProblemId]: "",
      [legacyProjectedProblemId]:
        "Breakfast is ready.\n\nSave dessert for later.",
    }
    saveProgress(storage, progress)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
    )

    expect(problemBankRevision).not.toBe(legacyStarterlessBankRevision)
    expect(loaded.bankRevision).toBe(problemBankRevision)
    expect(loaded.entryId).toBe("level-3")
    expect(loaded.runProblemIds).toEqual(ids)
    expect(loaded.runStepIndex).toBe(1)
    expect(loaded.draftByProblemId[currentProblemId]).toBeUndefined()
    expect(loaded.draftByProblemId[genuineDraftProblemId]).toBe(
      "## Genuine learner draft",
    )
    expect(loaded.draftByProblemId[lowLevelProblemId]).toBe("")
    expect(
      loaded.draftByProblemId[legacyProjectedProblemId],
    ).toBeUndefined()
  })

  it("migrates flattened @1 starters to exact Goal topology without replacing learner drafts", () => {
    const topologyProblem = getProblem("l3-agenda-break-room-supplies")
    const editedProblem = problemBank.find(
      (problem) => problem.level === 4,
    )!
    const lowLevelProblem = getProblem("l1-heading-apple")
    const lowLevelTwoProblem = getProblem(
      "l2-nested-checklist-closet-shelf",
    )
    const lowLevelProjectedProblem = getProblem(
      "l1-thematic-break-breakfast-dessert",
    )
    const progress = createDefaultProgress(
      topologyProblem.id,
      flattenedStarterProjectionProblemBankRevision,
    )
    progress.draftByProblemId = {
      [topologyProblem.id]: deriveLegacyPlaintextStarter(
        topologyProblem.target,
      ),
      [editedProblem.id]: "## Genuine learner draft",
      [lowLevelProblem.id]: "",
      [lowLevelTwoProblem.id]: "",
      [lowLevelProjectedProblem.id]: deriveLegacyPlaintextStarter(
        lowLevelProjectedProblem.target,
      ),
    }
    saveProgress(storage, progress)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded.bankRevision).toBe(problemBankRevision)
    expect(loaded.draftByProblemId[topologyProblem.id]).toBeUndefined()
    expect(loaded.draftByProblemId[editedProblem.id]).toBe(
      "## Genuine learner draft",
    )
    expect(loaded.draftByProblemId).toHaveProperty(lowLevelProblem.id, "")
    expect(loaded.draftByProblemId).toHaveProperty(lowLevelTwoProblem.id, "")
    expect(
      loaded.draftByProblemId[lowLevelProjectedProblem.id],
    ).toBeUndefined()

    const restored = createLearningSession(loaded, topologyProblem)
    // With the removed automatic draft, the session starts blank so the
    // center card can grow the document from its first slot.
    expect(restored.draft).toBe("")
  })

  it("migrates an empty high-level draft persisted under flattened @1", () => {
    const problem = getProblem("l5-bug-duplicate-webhook-retry-report")
    const progress = createDefaultProgress(
      problem.id,
      flattenedStarterProjectionProblemBankRevision,
    )
    progress.draftByProblemId[problem.id] = ""
    saveProgress(storage, progress)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded.bankRevision).toBe(problemBankRevision)
    expect(loaded.draftByProblemId[problem.id]).toBeUndefined()
    expect(createLearningSession(loaded, problem).draft).toBe("")
  })

  it("restores an allowed same-level replacement", () => {
    const baseline = createRunProblemIds("level-1", 0)
    const replacement = problemBank.find(
      (candidate) =>
        candidate.level === 1 &&
        candidate.retryFamily === getProblem(baseline[0]!).retryFamily &&
        !baseline.includes(candidate.id),
    )!
    const progress = createDefaultProgress(replacement.id)
    progress.entryId = "level-1"
    progress.runProblemIds = [replacement.id, ...baseline.slice(1)]
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("restores a failed prompt replaced by a same-step transfer retry", () => {
    const baseline = createRunProblemIds("level-1", 0)
    const replacement = problemBank.find(
      (candidate) =>
        candidate.level === 1 &&
        candidate.retryFamily === getProblem(baseline[0]!).retryFamily &&
        !baseline.includes(candidate.id),
    )!
    const progress = createDefaultProgress(replacement.id)
    progress.entryId = "level-1"
    progress.runProblemIds = [replacement.id, ...baseline.slice(1)]
    progress.currentIsTransfer = true
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("rejects a known cross-level substitution", () => {
    const baseline = createRunProblemIds("level-3", 0)
    const wrongLevel = createRunProblemIds("level-4", 0)[0]!
    const progress = createDefaultProgress(wrongLevel)
    progress.entryId = "level-3"
    progress.runProblemIds = [wrongLevel, ...baseline.slice(1)]
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("restores a live-eligible same-level transfer insertion", () => {
    const baseline = createRunProblemIds("level-2", 0)
    const currentProblem = getProblem(baseline[0]!)
    const transfer = selectTransferProblem({
      problems: problemBank,
      currentProblemId: currentProblem.id,
      retryFamily: currentProblem.retryFamily,
      recentProblemIds: baseline,
    })
    const progress = createDefaultProgress(transfer.id)
    progress.entryId = "level-2"
    progress.runProblemIds = [baseline[0]!, transfer.id, ...baseline.slice(1)]
    progress.runStepIndex = 1
    progress.currentIsTransfer = true
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("rejects a forged cross-level transfer insertion", () => {
    const baseline = createRunProblemIds("level-3", 0)
    const wrongLevel = createRunProblemIds("level-4", 0)[0]!
    const progress = createDefaultProgress(wrongLevel)
    progress.entryId = "level-3"
    progress.runProblemIds = [
      baseline[0]!,
      wrongLevel,
      ...baseline.slice(1),
    ]
    progress.runStepIndex = 1
    progress.currentIsTransfer = true
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
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

    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultProgress(problemBank[0].id),
        version: 3,
        pendingTransferFamily: "hint-created-debt",
      }),
    )
    expect(loadProgress(storage, validProblemIds)).toEqual(
      createDefaultProgress(problemBank[0].id),
    )
  })

  it("rejects a persisted run number beyond the session safety limit", () => {
    expect(MAX_PERSISTED_RUN_NUMBER).toBe(10_000)
    const progress = createDefaultProgress(problemBank[0].id)
    progress.entryId = "level-1"
    progress.runNumber = MAX_PERSISTED_RUN_NUMBER + 1
    progress.runProblemIds = createRunProblemIds("level-1", 0)
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
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
