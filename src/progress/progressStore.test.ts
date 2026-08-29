import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  COMPOSITION_REVISION,
  createRunProblemIds,
  entryChoices,
  runScheduleRevision,
} from "../content/entryChoices"
import {
  getCurriculumElement,
  getCurriculumElements,
  getProblemEntryId,
} from "../content/curriculumElements"
import {
  isEligibleMixedExercise,
  MIXED_EXERCISE_POLICY,
} from "../content/mixedExercisePolicy"
import {
  flattenedStarterProjectionProblemBankRevision,
  getProblem,
  preStarterProjectionProblemBankRevision,
  problemBank,
  problemBankRevision,
  publishedProblemIds,
} from "../content/problemBank"
import { deriveLegacyPlaintextStarter } from "../content/plaintextStarter"
import {
  isEligibleTransferProblem,
  selectTransferProblem,
} from "../selection/selectTransferProblem"
import { curriculumLevels } from "../content/curriculumLevels"
import { SYNTAX_FAMILY_WEIGHTS } from "../selection/runPolicy"
import { MemoryStorage } from "../test/MemoryStorage"
import { createLearningSession } from "../session/learningSession"
import {
  MAX_PERSISTED_RUN_NUMBER,
  PROGRESS_STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  readPersistedRunSeed,
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
const validDraftProblemIds = new Set(publishedProblemIds)
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("binds persisted progress to the compiled bank revision", () => {
    const progress = createDefaultProgress(problemBank[0].id)
    expect(PROGRESS_STORAGE_KEY).toBe("nabimd.progress.v5")
    expect(progress).toMatchObject({
      version: 5,
      bankRevision: problemBankRevision,
      runScheduleRevision,
      scheduledStepIndex: 0,
      failedScheduledStepIndexes: [],
      failedProblemIds: [],
      runStartedAtMs: null,
      runCompletedAtMs: null,
    })
    const policy = [
      "turn-size@5",
      `family-weights@${Object.entries(SYNTAX_FAMILY_WEIGHTS)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([family, weight]) => `${family}:${weight}`)
        .join(",")}`,
      `mixed-exercise@max-${MIXED_EXERCISE_POLICY.maxCheckpoints}:separated-repeat-${MIXED_EXERCISE_POLICY.separatedSyntaxRepeats}`,
      ...entryChoices.map(
        (entry) => `${entry.id}@${entry.level}:${entry.elements.join(",")}`,
      ),
    ].join("|")
    expect(runScheduleRevision.startsWith(`${policy}|`)).toBe(true)

    // Nothing derived from the bank can notice that `createTurnProblemIds`
    // now returns a different run for the same (chapter, runNumber, seed), so
    // the algorithm carries a hand-written token. Losing it would let a
    // composition change reach a learner whose persisted run no longer
    // matches, and the validator drops that progress instead of migrating it.
    expect(runScheduleRevision).toContain(`|${COMPOSITION_REVISION}|`)
    expect(COMPOSITION_REVISION).toMatch(/^composition@\d+-/)

    // Eligibility is computed, not declared, so naming the policy constants is
    // not enough: a change to how the card cuts blanks moves which mixed
    // exercises a level may serve without touching any constant above. The
    // served counts are recomputed here from the bank directly rather than
    // through `getServedProblemsForBank`, so this fails if the revision stops
    // following the real served set.
    const servedIdsByEntry = curriculumLevels.map((entry) => ({
      entry,
      ids: problemBank
        .filter(
          (problem) =>
            problem.flavor === "standard" &&
            getProblemEntryId(problem) === entry.id &&
            (getCurriculumElements(problem).length === 1 ||
              isEligibleMixedExercise(problem)),
        )
        .map((problem) => problem.id),
    }))
    const fingerprints = new Set<string>()
    for (const { entry, ids } of servedIdsByEntry) {
      const marker = `|served@${entry.id}:${ids.length}:`
      expect(runScheduleRevision, entry.id).toContain(marker)
      const fingerprint = runScheduleRevision
        .slice(runScheduleRevision.indexOf(marker) + marker.length)
        .split("|")[0]!
      expect(fingerprint, entry.id).toMatch(/^[0-9a-z]+$/)
      fingerprints.add(fingerprint)
    }
    // Levels serve different problems, so a fingerprint that ignored its input
    // would collapse them to one value.
    expect(fingerprints.size).toBe(servedIdsByEntry.length)
  })

  it("round-trips a valid deterministic run", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    progress.draftByProblemId[ids[0]!] = "# Draft"
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("keeps learner drafts while replacing a persisted six-card run", () => {
    const legacySixCardProgress = {
      version: 5,
      bankRevision: problemBankRevision,
      entryId: "level-1",
      runNumber: 0,
      runSeed: 0,
      runProblemIds: [
        "l1-blockquote-book-by-lamp",
        "l1-blockquote-bring-keys",
        "l1-blockquote-bus-arrival",
        "l1-blockquote-call-when-home",
        "l1-blockquote-close-back-door",
        "l1-blockquote-dinner-table",
      ],
      runStepIndex: 2,
      scheduledStepIndex: 2,
      currentProblemId: "l1-blockquote-bus-arrival",
      draftByProblemId: {
        "l1-blockquote-bus-arrival": "# my in-progress draft",
      },
      completedProblemIds: [
        "l1-blockquote-book-by-lamp",
        "l1-blockquote-bring-keys",
      ],
      recentProblemIds: [
        "l1-blockquote-book-by-lamp",
        "l1-blockquote-bring-keys",
      ],
      pendingTransferFamily: null,
      pendingSlotRetryProblemId: null,
      currentIsTransfer: false,
      failedScheduledStepIndexes: [],
      failedProblemIds: [],
      syntaxMistakes: [],
      runStartedAtMs: 1000,
      runCompletedAtMs: null,
    }
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify(legacySixCardProgress),
    )
    vi.spyOn(Date, "now").mockReturnValue(9_000)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded.entryId).toBe("level-1")
    expect(loaded.runProblemIds).toEqual(createRunProblemIds("level-1", 0, 0))
    expect(loaded.runStepIndex).toBe(0)
    expect(loaded.scheduledStepIndex).toBe(0)
    expect(loaded.runStartedAtMs).toBe(9_000)
    expect(loaded.draftByProblemId).toEqual({
      "l1-blockquote-bus-arrival": "# my in-progress draft",
    })
  })

  it("lands a completed migrated run without repeating its rotation", () => {
    const firstRunProblemIds = createRunProblemIds("level-1", 0, 0)
    const justCompletedProblemIds = createRunProblemIds("level-1", 7, 0)
    const completedProblemIds = [
      ...justCompletedProblemIds,
      "l1-blockquote-book-by-lamp",
    ]
    const completedSixCardProgress = {
      ...createDefaultProgress(completedProblemIds.at(-1)!),
      entryId: "level-1",
      runNumber: 7,
      runProblemIds: completedProblemIds,
      runStepIndex: completedProblemIds.length,
      scheduledStepIndex: completedProblemIds.length,
      currentProblemId: completedProblemIds.at(-1),
      draftByProblemId: {
        "l1-blockquote-bus-arrival": "# keep the completed draft",
      },
      completedProblemIds,
      recentProblemIds: completedProblemIds,
      runStartedAtMs: 1_000,
      runCompletedAtMs: 9_000,
    }
    const { runScheduleRevision: _revision, ...legacyProgress } =
      completedSixCardProgress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded).toMatchObject({
      entryId: null,
      runProblemIds: [],
      runStartedAtMs: null,
      runCompletedAtMs: null,
      draftByProblemId: {
        "l1-blockquote-bus-arrival": "# keep the completed draft",
      },
    })
    const nextRunProblemIds = createRunProblemIds(
      "level-1",
      loaded.runNumber,
      loaded.runSeed,
    )
    expect(nextRunProblemIds).not.toEqual(justCompletedProblemIds)
    expect(nextRunProblemIds).not.toEqual(firstRunProblemIds)
  })

  it("regenerates a revision-mismatched run while preserving its entry and drafts", () => {
    const draftProblemId = "l1-heading-apple"
    const legacyProgress = {
      ...createDefaultProgress(draftProblemId),
      runScheduleRevision:
        "turn-size@5|level-removed@4:heading,bold,italic",
      entryId: "level-1",
      runNumber: 7,
      runProblemIds: [draftProblemId],
      runStartedAtMs: 1_000,
      draftByProblemId: { [draftProblemId]: "# Keep this draft" },
    }
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))
    vi.spyOn(Date, "now").mockReturnValue(9_000)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded.entryId).toBe("level-1")
    expect(loaded.runNumber).toBe(7)
    expect(loaded.runProblemIds).toEqual(
      createRunProblemIds("level-1", 7, 0),
    )
    expect(loaded.runStartedAtMs).toBe(9_000)
    expect(loaded.draftByProblemId).toEqual({
      [draftProblemId]: "# Keep this draft",
    })
  })

  it("carries a mid-run draft across the composition token instead of dropping it", () => {
    // The token is the only part of the revision that a composition change can
    // move, and it is the part that decides which path a stored run takes. A
    // stored run written before it fails `isValidRunProblemIds` — that path
    // returns a default and the learner loses the draft. This asserts the
    // revision mismatch is seen first, so the migration regenerates instead.
    const runNumber = 7
    const scheduled = createRunProblemIds("level-1", runNumber, 0)
    const servedMixed = scheduled.find(
      (id) => getCurriculumElements(getProblem(id)).length > 1,
    )!
    const otherMixed = problemBank.find(
      (problem) =>
        problem.flavor === "standard" &&
        getProblemEntryId(problem) === "level-1" &&
        getCurriculumElements(problem).length > 1 &&
        isEligibleMixedExercise(problem) &&
        problem.id !== servedMixed,
    )!
    // What the schedule looked like before: the same singles, a different
    // mixed exercise in the slot the new choice moved.
    const previousRunProblemIds = scheduled.map((id) =>
      id === servedMixed ? otherMixed.id : id,
    )
    expect(previousRunProblemIds).not.toEqual(scheduled)

    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultProgress(otherMixed.id),
        runScheduleRevision: runScheduleRevision
          .split("|")
          .filter((segment) => segment !== COMPOSITION_REVISION)
          .join("|"),
        entryId: "level-1",
        runNumber,
        runProblemIds: previousRunProblemIds,
        runStartedAtMs: 1_000,
        draftByProblemId: { [otherMixed.id]: "# Keep this across the bump" },
      }),
    )
    vi.spyOn(Date, "now").mockReturnValue(9_000)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
      0,
      validDraftProblemIds,
    )

    expect(loaded.entryId).toBe("level-1")
    expect(loaded.runNumber).toBe(runNumber)
    expect(loaded.runProblemIds).toEqual(scheduled)
    expect(loaded.draftByProblemId).toEqual({
      [otherMixed.id]: "# Keep this across the bump",
    })
  })

  it("keeps a draft for a mixed exercise retired from serving while regenerating its schedule", () => {
    const retiredMixed = problemBank.find(
      (problem) =>
        problem.flavor === "standard" &&
        getProblemEntryId(problem) === "level-1" &&
        getCurriculumElements(problem).length > 1 &&
        !isEligibleMixedExercise(problem),
    )
    if (!retiredMixed) {
      throw new Error("Missing a Level 1 mixed exercise retired by policy")
    }
    const runNumber = 7
    const previousRunScheduleRevision = runScheduleRevision
      .split("|")
      .filter((segment) => !segment.startsWith("mixed-exercise@"))
      .join("|")
    const previousRunProblemIds = createRunProblemIds(
      "level-1",
      runNumber,
      0,
    ).map((id) =>
      getCurriculumElements(getProblem(id)).length > 1
        ? retiredMixed.id
        : id,
    )
    expect(previousRunProblemIds).toHaveLength(5)
    expect(previousRunProblemIds).toContain(retiredMixed.id)
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultProgress(retiredMixed.id),
        runScheduleRevision: previousRunScheduleRevision,
        entryId: "level-1",
        runNumber,
        runProblemIds: previousRunProblemIds,
        runStartedAtMs: 1_000,
        draftByProblemId: {
          [retiredMixed.id]: "# Keep the retired mixed draft",
        },
      }),
    )
    vi.spyOn(Date, "now").mockReturnValue(9_000)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
      0,
      validDraftProblemIds,
    )

    expect(loaded.entryId).toBe("level-1")
    expect(loaded.runNumber).toBe(runNumber)
    expect(loaded.runProblemIds).toEqual(
      createRunProblemIds("level-1", runNumber, 0),
    )
    expect(loaded.runStartedAtMs).toBe(9_000)
    expect(loaded.runProblemIds).not.toContain(retiredMixed.id)
    for (const id of loaded.runProblemIds) {
      const problem = getProblem(id)
      if (getCurriculumElements(problem).length > 1) {
        expect(isEligibleMixedExercise(problem), id).toBe(true)
      }
    }
    expect(loaded.draftByProblemId).toEqual({
      [retiredMixed.id]: "# Keep the retired mixed draft",
    })
  })

  it.each([
    ["has no schedule revision", false],
    ["claims the current schedule revision", true],
  ])(
    "keeps learner drafts when an old level-five progress record %s",
    (_label, currentRevision) => {
      const draftProblemId = "l1-heading-apple"
      const progress = {
        ...createDefaultProgress(draftProblemId),
        entryId: "level-5",
        runProblemIds: [draftProblemId],
        runStartedAtMs: 1_000,
        draftByProblemId: { [draftProblemId]: "# Still mine" },
      }
      const { runScheduleRevision: _revision, ...withoutRevision } = progress
      storage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify(currentRevision ? progress : withoutRevision),
      )

      const loaded = loadProgress(
        storage,
        validProblemIds,
        isEligibleTransferProblemId,
      )

      expect(loaded.entryId).toBeNull()
      expect(loaded.draftByProblemId).toEqual({
        [draftProblemId]: "# Still mine",
      })
    },
  )

  it("salvages valid learner drafts from otherwise corrupt progress", () => {
    const draftProblemId = "l1-heading-apple"
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 5,
        bankRevision: problemBankRevision,
        runScheduleRevision,
        entryId: 42,
        runSeed: "not-a-seed",
        currentProblemId: null,
        draftByProblemId: {
          [draftProblemId]: "# Survives the last fallback",
          "not-in-the-bank": "# Discard this",
          "l1-heading-pear": 42,
        },
      }),
    )

    const loaded = loadProgress(storage, validProblemIds)

    expect(loaded).toEqual({
      ...createDefaultProgress(problemBank[0].id),
      draftByProblemId: {
        [draftProblemId]: "# Survives the last fallback",
      },
    })
  })

  it("migrates old v5 progress without a run seed to seed 0", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    progress.draftByProblemId[ids[0]!] = "# Draft"

    const { runSeed: _runSeed, ...legacyProgress } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("migrates old v5 progress without pending slot-retry metadata", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000

    const {
      pendingSlotRetryProblemId: _pendingSlotRetryProblemId,
      ...legacyProgress
    } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("migrates old v5 progress without a syntax mistake ledger", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000

    const { syntaxMistakes: _syntaxMistakes, ...legacyProgress } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("invalidates checkpoint-scoped evidence when the card projection changes", () => {
    const ids = createRunProblemIds("level-1", 0)
    const currentProblemId = ids[1]!
    const progress = createDefaultProgress(currentProblemId)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStepIndex = 1
    progress.scheduledStepIndex = 1
    progress.runStartedAtMs = 1_000
    progress.pendingSlotRetryProblemId = currentProblemId
    progress.syntaxMistakes = [
      {
        problemId: currentProblemId,
        checkpointId: "syntax-1-1",
        groupIndex: 0,
        term: "level 1 heading",
        submitted: "@",
        expected: ["# "],
      },
    ]
    progress.draftByProblemId[currentProblemId] = "# Learner draft"
    const {
      checkpointProjectionRevision: _checkpointProjectionRevision,
      ...legacyProgress
    } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
    )

    expect(loaded.currentProblemId).toBe(currentProblemId)
    expect(loaded.runStepIndex).toBe(1)
    expect(loaded.draftByProblemId[currentProblemId]).toBe("# Learner draft")
    expect(loaded.pendingSlotRetryProblemId).toBeNull()
    expect(loaded.syntaxMistakes).toEqual([])
  })

  it("round-trips a bounded syntax mistake ledger", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    progress.syntaxMistakes = [
      {
        problemId: ids[0]!,
        checkpointId: "syntax-1-1",
        groupIndex: 0,
        term: "level 1 heading",
        submitted: "@",
        expected: ["# "],
      },
    ]
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(progress)
  })

  it("rejects malformed persisted syntax mistake metadata", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000
    saveProgress(storage, {
      ...progress,
      syntaxMistakes: [
        {
          problemId: "not-in-the-bank",
          checkpointId: "syntax-1-1",
          groupIndex: 0,
          term: "heading",
          submitted: "@",
          expected: ["# "],
        },
      ],
    })

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("reads the seed a legacy seedless record should adopt as 0", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    const { runSeed: _runSeed, ...legacyProgress } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

    expect(readPersistedRunSeed(storage)).toBe(0)
  })

  it("reads an explicit persisted run seed and null when absent or invalid", () => {
    expect(readPersistedRunSeed(storage)).toBeNull()

    const progress = createDefaultProgress(problemBank[0].id, problemBankRevision, 42)
    saveProgress(storage, progress)
    expect(readPersistedRunSeed(storage)).toBe(42)

    storage.setItem(PROGRESS_STORAGE_KEY, "not json")
    expect(readPersistedRunSeed(storage)).toBeNull()
  })

  it("rejects old v5 progress without a run seed in nonzero-seed sessions", () => {
    const ids = createRunProblemIds("level-1", 0)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
    progress.runProblemIds = ids
    progress.runStartedAtMs = 1_000

    const { runSeed: _runSeed, ...legacyProgress } = progress
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(legacyProgress))

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

  it("rejects a persisted run that was generated for another session seed", () => {
    const ids = createRunProblemIds("level-1", 0, 17)
    const progress = createDefaultProgress(ids[0]!)
    progress.entryId = "level-1"
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

  it("preserves drafts for published exercises retired from scheduling", () => {
    const retiredProblemId = "l4-accessible-dialog-spec"
    expect(validProblemIds.has(retiredProblemId)).toBe(false)
    expect(validDraftProblemIds.has(retiredProblemId)).toBe(true)
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultProgress(problemBank[0].id, "parent-runtime"),
        draftByProblemId: {
          [retiredProblemId]: "## Learner-authored dialog notes",
          "removed-from-bank": "This draft no longer has a problem",
        },
      }),
    )

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
      0,
      validDraftProblemIds,
    )
    saveProgress(storage, loaded)

    expect(loaded.draftByProblemId).toEqual({
      [retiredProblemId]: "## Learner-authored dialog notes",
    })
    expect(
      JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY)!).draftByProblemId,
    ).toEqual(loaded.draftByProblemId)
  })

  it("keeps learner drafts while retiring a pre-chapter level-five schedule", () => {
    const preChapterRevision = [
      problemBank
        .filter((problem) => {
          if (problem.level < 4) return true
          const lines = problem.target.split("\n").length
          const words = problem.target.split(/\s+/).filter(Boolean).length
          return lines <= 20 && words <= 120
        })
        .map((problem) => `${problem.id}@${problem.revision}`)
        .join("|"),
      "starter-projection@2",
    ].join("|")
    const oldRun = problemBank
      .filter((problem) => problem.level === 5)
      .slice(0, 5)
      .map((problem) => problem.id)
    const savedDraftProblemId = oldRun[1]!
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...createDefaultProgress(oldRun[0]!, preChapterRevision, 0),
        runScheduleRevision: "five-chapter-schedule",
        entryId: "level-5",
        runProblemIds: oldRun,
        runStepIndex: 1,
        scheduledStepIndex: 1,
        currentProblemId: oldRun[1]!,
        runStartedAtMs: 1_000,
        draftByProblemId: {
          [savedDraftProblemId]: "## Learner-authored draft",
        },
      }),
    )
    vi.spyOn(Date, "now").mockReturnValue(9_000)

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
      0,
    )

    expect(preChapterRevision).not.toBe(problemBankRevision)
    expect(loaded.bankRevision).toBe(problemBankRevision)
    expect(loaded.entryId).toBeNull()
    expect(loaded.runProblemIds).toEqual([])
    expect(loaded.runStepIndex).toBe(0)
    expect(loaded.scheduledStepIndex).toBe(0)
    expect(loaded.runStartedAtMs).toBeNull()
    expect(loaded.draftByProblemId[savedDraftProblemId]).toBe(
      "## Learner-authored draft",
    )
  })

  it("migrates only legacy auto-generated drafts to Goal-derived starters", () => {
    const ids = problemBank
      .filter((problem) => problem.level === 5)
      .slice(0, 5)
      .map((problem) => problem.id)
    const seed = 0
    const currentProblemId = ids[0]!
    const currentIndex = ids.indexOf(currentProblemId)
    const genuineDraftProblemId = ids.find((id) => id !== currentProblemId)!
    const lowLevelProblemId = problemBank.find(
      (problem) => problem.level === 1 && !ids.includes(problem.id),
    )!.id
    const legacyProjectedProblemId =
      "l1-thematic-break-breakfast-dessert"
    const progress = createDefaultProgress(
      currentProblemId,
      legacyStarterlessBankRevision,
      seed,
    )
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        ...progress,
        runScheduleRevision: "five-chapter-schedule",
        entryId: "level-5",
        runProblemIds: ids,
        runStepIndex: currentIndex,
        scheduledStepIndex: currentIndex,
        runStartedAtMs: 1_000,
        draftByProblemId: {
          [currentProblemId]: "",
          [genuineDraftProblemId]: "## Genuine learner draft",
          [lowLevelProblemId]: "",
          [legacyProjectedProblemId]:
            "Breakfast is ready.\n\nSave dessert for later.",
        },
      }),
    )

    const loaded = loadProgress(
      storage,
      validProblemIds,
      isEligibleTransferProblemId,
      problemBankRevision,
      seed,
    )

    expect(problemBankRevision).not.toBe(legacyStarterlessBankRevision)
    expect(loaded.bankRevision).toBe(problemBankRevision)
    expect(loaded.entryId).toBeNull()
    expect(loaded.runProblemIds).toEqual([])
    expect(loaded.runStepIndex).toBe(0)
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
    const baselineProblem = getProblem(baseline[0]!)
    const replacement = problemBank.find(
      (candidate) =>
        candidate.level === baselineProblem.level &&
        candidate.retryFamily === baselineProblem.retryFamily &&
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
    const baselineProblem = getProblem(baseline[0]!)
    const replacement = problemBank.find(
      (candidate) =>
        candidate.level === baselineProblem.level &&
        candidate.retryFamily === baselineProblem.retryFamily &&
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
    const baseline = createRunProblemIds("level-1", 0)
    const wrongLevel = problemBank.find(
      (problem) => getCurriculumElement(problem) === "thematic-break",
    )!.id
    const progress = createDefaultProgress(wrongLevel)
    progress.entryId = "level-1"
    progress.runProblemIds = [wrongLevel, ...baseline.slice(1)]
    progress.runStartedAtMs = 1_000
    saveProgress(storage, progress)

    expect(
      loadProgress(storage, validProblemIds, isEligibleTransferProblemId),
    ).toEqual(createDefaultProgress(problemBank[0].id))
  })

  it("restores a live-eligible same-level transfer insertion", () => {
    const baseline = createRunProblemIds("level-1", 0)
    const currentProblem = getProblem(baseline[0]!)
    const transfer = selectTransferProblem({
      problems: problemBank,
      currentProblemId: currentProblem.id,
      retryFamily: currentProblem.retryFamily,
      recentProblemIds: baseline,
    })
    const progress = createDefaultProgress(transfer.id)
    progress.entryId = "level-1"
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
    const baseline = createRunProblemIds("level-1", 0)
    const wrongLevel = problemBank.find(
      (problem) => getCurriculumElement(problem) === "thematic-break",
    )!.id
    const progress = createDefaultProgress(wrongLevel)
    progress.entryId = "level-1"
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
