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
export const SESSION_SEED_STORAGE_KEY = "nabimd.session-seed.v1"

function createRandomSessionSeed(): number {
  return Math.floor(Math.random() * 0x1_0000_0000)
}

function getOrCreateSessionSeed(
  storage: Storage,
  createSeed: () => number,
): number {
  try {
    const storedValue = storage.getItem(SESSION_SEED_STORAGE_KEY)
    const stored = storedValue === null ? null : Number(storedValue)
    if (stored !== null && Number.isSafeInteger(stored) && stored >= 0) {
      return stored
    }

    const seed = createSeed()
    if (!Number.isSafeInteger(seed) || seed < 0) {
      throw new Error("Session seed must be a nonnegative safe integer")
    }
    storage.setItem(SESSION_SEED_STORAGE_KEY, String(seed))
    return seed
  } catch {
    return 0
  }
}

function isSafeReplacement(leftId: string, rightId: string): boolean {
  const left = getProblem(leftId)
  const right = getProblem(rightId)
  return isEligibleTransferProblem(left, right, left.retryFamily)
}

function initializeSession({ storage, seed }: { storage: Storage; seed: number }) {
  const progress = loadProgress(
    storage,
    validProblemIds,
    isSafeReplacement,
    problemBankRevision,
    seed,
  )
  return createLearningSession(progress, getProblem(progress.currentProblemId))
}

export function useLearningSession(
  storage?: Storage,
  now: () => number = Date.now,
  createSessionSeed: () => number = createRandomSessionSeed,
) {
  const [sessionStorage] = useState(() => storage ?? resolveBrowserStorage())
  const [sessionSeed] = useState(() =>
    getOrCreateSessionSeed(sessionStorage, createSessionSeed),
  )
  const [session, dispatch] = useReducer(
    learningSessionReducer,
    { storage: sessionStorage, seed: sessionSeed },
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
    const runProblemIds = createRunProblemIds(entryId, runNumber, sessionSeed)
    const firstProblemId = runProblemIds.at(0)
    if (!firstProblemId) return
    dispatch({
      type: "started",
      atMs: now(),
      entryId,
      runNumber,
      runSeed: sessionSeed,
      runProblemIds,
      problem: getProblem(firstProblemId),
    })
  }, [now, sessionSeed])

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
    startRun(session.entryId, session.runNumber + 1)
  }, [session.entryId, session.runNumber, startRun])

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
        nextProblem: transferProblem,
        nextDraft: transferProblem.starterText,
      })
      return
    }

    const nextProblemId = session.runProblemIds[session.runStepIndex + 1]
    if (nextProblemId) {
      const nextProblem = getProblem(nextProblemId)
      dispatch({
        type: "next",
        nextProblem,
        nextDraft: nextProblem.starterText,
      })
      return
    }

    dispatch({ type: "completed", atMs: now() })
  }, [now, problem, session])

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
