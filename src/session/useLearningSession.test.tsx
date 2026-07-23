import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { createRunProblemIds, entryChoices } from "../content/entryChoices"
import {
  getProblem,
  problemBank,
  problemBankRevision,
} from "../content/problemBank"
import {
  PROGRESS_STORAGE_KEY,
  createDefaultProgress,
  saveProgress,
} from "../progress/progressStore"
import { getSyntaxFamily } from "../selection/runComposition"
import { MemoryStorage } from "../test/MemoryStorage"
import type { PracticeHistorySnapshot } from "./learningSession"
import { useLearningSession } from "./useLearningSession"

function matchCurrent(result: ReturnType<typeof renderLearningSession>["result"]) {
  act(() => result.current.edit(result.current.problem.target))
  act(() => result.current.check())
  expect(result.current.canNext).toBe(true)
}

// Mirrors the snapshot App.tsx records into each browser history entry.
function captureSnapshot(
  result: ReturnType<typeof renderLearningSession>["result"],
): PracticeHistorySnapshot {
  const { session } = result.current
  return {
    entryId: session.entryId,
    runNumber: session.runNumber,
    runProblemIds: [...session.runProblemIds],
    runStepIndex: session.runStepIndex,
    scheduledStepIndex: session.scheduledStepIndex,
    currentProblemId: session.currentProblemId,
    currentIsTransfer: session.currentIsTransfer,
    runStartedAtMs: session.runStartedAtMs,
  }
}

function renderLearningSession(
  storage = new MemoryStorage(),
  now: () => number = () => 1_000,
  createSessionSeed: () => number = () => 0,
) {
  return renderHook(() => useLearningSession(storage, now, createSessionSeed))
}

