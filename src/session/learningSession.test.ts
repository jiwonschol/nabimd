import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import type { Problem } from "../content/types"
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

function newSession(problem: Problem = apple): LearningSession {
  return createLearningSession(
    createDefaultProgress(problem.id),
    problem,
  )
}

function editAndCheck(
  session: LearningSession,
  problem: Problem,
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
      nextProblemId: "heading-rainy-day",
      nextDraft: "",
    })

    expect(advanced.phase).toBe("editing")
    expect(advanced.currentProblemId).toBe("heading-rainy-day")
    expect(advanced.currentIsTransfer).toBe(false)
    expect(advanced.progress.completedProblemIds).toContain("heading-apple")
  })

  it("restores a completed problem as complete", () => {
    const passed = editAndCheck(newSession(), apple, "# Apple")
    const complete = learningSessionReducer(passed, { type: "next" })

    const restored = createLearningSession(complete.progress, apple)

    expect(restored.phase).toBe("complete")
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
    expect(learningSessionReducer(passed, { type: "next" }).phase).toBe(
      "complete",
    )
  })

  it("blocks Next after Fail and routes a repaired answer to transfer", () => {
    const failed = editAndCheck(newSession(), apple, "#Apple")

    expect(failed.evaluation?.status).toBe("fail")
    expect(failed.needsTransfer).toBe(true)
    expect(canAdvance(failed)).toBe(false)
    expect(learningSessionReducer(failed, { type: "next" })).toBe(failed)

    const repaired = editAndCheck(failed, apple, "# Apple")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      nextProblemId: "heading-rainy-day",
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
      nextProblemId: "heading-study-tools",
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
      nextProblemId: "heading-rainy-day",
      nextDraft: "",
    })
    const transferFailed = editAndCheck(transfer, rainyDay, "#Rainy day")
    const transferRepaired = editAndCheck(
      transferFailed,
      rainyDay,
      "# Rainy day",
    )

    const complete = learningSessionReducer(transferRepaired, {
      type: "next",
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
})
