import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { EditorialDesk } from "./components/EditorialDesk"
import { OpenBookLanding } from "./components/OpenBookLanding"
import type { EntryId } from "./content/entryChoices"
import { useLearningSession } from "./session/useLearningSession"
import type { PracticeHistorySnapshot } from "./session/learningSession"
import { playPageTurnSound } from "./sound/pageTurnSound"

export const PAGE_TURN_DURATION_MS = 720
export const REDUCED_PAGE_TURN_DURATION_MS = 120

const HISTORY_MARKER = "nabimd-practice-v1"

type LearningSessionController = ReturnType<typeof useLearningSession>

type AppHistoryState =
  | { marker: typeof HISTORY_MARKER; view: "landing" }
  | {
      marker: typeof HISTORY_MARKER
      view: "practice"
      snapshot: PracticeHistorySnapshot
    }

function isAppHistoryState(value: unknown): value is AppHistoryState {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Partial<AppHistoryState>
  if (candidate.marker !== HISTORY_MARKER) return false
  if (candidate.view === "landing") return true
  return candidate.view === "practice" && candidate.snapshot !== undefined
}

function sameHistoryLocation(
  left: unknown,
  right: AppHistoryState,
): boolean {
  if (!isAppHistoryState(left) || left.view !== right.view) return false
  if (left.view === "landing" || right.view === "landing") return true
  return (
    left.snapshot.entryId === right.snapshot.entryId &&
    left.snapshot.runNumber === right.snapshot.runNumber &&
    left.snapshot.runStepIndex === right.snapshot.runStepIndex &&
    left.snapshot.currentProblemId === right.snapshot.currentProblemId
  )
}

export function getPageTurnDuration() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return PAGE_TURN_DURATION_MS
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? REDUCED_PAGE_TURN_DURATION_MS
    : PAGE_TURN_DURATION_MS
}

export function App() {
  const learningSession = useLearningSession()
  const [turningEntryId, setTurningEntryId] = useState<EntryId | null>(null)
  const [summarySnapshot, setSummarySnapshot] =
    useState<LearningSessionController | null>(null)
  const turningEntryRef = useRef<EntryId | null>(null)
  const sessionRef = useRef(learningSession.session)

  useLayoutEffect(() => {
    sessionRef.current = learningSession.session
  }, [learningSession.session])

  useEffect(() => {
    const landingState: AppHistoryState = {
      marker: HISTORY_MARKER,
      view: "landing",
    }
    window.history.replaceState(landingState, "")

    const handlePopState = (event: PopStateEvent) => {
      if (!isAppHistoryState(event.state)) return
      if (event.state.view === "landing") {
        learningSession.returnToGreetingFromHistory()
        return
      }
      const current = sessionRef.current
      if (
        current.entryId === event.state.snapshot.entryId &&
        current.runNumber === event.state.snapshot.runNumber &&
        current.runStepIndex === event.state.snapshot.runStepIndex &&
        current.currentProblemId === event.state.snapshot.currentProblemId
      ) {
        return
      }
      learningSession.navigateToHistory(event.state.snapshot)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [
    learningSession.navigateToHistory,
    learningSession.returnToGreetingFromHistory,
  ])

  useEffect(() => {
    const historyState: AppHistoryState = learningSession.session.entryId
      ? {
          marker: HISTORY_MARKER,
          view: "practice",
          snapshot: {
            entryId: learningSession.session.entryId,
            runNumber: learningSession.session.runNumber,
            runProblemIds: [...learningSession.session.runProblemIds],
            runStepIndex: learningSession.session.runStepIndex,
            scheduledStepIndex: learningSession.session.scheduledStepIndex,
            currentProblemId: learningSession.session.currentProblemId,
            currentIsTransfer: learningSession.session.currentIsTransfer,
            runStartedAtMs: learningSession.session.runStartedAtMs,
          },
        }
      : { marker: HISTORY_MARKER, view: "landing" }

    if (!sameHistoryLocation(window.history.state, historyState)) {
      window.history.pushState(historyState, "")
    }
  }, [
    learningSession.session.currentIsTransfer,
    learningSession.session.currentProblemId,
    learningSession.session.entryId,
    learningSession.session.runNumber,
    learningSession.session.runProblemIds,
    learningSession.session.runStartedAtMs,
    learningSession.session.runStepIndex,
    learningSession.session.scheduledStepIndex,
  ])

  const chooseLevel = useCallback(
    (entryId: EntryId) => {
      if (turningEntryRef.current) return

      turningEntryRef.current = entryId
      setTurningEntryId(entryId)
      playPageTurnSound()
      learningSession.start(entryId)
    },
    [learningSession.start],
  )

  useEffect(() => {
    if (!turningEntryId || !learningSession.session.entryId) return

    const timer = window.setTimeout(() => {
      turningEntryRef.current = null
      setTurningEntryId(null)
    }, getPageTurnDuration())

    return () => window.clearTimeout(timer)
  }, [learningSession.session.entryId, turningEntryId])

  useEffect(() => {
    if (learningSession.session.entryId) return
    turningEntryRef.current = null
    setTurningEntryId(null)
    setSummarySnapshot(null)
  }, [learningSession.session.entryId])

  useEffect(() => {
    if (!summarySnapshot) return
    if (learningSession.session.phase !== "complete") {
      setSummarySnapshot(null)
      return
    }

    const timer = window.setTimeout(
      () => setSummarySnapshot(null),
      getPageTurnDuration(),
    )
    return () => window.clearTimeout(timer)
  }, [learningSession.session.phase, summarySnapshot])

  useEffect(() => {
    if (
      turningEntryId ||
      summarySnapshot ||
      !learningSession.session.entryId
    ) {
      return
    }
    document
      .querySelector<HTMLElement>(".guided-syntax-card__input")
      ?.focus()
  }, [learningSession.session.entryId, summarySnapshot, turningEntryId])

  const advance = useCallback(() => {
    const { session } = learningSession
    const willComplete =
      learningSession.canNext &&
      !(session.needsTransfer && !session.currentIsTransfer) &&
      !session.runProblemIds[session.runStepIndex + 1]

    if (willComplete) {
      turningEntryRef.current = null
      setTurningEntryId(null)
      setSummarySnapshot(learningSession)
    }
    learningSession.next()
  }, [learningSession])

  if (!learningSession.session.entryId) {
    return <OpenBookLanding onChoose={chooseLevel} turningEntryId={null} />
  }

  const turning = turningEntryId !== null
  const summaryTurning = summarySnapshot !== null

  return (
    <div className={`page-turn-stage${turning ? " page-turn-stage--active" : ""}`}>
      <div
        className="page-turn-receiver"
        data-testid="page-turn-receiver"
        inert={turning || undefined}
      >
        <EditorialDesk
          {...learningSession}
          next={advance}
          summaryMotionReady={!summaryTurning}
        />
      </div>
      {turning ? (
        <div className="page-turn-overlay">
          <OpenBookLanding
            onChoose={chooseLevel}
            turningEntryId={turningEntryId}
          />
        </div>
      ) : null}
      {summarySnapshot ? (
        <div
          aria-hidden="true"
          className="summary-page-turn-overlay"
          data-testid="summary-page-turn-transition"
          inert
        >
          <EditorialDesk {...summarySnapshot} transitionSnapshot />
        </div>
      ) : null}
    </div>
  )
}
