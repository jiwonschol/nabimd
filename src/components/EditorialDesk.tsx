import { useCallback, useEffect, useEffectEvent, useRef } from "react"
import type { useLearningSession } from "../session/useLearningSession"
import { createRunProblemIds } from "../content/entryChoices"
import { AnswerPanel } from "./AnswerPanel"
import { getElapsedMs } from "./ElapsedTime"
import { ExerciseTopBar } from "./ExerciseTopBar"
import { GoalPanel } from "./GoalPanel"
import { RunSummary } from "./RunSummary"
import { VerdictNotice } from "./VerdictNotice"
import { VERDICT_BEAT_MS } from "./verdictBeat"

type EditorialDeskProps = ReturnType<typeof useLearningSession> & {
  summaryMotionReady?: boolean
  transitionSnapshot?: boolean
}

export function EditorialDesk({
  session,
  problem,
  canCheck,
  canGoToPreviousStep,
  canGoToNextStep,
  edit,
  check,
  requestHint,
  closeCoach,
  next,
  goToPreviousStep,
  goToNextStep,
  practiceAgain,
  changeLevel,
  tryAnother,
  summaryMotionReady = true,
  transitionSnapshot = false,
}: EditorialDeskProps) {
  const interactive = !transitionSnapshot
  const runLength = session.runProblemIds.length || 1
  const problemPosition = Math.min(session.runStepIndex + 1, runLength)
  const scheduledRunLength = createRunProblemIds(
    session.entryId!,
    session.runNumber,
  ).length
  const score =
    scheduledRunLength - session.failedScheduledStepIndexes.length
  const elapsedMs = getElapsedMs(
    session.runStartedAtMs,
    session.runCompletedAtMs,
    session.runCompletedAtMs ?? Date.now(),
  )

  // Matched flows, Try again holds (issue #102): a fresh Matched verdict at
  // the frontier of the run advances by itself after the verdict beat. A
  // revisited step (a visited step exists ahead) never auto-advances, so
  // browsing back through the run stays safe.
  const advancePendingRef = useRef(false)
  const autoAdvance =
    interactive &&
    session.phase === "evaluated" &&
    session.evaluation?.status === "matched" &&
    !canGoToNextStep

  const advanceAfterBeat = useEffectEvent(() => {
    advancePendingRef.current = false
    next()
  })

  useEffect(() => {
    if (!autoAdvance) {
      advancePendingRef.current = false
      return
    }
    advancePendingRef.current = true
    const timer = window.setTimeout(advanceAfterBeat, VERDICT_BEAT_MS)
    return () => {
      advancePendingRef.current = false
      window.clearTimeout(timer)
    }
  }, [autoAdvance, session.evaluation])

  // During the beat the answer is already judged; another Check chord (held
  // or re-pressed) must not re-evaluate and restart the pending advance.
  const guardedCheck = useCallback(() => {
    if (advancePendingRef.current) return
    check()
  }, [check])

  const moveStep = useEffectEvent((direction: "previous" | "next") => {
    if (direction === "previous") goToPreviousStep()
    else goToNextStep()
  })

  // Alt+P / Alt+N step navigation works from anywhere, including the editor.
  // Matching on event.code keeps macOS Option-layer characters (π, ˜) from
  // reaching the document; the session hook's own guards decide whether the
  // move actually happens.
  useEffect(() => {
    if (!interactive || session.phase === "complete") return
    const navigateSteps = (event: KeyboardEvent) => {
      if (
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.repeat
      ) {
        return
      }
      if (event.code === "KeyP") {
        event.preventDefault()
        moveStep("previous")
        return
      }
      if (event.code === "KeyN") {
        event.preventDefault()
        moveStep("next")
      }
    }
    document.addEventListener("keydown", navigateSteps, true)
    return () => document.removeEventListener("keydown", navigateSteps, true)
  }, [interactive, session.phase])

  return (
    <main className="app-shell app-shell--practice">
      <ExerciseTopBar
        canCheck={canCheck}
        canGoToPreviousStep={canGoToPreviousStep}
        canGoToNextStep={canGoToNextStep}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        currentIsTransfer={session.currentIsTransfer}
        onCheck={guardedCheck}
        onExit={changeLevel}
        onNext={next}
        onPreviousStep={goToPreviousStep}
        onNextStep={goToNextStep}
        onTryAnother={tryAnother}
        phase={session.phase}
        problemPosition={problemPosition}
        runCompletedAtMs={session.runCompletedAtMs}
        runLength={runLength}
        runStartedAtMs={session.runStartedAtMs}
        scheduledRunLength={scheduledRunLength}
        scheduledStepIndex={session.scheduledStepIndex}
      />

      {session.phase === "complete" ? (
        <RunSummary
          elapsedMs={elapsedMs}
          failedProblemIds={session.failedProblemIds}
          onChangeLevel={changeLevel}
          onPracticeAgain={practiceAgain}
          score={score}
          motionReady={summaryMotionReady}
          total={scheduledRunLength}
        />
      ) : (
        <>
          <article className="cbt-workspace open-book-shell">
            <GoalPanel problem={problem} />
            <AnswerPanel
              coach={session.coach}
              draft={session.draft}
              entryId={session.entryId!}
              evaluation={session.evaluation}
              hintLevel={session.hintLevel}
              onChange={edit}
              onCheck={guardedCheck}
              onCloseHint={closeCoach}
              onNextHint={requestHint}
              onRequestHint={requestHint}
              problem={problem}
              interactive={interactive}
            />
          </article>
          <VerdictNotice
            draft={session.draft}
            evaluation={session.evaluation}
            phase={session.phase}
            problem={problem}
          />
        </>
      )}
    </main>
  )
}
