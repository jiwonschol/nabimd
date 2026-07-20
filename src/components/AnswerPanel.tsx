import { Eye, Lightbulb, Pencil } from "lucide-react"
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { EntryId } from "../content/entryChoices"
import { getExerciseMode } from "../content/exerciseMode"
import type { GradableProblem } from "../content/types"
import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import { MarkdownSourceEditor } from "./MarkdownSourceEditor"
import { RenderedDocumentBody } from "./RenderedDocument"
import { WritingProcessor } from "./WritingProcessor"

type AnswerView = "write" | "preview" | "review" | "hint"

type AnswerPanelProps = {
  draft: string
  entryId: EntryId
  evaluation: Evaluation | null
  coach: LearningSession["coach"]
  hintLevel: LearningSession["hintLevel"]
  problem: GradableProblem
  onChange: (value: string) => void
  onCheck: () => void
  onCloseHint: () => void
  onNextHint: () => void
  onRequestHint: () => void
}

function sourceExamples(problem: GradableProblem): string[] {
  if ((problem.level ?? 1) !== 5) return [...problem.syntaxTokens]

  let listIndex = 0

  return problem.syntaxTokens.map((token) => {
    const mark = token.trim()

    if (mark === "#") return "# Title"
    if (mark === "##") return "## Section"
    if (mark === "###") return "### Phase"
    if (mark === "1.") return "1. Read AGENTS.md"
    if (mark === ">") return "> Pause when..."
    if (mark === "`") return "`npm test`"
    if (mark.startsWith("```")) return `${mark}\n...\n\`\`\``
    if (mark === "-") {
      const example =
        token !== mark || listIndex > 0
          ? "  - Versioned schema"
          : "- API provider"
      listIndex += 1
      return example
    }
    if (mark === "**") return "**Important**"
    if (mark === "*" || mark === "_") return "*Emphasis*"
    return token
  })
}

