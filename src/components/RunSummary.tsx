import { useEffect, useMemo, useRef } from "react"
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
    completionTitleRef.current?.focus({ preventScroll: true })
  }, [])

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
          {pages.map((page) => (
            <article
              aria-label={page.title}
              className="run-summary__work-page"
              key={page.problemId}
            >
              <RenderedDocumentBody
                corrections={page.corrections}
                source={page.source}
              />
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="completion-title"
        className="run-summary__page run-summary__page--note open-book-page"
      >
        <div className="run-summary__note-copy">
          <h2
            className="run-summary__title summary-ink summary-ink--1"
            id="completion-title"
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
