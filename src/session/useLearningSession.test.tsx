import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { createRunProblemIds, entryChoices } from "../content/entryChoices"
import { getProblem, problemBank } from "../content/problemBank"
import { PROGRESS_STORAGE_KEY } from "../progress/progressStore"
import { getSyntaxFamily } from "../selection/runComposition"
import { MemoryStorage } from "../test/MemoryStorage"
import { useLearningSession } from "./useLearningSession"

function matchCurrent(result: ReturnType<typeof renderLearningSession>["result"]) {
  act(() => result.current.edit(result.current.problem.target))
  act(() => result.current.check())
  expect(result.current.canNext).toBe(true)
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

  it("advances Practice again and Start over to fresh turns", () => {
    const { result } = renderLearningSession()
    act(() => result.current.start("level-3"))
    const original = result.current.problem.id

    act(() => result.current.practiceAgain())
    expect(result.current.session.runNumber).toBe(1)
    expect(result.current.problem.id).not.toBe(original)

    act(() => result.current.startOver())
    expect(result.current.session.runNumber).toBe(2)
    expect(result.current.problem.id).not.toBe(original)
    expect(result.current.session.draft).toBe(
      result.current.problem.starterText,
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
      () => 17,
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
