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

  it("keeps hint UI state out of the session model", () => {
    const session = newSession()

    expect(session.teachingMode).toBe("introduce")
    expect(session).not.toHaveProperty("hintStartsOpen")
    expect(session).not.toHaveProperty("hintLevel")
    expect(session).not.toHaveProperty("coach")
    expect(session.needsTransfer).toBe(false)
  })

  it("persists only the currently unresolved syntax-slot retry", () => {
    const missed = learningSessionReducer(newSession(apple), {
      type: "slot-missed",
    })

    expect(missed.progress).toMatchObject({
      pendingSlotRetryProblemId: apple.id,
    })

    const corrected = learningSessionReducer(missed, {
      type: "edited",
      value: "# Apple",
    })
    expect(corrected.progress).toMatchObject({
      pendingSlotRetryProblemId: null,
    })

    const missedAgain = learningSessionReducer(corrected, {
      type: "slot-missed",
    })
    expect(missedAgain.progress).toMatchObject({
      pendingSlotRetryProblemId: apple.id,
    })
  })

  it("restores the run-scoped syntax mistake ledger", () => {
    const mistake = {
      problemId: apple.id,
      checkpointId: "syntax-1-1",
      groupIndex: 0,
      term: "level 1 heading",
      submitted: "@",
      expected: ["# "],
    }
    const missed = learningSessionReducer(newSession(apple), {
      type: "slot-missed",
      mistakes: [mistake],
    })

    expect(missed.progress.syntaxMistakes).toEqual([mistake])
    expect(createLearningSession(missed.progress, apple).syntaxMistakes).toEqual(
      [mistake],
    )
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
    expect(transfer.needsTransfer).toBe(false)
    expect(transfer.progress.pendingTransferFamily).toBeNull()
    expect(transfer.progress.recentProblemIds).toContain("heading-apple")
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
    expect(restored.needsTransfer).toBe(false)
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
