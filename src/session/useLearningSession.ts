import { useCallback, useEffect, useReducer, useState } from "react"
import {
  getHeadingProblem,
  headingProblems,
} from "../content/headingProblems"
import { evaluateProblem } from "../engine/evaluateProblem"
import { resolveBrowserStorage } from "../progress/browserStorage"
import { loadProgress, saveProgress } from "../progress/progressStore"
import { selectTransferProblem } from "../selection/selectTransferProblem"
import {
  createRunProblemIds,
  getEntryChoice,
  type EntryId,
} from "../content/entryChoices"
import {
  canAdvance,
  createLearningSession,
  learningSessionReducer,
} from "./learningSession"

const validProblemIds = new Set(
  headingProblems.map((problem) => problem.id),
)

const problemIdsByRetryFamily = new Map<string, Set<string>>()
for (const problem of headingProblems) {
  const familyProblemIds =
    problemIdsByRetryFamily.get(problem.retryFamily) ?? new Set<string>()
  familyProblemIds.add(problem.id)
  problemIdsByRetryFamily.set(problem.retryFamily, familyProblemIds)
}
const replacementProblemIdsByProblemId = new Map(
  headingProblems.map((problem) => [
    problem.id,
    problemIdsByRetryFamily.get(problem.retryFamily) ?? new Set<string>(),
  ]),
)

function initializeSession(storage: Storage) {
  const progress = loadProgress(
    storage,
    validProblemIds,
    replacementProblemIdsByProblemId,
  )
  return createLearningSession(
    progress,
    getHeadingProblem(progress.currentProblemId),
  )
}

export function useLearningSession(storage?: Storage) {
  const [sessionStorage] = useState(
    () => storage ?? resolveBrowserStorage(),
  )
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    sessionStorage,
    initializeSession,
  )
  const problem = getHeadingProblem(session.currentProblemId)

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
      problem: getHeadingProblem(firstProblemId),
    })
  }, [])

  const start = useCallback((entryId: EntryId) => {
    getEntryChoice(entryId)
    startRun(entryId, 0)
  }, [startRun])

  const practiceAgain = useCallback(() => {
    if (!session.entryId) return
    startRun(session.entryId, session.runNumber + 1)
  }, [session.entryId, session.runNumber, startRun])

  const startOver = useCallback(() => {
    if (!session.entryId) return
    startRun(session.entryId, 0)
  }, [session.entryId, startRun])

  const changeLevel = useCallback(() => {
    dispatch({
      type: "returned-to-greeting",
      problem: headingProblems[0],
    })
  }, [])

  const tryAnother = useCallback(() => {
    const excludedProblemIds = new Set([
      problem.id,
      ...session.runProblemIds,
      ...session.progress.recentProblemIds,
    ])
    const sameSkillProblems = headingProblems.filter(
      (candidate) => candidate.retryFamily === problem.retryFamily,
    )
    const replacement =
      sameSkillProblems.find(
        (candidate) => !excludedProblemIds.has(candidate.id),
      ) ?? sameSkillProblems.find((candidate) => candidate.id !== problem.id)

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
        problems: headingProblems,
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
      const nextProblem = getHeadingProblem(nextProblemId)
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
