import type { useLearningSession } from "../session/useLearningSession"
import { AnswerPanel } from "./AnswerPanel"
import { ExerciseTopBar } from "./ExerciseTopBar"
import { GoalPanel } from "./GoalPanel"
import { VerdictNotice } from "./VerdictNotice"

type EditorialDeskProps = ReturnType<typeof useLearningSession>

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
}: EditorialDeskProps) {
  const runLength = session.runProblemIds.length || 1
  const problemPosition = Math.min(session.runStepIndex + 1, runLength)

  return (
    <main className="app-shell app-shell--practice">
      <ExerciseTopBar
        canCheck={canCheck}
        entryId={session.entryId!}
        evaluation={session.evaluation}
        hadFailure={session.hadFailure}
        hintOpen={session.coach === "hint"}
        onCheck={check}
        onExit={changeLevel}
        onNext={next}
        onToggleHint={session.coach === "hint" ? closeCoach : requestHint}
        onTryAnother={tryAnother}
        phase={session.phase}
        problemPosition={problemPosition}
        runLength={runLength}
      />

      {session.phase === "complete" ? (
        <section className="completion" aria-labelledby="completion-title">
          <h2 id="completion-title">Practice complete.</h2>
          <p>
            You completed every step in this run. Keep practicing or choose a
            different level.
          </p>
          <div className="completion__actions">
            <button
              autoFocus
              className="primary-button"
              onClick={practiceAgain}
              type="button"
            >
              Practice again
            </button>
            <button className="text-button" onClick={startOver} type="button">
              Start over
            </button>
            <button className="text-button" onClick={changeLevel} type="button">
              Change level
            </button>
          </div>
        </section>
      ) : (
        <>
          <article className="cbt-workspace">
            <GoalPanel
              coach={session.coach}
              evaluation={session.evaluation}
              hintLevel={session.hintLevel}
              onNextHint={requestHint}
              problem={problem}
            />
            <AnswerPanel
              draft={session.draft}
              entryId={session.entryId!}
              evaluation={session.evaluation}
              onChange={edit}
              onCheck={check}
              problem={problem}
            />
          </article>
          <VerdictNotice evaluation={session.evaluation} />
        </>
      )}
    </main>
  )
}
