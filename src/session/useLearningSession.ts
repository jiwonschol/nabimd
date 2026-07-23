import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react"
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
  type PracticeHistorySnapshot,
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
      startRun(entryId, session.runNumber)
    },
    [session.runNumber, startRun],
  )

  const practiceAgain = useCallback(() => {
    if (!session.entryId) return
    startRun(session.entryId, session.runNumber + 1)
  }, [session.entryId, session.runNumber, startRun])

  const changeLevel = useCallback(() => {
    dispatch({
      type: "returned-to-greeting",
      problem: problemBank[0],
    })
  }, [])

  const returnToGreetingFromHistory = useCallback(() => {
    dispatch({
      type: "returned-to-greeting",
      problem: problemBank[0],
    })
  }, [])

  // Every visited run step keeps its last-known snapshot so the in-app
  // previous/next controls can restore it exactly like a browser Back. The
  // snapshots live in a ref (handlers only); the visited indexes mirror into
  // state so the render-time button flags never read a mutable ref.
  const stepSnapshotsRef = useRef(
    new Map<number, PracticeHistorySnapshot>(),
  )
  const [visitedStepIndexes, setVisitedStepIndexes] = useState<
    ReadonlySet<number>
  >(() => new Set())

  useEffect(() => {
    stepSnapshotsRef.current = new Map()
    setVisitedStepIndexes(new Set())
  }, [session.entryId, session.runNumber])

  useEffect(() => {
    if (!session.entryId) return
    // The completion state (runStepIndex === length) is recorded too, matching
    // the history entry App.tsx pushes for it. Without it, revisiting a repair
    // spliced after the last scheduled exercise has no forward snapshot to
    // prove completion, so owesRepair would misread it as still owed and trap
    // the learner on the step.
    if (session.runStepIndex > session.runProblemIds.length) return
    const snapshots = stepSnapshotsRef.current
    snapshots.set(session.runStepIndex, {
      entryId: session.entryId,
      runNumber: session.runNumber,
      runProblemIds: [...session.runProblemIds],
      runStepIndex: session.runStepIndex,
      scheduledStepIndex: session.scheduledStepIndex,
      currentProblemId: session.currentProblemId,
      currentIsTransfer: session.currentIsTransfer,
      runStartedAtMs: session.runStartedAtMs,
    })
    // A schedule change (Try another, repair splice) makes snapshots recorded
    // beyond this step describe an abandoned branch; restoring one would undo
    // the replacement. Drop them.
    const scheduleKey = session.runProblemIds.join(" ")
    for (const [index, snapshot] of snapshots) {
      if (
        index > session.runStepIndex &&
        snapshot.runProblemIds.join(" ") !== scheduleKey
      ) {
        snapshots.delete(index)
      }
    }
    setVisitedStepIndexes((previous) => {
      const unchanged =
        previous.size === snapshots.size &&
        [...snapshots.keys()].every((index) => previous.has(index))
      return unchanged ? previous : new Set(snapshots.keys())
    })
  }, [session])

  // In-app step moves rewrite the current history entry instead of appending
  // one, so the browser Back button keeps walking real steps afterwards.
  const replaceHistoryOnNextPushRef = useRef(false)

  const consumeHistoryReplaceHint = useCallback(() => {
    const shouldReplace = replaceHistoryOnNextPushRef.current
    replaceHistoryOnNextPushRef.current = false
    return shouldReplace
  }, [])

  const goToStep = useCallback((stepIndex: number) => {
    const snapshot = stepSnapshotsRef.current.get(stepIndex)
    if (!snapshot || snapshot.entryId === null) return
    replaceHistoryOnNextPushRef.current = true
    dispatch({
      type: "history-navigated",
      snapshot,
      problem: getProblem(snapshot.currentProblemId),
    })
  }, [])

  // While a repair is owed — a failed Check awaiting its transfer exercise,
  // or the scheduled repair step itself still unfinished — leaving the step
  // would silently drop it: older snapshots carry the pre-splice schedule, so
  // restoring one rewinds the run and the pruning above then discards the
  // repair step. Step navigation (in-app Prev/Next and browser Back, which
  // both restore practice snapshots) locks until the repair is completed. A
  // forward snapshot on the CURRENT schedule proves this step was already
  // advanced past, which distinguishes an unfinished repair step from a
  // completed one being revisited. The handlers read the snapshot ref and
  // compare schedule keys so the lock holds even in the frame before the
  // pruning effect drops stale forward snapshots.
  const owesRepair = useCallback(() => {
    if (session.needsTransfer) return true
    if (!session.currentIsTransfer) return false
    const forward = stepSnapshotsRef.current.get(session.runStepIndex + 1)
    return (
      forward === undefined ||
      forward.runProblemIds.join(" ") !== session.runProblemIds.join(" ")
    )
  }, [
    session.currentIsTransfer,
    session.needsTransfer,
    session.runProblemIds,
    session.runStepIndex,
  ])

  // The popstate subscription in App.tsx keys on navigateToHistory's
  // identity, and re-running that effect re-stamps the current history entry
  // as a landing state. The guard therefore reaches owesRepair through a ref
  // so navigateToHistory stays referentially stable across session changes.
  const owesRepairRef = useRef(owesRepair)
  useLayoutEffect(() => {
    owesRepairRef.current = owesRepair
  }, [owesRepair])

  // Restores a snapshot popped from browser history. Abandoning the run for
  // the landing page stays allowed (that pops a landing entry, handled by
  // returnToGreetingFromHistory); only practice-snapshot restores are locked
  // while a repair is owed, mirroring the in-app Prev/Next lock. Returns
  // whether the snapshot was restored: a rejected pop leaves the browser
  // pointer on the older entry, and a later pushState from there would
  // truncate the entries ahead — including the repair step's own entry — so
  // the caller must walk the pointer forward again.
  const navigateToHistory = useCallback(
    (snapshot: PracticeHistorySnapshot): boolean => {
      if (snapshot.entryId === null) return false
      if (owesRepairRef.current()) return false
      // History entries survive deploys; a snapshot may reference problems
      // that a newer bank no longer serves. Ignore it instead of crashing.
      if (!validProblemIds.has(snapshot.currentProblemId)) return false
      if (!snapshot.runProblemIds.every((id) => validProblemIds.has(id))) {
        return false
      }
      const problem = getProblem(snapshot.currentProblemId)
      dispatch({ type: "history-navigated", snapshot, problem })
      return true
    },
    [],
  )

  const goToPreviousStep = useCallback(() => {
    if (owesRepair()) return
    goToStep(session.runStepIndex - 1)
  }, [goToStep, owesRepair, session.runStepIndex])

  const goToNextStep = useCallback(() => {
    if (owesRepair()) return
    goToStep(session.runStepIndex + 1)
  }, [goToStep, owesRepair, session.runStepIndex])

  // The render-time flag mirrors the same rule through visitedStepIndexes
  // (state, never the mutable ref); the pruning effect keeps only
  // current-schedule snapshots ahead of the cursor, so a surviving forward
  // index means the repair step was completed.
  const stepNavigationUnlocked =
    session.entryId !== null &&
    session.phase !== "complete" &&
    !session.needsTransfer &&
    (!session.currentIsTransfer ||
      visitedStepIndexes.has(session.runStepIndex + 1))

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

  const check = useCallback((draftOverride?: string) => {
    const candidate = draftOverride ?? session.draft
    if (draftOverride !== undefined && draftOverride !== session.draft) {
      dispatch({ type: "edited", value: draftOverride })
    }
    dispatch({
      type: "checked",
      evaluation: evaluateProblem(problem, candidate),
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
    canGoToPreviousStep:
      stepNavigationUnlocked &&
      visitedStepIndexes.has(session.runStepIndex - 1),
    canGoToNextStep:
      stepNavigationUnlocked &&
      visitedStepIndexes.has(session.runStepIndex + 1),
    start,
    practiceAgain,
    changeLevel,
    returnToGreetingFromHistory,
    navigateToHistory,
    tryAnother,
    edit,
    check,
    requestHint,
    closeCoach,
    next,
    goToPreviousStep,
    goToNextStep,
    consumeHistoryReplaceHint,
  }
}
