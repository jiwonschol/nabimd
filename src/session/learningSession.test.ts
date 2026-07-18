import { describe, expect, it } from "vitest"
import { getHeadingProblem } from "../content/headingProblems"
import { evaluateProblem } from "../engine/evaluateProblem"
import { createDefaultProgress } from "../progress/progressStore"
import {
  canAdvance,
  createLearningSession,
  learningSessionReducer,
} from "./learningSession"
import type { LearningSession } from "./learningSession"

const projectNotes = getHeadingProblem("heading-project-notes")

function newSession(): LearningSession {
  return createLearningSession(
    createDefaultProgress(projectNotes.id),
    projectNotes,
  )
}

function editAndCheck(
  session: LearningSession,
  source: string,
): LearningSession {
  const edited = learningSessionReducer(session, {
    type: "edited",
    value: source,
  })

  return learningSessionReducer(edited, {
    type: "checked",
    evaluation: evaluateProblem(projectNotes, source),
    retryFamily: projectNotes.retryFamily,
  })
}

describe("learningSessionReducer", () => {
  it("completes after a first-attempt Perfect pass", () => {
    const passed = editAndCheck(newSession(), "# Project notes")

    expect(passed.evaluation?.status).toBe("perfect")
    expect(canAdvance(passed)).toBe(true)

    const complete = learningSessionReducer(passed, { type: "next" })

    expect(complete.phase).toBe("complete")
    expect(complete.progress.completedProblemIds).toContain(
      "heading-project-notes",
    )
  })

  it("completes after a first-attempt Matched pass without requiring Review", () => {
    const passed = editAndCheck(
      newSession(),
      "# Project notes\n\n# Details",
    )

    expect(passed.evaluation?.status).toBe("matched")
    expect(passed.coach).toBe("closed")
    expect(canAdvance(passed)).toBe(true)
    expect(
      learningSessionReducer(passed, { type: "next" }).phase,
    ).toBe("complete")
  })

  it("blocks Next after Fail and routes a repaired answer to transfer", () => {
    const failed = editAndCheck(newSession(), "#Project notes")

    expect(failed.evaluation?.status).toBe("fail")
    expect(canAdvance(failed)).toBe(false)
    expect(learningSessionReducer(failed, { type: "next" })).toBe(failed)

    const repaired = editAndCheck(failed, "# Project notes")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      transferProblemId: "heading-weekend-guide",
      transferDraft: "Weekend guide",
    })

    expect(transfer.phase).toBe("editing")
    expect(transfer.currentProblemId).toBe("heading-weekend-guide")
    expect(transfer.draft).toBe("Weekend guide")
    expect(transfer.currentIsTransfer).toBe(true)
    expect(transfer.hadFailure).toBe(false)
    expect(transfer.progress.recentProblemIds).toContain(
      "heading-project-notes",
    )
  })

  it("completes after repairing a failed transfer without another transfer", () => {
    const failed = editAndCheck(newSession(), "#Project notes")
    const repaired = editAndCheck(failed, "# Project notes")
    const transfer = learningSessionReducer(repaired, {
      type: "next",
      transferProblemId: "heading-weekend-guide",
      transferDraft: "Weekend guide",
    })
    const transferProblem = getHeadingProblem("heading-weekend-guide")
    const transferFailed = learningSessionReducer(
      learningSessionReducer(transfer, {
        type: "edited",
        value: "#Weekend guide",
      }),
      {
        type: "checked",
        evaluation: evaluateProblem(transferProblem, "#Weekend guide"),
        retryFamily: transferProblem.retryFamily,
      },
    )
    const transferRepaired = learningSessionReducer(
      learningSessionReducer(transferFailed, {
        type: "edited",
        value: "# Weekend guide",
      }),
      {
        type: "checked",
        evaluation: evaluateProblem(transferProblem, "# Weekend guide"),
        retryFamily: transferProblem.retryFamily,
      },
    )

    const complete = learningSessionReducer(transferRepaired, {
      type: "next",
    })

    expect(complete.phase).toBe("complete")
    expect(complete.progress.pendingTransferFamily).toBeNull()
    expect(complete.currentIsTransfer).toBe(false)
  })

  it("keeps failure memory when the learner edits after repairing", () => {
    const failed = editAndCheck(newSession(), "#Project notes")
    const repaired = editAndCheck(failed, "# Project notes")
    const editedAgain = learningSessionReducer(repaired, {
      type: "edited",
      value: "# Project notes ",
    })

    expect(editedAgain.phase).toBe("editing")
    expect(editedAgain.evaluation).toBeNull()
    expect(editedAgain.hadFailure).toBe(true)
    expect(editedAgain.progress.pendingTransferFamily).toBe("heading-h1")
  })

  it("reveals progressive hints only after Fail", () => {
    const initial = newSession()
    expect(
      learningSessionReducer(initial, { type: "hint-requested" }),
    ).toBe(initial)

    const failed = editAndCheck(initial, "#Project notes")
    let hinted = failed
    for (let attempt = 0; attempt < 4; attempt += 1) {
      hinted = learningSessionReducer(hinted, {
        type: "hint-requested",
      })
    }

    expect(hinted.coach).toBe("hint")
    expect(hinted.hintLevel).toBe(3)
  })

  it("opens Review only for Matched", () => {
    const perfect = editAndCheck(newSession(), "# Project notes")
    expect(
      learningSessionReducer(perfect, { type: "review-requested" }),
    ).toBe(perfect)

    const matched = editAndCheck(
      newSession(),
      "# Project notes\n\n# Details",
    )
    const reviewing = learningSessionReducer(matched, {
      type: "review-requested",
    })

    expect(reviewing.coach).toBe("review")
    expect(canAdvance(reviewing)).toBe(true)
  })
})