describe("useLearningSession", () => {
  it("finishes a six-problem turn instead of ending after the first Match", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    for (let index = 0; index < 6; index += 1) {
      expect(result.current.session.runStepIndex).toBe(index)
      matchCurrent(result)
      act(() => result.current.next())
    }

    expect(result.current.session.phase).toBe("complete")
  })

  it.each(entryChoices)("starts $id at its chosen level", (entry) => {
    const { result } = renderLearningSession()
    act(() => result.current.start(entry.id))

    expect(result.current.session.entryId).toBe(entry.id)
    expect(result.current.problem.level).toBe(entry.level)
    expect(result.current.session.runProblemIds).toEqual(
      createRunProblemIds(entry.id, 0),
    )
  })

  it("locks step navigation while a failed Check awaits its repair", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.canGoToPreviousStep).toBe(true)

    act(() => result.current.edit(""))
    act(() => result.current.check())
    expect(result.current.session.needsTransfer).toBe(true)
    expect(result.current.canGoToPreviousStep).toBe(false)
    expect(result.current.canGoToNextStep).toBe(false)

    const stepBefore = result.current.session.runStepIndex
    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(stepBefore)
    expect(result.current.session.needsTransfer).toBe(true)
  })

  it("keeps the owed repair when Prev is pressed on the repair step", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    expect(result.current.session.needsTransfer).toBe(true)
    matchCurrent(result)
    act(() => result.current.next())

    expect(result.current.session.currentIsTransfer).toBe(true)
    const repairProblemId = result.current.problem.id
    const repairedRunLength = result.current.session.runProblemIds.length

    // Step 0's snapshot still holds the pre-splice schedule; restoring it
    // would rewind the run and silently drop the owed repair exercise.
    expect(result.current.canGoToPreviousStep).toBe(false)
    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.session.runProblemIds).toHaveLength(repairedRunLength)

    for (let step = 1; step < repairedRunLength; step += 1) {
      expect(result.current.session.runStepIndex).toBe(step)
      matchCurrent(result)
      act(() => result.current.next())
    }

    expect(result.current.session.phase).toBe("complete")
    expect(result.current.session.progress.completedProblemIds).toContain(
      repairProblemId,
    )
  })

  it("locks the repair step even when stale forward snapshots exist", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    // Visit steps 0..2 so forward snapshots of the pre-splice schedule exist,
    // then walk back and fail step 0 to splice a repair exercise.
    matchCurrent(result)
    act(() => result.current.next())
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.runStepIndex).toBe(2)
    act(() => result.current.goToPreviousStep())
    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(0)

    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())

    expect(result.current.session.currentIsTransfer).toBe(true)
    const repairProblemId = result.current.problem.id
    const repairedRunLength = result.current.session.runProblemIds.length

    // The step-1/2 snapshots recorded before the splice belong to the
    // abandoned schedule; neither direction may leave the unfinished repair.
    expect(result.current.canGoToPreviousStep).toBe(false)
    expect(result.current.canGoToNextStep).toBe(false)
    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.currentIsTransfer).toBe(true)

    for (let step = 1; step < repairedRunLength; step += 1) {
      matchCurrent(result)
      act(() => result.current.next())
    }
    expect(result.current.session.phase).toBe("complete")
    expect(result.current.session.progress.completedProblemIds).toContain(
      repairProblemId,
    )
  })

  it("unlocks step navigation after the repair exercise is completed", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.currentIsTransfer).toBe(true)
    const repairProblemId = result.current.problem.id

    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.currentIsTransfer).toBe(false)
    expect(result.current.session.runStepIndex).toBe(2)

    // Revisiting the now-completed repair step is plain review, not an owed
    // repair, so navigation must stay unlocked there.
    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.canGoToPreviousStep).toBe(true)

    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(0)
    expect(result.current.session.progress.completedProblemIds).toContain(
      repairProblemId,
    )
  })

  it("keeps the owed repair when browser Back restores a pre-splice snapshot", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    const preSpliceSnapshot = captureSnapshot(result)

    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())

    expect(result.current.session.currentIsTransfer).toBe(true)
    const repairProblemId = result.current.problem.id
    const repairedRunLength = result.current.session.runProblemIds.length

    // popstate → navigateToHistory with the step-0 entry recorded before the
    // splice: restoring it would rewind to the pre-splice schedule and the
    // pruning effect would then silently drop the owed repair exercise.
    act(() => result.current.navigateToHistory(preSpliceSnapshot))
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.session.runProblemIds).toHaveLength(repairedRunLength)

    for (let step = 1; step < repairedRunLength; step += 1) {
      matchCurrent(result)
      act(() => result.current.next())
    }
    expect(result.current.session.phase).toBe("complete")
    expect(result.current.session.progress.completedProblemIds).toContain(
      repairProblemId,
    )
  })

  it("locks history navigation while a failed Check awaits its repair", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    const stepZeroSnapshot = captureSnapshot(result)
    matchCurrent(result)
    act(() => result.current.next())

    act(() => result.current.edit(""))
    act(() => result.current.check())
    expect(result.current.session.needsTransfer).toBe(true)

    // The history restore nulls pendingTransferFamily, so honoring browser
    // Back in this window would silently cancel the owed transfer exercise.
    act(() => result.current.navigateToHistory(stepZeroSnapshot))
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.needsTransfer).toBe(true)
  })

  it("allows history navigation again after the repair is completed", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.currentIsTransfer).toBe(true)
    const repairSnapshot = captureSnapshot(result)

    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.runStepIndex).toBe(2)
    expect(result.current.session.currentIsTransfer).toBe(false)

    // Revisiting the now-completed repair step via browser Back is plain
    // review; the lock must not outlive the owed repair.
    act(() => result.current.navigateToHistory(repairSnapshot))
    expect(result.current.session.runStepIndex).toBe(1)
    expect(result.current.session.currentIsTransfer).toBe(true)
  })

  it("frees a completed final repair revisited from the summary", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    const runLength = result.current.session.runProblemIds.length

    for (let step = 0; step < runLength - 1; step += 1) {
      matchCurrent(result)
      act(() => result.current.next())
    }
    expect(result.current.session.runStepIndex).toBe(runLength - 1)

    // Fail the LAST scheduled exercise so the repair lands after it; the
    // completion state is then the only thing beyond the repair step.
    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.session.runStepIndex).toBe(runLength)
    const repairSnapshot = captureSnapshot(result)

    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.phase).toBe("complete")
    const completionSnapshot = captureSnapshot(result)

    // Browser Back from the summary onto the completed final repair must not
    // misread it as still owed: that would disable the step controls and
    // ignore Forward, trapping the learner into re-checking the repair.
    act(() => result.current.navigateToHistory(repairSnapshot))
    expect(result.current.session.runStepIndex).toBe(runLength)
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.canGoToPreviousStep).toBe(true)
    expect(result.current.canGoToNextStep).toBe(true)

    act(() => result.current.navigateToHistory(completionSnapshot))
    expect(result.current.session.phase).toBe("complete")
  })

  it("drops future step snapshots when Try another changes the schedule", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    matchCurrent(result)
    act(() => result.current.next())

    act(() => result.current.goToPreviousStep())
    expect(result.current.session.runStepIndex).toBe(0)
    expect(result.current.canGoToNextStep).toBe(true)

    const scheduleBefore = [...result.current.session.runProblemIds]
    act(() => result.current.tryAnother())
    expect(result.current.session.runProblemIds).not.toEqual(scheduleBefore)

    // The old step-1 snapshot belongs to the abandoned schedule; following it
    // would restore the pre-replacement run and skip the unfinished step.
    expect(result.current.canGoToNextStep).toBe(false)
    const stepBefore = result.current.session.runStepIndex
    act(() => result.current.goToNextStep())
    expect(result.current.session.runStepIndex).toBe(stepBefore)
  })

  it("advances Practice again to fresh turns", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-3"))
    const original = result.current.problem.id

    act(() => result.current.practiceAgain())
    expect(result.current.session.runNumber).toBe(1)
    expect(result.current.problem.id).not.toBe(original)

    act(() => result.current.practiceAgain())
    expect(result.current.session.runNumber).toBe(2)
    expect(result.current.problem.id).not.toBe(original)
    expect(result.current.session.draft).toBe(
      result.current.problem.starterText,
    )
  })

  it("advances the run when the same level is re-entered", () => {
    const { result } = renderLearningSession(
      new MemoryStorage(),
      () => 1_000,
      () => 17,
    )

    act(() => result.current.start("level-1"))
    const firstVisitProblemId = result.current.problem.id

    act(() => result.current.changeLevel())
    act(() => result.current.start("level-1"))

    expect(result.current.session.runNumber).toBe(1)
    expect(result.current.problem.id).not.toBe(firstVisitProblemId)
    expect(result.current.session.runProblemIds).toEqual(
      createRunProblemIds("level-1", 1, 17),
    )
  })

  it("keeps one generated seed for progress and restored runs in a browser session", async () => {
    const storage = new MemoryStorage()
    const first = renderLearningSession(storage, () => 1_000, () => 17)

    act(() => first.result.current.start("level-1"))

    expect(first.result.current.session.progress.runSeed).toBe(17)
    expect(first.result.current.session.runProblemIds).toEqual(
      createRunProblemIds("level-1", 0, 17),
    )
    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain('"runSeed":17')
    })
    first.unmount()

    const restored = renderLearningSession(storage, () => 2_000, () => 99)

    expect(restored.result.current.session.progress.runSeed).toBe(17)
    expect(restored.result.current.session.runProblemIds).toEqual(
      createRunProblemIds("level-1", 0, 17),
    )
  })

  it("builds different opening shapes for separate browser-session seeds", () => {
    const first = renderLearningSession(
      new MemoryStorage(),
      () => 1_000,
      () => 0,
    )
    const second = renderLearningSession(
      new MemoryStorage(),
      () => 1_000,
      () => 1,
    )

    act(() => first.result.current.start("level-1"))
    act(() => second.result.current.start("level-1"))

    expect(first.result.current.session.runProblemIds).not.toEqual(
      second.result.current.session.runProblemIds,
    )
    expect(getSyntaxFamily(first.result.current.problem)).not.toBe(
      getSyntaxFamily(second.result.current.problem),
    )
  })

  it("clears the run and returns to level selection", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-5"))
    act(() => result.current.edit("draft"))
    act(() => result.current.changeLevel())

    expect(result.current.session.entryId).toBeNull()
    expect(result.current.session.runProblemIds).toEqual([])
    expect(result.current.session.progress.draftByProblemId).toEqual({})
  })

  it("shows Hint for four at-level problems and hides it for challenges", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))

    for (let index = 0; index < 4; index += 1) {
      expect(result.current.problem.level).toBe(1)
      expect(result.current.session.coach).toBe("hint")
      expect(result.current.session.needsTransfer).toBe(false)
      matchCurrent(result)
      act(() => result.current.next())
    }

    expect(result.current.problem.level).toBe(2)
    expect(result.current.session.coach).toBe("closed")
    act(() => result.current.requestHint())
    expect(result.current.session.coach).toBe("hint")
    expect(result.current.session.needsTransfer).toBe(false)
  })

  it("keeps every currently available Level 5 problem at-level and guided", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-5"))

    const runLength = result.current.session.runProblemIds.length
    for (let index = 0; index < runLength; index += 1) {
      expect(result.current.problem.level).toBe(5)
      expect(result.current.session.coach).toBe("hint")
      matchCurrent(result)
      act(() => result.current.next())
    }

    expect(result.current.session.phase).toBe("complete")
  })

  it("repairs a failure, then inserts different same-level content", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-2"))
    const failedProblem = result.current.problem
    const scheduledProblemIds = [...result.current.session.runProblemIds]

    act(() => result.current.edit("Not Markdown"))
    act(() => result.current.check())
    expect(result.current.session.evaluation?.status).toBe("fail")
    expect(result.current.canNext).toBe(false)

    matchCurrent(result)
    act(() => result.current.next())

    expect(result.current.problem.id).not.toBe(failedProblem.id)
    expect(result.current.problem.level).toBe(failedProblem.level)
    expect(result.current.problem.retryFamily).toBe(failedProblem.retryFamily)
    expect(result.current.problem.contentVariant).not.toBe(
      failedProblem.contentVariant,
    )
    expect(result.current.session.currentIsTransfer).toBe(true)
    expect(result.current.session.runProblemIds).toHaveLength(
      scheduledProblemIds.length + 1,
    )
    for (const scheduledProblemId of scheduledProblemIds) {
      expect(result.current.session.runProblemIds).toContain(scheduledProblemId)
    }
  })

  it("does not create an infinite transfer chain", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-1"))
    act(() => result.current.edit("#No space"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())
    expect(result.current.session.currentIsTransfer).toBe(true)

    act(() => result.current.edit("#Still wrong"))
    act(() => result.current.check())
    matchCurrent(result)
    act(() => result.current.next())

    expect(result.current.session.currentIsTransfer).toBe(false)
    expect(result.current.session.phase).toBe("editing")
  })

  it("persists a selected level, problem, and draft", async () => {
    const storage = new MemoryStorage()
    const first = renderLearningSession(storage)
    act(() => first.result.current.start("level-4"))
    const expectedProblem = first.result.current.problem.id
    act(() => first.result.current.edit("# Saved draft"))

    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain("# Saved draft")
    })
    first.unmount()

    const restored = renderLearningSession(storage)
    expect(restored.result.current.session.entryId).toBe("level-4")
    expect(restored.result.current.problem.id).toBe(expectedProblem)
    expect(restored.result.current.session.draft).toBe("# Saved draft")
  })

  it("restores a Goal-derived starter after migrating a legacy empty high-level draft", () => {
    const storage = new MemoryStorage()
    const ids = createRunProblemIds("level-5", 0)
    const currentProblemId = ids[1]!
    const genuineDraftProblemId = ids[2]!
    const legacyStarterlessBankRevision = problemBank
      .map((problem) => `${problem.id}@${problem.revision}`)
      .join("|")
    const progress = createDefaultProgress(
      currentProblemId,
      legacyStarterlessBankRevision,
    )
    progress.entryId = "level-5"
    progress.runProblemIds = ids
    progress.runStepIndex = 1
    progress.scheduledStepIndex = 1
    progress.runStartedAtMs = 1_000
    progress.draftByProblemId = {
      [currentProblemId]: "",
      [genuineDraftProblemId]: "## Preserve this learner draft",
    }
    saveProgress(storage, progress)

    const restored = renderLearningSession(storage)

    expect(problemBankRevision).not.toBe(legacyStarterlessBankRevision)
    expect(restored.result.current.problem.id).toBe(currentProblemId)
    expect(restored.result.current.session.draft).toBe(
      getProblem(currentProblemId).starterText,
    )
    expect(
      restored.result.current.session.progress.draftByProblemId[
        currentProblemId
      ],
    ).toBeUndefined()
    expect(
      restored.result.current.session.progress.draftByProblemId[
        genuineDraftProblemId
      ],
    ).toBe("## Preserve this learner draft")
  })

  it("preserves the original turn clock across reload and freezes completion", async () => {
    const storage = new MemoryStorage()
    let nowMs = 1_000
    const now = () => nowMs
    const first = renderLearningSession(storage, now)
    act(() => first.result.current.start("level-1"))

    expect(first.result.current.session.runStartedAtMs).toBe(1_000)
    await waitFor(() => {
      expect(storage.getItem(PROGRESS_STORAGE_KEY)).toContain(
        '"runStartedAtMs":1000',
      )
    })
    first.unmount()

    nowMs = 8_000
    const restored = renderLearningSession(storage, now)
    expect(restored.result.current.session.runStartedAtMs).toBe(1_000)
    expect(restored.result.current.session.runCompletedAtMs).toBeNull()

    for (let index = 0; index < 6; index += 1) {
      matchCurrent(restored.result)
      if (index === 5) nowMs = 16_000
      act(() => restored.result.current.next())
    }

    expect(restored.result.current.session.phase).toBe("complete")
    expect(restored.result.current.session.runCompletedAtMs).toBe(16_000)
  })

  it("starts a fresh clock and score for replay actions", () => {
    let nowMs = 1_000
    const { result } = renderLearningSession(new MemoryStorage(), () => nowMs)
    act(() => result.current.start("level-1"))
    act(() => result.current.edit("not markdown"))
    act(() => result.current.check())

    expect(result.current.session.failedScheduledStepIndexes).toEqual([0])

    nowMs = 5_000
    act(() => result.current.practiceAgain())

    expect(result.current.session.runStartedAtMs).toBe(5_000)
    expect(result.current.session.failedScheduledStepIndexes).toEqual([])
    expect(result.current.session.failedProblemIds).toEqual([])
  })

  it("starts with the first compiled problem when no run is active", () => {
    const { result } = renderLearningSession()
    expect(result.current.problem).toBe(getProblem(problemBank[0].id))
    expect(result.current.session.draft).toBe(problemBank[0].starterText)
    expect(result.current.canNext).toBe(false)
  })

  it("uses volatile progress when sessionStorage access throws", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage")
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError")
      },
    })

    try {
      const { result } = renderHook(() => useLearningSession())
      expect(result.current.problem.id).toBe(problemBank[0].id)
      act(() => result.current.edit("draft"))
      expect(result.current.session.draft).toBe("draft")
    } finally {
      if (descriptor) Object.defineProperty(window, "sessionStorage", descriptor)
    }
  })
})
