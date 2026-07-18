import type { useLearningSession } from "../session/useLearningSession"
import { HelpPanel } from "./HelpPanel"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"
import { RenderedDocument } from "./RenderedDocument"
import { StatusBar } from "./StatusBar"
import { Wordmark } from "./Wordmark"

type EditorialDeskProps = ReturnType<typeof useLearningSession>

export function EditorialDesk({
  session,
  problem,
  canCheck,
  edit,
  check,
  requestHint,
  requestReview,
  closeCoach,
  next,
  practiceAgain,
  startOver,
  changeLevel,
}: EditorialDeskProps) {
  const runLength = session.runProblemIds.length || 1
  const problemPosition = Math.min(session.runStepIndex + 1, runLength)

  return (
    <main className="app-shell">
      <header className="app-header">
        <Wordmark />
        <div aria-label="Heading progress" className="progress">
          <span className="progress__label">
            <span className="progress__label-name">Headings · </span>
            {problemPosition} of {runLength}
          </span>
          <span aria-hidden="true" className="progress__track">
            {session.runProblemIds.map((problemId, index) => (
              <span
                className={
                  index <= problemPosition - 1
                    ? "progress__segment progress__segment--active"
                    : "progress__segment"
                }
                key={`${index}-${problemId}`}
              />
            ))}
          </span>
        </div>
      </header>

      {session.phase === "complete" ? (
        <section className="completion" aria-labelledby="completion-title">
          <h2 id="completion-title">Heading practice complete.</h2>
          <p>
            You completed every step in this heading run. Keep practicing or
            choose a different entry.
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
          <article className="learning-workspace">
            <section
              aria-labelledby="exercise-instruction"
              className="instruction"
            >
              <p className="section-label">Instruction</p>
              <h2 id="exercise-instruction">{problem.prompt}</h2>
              {session.teachingMode === "introduce" ? (
                <p className="instruction__teaching">
                  {problem.teaching.concept} {problem.teaching.howTo}{" "}
                  <span>
                    Example: <code>{problem.teaching.example}</code>
                  </span>
                </p>
              ) : null}
            </section>

            <div className="lesson-grid">
              <RenderedDocument label="Goal" source={problem.target} />
              <HelpPanel
                coach={session.coach}
                evaluation={session.evaluation}
                hintLevel={session.hintLevel}
                hints={problem.hints}
                onClose={closeCoach}
                onNextHint={requestHint}
                onOpenHint={requestHint}
                syntaxTokens={problem.syntaxTokens}
              />
            </div>

            <div className="workbench-grid">
              <MarkdownSourceEditor
                key={problem.id}
                onChange={edit}
                onCheck={check}
                value={session.draft}
              />
              <RenderedDocument
                emptyMessage="Your preview will appear here."
                label="Live preview"
                source={session.draft}
              />
            </div>
          </article>

          <StatusBar
            canCheck={canCheck}
            evaluation={session.evaluation}
            hadFailure={session.hadFailure}
            onCheck={check}
            onNext={next}
            onReview={requestReview}
            phase={session.phase}
          />
        </>
      )}
    </main>
  )
}
