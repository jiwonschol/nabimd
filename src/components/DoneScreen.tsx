import { useEffect, useId } from "react"
import { MARKS, markNameKey, type MarkId } from "../app/marks"
import type { PracticeItem } from "../app/practiceItem"
import type { SheetResult } from "../app/practiceSheet"
import { useText } from "../i18n/useText"
import { type LangProgress, markState } from "../progress/learning"
import { playFeedbackSound } from "../sound/feedbackSound"
import { RenderedDocumentBody } from "./RenderedDocument"
import { useRenderLabels } from "./useRenderLabels"
import { SummaryFeedbackForm } from "./SummaryFeedbackForm"

export type DoneSummary = {
  items: readonly PracticeItem[]
  results: readonly (SheetResult | undefined)[]
  /** Progress when the bundle started, to show what changed on the map. */
  before: LangProgress
}

function changedMarks(
  before: LangProgress,
  after: LangProgress,
): { tried: MarkId[]; familiar: MarkId[] } {
  const tried: MarkId[] = []
  const familiar: MarkId[] = []
  for (const mark of MARKS) {
    const was = markState(before, mark)
    const now = markState(after, mark)
    if (was === "new" && now !== "new") tried.push(mark)
    if (was !== "familiar" && now === "familiar") familiar.push(mark)
  }
  return { tried, familiar }
}

function SummaryCard({ item, source }: { item: PracticeItem; source: string }) {
  const { t } = useText()
  const titleId = useId()
  const labels = useRenderLabels()
  return (
    <li aria-labelledby={titleId} className="rd-done__card">
      <h3 className="rd-panel__title" id={titleId}>
        {item.problem.title}
      </h3>
      <div className="rd-done__card-body">
        <pre
          aria-label={t("done.cardSource", { title: item.problem.title })}
          className="rd-answer rd-done__source"
        >
          <code>{source}</code>
        </pre>
        <div
          aria-label={t("done.cardRender", { title: item.problem.title })}
          className="rd-doc rd-done__render"
          role="group"
        >
          <RenderedDocumentBody labels={labels} source={source} />
        </div>
      </div>
    </li>
  )
}

/** The summary after today's five (plan §4.1): no score table, no time. */
export function DoneScreen({
  summary,
  progress,
  onAgain,
  onHome,
}: {
  summary: DoneSummary | null
  progress: LangProgress
  onAgain: () => void
  onHome: () => void
}) {
  const { t } = useText()
  const written = summary
    ? summary.items.flatMap((item, index) => {
        const result = summary.results[index]
        return result?.passed ? [{ item, result }] : []
      })
    : []
  const firstTry = written.filter(({ result }) => result.retriesBefore === 0).length
  const changes = summary ? changedMarks(summary.before, progress) : null
  const names = (marks: readonly MarkId[]) =>
    marks.map((mark) => t(markNameKey(mark))).join(t("mark.separator"))

  useEffect(() => {
    if (written.length > 0) playFeedbackSound("summary")
    // Once per arrival on the summary.
  }, [])

  return (
    <main className="rd-main rd-done" data-testid="done">
      <h1 className="rd-done__title">
        {written.length > 0 ? t("done.title") : t("done.empty")}
      </h1>
      {written.length > 0 ? (
        <div className="rd-done__facts" data-testid="done-facts">
          {firstTry > 0 ? <p>{t("done.firstTry", { count: firstTry })}</p> : null}
          {changes && changes.tried.length > 0 ? (
            <p>{t("done.newMarks", { marks: names(changes.tried) })}</p>
          ) : null}
          {changes && changes.familiar.length > 0 ? (
            <p>{t("done.familiarMarks", { marks: names(changes.familiar) })}</p>
          ) : null}
        </div>
      ) : null}
      <div className="rd-done__actions">
        <button
          className="rd-btn rd-btn--primary rd-btn--large"
          data-testid="again"
          onClick={onAgain}
          type="button"
        >
          {t("done.again")}
        </button>
        <button
          className="rd-btn rd-btn--ghost rd-btn--large"
          data-testid="done-home"
          onClick={onHome}
          type="button"
        >
          {t("done.home")}
        </button>
      </div>
      {written.length > 0 ? (
        <ul className="rd-done__cards" data-testid="done-cards">
          {written.map(({ item, result }, index) => (
            <SummaryCard item={item} key={`${index}-${item.problem.id}`} source={result.source} />
          ))}
        </ul>
      ) : null}
      {/* The note API needs at least one written document as context. */}
      {written.length > 0 ? (
        <details className="rd-done__note">
          <summary>{t("done.note")}</summary>
          <SummaryFeedbackForm level={1} score={firstTry} total={written.length} />
        </details>
      ) : null}
    </main>
  )
}
