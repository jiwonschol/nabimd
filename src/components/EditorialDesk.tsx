import type { useLearningSession } from "../session/useLearningSession"
import {
  createRunProblemIds,
  getEntryChoice,
} from "../content/entryChoices"
import type { RankingClient } from "../ranking/rankingClient"
import { AnswerPanel } from "./AnswerPanel"
import { getElapsedMs } from "./ElapsedTime"
import { ExerciseTopBar } from "./ExerciseTopBar"
import { GoalPanel } from "./GoalPanel"
import { RunSummary } from "./RunSummary"
import { VerdictNotice } from "./VerdictNotice"

type EditorialDeskProps = ReturnType<typeof useLearningSession> & {
  rankingClient: RankingClient
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
  startOver,
  changeLevel,
  tryAnother,
  rankingClient,
}: EditorialDeskProps) {
  const runLength = session.runProblemIds.length || 1
  const problemPosition = Math.min(session.runStepIndex + 1, runLength)
  const entry = getEntryChoice(session.entryId!)
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
        canCheck={canCheck}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        currentIsTransfer={session.currentIsTransfer}
        onCheck={check}
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
          level={entry.level}
          levelLabel={entry.label}
          onChangeLevel={changeLevel}
          onPracticeAgain={practiceAgain}
          onStartOver={startOver}
          rankingClient={rankingClient}
          score={score}
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
              onCheck={check}
              onCloseHint={closeCoach}
              onNextHint={requestHint}
              onRequestHint={requestHint}
              problem={problem}
            />
          </article>
          <VerdictNotice evaluation={session.evaluation} />
        </>
      )}
    </main>
  )
}
