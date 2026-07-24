import { describe, expect, it } from "vitest"
import { createRunProblemIds } from "../content/entryChoices"
import { getHeadingProblem } from "../content/headingProblems"
import { getProblem } from "../content/problemBank"
import type { GradableProblem } from "../content/types"
import { evaluateProblem } from "../engine/evaluateProblem"
import { createDefaultProgress } from "../progress/progressStore"
import {
  canAdvance,
  createLearningSession,
  learningSessionReducer,
} from "./learningSession"
import type { LearningSession } from "./learningSession"

const apple = getHeadingProblem("heading-apple")
const rainyDay = getHeadingProblem("heading-rainy-day")

function newSession(problem: GradableProblem = apple): LearningSession {
  return createLearningSession(
    createDefaultProgress(problem.id),
    problem,
  )
}

function editAndCheck(
  session: LearningSession,
  problem: GradableProblem,
  source: string,
): LearningSession {
  const edited = learningSessionReducer(session, {
    type: "edited",
    value: source,
  })

  return learningSessionReducer(edited, {
    type: "checked",
    evaluation: evaluateProblem(problem, source),
    retryFamily: problem.retryFamily,
  })
}

describe("learningSessionReducer", () => {
  it("starts every level blank so the center card can grow the document", () => {
    const levelOne = getProblem("l1-heading-apple")
    const levelTwo = getProblem("l2-nested-checklist-closet-shelf")
    const levelThree = getProblem("l3-agenda-break-room-supplies")

    expect(newSession(levelOne).draft).toBe("")
    expect(newSession(levelTwo).draft).toBe("")
    expect(newSession(levelThree).draft).toBe("")
  })

  it("restores a saved learner draft instead of replacing it with the seed", () => {
    const problem = getProblem("l1-heading-apple")
    const progress = createDefaultProgress(problem.id)
    progress.draftByProblemId[problem.id] = "# Saved apple"

    expect(createLearningSession(progress, problem).draft).toBe(
      "# Saved apple",
    )
  })

  it("opens the introduced rule without creating transfer debt", () => {
    const session = newSession()

    expect(session.teachingMode).toBe("introduce")
    expect(session.coach).toBe("hint")
    expect(session.hintLevel).toBe(1)
    expect(session.needsTransfer).toBe(false)
  })

  it("starts a recall problem with every hint closed", () => {
    const session = newSession(rainyDay)

    expect(session.teachingMode).toBe("recall")
    expect(session.coach).toBe("closed")
    expect(session.hintLevel).toBe(0)
    expect(session.needsTransfer).toBe(false)
  })

  it("opens Help during recall without creating transfer debt", () => {
    const session = newSession(rainyDay)
    const hinted = learningSessionReducer(session, {
      type: "hint-requested",
    })

    expect(hinted.coach).toBe("hint")
    expect(hinted.hintLevel).toBe(1)
    expect(hinted.needsTransfer).toBe(false)
    expect(hinted.progress.pendingTransferFamily).toBeNull()
  })

  it("advances after a first-attempt Matched pass when the run has another step", () => {
    const passed = editAndCheck(newSession(), apple, "# Apple")

    expect(passed.evaluation?.status).toBe("matched")
    expect(canAdvance(passed)).toBe(true)

    const advanced = learningSessionReducer(passed, {
      type: "next",
      nextProblem: rainyDay,
      nextDraft: "",
    })

    expect(advanced.phase).toBe("editing")
    expect(advanced.currentProblemId).toBe("heading-rainy-day")
    expect(advanced.currentIsTransfer).toBe(false)
    expect(advanced.progress.completedProblemIds).toContain("heading-apple")
  })

  it("restores a completed problem as complete", () => {
    const passed = editAndCheck(newSession(), apple, "# Apple")
    const complete = learningSessionReducer(passed, {
      type: "completed",
      atMs: 9_000,
    })

    const restored = createLearningSession(complete.progress, apple)

    expect(restored.phase).toBe("complete")
  })

  it("keeps completion time valid if the wall clock moves backward", () => {
    const started = learningSessionReducer(newSession(), {
      type: "started",
      atMs: 10_000,
      entryId: "level-1",
      runNumber: 0,
      runProblemIds: [apple.id],
      problem: apple,
    })
    const passed = editAndCheck(started, apple, "# Apple")
    const complete = learningSessionReducer(passed, {
      type: "completed",
      atMs: 9_000,
    })

    expect(complete.runCompletedAtMs).toBe(10_000)
    expect(complete.progress.runCompletedAtMs).toBe(10_000)
  })

  it("completes after first-attempt Matched without requiring Review", () => {
    const passed = editAndCheck(
      newSession(),
      apple,
      "# Apple\n\n# Details",
    )

    expect(passed.evaluation?.status).toBe("matched")
    expect(passed.coach).toBe("closed")
    expect(canAdvance(passed)).toBe(true)
    expect(
      learningSessionReducer(passed, { type: "completed", atMs: 9_000 })
        .phase,
    ).toBe("complete")
  })

  it("blocks Next after Fail and routes a repaired answer to transfer", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")

    expect(failed.evaluation?.status).toBe("fail")
    expect(failed.needsTransfer).toBe(true)
    expect(canAdvance(failed)).toBe(false)
    expect(
      learningSessionReducer(failed, { type: "completed", atMs: 9_000 }),
    ).toBe(failed)

    const repaired = editAndCheck(failed, apple, "# Apple")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      nextProblem: rainyDay,
      nextDraft: "",
    })

    expect(transfer.phase).toBe("editing")
    expect(transfer.currentProblemId).toBe("heading-rainy-day")
    expect(transfer.draft).toBe("")
    expect(transfer.currentIsTransfer).toBe(true)
    expect(transfer.teachingMode).toBe("recall")
    expect(transfer.coach).toBe("closed")
    expect(transfer.needsTransfer).toBe(false)
    expect(transfer.progress.pendingTransferFamily).toBeNull()
    expect(transfer.progress.recentProblemIds).toContain("heading-apple")
  })

  it("preserves transfer debt when restoring a history snapshot", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")
    const repaired = editAndCheck(failed, apple, "# Apple")

    expect(repaired.progress.pendingTransferFamily).toBe(apple.retryFamily)

    const restored = learningSessionReducer(repaired, {
      type: "history-navigated",
      snapshot: {
        entryId: repaired.entryId,
        runNumber: repaired.runNumber,
        runProblemIds: [...repaired.runProblemIds],
        runStepIndex: repaired.runStepIndex,
        scheduledStepIndex: repaired.scheduledStepIndex,
        currentProblemId: repaired.currentProblemId,
        currentIsTransfer: repaired.currentIsTransfer,
        pendingTransferFamily: repaired.progress.pendingTransferFamily,
        runStartedAtMs: repaired.runStartedAtMs,
      },
      problem: apple,
    })

    expect(restored.needsTransfer).toBe(true)
    expect(restored.hadFailure).toBe(true)
    expect(restored.progress.pendingTransferFamily).toBe(apple.retryFamily)
  })

  it("keeps failed feedback while editing until Check replaces it", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")
    const edited = learningSessionReducer(failed, {
      type: "edited",
      value: "# Apple",
    })

    expect(edited.phase).toBe("editing")
    expect(edited.evaluation).toBe(failed.evaluation)
    expect(canAdvance(edited)).toBe(false)

    const rechecked = learningSessionReducer(edited, {
      type: "checked",
      evaluation: evaluateProblem(apple, "# Apple"),
      retryFamily: apple.retryFamily,
    })

    expect(rechecked.evaluation?.status).toBe("matched")
    expect(rechecked.evaluation).not.toBe(failed.evaluation)
  })

  it("replaces one failed evaluation with a different failed recheck", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")
    const rechecked = editAndCheck(failed, apple, "Apple\n=====")

    expect(failed.evaluation?.status).toBe("fail")
    expect(rechecked.evaluation?.status).toBe("fail")
    expect(rechecked.evaluation).not.toBe(failed.evaluation)
    if (
      failed.evaluation?.status === "fail" &&
      rechecked.evaluation?.status === "fail"
    ) {
      expect(
        failed.evaluation.failures.map((failure) => failure.feedbackId),
      ).toEqual(["space-after-hash", "use-h1-heading"])
      expect(
        rechecked.evaluation.failures.map((failure) => failure.feedbackId),
      ).toEqual(["use-hash-heading-style", "use-h1-heading"])
      expect(
        rechecked.evaluation.failures.map((failure) => failure.feedbackId),
      ).not.toContain("space-after-hash")
    }
  })

  it("restores any transfer as a clean recall exercise", () => {
    const progress = createDefaultProgress("heading-apple")
    progress.currentIsTransfer = true

    const restored = createLearningSession(progress, apple)

    expect(restored.currentIsTransfer).toBe(true)
    expect(restored.teachingMode).toBe("recall")
    expect(restored.coach).toBe("closed")
    expect(restored.hintLevel).toBe(0)
    expect(restored.needsTransfer).toBe(false)
  })

  it("does not route a recall pass to transfer merely because Help was used", () => {
    const hinted = learningSessionReducer(newSession(rainyDay), {
      type: "hint-requested",
    })
    const passed = editAndCheck(hinted, rainyDay, "# Rainy day")
    const advanced = learningSessionReducer(passed, {
      type: "next",
      nextProblem: getHeadingProblem("heading-study-tools"),
      nextDraft: "",
    })

    expect(advanced.currentProblemId).toBe("heading-study-tools")
    expect(advanced.currentIsTransfer).toBe(false)
  })

  it("completes after repairing a failed transfer without another transfer", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")
    const repaired = editAndCheck(failed, apple, "# Apple")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      nextProblem: rainyDay,
      nextDraft: "",
    })
    const transferFailed = editAndCheck(transfer, rainyDay, "#Rainy day")
    const transferRepaired = editAndCheck(
      transferFailed,
      rainyDay,
      "# Rainy day",
    )

    const complete = learningSessionReducer(transferRepaired, {
      type: "completed",
      atMs: 9_000,
    })

    expect(complete.phase).toBe("complete")
    expect(complete.progress.pendingTransferFamily).toBeNull()
    expect(complete.currentIsTransfer).toBe(false)
  })

  it("keeps transfer debt when the learner edits after repairing", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")
    const repaired = editAndCheck(failed, apple, "# Apple")
    const editedAgain = learningSessionReducer(repaired, {
      type: "edited",
      value: "# Apple ",
    })

    expect(editedAgain.phase).toBe("editing")
    expect(editedAgain.evaluation).toBeNull()
    expect(editedAgain.needsTransfer).toBe(true)
    expect(editedAgain.progress.pendingTransferFamily).toBe("heading-h1")
  })

  it("advances progressive hints only after Fail", () => {
    const initial = newSession()
    expect(
      learningSessionReducer(initial, { type: "hint-requested" }),
    ).toBe(initial)

    const failed = editAndCheck(initial, apple, "#Apple")
    const reopened = learningSessionReducer(failed, {
      type: "hint-requested",
    })
    const second = learningSessionReducer(reopened, {
      type: "hint-requested",
    })
    const third = learningSessionReducer(second, {
      type: "hint-requested",
    })
    const capped = learningSessionReducer(third, {
      type: "hint-requested",
    })

    expect(reopened.hintLevel).toBe(1)
    expect(second.hintLevel).toBe(2)
    expect(third.hintLevel).toBe(3)
    expect(capped.hintLevel).toBe(3)
  })

  it("keeps structural review notes in the Matched evaluation", () => {
    const cleanMatch = editAndCheck(newSession(), apple, "# Apple")
    expect(cleanMatch.evaluation?.status).toBe("matched")
    if (cleanMatch.evaluation?.status === "matched") {
      expect(cleanMatch.evaluation.reviewItems).toEqual([])
    }

    const matched = editAndCheck(
      newSession(),
      apple,
      "# Apple\n\n# Details",
    )
    expect(matched.evaluation?.status).toBe("matched")
    if (matched.evaluation?.status === "matched") {
      expect(matched.evaluation.reviewItems).toHaveLength(1)
    }
    expect(canAdvance(matched)).toBe(true)
  })

  it("replaces the current prompt without advancing the run", () => {
    const started = learningSessionReducer(newSession(), {
      type: "started",
      atMs: 1_000,
      entryId: "level-1",
      runNumber: 0,
      runProblemIds: ["heading-apple", "heading-study-tools"],
      problem: apple,
    })
    const replaced = learningSessionReducer(started, {
      type: "problem-replaced",
      problem: rainyDay,
    })

    expect(replaced.currentProblemId).toBe("heading-rainy-day")
    expect(replaced.runProblemIds).toEqual([
      "heading-rainy-day",
      "heading-study-tools",
    ])
    expect(replaced.runStepIndex).toBe(0)
    expect(replaced.draft).toBe("")
    expect(replaced.evaluation).toBeNull()
    expect(replaced.needsTransfer).toBe(false)
    expect(replaced.progress.completedProblemIds).toEqual([])
  })

  it("turns a failed prompt replacement into the required same-skill retry", () => {
    const started = learningSessionReducer(newSession(), {
      type: "started",
      atMs: 1_000,
      entryId: "level-1",
      runNumber: 0,
      runProblemIds: ["heading-apple", "heading-study-tools"],
      problem: apple,
    })
    const failed = editAndCheck(started, apple, "#Apple")
    const replaced = learningSessionReducer(failed, {
      type: "problem-replaced",
      problem: rainyDay,
    })

    expect(replaced.currentProblemId).toBe("heading-rainy-day")
    expect(replaced.currentIsTransfer).toBe(true)
    expect(replaced.needsTransfer).toBe(false)
    expect(replaced.progress.pendingTransferFamily).toBeNull()
    expect(replaced.progress.currentIsTransfer).toBe(true)
  })

  it("recomputes Hint visibility when a replacement changes the problem role", () => {
    const levelOneProblem = getProblem(createRunProblemIds("level-1", 0)[0]!)
    const started = learningSessionReducer(newSession(levelOneProblem), {
      type: "started",
      atMs: 1_000,
      entryId: "level-1",
      runNumber: 0,
      runProblemIds: [levelOneProblem.id],
      problem: levelOneProblem,
    })
    const levelTwoProblem = getProblem(createRunProblemIds("level-2", 0)[0]!)

    const replaced = learningSessionReducer(started, {
      type: "problem-replaced",
      problem: levelTwoProblem,
    })

    expect(started.hintStartsOpen).toBe(true)
    expect(replaced.hintStartsOpen).toBe(false)
    expect(replaced.coach).toBe("closed")
  })

  it("tracks one score penalty per scheduled step across remediation", () => {
    const scheduledIds = createRunProblemIds("level-1", 0)
    const started = learningSessionReducer(newSession(), {
      type: "started",
      atMs: 1_000,
      entryId: "level-1",
      runNumber: 0,
      runProblemIds: scheduledIds,
      problem: apple,
    })
    const failedOnce = editAndCheck(started, apple, "#Apple")
    const failedTwice = editAndCheck(failedOnce, apple, "#Still wrong")
    const repaired = editAndCheck(failedTwice, apple, "# Apple")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      nextProblem: rainyDay,
      nextDraft: "",
    })

    expect(transfer.scheduledStepIndex).toBe(0)
    expect(transfer.failedScheduledStepIndexes).toEqual([0])
    expect(transfer.failedProblemIds).toEqual([apple.id])

    const transferFailed = editAndCheck(transfer, rainyDay, "#Rainy day")
    const transferRepaired = editAndCheck(
      transferFailed,
      rainyDay,
      "# Rainy day",
    )
    const nextScheduled = learningSessionReducer(transferRepaired, {
      type: "next",
      nextProblem: getProblem(scheduledIds[1]!),
      nextDraft: "",
    })

    expect(nextScheduled.scheduledStepIndex).toBe(1)
    expect(nextScheduled.failedScheduledStepIndexes).toEqual([0])
    expect(nextScheduled.failedProblemIds).toEqual([apple.id, rainyDay.id])
    expect(nextScheduled.runStartedAtMs).toBe(1_000)
  })
})
