import { useEffect, useMemo, useState } from "react"
import { getProblem } from "../content/problemBank"
import type { CurriculumLevel } from "../content/types"
import type {
  RankingClient,
  RankingStanding,
} from "../ranking/rankingClient"
import { formatElapsedTime } from "./ElapsedTime"

type RunSummaryProps = {
  level: CurriculumLevel
  levelLabel: string
  score: number
  total: number
  elapsedMs: number
  failedProblemIds: readonly string[]
  rankingClient: RankingClient
  onPracticeAgain: () => void
  onStartOver: () => void
  onChangeLevel: () => void
}

function normalizeStanding(standing: RankingStanding): RankingStanding {
  if (
    standing.kind === "percentile" &&
    Number.isFinite(standing.topPercent) &&
    standing.topPercent >= 1 &&
    standing.topPercent <= 100
  ) {
    return standing
  }
  return { kind: "collecting" }
}

function encouragement(score: number, total: number): string {
  if (score === total) {
    return "Clean run. You kept every scheduled Markdown structure intact."
  }
  if (score >= total - 1) {
    return "Strong work. One pattern is ready for a quick review below."
  }
  return "Good finish. The patterns below are exactly what to revisit next."
}

function syntaxReminders(problemIds: readonly string[]) {
  const seenFamilies = new Set<string>()
  return problemIds.flatMap((problemId) => {
    const problem = getProblem(problemId)
    if (seenFamilies.has(problem.retryFamily)) return []
    seenFamilies.add(problem.retryFamily)
    return [
      {
        family: problem.retryFamily,
        concept: problem.teaching.concept,
        instruction: problem.teaching.howTo,
        tokens: [...new Set(problem.syntaxTokens)],
      },
    ]
  })
}

export function RunSummary({
  level,
  levelLabel,
  score,
  total,
  elapsedMs,
  failedProblemIds,
  rankingClient,
  onPracticeAgain,
  onStartOver,
  onChangeLevel,
}: RunSummaryProps) {
  const [standing, setStanding] = useState<RankingStanding | null>(null)
  const reminders = useMemo(
    () => syntaxReminders(failedProblemIds),
    [failedProblemIds],
  )

  useEffect(() => {
    let active = true
    setStanding(null)
    void rankingClient
      .getStanding({ elapsedMs, level, score, total })
      .then((result) => {
        if (active) setStanding(normalizeStanding(result))
      })
      .catch(() => {
        if (active) setStanding({ kind: "collecting" })
      })
    return () => {
      active = false
    }
  }, [elapsedMs, level, rankingClient, score, total])

  return (
    <section className="run-summary" aria-labelledby="completion-title">
      <header className="run-summary__intro">
        <p>Turn results · {levelLabel}</p>
        <h2 id="completion-title">Practice complete.</h2>
        <p>{encouragement(score, total)}</p>
      </header>

      <dl className="run-summary__metrics">
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
        <div aria-label="Level standing">
          <dt>Level standing</dt>
          <dd>
            {standing?.kind === "percentile"
              ? `About top ${Math.round(standing.topPercent)}%`
              : standing
                ? "Collecting data"
                : "Checking…"}
          </dd>
          {standing?.kind === "percentile" && standing.sampleSize ? (
            <small>
              Compared with {standing.sampleSize.toLocaleString()} anonymous
              turns
            </small>
          ) : standing?.kind === "collecting" ? (
            <small>Your time only — comparison data is not available yet.</small>
          ) : null}
        </div>
      </dl>

      {reminders.length ? (
        <section className="run-summary__review" aria-labelledby="syntax-review-title">
          <p>Review once, then keep moving.</p>
          <h3 id="syntax-review-title">Syntax to revisit</h3>
          <ul>
            {reminders.map((reminder) => (
              <li
                aria-label={`Syntax reminder: ${reminder.concept}`}
                key={reminder.family}
              >
                <div>
                  <strong>{reminder.concept}</strong>
                  <p>{reminder.instruction}</p>
                </div>
                {reminder.tokens.length ? (
                  <code>{reminder.tokens.join("  ")}</code>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="completion__actions">
        <button
          autoFocus
          className="primary-button"
          onClick={onPracticeAgain}
          type="button"
        >
          Practice again
        </button>
        <button className="text-button" onClick={onStartOver} type="button">
          Start over
        </button>
        <button className="text-button" onClick={onChangeLevel} type="button">
          Change level
        </button>
      </div>
    </section>
  )
}
