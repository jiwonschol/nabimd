import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
} from "react"
import type { useLearningSession } from "../session/useLearningSession"
import { createRunProblemIds } from "../content/entryChoices"
import { getProblem } from "../content/problemBank"
import { CardFirstPractice } from "./CardFirstPractice"
import { getElapsedMs } from "./ElapsedTime"
import { ExerciseTopBar } from "./ExerciseTopBar"
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
  canGoToPreviousStep,
  canGoToNextStep,
  edit,
  check,
  next,
  recordSlotMiss,
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
  const completedPages = useMemo(() => {
    const completedIds = new Set(session.progress.completedProblemIds)
    const seen = new Set<string>()

    return session.runProblemIds.flatMap((problemId) => {
      if (seen.has(problemId) || !completedIds.has(problemId)) return []
      seen.add(problemId)
      const completedProblem = getProblem(problemId)
      return [
        {
          problemId,
          title: completedProblem.title,
          source:
            session.progress.draftByProblemId[problemId] ??
            completedProblem.target,
        },
      ]
    })
  }, [
    session.progress.completedProblemIds,
    session.progress.draftByProblemId,
    session.runProblemIds,
  ])

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
  // or re-pressed) must not re-evaluate and restart the pending advance. The
  // typeof guard keeps DOM event objects out of the draft-override slot.
  const guardedCheck = useCallback(
    (value?: unknown) => {
      if (advancePendingRef.current) return
      check(typeof value === "string" ? value : undefined)
    },
    [check],
  )

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
    <main
      className={`app-shell app-shell--practice${
        // While practicing, the book is only as tall as the exercise
        // (issue #139). Summary keeps the full-height spread: the teacher's
        // return is a finished page, not a problem-sized card.
        session.phase === "complete" ? "" : " app-shell--practice-fit"
      }`}
      data-draft={session.draft}
      data-problem-id={problem.id}
    >
      <ExerciseTopBar
        canGoToPreviousStep={canGoToPreviousStep}
        canGoToNextStep={canGoToNextStep}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        currentIsTransfer={session.currentIsTransfer}
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
          completedPages={completedPages}
          elapsedMs={elapsedMs}
          onChangeLevel={changeLevel}
          onPracticeAgain={practiceAgain}
          score={score}
          motionReady={summaryMotionReady}
          syntaxMistakes={session.syntaxMistakes}
          total={scheduledRunLength}
        />
      ) : (
        <>
          <CardFirstPractice
            draft={session.draft}
            interactive={interactive}
            onComplete={guardedCheck}
            onGrow={edit}
            onMiss={recordSlotMiss}
            problem={problem}
            problemCompleted={session.progress.completedProblemIds.includes(
              problem.id,
            )}
            retryPending={
              session.progress.pendingSlotRetryProblemId === problem.id
            }
          />
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
