import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { getProblem, problemBank } from "../content/problemBank"
import { playFeedbackSound } from "../sound/feedbackSound"
import { formatElapsedTime } from "./ElapsedTime"
import { RenderedDocumentBody } from "./RenderedDocument"

export type CompletedPracticePage = {
  problemId: string
  title: string
  source: string
}

type RunSummaryProps = {
  score: number
  total: number
  elapsedMs: number
  failedProblemIds: readonly string[]
  onPracticeAgain: () => void
  onChangeLevel: () => void
  completedPages?: readonly CompletedPracticePage[]
  motionReady?: boolean
}

const SUMMARY_REVIEW_LIMIT = 3
const SUMMARY_EXAMPLE_MAX_LINES = 12
const SUMMARY_EXAMPLE_MAX_LENGTH = 160
const FAMILY_LABELS: Readonly<Record<string, string>> = {
  "level-2-rebuild-quick-note": "Quick notes",
  "level-2-rebuild-quote-card": "Quote cards",
  "level-2-rebuild-short-process": "Short processes",
  "level3-readable-document": "Readable documents",
  "level-4-workplace-handoff": "Handoff notes",
  "level-4-workplace-decision": "Decision notes",
  "level-4-workplace-checklist": "Checklists",
  "level-4-workplace-status": "Status notes",
}

function completionTitle(score: number, total: number): string {
  return score === total ? "Well done." : "Good finish."
}

function strengthStatement(score: number, total: number): string {
  if (score === total) {
    return "You kept every Markdown pattern intact."
  }

  if (score === total - 1) {
    return `You kept ${score} of ${total} patterns intact on the first try.`
  }

  return `You finished every exercise and repaired ${total - score} patterns along the way.`
}

function syntaxFamilyLabel(family: string): string {
  const exactLabel = FAMILY_LABELS[family]
  if (exactLabel) return exactLabel

  if (family.includes("blockquote")) return "Block quotes"
  if (family.includes("heading")) return "Headings"
  if (
    family.endsWith("unordered-list") ||
    family.endsWith("unordered-list-recall")
  ) {
    return "Lists"
  }
  if (
    family.endsWith("ordered-list") ||
    family.endsWith("ordered-list-recall")
  ) {
    return "Numbered steps"
  }
  if (family.includes("inline-code")) return "Inline code"
  if (family.includes("code-block") || family.includes("fenced-code")) {
    return "Code blocks"
  }
  if (family.includes("italic")) return "Italics"
  if (family.includes("bold") || family.includes("emphasis")) return "Bold"
  if (family.includes("link")) return "Links"
  if (family.includes("thematic-break")) return "Section breaks"

  return family
    .replace(/^level-?\d+-/, "")
    .replace(/-(document|spec|work-order)$/, "")
    .split("-")
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ")
}

export function joinSyntaxTokens(tokens: readonly string[]): string {
  return tokens.join("  ")
}

function isShortAuthoredExample(problem: ReturnType<typeof getProblem>): boolean {
  const authored = problem.teaching.example.trim()
  return (
    authored.length <= SUMMARY_EXAMPLE_MAX_LENGTH &&
    authored.split("\n").length <= SUMMARY_EXAMPLE_MAX_LINES
  )
}

function compactSyntaxExample(problem: ReturnType<typeof getProblem>): string {
  const family = problemBank.filter(
    (candidate) => candidate.retryFamily === problem.retryFamily,
  )

  if (problem.level >= 4) {
    return joinSyntaxTokens([
      ...new Set(family.flatMap((candidate) => candidate.syntaxTokens)),
    ])
  }

  const tokenShapes = new Set(
    family.map((candidate) => JSON.stringify(candidate.syntaxTokens)),
  )

  if (tokenShapes.size > 1 && isShortAuthoredExample(problem)) {
    return problem.teaching.example.trim()
  }

  const representative = family
    .filter(isShortAuthoredExample)
    .sort(
      (left, right) =>
        left.teaching.example.trim().length -
          right.teaching.example.trim().length ||
        left.id.localeCompare(right.id),
    )[0]

  if (representative) return representative.teaching.example.trim()

  return joinSyntaxTokens(problem.syntaxTokens)
}

function syntaxReminders(problemIds: readonly string[]) {
  const remindersByFamily = new Map<
    string,
    {
      family: string
      label: string
      examples: Set<string>
      instructions: Set<string>
    }
  >()

  for (const problemId of problemIds) {
    const problem = getProblem(problemId)
    const reminder = remindersByFamily.get(problem.retryFamily) ?? {
      family: problem.retryFamily,
      label: syntaxFamilyLabel(problem.retryFamily),
      examples: new Set<string>(),
      instructions: new Set<string>(),
    }
    reminder.examples.add(compactSyntaxExample(problem))
    reminder.instructions.add(problem.teaching.howTo)
    remindersByFamily.set(problem.retryFamily, reminder)
  }

  return [...remindersByFamily.values()]
    .slice(0, SUMMARY_REVIEW_LIMIT)
    .map((reminder) => {
      const instructions = [...reminder.instructions]
      return {
        family: reminder.family,
        label: reminder.label,
        example: [...reminder.examples].join("\n\n"),
        instruction:
          instructions.length === 1
            ? instructions[0]
            : "Review each mark shown, then build the structure again.",
      }
    })
}

