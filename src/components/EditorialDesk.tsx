import { headingProblems } from "../content/headingProblems"
import type { useLearningSession } from "../session/useLearningSession"
import { HelpPanel } from "./HelpPanel"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"
import { RenderedDocument } from "./RenderedDocument"
import { StatusBar } from "./StatusBar"

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
}: EditorialDeskProps) {
  const problemPosition =
    headingProblems.findIndex((candidate) => candidate.id === problem.id) + 1

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1 className="wordmark">Nabi Markdown</h1>
        <div aria-label="Heading progress" className="progress">
          <span className="progress__label">
            <span className="progress__label-name">Headings · </span>
            {problemPosition} of 3
          </span>
          <span aria-hidden="true" className="progress__track">
            {headingProblems.map((candidate, index) => (
              <span
                className={
                  index <= problemPosition - 1
                    ? "progress__segment progress__segment--active"
                    : "progress__segment"
                }
                key={candidate.id}
              />
            ))}
          </span>
        </div>
      </header>

      {session.phase === "complete" ? (
        <section className="completion" aria-labelledby="completion-title">
          <h2 id="completion-title">Heading practice complete.</h2>
          <p>
            You matched the requested syntax. The full learning path is being
            built next.
          </p>
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
