import { useCallback, useEffect, useRef, useState } from "react"
import { EditorialDesk } from "./components/EditorialDesk"
import { OpenBookLanding } from "./components/OpenBookLanding"
import type { EntryId } from "./content/entryChoices"
import { localRankingClient } from "./ranking/localRankingClient"
import type { RankingClient } from "./ranking/rankingClient"
import { useLearningSession } from "./session/useLearningSession"
import { playPageTurnSound } from "./sound/pageTurnSound"

export const PAGE_TURN_DURATION_MS = 720
export const REDUCED_PAGE_TURN_DURATION_MS = 120

export function getPageTurnDuration() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return PAGE_TURN_DURATION_MS
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? REDUCED_PAGE_TURN_DURATION_MS
    : PAGE_TURN_DURATION_MS
}

type AppProps = {
  rankingClient?: RankingClient
}

export function App({ rankingClient = localRankingClient }: AppProps = {}) {
  const learningSession = useLearningSession()
  const [turningEntryId, setTurningEntryId] = useState<EntryId | null>(null)
  const turningEntryRef = useRef<EntryId | null>(null)

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
  }, [learningSession.session.entryId])

  useEffect(() => {
    if (turningEntryId || !learningSession.session.entryId) return
    document
      .querySelector<HTMLElement>('[role="textbox"][aria-label="Your Markdown"]')
      ?.focus()
  }, [learningSession.session.entryId, turningEntryId])

  if (!learningSession.session.entryId) {
    return <OpenBookLanding onChoose={chooseLevel} turningEntryId={null} />
  }

  const turning = turningEntryId !== null

  return (
    <div className={`page-turn-stage${turning ? " page-turn-stage--active" : ""}`}>
      <div
        className="page-turn-receiver"
        data-testid="page-turn-receiver"
        inert={turning || undefined}
      >
        <EditorialDesk {...learningSession} rankingClient={rankingClient} />
      </div>
      {turning ? (
        <div className="page-turn-overlay">
          <OpenBookLanding
            onChoose={chooseLevel}
            turningEntryId={turningEntryId}
          />
        </div>
      ) : null}
    </div>
  )
}
