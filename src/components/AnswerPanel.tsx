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
import { buildReviewCorrections } from "../feedback/reviewCorrections"
import { useCenterCard } from "../guided/useCenterCard"
import type { LearningSession } from "../session/learningSession"
import { CenterCard } from "./CenterCard"
import { RenderedDocumentBody } from "./RenderedDocument"
import { WordProcessorPage } from "./WordProcessorPage"

type AnswerView = "write" | "preview" | "review" | "hint"

type AnswerPanelProps = {
  draft: string
  entryId: EntryId
  evaluation: Evaluation | null
  coach: LearningSession["coach"]
  hintLevel: LearningSession["hintLevel"]
  problem: GradableProblem
  onChange: (value: string) => void
  onCheck: (value?: string) => void
  onCloseHint: () => void
  onNextHint: () => void
  onRequestHint: () => void
  interactive?: boolean
  problemCompleted?: boolean
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
  draft,
  evaluation,
  hintLevel,
  onNextHint,
  problem,
}: {
  draft: string
  evaluation: Evaluation | null
  hintLevel: LearningSession["hintLevel"]
  onNextHint: () => void
  problem: GradableProblem
}) {
  if (evaluation?.status === "fail") {
    const corrections = buildReviewCorrections(problem, evaluation, draft)
    const showsMessages = hintLevel >= 2

    return (
      <div className="answer-hint answer-hint--corrections">
        <ol
          aria-label="Failed Markdown patterns"
          className="answer-hint__corrections"
        >
          {corrections.map((cue) => (
            <li
              className="answer-hint__correction"
              key={cue.id}
            >
              {showsMessages ? (
                <span className="answer-hint__location">{cue.location}</span>
              ) : null}
              <h4>{cue.label}</h4>
              {showsMessages && cue.learnerExcerpt ? (
                <div className="answer-correction__source">
                  <span>You wrote</span>
                  <code>{cue.learnerExcerpt}</code>
                </div>
              ) : null}
              {cue.requiredSource ? (
                <div className="answer-correction__source">
                  <span>Use</span>
                  <code>{cue.requiredSource}</code>
                </div>
              ) : null}
              {showsMessages || !cue.requiredSource ? (
                <p>{cue.repairInstruction}</p>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="answer-hint__coaching">
          <span>{Math.min(hintLevel, 2)} of 2</span>
          {hintLevel < 2 ? (
            <button className="text-button" onClick={onNextHint} type="button">
              Next hint
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const examples = sourceExamples(problem)

  return (
    <div className="answer-hint">
      <div aria-label="Markdown pattern" className="syntax-sequence">
        {examples.map((example, index) => (
          <code key={`${problem.syntaxTokens[index]}-${index}`}>{example}</code>
        ))}
      </div>
      <p>{problem.teaching.howTo}</p>
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
  const corrections = failed
    ? buildReviewCorrections(problem, evaluation, draft)
    : []
  const showsReferenceAnswer = getExerciseMode(problem.level ?? 1) === "target"

  return (
    <div
      className={`answer-review${failed ? " answer-review--corrections" : ""}`}
    >
      <div className="answer-review__summary">
        <p>
          {failed
            ? "Review each required correction and revise your Markdown."
            : "Your Markdown matched. These notes are optional improvements."}
        </p>
        <span>
          {failed
            ? `${corrections.length} ${corrections.length === 1 ? "thing" : "things"} to fix`
            : `${reviewItems.length} ${reviewItems.length === 1 ? "thing" : "things"} to review`}
        </span>
      </div>
      {failed ? (
        <ol
          aria-label="Required corrections"
          className="answer-review__corrections"
        >
          {corrections.map((cue) => (
            <li
              className="answer-review__correction"
              key={cue.id}
            >
              <span className="answer-review__location">{cue.location}</span>
              <h4>{cue.label}</h4>
              {cue.learnerExcerpt ? (
                <div className="answer-correction__source">
                  <span>You wrote</span>
                  <code>{cue.learnerExcerpt}</code>
                </div>
              ) : null}
              {cue.requiredSource ? (
                <div className="answer-correction__source">
                  <span>Use</span>
                  <code>{cue.requiredSource}</code>
                </div>
              ) : null}
              <p>{cue.repairInstruction}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="answer-review__card">
          <h3>Document structure</h3>
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
            <ul>
              {reviewItems.map((item) => (
                <li key={item.id}>{item.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
  interactive = true,
  problemCompleted = false,
}: AnswerPanelProps) {
  const [view, setView] = useState<AnswerView>("write")
  const writeTabRef = useRef<HTMLButtonElement>(null)
  const secondTabRef = useRef<HTMLButtonElement>(null)
  const hintTabRef = useRef<HTMLButtonElement>(null)
  const writePanelRef = useRef<HTMLDivElement>(null)
  const secondPanelRef = useRef<HTMLDivElement>(null)
  const hintPanelRef = useRef<HTMLDivElement>(null)
  const pendingTabFocus = useRef<AnswerView | null>(null)
  const pendingReadingFocus = useRef<"second" | "hint" | null>(null)
  const pendingEditorFocus = useRef(false)
  const reviewAvailable =
    evaluation?.status === "fail" ||
    (evaluation?.status === "matched" && evaluation.reviewItems.length > 0)
  const secondView: AnswerView = reviewAvailable ? "review" : "preview"
  const secondLabel = reviewAvailable ? "Review" : "Preview"
  const leadingBlankRows = (problem.level ?? 1) <= 2 ? 2 : 0

  // The center card is the input mode: the document page starts blank and
  // grows one accepted slot at a time until the finished draft triggers the
  // regular Check. (A future "hard" mode may swap this layer for a blank
  // editor without touching the session model underneath.)
  const card = useCenterCard({
    problem,
    draft,
    completed: problemCompleted,
    onGrow: onChange,
    onComplete: onCheck,
  })

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

  const focusTab = useCallback((target: AnswerView) => {
    const targetRef =
      target === "write"
        ? writeTabRef
        : target === "hint"
          ? hintTabRef
          : secondTabRef
    targetRef.current?.focus()
  }, [])

  const selectViewFromPointer = (nextView: AnswerView) => {
    pendingEditorFocus.current = false
    pendingTabFocus.current = null
    pendingReadingFocus.current = null
    selectView(nextView)
  }

  useEffect(() => {
    if (!interactive) return
    setView("write")
    onCloseHint()
  }, [interactive, onCloseHint, problem.id])

  useEffect(() => {
    if (!evaluation) return
    // A failed Check must never take the editor away: the learner stays on
    // Write with the verdict visible and retypes immediately. Review stays
    // reachable as a tab. A Matched verdict also stays on Write: the run
    // either auto-advances after the verdict beat or, on a revisited step,
    // waits for an explicit move (issue #102).
    if (evaluation.status === "fail") {
      pendingTabFocus.current = null
      pendingReadingFocus.current = null
      pendingEditorFocus.current = true
      setView("write")
    }
  }, [entryId, evaluation])

  useEffect(() => {
    const readingTarget = pendingReadingFocus.current
    if (readingTarget) {
      const readingTargetIsVisible =
        readingTarget === "second" ? view === secondView : view === "hint"
      if (!readingTargetIsVisible) return

      pendingReadingFocus.current = null
      const panel =
        readingTarget === "second"
          ? secondPanelRef.current
          : hintPanelRef.current
      panel?.focus({ preventScroll: true })
      return
    }

    if (pendingEditorFocus.current && view === "write") {
      pendingEditorFocus.current = false
      const panel = writePanelRef.current
      const input =
        panel?.querySelector<HTMLElement>("input") ??
        panel?.querySelector<HTMLElement>('[role="textbox"]')
      input?.focus()
      return
    }

    const target = pendingTabFocus.current
    if (!target) return
    pendingTabFocus.current = null
    focusTab(target)
  }, [entryId, evaluation, focusTab, secondView, view])

  const moveWithinReadingPanel = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return

    if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault()
      const direction = event.key === "PageDown" ? 1 : -1
      event.currentTarget.scrollTop +=
        direction * Math.max(40, event.currentTarget.clientHeight - 40)
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "Home") {
      event.preventDefault()
      event.currentTarget.scrollTop = 0
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "End") {
      event.preventDefault()
      event.currentTarget.scrollTop = event.currentTarget.scrollHeight
    }
  }

  useEffect(() => {
    if (!interactive) return
    const openHintFromKeyboard = (event: KeyboardEvent) => {
      if (
        event.key !== "?" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return
      }

      const isTextEntryContext = (target: EventTarget | null) =>
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
        ) !== null

      if (
        isTextEntryContext(event.target) ||
        isTextEntryContext(document.activeElement)
      ) {
        return
      }

      event.preventDefault()
      pendingReadingFocus.current = null
      pendingEditorFocus.current = false
      if (view === "hint") {
        pendingTabFocus.current = null
        focusTab("hint")
        return
      }
      pendingTabFocus.current = "hint"
      selectView("hint")
    }

    document.addEventListener("keydown", openHintFromKeyboard)
    return () => document.removeEventListener("keydown", openHintFromKeyboard)
  }, [focusTab, interactive, selectView, view])

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
    pendingReadingFocus.current = null
    pendingEditorFocus.current = false
    pendingTabFocus.current = target
    selectView(target)
  }

  const switchViewShortcut = useCallback((
    event: ReactKeyboardEvent<HTMLElement> | KeyboardEvent,
  ) => {
    if (!event.altKey || event.ctrlKey || event.metaKey) return

    // Alt+H peeks at the Hint and puts it away again: the same key closes
    // the peek and returns focus to the editor with the cursor intact.
    // Matching on event.code keeps the macOS Option layer (˙) out of the
    // document.
    const code = "code" in event ? event.code : undefined
    if (code === "KeyH" && !event.shiftKey && !event.repeat) {
      event.preventDefault()
      pendingTabFocus.current = null
      if (view === "hint") {
        pendingReadingFocus.current = null
        pendingEditorFocus.current = true
        selectView("write")
        return
      }
      pendingReadingFocus.current = "hint"
      pendingEditorFocus.current = false
      selectView("hint")
      return
    }

    if (event.key !== "1" && event.key !== "2" && event.key !== "3") {
      return
    }

    event.preventDefault()
    pendingReadingFocus.current = null
    const target =
      event.key === "1" ? "write" : event.key === "2" ? secondView : "hint"
    if (target === "write") {
      pendingTabFocus.current = null
      if (view === "write") {
        pendingEditorFocus.current = false
        writePanelRef.current
          ?.querySelector<HTMLElement>('[role="textbox"]')
          ?.focus()
      } else {
        pendingEditorFocus.current = true
        selectView("write")
      }
      return
    }
    pendingEditorFocus.current = false
    if (view === target) {
      pendingTabFocus.current = null
      focusTab(target)
      return
    }
    pendingTabFocus.current = target
    selectView(target)
  }, [focusTab, secondView, selectView, view])

  useEffect(() => {
    if (!interactive) return
    const switchViewOutsideAnswerPanel = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(".answer-panel") !== null
      ) {
        return
      }
      switchViewShortcut(event)
    }

    document.addEventListener("keydown", switchViewOutsideAnswerPanel)
    return () =>
      document.removeEventListener("keydown", switchViewOutsideAnswerPanel)
  }, [interactive, switchViewShortcut])

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
      onKeyDownCapture={switchViewShortcut}
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
            onClick={() => selectViewFromPointer("write")}
            onKeyDown={(event) => moveBetweenTabs(event, "write")}
            ref={writeTabRef}
            role="tab"
            tabIndex={view === "write" ? 0 : -1}
            type="button"
          >
            <span className="answer-tab__icon">
              <Pencil aria-hidden="true" size={40} strokeWidth={1.5} />
            </span>
          </button>
          <button
            aria-label={secondLabel}
            aria-controls={tabIds.secondPanel}
            aria-keyshortcuts="Alt+2"
            aria-selected={view === secondView}
            className="answer-tab"
            data-tooltip={secondLabel}
            id={tabIds.second}
            onClick={() => selectViewFromPointer(secondView)}
            onKeyDown={(event) => moveBetweenTabs(event, secondView)}
            ref={secondTabRef}
            role="tab"
            tabIndex={view === secondView ? 0 : -1}
            type="button"
          >
            <span className="answer-tab__icon">
              <Eye aria-hidden="true" size={40} strokeWidth={1.5} />
            </span>
          </button>
          <button
            aria-label="Hint"
            aria-controls={tabIds.hintPanel}
            aria-keyshortcuts="Alt+H Alt+3 ?"
            aria-selected={view === "hint"}
            className="answer-tab"
            data-tooltip="Hint"
            id={tabIds.hint}
            onClick={() => selectViewFromPointer("hint")}
            onKeyDown={(event) => moveBetweenTabs(event, "hint")}
            ref={hintTabRef}
            role="tab"
            tabIndex={view === "hint" ? 0 : -1}
            type="button"
          >
            <span className="answer-tab__icon">
              <Lightbulb aria-hidden="true" size={40} strokeWidth={1.5} />
            </span>
          </button>
        </div>
      </header>

      <div
        aria-labelledby={tabIds.write}
        className="answer-panel__body answer-panel__body--sheet"
        hidden={view !== "write"}
        id={tabIds.writePanel}
        ref={writePanelRef}
        role="tabpanel"
      >
        <WordProcessorPage
          key={`${problem.id}-document`}
          label="Your document"
          leadingBlankRows={leadingBlankRows}
          presentation="rendered"
          value={draft}
        />
        {interactive && card.checkpoint ? (
          <CenterCard
            key={`${problem.id}-card`}
            checkpoint={card.checkpoint}
            onEditSegment={card.editSegment}
            onSubmit={card.submit}
            segmentValues={card.segmentValues}
            slotIndex={card.slotIndex}
            slotTotal={card.slotTotal}
            verdict={card.verdict}
          />
        ) : null}
      </div>

      <div
        aria-label={secondLabel}
        aria-labelledby={tabIds.second}
        className={`answer-panel__body${secondView === "preview" ? " answer-panel__body--sheet" : " answer-panel__body--reading"}`}
        hidden={view !== secondView}
        id={tabIds.secondPanel}
        onKeyDown={moveWithinReadingPanel}
        ref={secondPanelRef}
        role="tabpanel"
        tabIndex={view === secondView && secondView === "review" ? 0 : -1}
      >
        {secondView === "review" && evaluation ? (
          <ReviewPanel draft={draft} evaluation={evaluation} problem={problem} />
        ) : (
          <WordProcessorPage
            key={`${problem.id}-preview`}
            label="Rendered answer"
            leadingBlankRows={leadingBlankRows}
            presentation="rendered"
            value={draft}
          />
        )}
      </div>

      <div
        aria-label="Hint"
        aria-labelledby={tabIds.hint}
        className="answer-panel__body answer-panel__body--reading"
        hidden={view !== "hint"}
        id={tabIds.hintPanel}
        onKeyDown={moveWithinReadingPanel}
        ref={hintPanelRef}
        role="tabpanel"
        tabIndex={view === "hint" ? 0 : -1}
      >
        <HintPanel
          draft={draft}
          evaluation={evaluation}
          hintLevel={hintLevel}
          onNextHint={onNextHint}
          problem={problem}
        />
      </div>

    </section>
  )
}
