import { useCallback, useEffect, useReducer, useState } from "react"
import {
  createRunProblemIds,
  getEntryChoice,
  type EntryId,
} from "../content/entryChoices"
import {
  getProblem,
  problemBank,
  problemBankRevision,
} from "../content/problemBank"
import { evaluateProblem } from "../engine/evaluateProblem"
import { resolveBrowserStorage } from "../progress/browserStorage"
import { loadProgress, saveProgress } from "../progress/progressStore"
import {
  isEligibleTransferProblem,
  selectTransferProblem,
} from "../selection/selectTransferProblem"
import {
  canAdvance,
  createLearningSession,
  learningSessionReducer,
} from "./learningSession"

const validProblemIds = new Set(problemBank.map((problem) => problem.id))

function isSafeReplacement(leftId: string, rightId: string): boolean {
  const left = getProblem(leftId)
  const right = getProblem(rightId)
  return isEligibleTransferProblem(left, right, left.retryFamily)
}

function initializeSession(storage: Storage) {
  const progress = loadProgress(
    storage,
    validProblemIds,
    isSafeReplacement,
    problemBankRevision,
  )
  return createLearningSession(progress, getProblem(progress.currentProblemId))
}

export function useLearningSession(storage?: Storage) {
  const [sessionStorage] = useState(() => storage ?? resolveBrowserStorage())
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    sessionStorage,
    initializeSession,
  )
  const problem = getProblem(session.currentProblemId)

  useEffect(() => {
    saveProgress(sessionStorage, session.progress)
  }, [session.progress, sessionStorage])

  const edit = useCallback((value: string) => {
    dispatch({ type: "edited", value })
  }, [])

  const startRun = useCallback((entryId: EntryId, runNumber: number) => {
    const runProblemIds = createRunProblemIds(entryId, runNumber)
    const firstProblemId = runProblemIds.at(0)
    if (!firstProblemId) return
    dispatch({
      type: "started",
      entryId,
      runNumber,
      runProblemIds,
      problem: getProblem(firstProblemId),
    })
  }, [])

  const start = useCallback(
    (entryId: EntryId) => {
      getEntryChoice(entryId)
      startRun(entryId, 0)
    },
    [startRun],
  )

  const practiceAgain = useCallback(() => {
    if (!session.entryId) return
    startRun(session.entryId, session.runNumber + 1)
  }, [session.entryId, session.runNumber, startRun])

  const startOver = useCallback(() => {
    if (!session.entryId) return
    startRun(session.entryId, 0)
  }, [session.entryId, startRun])

  const changeLevel = useCallback(() => {
    dispatch({ type: "returned-to-greeting", problem: problemBank[0] })
  }, [])

  const tryAnother = useCallback(() => {
    const excludedProblemIds = new Set([
      problem.id,
      ...session.runProblemIds,
      ...session.progress.recentProblemIds,
    ])
    const sameSkillProblems = problemBank.filter((candidate) =>
      isSafeReplacement(problem.id, candidate.id),
    )
    const replacement =
      sameSkillProblems.find(
        (candidate) => !excludedProblemIds.has(candidate.id),
      ) ?? sameSkillProblems.at(0)

    if (!replacement) return
    dispatch({ type: "problem-replaced", problem: replacement })
  }, [problem, session.progress.recentProblemIds, session.runProblemIds])

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

  const closeCoach = useCallback(() => {
    dispatch({ type: "coach-closed" })
  }, [])

  const next = useCallback(() => {
    if (!canAdvance(session)) return

    if (session.needsTransfer && !session.currentIsTransfer) {
      const transferProblem = selectTransferProblem({
        problems: problemBank,
        currentProblemId: problem.id,
        retryFamily: problem.retryFamily,
        recentProblemIds: session.progress.recentProblemIds,
      })
      dispatch({
        type: "next",
        nextProblemId: transferProblem.id,
        nextDraft: transferProblem.starterText,
      })
      return
    }

    const nextProblemId = session.runProblemIds[session.runStepIndex + 1]
    if (nextProblemId) {
      const nextProblem = getProblem(nextProblemId)
      dispatch({
        type: "next",
        nextProblemId: nextProblem.id,
        nextDraft: nextProblem.starterText,
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
    start,
    practiceAgain,
    startOver,
    changeLevel,
    tryAnother,
    edit,
    check,
    requestHint,
    closeCoach,
    next,
  }
}
