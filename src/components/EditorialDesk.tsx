import type { KeyboardEvent } from "react"
import { headingProblems } from "../content/headingProblems"
import type { useLearningSession } from "../session/useLearningSession"
import { MarkdownPreview } from "./MarkdownPreview"
import { SideCoach } from "./SideCoach"
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

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      check()
    }
  }

  return (
    <main className={`app-shell app-shell--coach-${session.coach}`}>
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
          <div className="desk-layout">
            <article className="editorial-desk">
              <section
                aria-labelledby="exercise-title"
                className="instruction"
              >
                <h2 id="exercise-title">{problem.title}</h2>
                <p id="exercise-instruction">{problem.prompt}</p>
              </section>

              <MarkdownPreview
                label="Target"
                source={problem.target}
                variant="target"
              />

              <section className="source-editor">
                <label htmlFor="markdown-source">Your Markdown</label>
                <textarea
                  aria-describedby="exercise-instruction"
                  id="markdown-source"
                  onChange={(event) => edit(event.target.value)}
                  onKeyDown={handleEditorKeyDown}
                  spellCheck={false}
                  value={session.draft}
                />
              </section>

              <div className="learner-preview">
                <p className="section-label">Live preview</p>
                <MarkdownPreview
                  label="Live preview"
                  source={session.draft}
                  variant="learner"
                />
              </div>
            </article>

            <SideCoach
              coach={session.coach}
              evaluation={session.evaluation}
              hintLevel={session.hintLevel}
              hints={problem.hints}
              onClose={closeCoach}
              onNextHint={requestHint}
            />
          </div>

          <StatusBar
            canCheck={canCheck}
            evaluation={session.evaluation}
            hadFailure={session.hadFailure}
            onCheck={check}
            onHint={requestHint}
            onNext={next}
            onReview={requestReview}
            phase={session.phase}
          />
        </>
      )}
    </main>
  )
}
