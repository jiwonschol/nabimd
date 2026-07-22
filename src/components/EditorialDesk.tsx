import type { useLearningSession } from "../session/useLearningSession"
import { createRunProblemIds } from "../content/entryChoices"
import { AnswerPanel } from "./AnswerPanel"
import { getElapsedMs } from "./ElapsedTime"
import { ExerciseTopBar } from "./ExerciseTopBar"
import { GoalPanel } from "./GoalPanel"
import { RunSummary } from "./RunSummary"
import { VerdictNotice } from "./VerdictNotice"

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

  return (
    <main className="app-shell app-shell--practice">
      <ExerciseTopBar
        autofocusActions={!transitionSnapshot}
        canCheck={canCheck}
        canGoToPreviousStep={canGoToPreviousStep}
        canGoToNextStep={canGoToNextStep}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        currentIsTransfer={session.currentIsTransfer}
        onCheck={() => check()}
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
              onCheck={() => check()}
              onCloseHint={closeCoach}
              onNextHint={requestHint}
              onRequestHint={requestHint}
              problem={problem}
              interactive={!transitionSnapshot}
            />
          </article>
          <VerdictNotice evaluation={session.evaluation} />
        </>
      )}
    </main>
  )
}
