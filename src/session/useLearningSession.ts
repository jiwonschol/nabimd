import { useCallback, useEffect, useReducer } from "react"
import {
  getHeadingProblem,
  headingProblems,
} from "../content/headingProblems"
import { evaluateProblem } from "../engine/evaluateProblem"
import { loadProgress, saveProgress } from "../progress/progressStore"
import { selectTransferProblem } from "../selection/selectTransferProblem"
import {
  canAdvance,
  createLearningSession,
  learningSessionReducer,
} from "./learningSession"

const validProblemIds = new Set(
  headingProblems.map((problem) => problem.id),
)

function initializeSession(storage: Storage) {
  const progress = loadProgress(storage, validProblemIds)
  return createLearningSession(
    progress,
    getHeadingProblem(progress.currentProblemId),
  )
}

export function useLearningSession(
  storage: Storage = window.localStorage,
) {
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    storage,
    initializeSession,
  )
  const problem = getHeadingProblem(session.currentProblemId)

  useEffect(() => {
    saveProgress(storage, session.progress)
  }, [session.progress, storage])

  const edit = useCallback((value: string) => {
    dispatch({ type: "edited", value })
  }, [])

  const check = useCallback(() => {
    dispatch({
      type: "checked",
      evaluation: evaluateProblem(problem, session.draft),
      retryFamily: problem.retryFamily,
    })
  }, [problem, session.draft])

  const requestHint = useCallback(() => {
    dispatch({ type: "hint-requested" })
  }, [])

  const requestReview = useCallback(() => {
    dispatch({ type: "review-requested" })
  }, [])

  const closeCoach = useCallback(() => {
    dispatch({ type: "coach-closed" })
  }, [])

  const next = useCallback(() => {
    if (!canAdvance(session)) return

    if (session.hadFailure && !session.currentIsTransfer) {
      const transferProblem = selectTransferProblem({
        problems: headingProblems,
        currentProblemId: problem.id,
        retryFamily: problem.retryFamily,
        recentProblemIds: session.progress.recentProblemIds,
      })
      const transferDraft =
        session.progress.draftByProblemId[transferProblem.id] ??
        transferProblem.starterText

      dispatch({
        type: "next",
        transferProblemId: transferProblem.id,
        transferDraft,
      })
      return
    }

    dispatch({ type: "next" })
  }, [problem, session])

  return {
    session,
    problem,
    canCheck: session.phase !== "complete",
    canNext: canAdvance(session),
    edit,
    check,
    requestHint,
    requestReview,
    closeCoach,
    next,
  }
}