function HintPanel({
  evaluation,
  hintLevel,
  onNextHint,
  problem,
}: {
  evaluation: Evaluation | null
  hintLevel: LearningSession["hintLevel"]
  onNextHint: () => void
  problem: GradableProblem
}) {
  const visibleHint = problem.hints[Math.max(0, hintLevel - 1)]
  const examples = sourceExamples(problem)

  return (
    <div className="answer-hint">
      <div aria-label="Markdown pattern" className="syntax-sequence">
        {examples.map((example, index) => (
          <code key={`${problem.syntaxTokens[index]}-${index}`}>{example}</code>
        ))}
      </div>
      <p>{problem.teaching.howTo}</p>
      {evaluation?.status === "fail" ? (
        <div className="answer-hint__coaching">
          <p>{visibleHint}</p>
          <span>{hintLevel} of 3</span>
          {hintLevel < 3 ? (
            <button className="text-button" onClick={onNextHint} type="button">
              Next hint
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ReviewPanel({
  draft,
  evaluation,
  problem,
}: {
  draft: string
  evaluation: Evaluation
  problem: GradableProblem
}) {
  const failed = evaluation.status === "fail"
  const reviewItems = failed ? [] : evaluation.reviewItems
  const showsReferenceAnswer = getExerciseMode(problem.level ?? 1) === "target"

  return (
    <div className="answer-review">
      <div className="answer-review__summary">
        <p>
          {failed
            ? showsReferenceAnswer
              ? "Compare the expected Markdown with what you wrote."
              : "Review the document structure and revise your Markdown."
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
        {showsReferenceAnswer ? (
          <div className="answer-review__section">
            <h4>How it should look</h4>
            <div className="answer-review__document">
              <RenderedDocumentBody source={problem.target} />
            </div>
          </div>
        ) : null}
        <div className="answer-review__section">
          <h4>What you wrote</h4>
          <div className="answer-review__document">
            <RenderedDocumentBody
              emptyMessage="Nothing yet"
              source={draft}
            />
          </div>
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
  coach,
  hintLevel,
  problem,
  onChange,
  onCheck,
  onCloseHint,
  onNextHint,
  onRequestHint,
}: AnswerPanelProps) {
  const [view, setView] = useState<AnswerView>("write")
  const writeTabRef = useRef<HTMLButtonElement>(null)
  const secondTabRef = useRef<HTMLButtonElement>(null)
  const hintTabRef = useRef<HTMLButtonElement>(null)
  const writePanelRef = useRef<HTMLDivElement>(null)
  const pendingTabFocus = useRef<AnswerView | null>(null)
  const reviewAvailable =
    evaluation?.status === "fail" ||
    (evaluation?.status === "matched" && evaluation.reviewItems.length > 0)
  const secondView: AnswerView = reviewAvailable ? "review" : "preview"
  const secondLabel = reviewAvailable ? "Review" : "Preview"

  const selectView = useCallback(
    (nextView: AnswerView) => {
      if (nextView === "hint") {
        if (coach !== "hint") onRequestHint()
      } else if (coach === "hint") {
        onCloseHint()
      }
      setView(nextView)
    },
    [coach, onCloseHint, onRequestHint],
  )

  useEffect(() => {
    setView("write")
    onCloseHint()
  }, [onCloseHint, problem.id])

  useEffect(() => {
    if (!evaluation) return
    if (
      evaluation.status === "fail" ||
      (evaluation.status === "matched" && evaluation.reviewItems.length > 0)
    ) {
      if (writePanelRef.current?.contains(document.activeElement)) {
        pendingTabFocus.current = "review"
      }
      setView("review")
      return
    }
    setView("preview")
  }, [entryId, evaluation])

  useEffect(() => {
    const target = pendingTabFocus.current
    if (!target) return
    pendingTabFocus.current = null
    const targetRef =
      target === "write"
        ? writeTabRef
        : target === "hint"
          ? hintTabRef
          : secondTabRef
    targetRef.current?.focus()
  }, [view])

  const moveBetweenTabs = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    current: AnswerView,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const tabs: AnswerView[] = ["write", secondView, "hint"]
    const currentIndex = tabs.indexOf(current)
    const direction = event.key === "ArrowRight" ? 1 : -1
    const target = tabs[(currentIndex + direction + tabs.length) % tabs.length]!
    pendingTabFocus.current = target
    selectView(target)
  }

  const switchViewFromEditor = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (
      !event.altKey ||
      (event.key !== "1" && event.key !== "2" && event.key !== "3")
    ) {
      return
    }

    event.preventDefault()
    const target =
      event.key === "1" ? "write" : event.key === "2" ? secondView : "hint"
    if (target === "write") {
      writePanelRef.current
        ?.querySelector<HTMLElement>('[role="textbox"]')
        ?.focus()
      return
    }
    pendingTabFocus.current = target
    selectView(target)
  }

  const tabIds = useMemo(
    () => ({
      write: `write-tab-${problem.id}`,
      second: `second-tab-${problem.id}`,
      hint: `hint-tab-${problem.id}`,
      writePanel: `write-panel-${problem.id}`,
      secondPanel: `second-panel-${problem.id}`,
      hintPanel: `hint-panel-${problem.id}`,
    }),
    [problem.id],
  )

  return (
    <section
      aria-label="Your answer"
      className="cbt-panel answer-panel"
    >
      <header className="cbt-panel__header answer-panel__header">
        <div aria-label="Answer view" className="answer-tabs" role="tablist">
          <button
            aria-label="Write"
            aria-controls={tabIds.writePanel}
            aria-keyshortcuts="Alt+1"
            aria-selected={view === "write"}
            className="answer-tab"
            data-tooltip="Write"
            id={tabIds.write}
            onClick={() => selectView("write")}
            onKeyDown={(event) => moveBetweenTabs(event, "write")}
            ref={writeTabRef}
            role="tab"
            tabIndex={view === "write" ? 0 : -1}
            type="button"
          >
            <Pencil aria-hidden="true" size={40} strokeWidth={1.5} />
          </button>
          <button
            aria-label={secondLabel}
            aria-controls={tabIds.secondPanel}
            aria-keyshortcuts="Alt+2"
            aria-selected={view === secondView}
            className="answer-tab"
            data-tooltip={secondLabel}
            id={tabIds.second}
            onClick={() => selectView(secondView)}
            onKeyDown={(event) => moveBetweenTabs(event, secondView)}
            ref={secondTabRef}
            role="tab"
            tabIndex={view === secondView ? 0 : -1}
            type="button"
          >
            <Eye aria-hidden="true" size={40} strokeWidth={1.5} />
          </button>
          <button
            aria-label="Hint"
            aria-controls={tabIds.hintPanel}
            aria-keyshortcuts="Alt+3"
            aria-selected={view === "hint"}
            className="answer-tab"
            data-tooltip="Hint"
            id={tabIds.hint}
            onClick={() => selectView("hint")}
            onKeyDown={(event) => moveBetweenTabs(event, "hint")}
            ref={hintTabRef}
            role="tab"
            tabIndex={view === "hint" ? 0 : -1}
            type="button"
          >
            <Lightbulb aria-hidden="true" size={40} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div
        aria-labelledby={tabIds.write}
        className="answer-panel__body answer-panel__body--sheet"
        hidden={view !== "write"}
        id={tabIds.writePanel}
        onKeyDownCapture={switchViewFromEditor}
        ref={writePanelRef}
        role="tabpanel"
      >
        <WritingProcessor
          contentVersion={draft}
          label="Your Markdown"
          mode="edit"
        >
          <MarkdownSourceEditor
            active={view === "write"}
            key={problem.id}
            onChange={onChange}
            onCheck={onCheck}
            showInvisibles
            value={draft}
          />
        </WritingProcessor>
      </div>

      <div
        aria-label={secondLabel}
        aria-labelledby={tabIds.second}
        className={`answer-panel__body${secondView === "preview" ? " answer-panel__body--sheet" : " answer-panel__body--reading"}`}
        hidden={view !== secondView}
        id={tabIds.secondPanel}
        role="tabpanel"
      >
        {secondView === "review" && evaluation ? (
          <ReviewPanel draft={draft} evaluation={evaluation} problem={problem} />
        ) : (
          <WritingProcessor
            contentVersion={draft}
            label="Rendered answer"
            mode="read-only"
          >
            <RenderedDocumentBody
              emptyMessage="Your preview will appear here."
              source={draft}
            />
          </WritingProcessor>
        )}
      </div>

      <div
        aria-label="Hint"
        aria-labelledby={tabIds.hint}
        className="answer-panel__body answer-panel__body--reading"
        hidden={view !== "hint"}
        id={tabIds.hintPanel}
        role="tabpanel"
      >
        <HintPanel
          evaluation={evaluation}
          hintLevel={hintLevel}
          onNextHint={onNextHint}
          problem={problem}
        />
      </div>
    </section>
  )
}