export function RunSummary({
  score,
  total,
  elapsedMs,
  failedProblemIds,
  onPracticeAgain,
  onChangeLevel,
  completedPages = [],
  motionReady = true,
}: RunSummaryProps) {
  const playedSummarySound = useRef(false)
  const completionTitleRef = useRef<HTMLHeadingElement>(null)
  const completedPagesButtonRef = useRef<HTMLButtonElement>(null)
  const completedPagesCloseRef = useRef<HTMLButtonElement>(null)
  const [completedPagesOpen, setCompletedPagesOpen] = useState(false)
  const [completedPageIndex, setCompletedPageIndex] = useState(0)
  const reminders = useMemo(
    () => syntaxReminders(failedProblemIds),
    [failedProblemIds],
  )
  const completedPage = completedPages[completedPageIndex]

  useEffect(() => {
    if (playedSummarySound.current) return
    playedSummarySound.current = true
    playFeedbackSound("summary")
  }, [])

  useEffect(() => {
    completionTitleRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (completedPagesOpen) {
      completedPagesCloseRef.current?.focus({ preventScroll: true })
    }
  }, [completedPagesOpen])

  const closeCompletedPages = () => {
    setCompletedPagesOpen(false)
    completedPagesButtonRef.current?.focus({ preventScroll: true })
  }

  const singleReminder = reminders.length === 1 ? reminders[0] : null

  return (
    <section
      aria-label="Run summary"
      className={`run-summary open-book-shell${motionReady ? "" : " run-summary--waiting"}`}
    >
      <section className="run-summary__page run-summary__page--closure open-book-page">
        <img
          alt=""
          aria-hidden="true"
          className="run-summary__sprig"
          src="/images/nabi-summary-sprig.png"
        />
        <div className="run-summary__closure-copy">
          <h2
            className="run-summary__title summary-ink summary-ink--1"
            id="completion-title"
            ref={completionTitleRef}
            tabIndex={-1}
          >
            {completionTitle(score, total)}
          </h2>
          <p className="run-summary__strength summary-ink summary-ink--2">
            {strengthStatement(score, total)}
          </p>
        </div>

        <dl className="run-summary__metrics summary-ink summary-ink--3">
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

      <section
        className="run-summary__page run-summary__page--note open-book-page"
        aria-labelledby="syntax-review-title"
      >
        <img
          alt=""
          aria-hidden="true"
          className="run-summary__bookmark"
          src="/images/nabi-bookmark.png"
        />
        <div className="run-summary__note-copy">
          {singleReminder ? (
            <>
              <p className="run-summary__eyebrow summary-ink summary-ink--5">
                One thing to revisit
              </p>
              <h3
                className="run-summary__note-title summary-ink summary-ink--6"
                id="syntax-review-title"
              >
                Try {singleReminder.label.toLowerCase()} once more.
              </h3>
              <ul className="run-summary__review-list run-summary__review-list--single">
                <li
                  aria-label={`Syntax reminder: ${singleReminder.label}`}
                  className="summary-ink summary-ink--7"
                >
                  <code>{singleReminder.example}</code>
                  <p>{singleReminder.instruction}</p>
                </li>
              </ul>
            </>
          ) : reminders.length ? (
            <>
              <p className="run-summary__eyebrow summary-ink summary-ink--5">
                A few marks to revisit
              </p>
              <h3
                className="run-summary__note-title run-summary__note-title--compact summary-ink summary-ink--6"
                id="syntax-review-title"
              >
                Keep these {reminders.length === 3 ? "three" : "two"} close.
              </h3>
              <ul className="run-summary__review-list">
                {reminders.map((reminder, index) => (
                  <li
                    aria-label={`Syntax reminder: ${reminder.label}`}
                    className="summary-ink"
                    key={reminder.family}
                    style={{ animationDelay: `${660 + index * 120}ms` }}
                  >
                    <strong>{reminder.label}</strong>
                    <code>{reminder.example}</code>
                  </li>
                ))}
              </ul>
              <p className="run-summary__teacher-note summary-ink summary-ink--9">
                A quick second round will make these marks easier to recall.
              </p>
            </>
          ) : (
            <>
              <p className="run-summary__eyebrow summary-ink summary-ink--5">
                Ready when you are
              </p>
              <h3
                className="run-summary__note-title summary-ink summary-ink--6"
                id="syntax-review-title"
              >
                Nothing to revisit this time.
              </h3>
              <p className="run-summary__teacher-note summary-ink summary-ink--7">
                Another short turn will keep the marks familiar.
              </p>
            </>
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
          {completedPages.length ? (
            <button
              className="text-button run-summary__completed-pages-button"
              onClick={() => {
                setCompletedPageIndex(0)
                setCompletedPagesOpen(true)
              }}
              ref={completedPagesButtonRef}
              type="button"
            >
              View completed pages
            </button>
          ) : null}
        </div>
      </section>

      {completedPagesOpen && completedPage ? (
        <section
          aria-label="Completed pages"
          className="completed-pages"
          role="region"
        >
          <header className="completed-pages__header">
            <div>
              <p>Completed pages</p>
              <strong>{completedPage.title}</strong>
            </div>
            <div className="completed-pages__navigation">
              <button
                aria-label="Previous completed page"
                disabled={completedPageIndex === 0}
                onClick={() =>
                  setCompletedPageIndex((index) => Math.max(0, index - 1))
                }
                type="button"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <span>
                Page {completedPageIndex + 1} of {completedPages.length}
              </span>
              <button
                aria-label="Next completed page"
                disabled={completedPageIndex === completedPages.length - 1}
                onClick={() =>
                  setCompletedPageIndex((index) =>
                    Math.min(completedPages.length - 1, index + 1),
                  )
                }
                type="button"
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <button
                aria-label="Close completed pages"
                onClick={closeCompletedPages}
                ref={completedPagesCloseRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </header>
          <div className="completed-pages__document">
            <RenderedDocumentBody source={completedPage.source} />
          </div>
        </section>
      ) : null}
    </section>
  )
}
