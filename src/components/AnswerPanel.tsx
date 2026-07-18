import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { EntryId } from "../content/entryChoices"
import type { Problem } from "../content/types"
import type { Evaluation } from "../engine/types"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"
import { RenderedDocumentBody } from "./RenderedDocument"

type AnswerView = "write" | "preview" | "review"

type AnswerPanelProps = {
  draft: string
  entryId: EntryId
  evaluation: Evaluation | null
  problem: Problem
  onChange: (value: string) => void
  onCheck: () => void
}

function ReviewPanel({
  draft,
  evaluation,
  problem,
}: {
  draft: string
  evaluation: Evaluation
  problem: Problem
}) {
  const failed = evaluation.status === "fail"
  const reviewItems = failed ? [] : evaluation.reviewItems

  return (
    <div className="answer-review">
      <div className="answer-review__summary">
        <p>
          {failed
            ? "Only the Markdown part that needs attention is shown."
            : "Your Markdown matched. These notes are optional improvements."}
        </p>
        <span>
          {failed
            ? "1 thing to fix"
            : `${reviewItems.length} ${reviewItems.length === 1 ? "thing" : "things"} to review`}
        </span>
      </div>
      <div className="answer-review__card">
        <h3>{failed ? "Markdown mark" : "Document structure"}</h3>
        <div className="answer-review__section">
          <h4>How it should look</h4>
          <pre>{problem.target}</pre>
        </div>
        <div className="answer-review__section">
          <h4>What you wrote</h4>
          <pre>{draft || "Nothing yet"}</pre>
        </div>
        <div className="answer-review__section">
          <h4>How to fix it</h4>
          {failed ? (
            <p>{evaluation.message}</p>
          ) : (
            <ul>
              {reviewItems.map((item) => (
                <li key={item.id}>{item.message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function AnswerPanel({
  draft,
  entryId,
  evaluation,
  problem,
  onChange,
  onCheck,
}: AnswerPanelProps) {
  const [view, setView] = useState<AnswerView>("write")
  const writeTabRef = useRef<HTMLButtonElement>(null)
  const secondTabRef = useRef<HTMLButtonElement>(null)
  const pendingTabFocus = useRef<AnswerView | null>(null)
  const reviewAvailable =
    evaluation?.status === "fail" ||
    (evaluation?.status === "matched" && evaluation.reviewItems.length > 0)
  const secondView: AnswerView = reviewAvailable ? "review" : "preview"
  const secondLabel = reviewAvailable ? "Review" : "Preview"

  useEffect(() => {
    setView("write")
  }, [problem.id])

  useEffect(() => {
    if (!evaluation) return
    if (
      evaluation.status === "fail" ||
      (evaluation.status === "matched" && evaluation.reviewItems.length > 0)
    ) {
      setView("review")
      return
    }
    if (entryId !== "challenge") setView("preview")
  }, [entryId, evaluation])

  useEffect(() => {
    const switchView = (event: KeyboardEvent) => {
      if (!event.altKey || (event.key !== "1" && event.key !== "2")) return
      event.preventDefault()
      setView(event.key === "1" ? "write" : secondView)
    }
    document.addEventListener("keydown", switchView)
    return () => document.removeEventListener("keydown", switchView)
  }, [secondView])

  useEffect(() => {
    const target = pendingTabFocus.current
    if (!target) return
    pendingTabFocus.current = null
    const targetRef = target === "write" ? writeTabRef : secondTabRef
    targetRef.current?.focus()
  }, [view])

  const moveBetweenTabs = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: AnswerView,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const target = current === "write" ? secondView : "write"
    pendingTabFocus.current = target
    setView(target)
  }

  const tabIds = useMemo(
    () => ({
      write: `write-tab-${problem.id}`,
      second: `second-tab-${problem.id}`,
      writePanel: `write-panel-${problem.id}`,
      secondPanel: `second-panel-${problem.id}`,
    }),
    [problem.id],
  )

  return (
    <section aria-label="Your answer" className="cbt-panel answer-panel">
      <header className="cbt-panel__header answer-panel__header">
        <span>Your answer</span>
        <div aria-label="Answer view" className="answer-tabs" role="tablist">
          <button
            aria-controls={tabIds.writePanel}
            aria-keyshortcuts="Alt+1"
            aria-selected={view === "write"}
            className="answer-tab"
            id={tabIds.write}
            onClick={() => setView("write")}
            onKeyDown={(event) => moveBetweenTabs(event, "write")}
            ref={writeTabRef}
            role="tab"
            tabIndex={view === "write" ? 0 : -1}
            type="button"
          >
            Write
          </button>
          <button
            aria-controls={tabIds.secondPanel}
            aria-keyshortcuts="Alt+2"
            aria-selected={view === secondView}
            className="answer-tab"
            id={tabIds.second}
            onClick={() => setView(secondView)}
            onKeyDown={(event) => moveBetweenTabs(event, secondView)}
            ref={secondTabRef}
            role="tab"
            tabIndex={view === secondView ? 0 : -1}
            type="button"
          >
            {secondLabel}
          </button>
        </div>
      </header>

      <div
        aria-labelledby={tabIds.write}
        className="answer-panel__body"
        hidden={view !== "write"}
        id={tabIds.writePanel}
        role="tabpanel"
      >
        <MarkdownSourceEditor
          active={view === "write"}
          key={problem.id}
          onChange={onChange}
          onCheck={onCheck}
          value={draft}
        />
      </div>

      <div
        aria-label={secondLabel}
        aria-labelledby={tabIds.second}
        className="answer-panel__body answer-panel__body--reading"
        hidden={view !== secondView}
        id={tabIds.secondPanel}
        role="tabpanel"
      >
        {secondView === "review" && evaluation ? (
          <ReviewPanel draft={draft} evaluation={evaluation} problem={problem} />
        ) : (
          <RenderedDocumentBody
            emptyMessage="Your preview will appear here."
            source={draft}
          />
        )}
      </div>
    </section>
  )
}
