import { useEffect, useMemo, useRef, useState } from "react"
import type { SyntaxMistake } from "../guided/guidedSyntax"
import { playFeedbackSound } from "../sound/feedbackSound"
import { formatElapsedTime } from "./ElapsedTime"
import { RenderedDocumentBody } from "./RenderedDocument"
import {
  buildTeachersReturn,
  type CompletedPracticePage,
} from "./teachersReturn"

export type { CompletedPracticePage } from "./teachersReturn"

type RunSummaryProps = {
  score: number
  total: number
  elapsedMs: number
  onPracticeAgain: () => void
  onChangeLevel: () => void
  completedPages?: readonly CompletedPracticePage[]
  syntaxMistakes?: readonly SyntaxMistake[]
  motionReady?: boolean
}

export function joinSyntaxTokens(tokens: readonly string[]): string {
  return tokens.join("  ")
}

/** The keycaps a note prints, with required spaces spelled out. */
function keySequence(form: string): readonly string[] {
  return [...form].map((character) => (character === " " ? "Space" : character))
}

function sentenceCase(value: string): string {
  return value ? `${value[0]!.toUpperCase()}${value.slice(1)}` : value
}

export function RunSummary({
  score,
  total,
  elapsedMs,
  onPracticeAgain,
  onChangeLevel,
  completedPages = [],
  syntaxMistakes = [],
  motionReady = true,
}: RunSummaryProps) {
  const playedSummarySound = useRef(false)
  const completionTitleRef = useRef<HTMLHeadingElement>(null)
  const workTitleRef = useRef<HTMLHeadingElement>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [quietInitialFocus, setQuietInitialFocus] = useState(true)
  const { pages, notes } = useMemo(
    () => buildTeachersReturn(completedPages, syntaxMistakes),
    [completedPages, syntaxMistakes],
  )

  useEffect(() => {
    if (playedSummarySound.current) return
    playedSummarySound.current = true
    playFeedbackSound("summary")
  }, [])

  useEffect(() => {
    ;(workTitleRef.current ?? completionTitleRef.current)?.focus({
      preventScroll: true,
    })
  }, [])

  const activePage = pages[Math.min(pageIndex, Math.max(0, pages.length - 1))]

  return (
    <section
      aria-label="Run summary"
      className={`run-summary open-book-shell${motionReady ? "" : " run-summary--waiting"}`}
      data-clean={notes.length === 0 || undefined}
    >
      <section
        aria-label="Your work"
        className="run-summary__page run-summary__page--work open-book-page"
      >
        <div className="run-summary__work">
          {activePage ? (
            <article
              aria-label={`Completed exercise ${pageIndex + 1} of ${pages.length}: ${activePage.title}`}
              className="run-summary__work-page"
            >
              <header className="run-summary__work-header">
                <div>
                  <p>Completed exercise</p>
                  <h3
                    data-quiet-focus={quietInitialFocus || undefined}
                    onBlur={() => setQuietInitialFocus(false)}
                    ref={workTitleRef}
                    tabIndex={-1}
                  >
                    {activePage.title}
                  </h3>
                </div>
                <nav aria-label="Completed exercise navigation" className="run-summary__work-navigation">
                  <button
                    aria-label="Previous completed exercise"
                    disabled={pageIndex === 0}
                    onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
                    type="button"
                  >
                    ←
                  </button>
                  <span>{pageIndex + 1} / {pages.length}</span>
                  <button
                    aria-label="Next completed exercise"
                    disabled={pageIndex === pages.length - 1}
                    onClick={() => setPageIndex((index) => Math.min(pages.length - 1, index + 1))}
                    type="button"
                  >
                    →
                  </button>
                </nav>
              </header>
              <div className="run-summary__work-compare">
                <section
                  aria-label="Rendered document"
                  className="run-summary__work-pane"
                  key={`rendered-${activePage.problemId}`}
                  tabIndex={0}
                >
                  <p className="run-summary__work-label">Rendered</p>
                  <RenderedDocumentBody
                    corrections={activePage.corrections}
                    source={activePage.source}
                  />
                </section>
                <section
                  aria-label="Markdown source"
                  className="run-summary__work-pane"
                  key={`source-${activePage.problemId}`}
                  tabIndex={0}
                >
                  <p className="run-summary__work-label">Markdown</p>
                  <pre><code>{activePage.source}</code></pre>
                </section>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="completion-title"
        className="run-summary__page run-summary__page--note open-book-page"
      >
        <div className="run-summary__note-copy">
          <h2
            className="run-summary__title summary-ink summary-ink--1"
            data-quiet-focus={quietInitialFocus || undefined}
            id="completion-title"
            onBlur={() => setQuietInitialFocus(false)}
            ref={completionTitleRef}
            tabIndex={-1}
          >
            {score === total ? "Well done." : "Good finish."}
          </h2>

          {notes.length ? (
            <ol className="run-summary__notes">
              {notes.map((note, index) => (
                <li
                  className="run-summary__note summary-ink"
                  key={note.number}
                  style={{ animationDelay: `${660 + index * 120}ms` }}
                >
                  <span
                    aria-hidden="true"
                    className="run-summary__note-number"
                  >
                    {note.number}
                  </span>
                  <div className="run-summary__note-body">
                    <p className="run-summary__note-term">
                      {/* The number is repeated in the accessible name so the
                          note still maps to its mark without colour. */}
                      <span className="visually-hidden">
                        Correction {note.number}:{" "}
                      </span>
                      {sentenceCase(note.term)} needs these marks.
                    </p>
                    <ul className="run-summary__note-forms">
                      {note.expected.map((form) => (
                        <li key={form}>
                          <span
                            aria-label={`Type ${form.replace(/ /g, " space ")}`}
                            className="run-summary__keycaps"
                          >
                            {keySequence(form).map((cap, capIndex) => (
                              <kbd key={`${cap}:${capIndex}`}>{cap}</kbd>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="run-summary__clean-page summary-ink summary-ink--2">
              A clean page — nothing to correct.
            </p>
          )}
        </div>

        <div className="run-summary__actions summary-ink summary-ink--actions">
          <button
            className="primary-button run-summary__practice-again"
            onClick={onPracticeAgain}
            type="button"
          >
            Practice again
          </button>
          <button className="text-button" onClick={onChangeLevel} type="button">
            Change level
          </button>
        </div>

        <dl className="run-summary__metrics summary-ink summary-ink--actions">
          <div aria-label="Score">
            <dt>Score</dt>
            <dd>
              {score} <small>/ {total}</small>
            </dd>
          </div>
          <div aria-label="Total time">
            <dt>Time</dt>
            <dd>{formatElapsedTime(elapsedMs)}</dd>
          </div>
        </dl>
      </section>
    </section>
  )
}
