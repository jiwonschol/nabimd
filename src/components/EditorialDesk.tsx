import type { useLearningSession } from "../session/useLearningSession"
import { createRunProblemIds } from "../content/entryChoices"
import { AnswerPanel } from "./AnswerPanel"
import { getElapsedMs } from "./ElapsedTime"
import { ExerciseTopBar } from "./ExerciseTopBar"
import { GoalPanel } from "./GoalPanel"
import { GuidedSyntaxCard } from "./GuidedSyntaxCard"
import { RunSummary } from "./RunSummary"
import { VerdictNotice } from "./VerdictNotice"
import { useGuidedSyntaxPractice } from "../guided/useGuidedSyntaxPractice"

type EditorialDeskProps = ReturnType<typeof useLearningSession> & {
  summaryMotionReady?: boolean
  transitionSnapshot?: boolean
}

export function EditorialDesk({
  session,
  problem,
  canCheck,
  edit,
  check,
  requestHint,
  closeCoach,
  next,
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
  const guided = useGuidedSyntaxPractice({
    draft: session.draft,
    onChange: edit,
    onCheck: check,
    problem,
  })

  return (
    <main className="app-shell app-shell--practice">
      <ExerciseTopBar
        autofocusActions={!transitionSnapshot}
        canCheck={canCheck}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        currentIsTransfer={session.currentIsTransfer}
        onCheck={guided.checkDraft}
        onExit={changeLevel}
        onNext={next}
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
            <GoalPanel
              activeOffset={guided.checkpoint?.activeOffset}
              problem={problem}
            />
            <AnswerPanel
              coach={session.coach}
              draft={session.draft}
              entryId={session.entryId!}
              evaluation={session.evaluation}
              hintLevel={session.hintLevel}
              onChange={edit}
              onCheck={check}
              onCloseHint={closeCoach}
              onNextHint={requestHint}
              onRequestHint={requestHint}
              problem={problem}
              guided={guided}
              interactive={!transitionSnapshot}
            />
            {session.phase === "editing" && guided.checkpoint ? (
              <GuidedSyntaxCard
                attempts={guided.attempts}
                canGoBack={guided.canGoBack}
                canGoForward={guided.canGoForward}
                checkpoint={guided.checkpoint}
                current={guided.currentIndex + 1}
                hintOpen={guided.hintOpen}
                instruction={problem.prompt}
                key={problem.id}
                onBack={guided.goBack}
                onForward={guided.goForward}
                onSubmit={guided.submit}
                onToggleHint={guided.toggleHint}
                onValueChange={guided.setValue}
                total={guided.checkpoints.length}
                value={guided.value}
              />
            ) : null}
          </article>
          <VerdictNotice evaluation={session.evaluation} />
        </>
      )}
    </main>
  )
}
