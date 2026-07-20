import { useEffect, useMemo, useRef } from "react"
import { getProblem, problemBank } from "../content/problemBank"
import { playFeedbackSound } from "../sound/feedbackSound"
import { formatElapsedTime } from "./ElapsedTime"

type RunSummaryProps = {
  score: number
  total: number
  elapsedMs: number
  failedProblemIds: readonly string[]
  onPracticeAgain: () => void
  onChangeLevel: () => void
}

const SUMMARY_REVIEW_LIMIT = 3
const SUMMARY_EXAMPLE_MAX_LINES = 12
const SUMMARY_EXAMPLE_MAX_LENGTH = 120

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
  if (family.includes("blockquote")) return "Block quotes"
  if (family.includes("heading")) return "Headings"
  if (family.includes("ordered-list")) return "Numbered steps"
  if (family.includes("list")) return "Lists"
  if (family.includes("inline-code")) return "Inline code"
  if (family.includes("code-block") || family.includes("fenced-code")) {
    return "Code blocks"
  }
  if (family.includes("italic") || family.includes("emphasis")) {
    return "Emphasis"
  }
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
}: RunSummaryProps) {
  const playedSummarySound = useRef(false)
  const reminders = useMemo(
    () => syntaxReminders(failedProblemIds),
    [failedProblemIds],
  )

  useEffect(() => {
    if (playedSummarySound.current) return
    playedSummarySound.current = true
    playFeedbackSound("summary")
  }, [])

  const singleReminder = reminders.length === 1 ? reminders[0] : null

  return (
    <section
      className="run-summary open-book-shell"
      aria-labelledby="completion-title"
    >
      <section className="run-summary__page run-summary__page--closure open-book-page">
        <div className="run-summary__closure-copy">
          <h2
            className="run-summary__title summary-ink summary-ink--1"
            id="completion-title"
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
                    style={{ animationDelay: `${900 + index * 140}ms` }}
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

        <div className="run-summary__actions summary-ink summary-ink--10">
          <button
            autoFocus
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
      </section>
    </section>
  )
}
