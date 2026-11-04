import { Fragment, type ReactNode, useEffect, useId, useMemo, useState } from "react"
import { setCurrentProblemId } from "../app/currentProblem"
import { MARK_EXAMPLES, markNameKey, type MarkId } from "../app/marks"
import type { PracticeItem } from "../app/practiceItem"
import {
  type PracticeSheet,
  type SheetResult,
  type SheetVerdict,
  usePracticeSheet,
} from "../app/practiceSheet"
import type { TextKey } from "../i18n/ko"
import type { Translate } from "../i18n/text"
import { useText } from "../i18n/useText"
import { type LangProgress, markState } from "../progress/learning"
import { InlineCode } from "./InlineCode"
import {
  type FlaggedSourceLines,
  MarkdownSourceEditor,
} from "./MarkdownSourceEditor"
import { getPlatformFamily, resolveActionShortcut } from "./keyboardShortcut"
import { RenderedDocumentBody } from "./RenderedDocument"

const navigatorLike = typeof navigator === "undefined" ? {} : navigator

function markNames(marks: readonly MarkId[], t: Translate): string {
  return marks.map((mark) => t(markNameKey(mark))).join(t("mark.separator"))
}

function markSyntax(mark: MarkId, t: Translate): string {
  const example = MARK_EXAMPLES[mark]
  return example.startsWith("markExample.") ? t(example as TextKey) : example
}

function useImageLabel() {
  const { t } = useText()
  return (alt: string) =>
    t("render.image", { alt: alt || t("render.imageFallback") })
}

function Instruction({
  sheet,
  showTeaching,
}: {
  sheet: PracticeSheet
  showTeaching: boolean
}) {
  const { t } = useText()
  const { problem, marks } = sheet.item
  return (
    <div className="rd-instruction-block">
      <p className="rd-instruction" data-testid="instruction">
        {problem.prompt} {t("practice.instructionMarks")}{" "}
        <strong>{markNames(marks, t)}</strong>
      </p>
      {showTeaching ? (
        <p className="rd-teaching" data-testid="teaching">
          <InlineCode text={problem.teaching.howTo} />
        </p>
      ) : null}
    </div>
  )
}

function TargetPanel({ sheet }: { sheet: PracticeSheet }) {
  const { t } = useText()
  const headingId = useId()
  const imageLabel = useImageLabel()
  const { target } = sheet.item.problem
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-target"
      data-testid="rd-target"
    >
      <h2 className="rd-panel__title" id={headingId}>
        {t("practice.target")}
      </h2>
      <div className="rd-doc">
        <RenderedDocumentBody imageLabel={imageLabel} source={target} />
      </div>
      {sheet.answerShown ? (
        <pre
          aria-label={t("practice.answer")}
          className="rd-answer"
          data-testid="rd-answer"
        >
          <code>{target}</code>
        </pre>
      ) : null}
    </section>
  )
}

function MyRenderPanel({ source }: { source: string }) {
  const { t } = useText()
  const headingId = useId()
  const imageLabel = useImageLabel()
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-mine"
      data-testid="rd-mine"
    >
      <h2 className="rd-panel__title" id={headingId}>
        {t("practice.mine")}
      </h2>
      <div className="rd-doc">
        <RenderedDocumentBody imageLabel={imageLabel} source={source} />
      </div>
    </section>
  )
}

function flaggedLinesOf(
  verdict: SheetVerdict | null,
): FlaggedSourceLines | null {
  return verdict?.kind === "retry"
    ? { lines: verdict.lines, key: verdict.id }
    : null
}

function EditorPanel({
  sheet,
  onNext,
  focusOnOpen,
}: {
  sheet: PracticeSheet
  onNext: (fromKeyboard: boolean) => void
  focusOnOpen: boolean
}) {
  const { t } = useText()
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-editor"
      data-testid="rd-editor"
    >
      <div className="rd-panel__head">
        <h2 className="rd-panel__title" id={headingId}>
          {t("practice.editor")}
        </h2>
        <div aria-label={t("editor.options")} className="rd-editor__options" role="group">
          <button
            aria-pressed={sheet.blankPage}
            className="rd-toggle"
            data-testid="blank-page-toggle"
            onClick={() => sheet.setBlankPage(!sheet.blankPage)}
            type="button"
          >
            {t("editor.blankPage")}
          </button>
          <button
            aria-pressed={sheet.showInvisibles}
            className="rd-toggle"
            data-testid="invisibles-toggle"
            onClick={sheet.toggleInvisibles}
            type="button"
          >
            {t("editor.invisibles")}
          </button>
        </div>
      </div>
      <MarkdownSourceEditor
        active={focusOnOpen}
        blankGuides={sheet.blankGuides}
        escapeHint={t("editor.escapeHint")}
        flaggedLines={flaggedLinesOf(sheet.verdict)}
        label={t("practice.editor")}
        onChange={sheet.changeDraft}
        // 통과한 뒤에는 같은 단축키가 판정 바의 "다음 장"과 같은 일을 한다.
        onCheck={sheet.verdict?.kind === "pass" ? () => onNext(true) : sheet.check}
        placeholder={t("editor.placeholder")}
        showInvisibles={sheet.showInvisibles}
        value={sheet.draft}
      />
    </section>
  )
}

/** The first hint names the marks; they render as code, not as backticks. */
function markHint(sheet: PracticeSheet, t: Translate): ReactNode {
  const [before = "", after = ""] = t("hint.marks", { marks: "\u0000" }).split("\u0000")
  return (
    <>
      {before}
      {sheet.item.marks.map((mark, index) => (
        <Fragment key={mark}>
          {index > 0 ? " " : null}
          <code>{markSyntax(mark, t)}</code>
        </Fragment>
      ))}
      {after}
    </>
  )
}

function statusText(sheet: PracticeSheet, t: Translate): string {
  const { problem, marks } = sheet.item
  if (sheet.hintStep === 2) {
    return problem.hints[2] ?? problem.hints[0]
  }
  const { verdict } = sheet
  if (!verdict) return ""
  if (verdict.kind === "retry") {
    const message = verdict.messageKey
      ? t(`engine.${verdict.messageKey}`)
      : verdict.message
    if (!verdict.lines) return message
    const where =
      verdict.lines.from === verdict.lines.to
        ? t("verdict.lineOne", { line: verdict.lines.from })
        : t("verdict.lineRange", {
            from: verdict.lines.from,
            to: verdict.lines.to,
          })
    return t("verdict.withLines", { where, message })
  }
  const passed = t("verdict.pass", { marks: markNames(marks, t) })
  const review = verdict.reviews[0]
  return review ? `${passed} ${review}` : passed
}

function hintLabel(sheet: PracticeSheet, t: Translate): string {
  if (sheet.hintStep === 0) return t("bar.hint")
  if (sheet.hintStep === 1) return t("bar.hintMore")
  return t("bar.hintClose")
}

function VerdictBar({
  sheet,
  nextLabel,
  onNext,
}: {
  sheet: PracticeSheet
  nextLabel: string
  onNext: (fromKeyboard: boolean) => void
}) {
  const { t } = useText()
  const passed = sheet.verdict?.kind === "pass"
  const tone = sheet.hintStep > 0 ? "hint" : (sheet.verdict?.kind ?? "idle")
  const shortcut = resolveActionShortcut(navigatorLike)
  const keyLabel = getPlatformFamily(navigatorLike) === "apple" ? "⌘↩" : "Ctrl+↩"

  return (
    <div
      className={`rd-bar rd-bar--${tone} rd-bar--mobile-fixed`}
      data-testid="rd-bar"
      data-tone={tone}
    >
      <div className="rd-bar__inner">
        <div className="rd-bar__left">
          <button
            aria-pressed={sheet.hintStep > 0}
            className="rd-btn rd-btn--ghost"
            data-testid="hint"
            onClick={sheet.advanceHint}
            type="button"
          >
            {hintLabel(sheet, t)}
          </button>
          {sheet.canShowAnswer ? (
            <button
              className="rd-btn rd-btn--ghost"
              data-testid="show-answer"
              onClick={sheet.showAnswer}
              type="button"
            >
              {t("bar.showAnswer")}
            </button>
          ) : null}
        </div>
        <p
          aria-atomic="true"
          aria-live="polite"
          className="rd-bar__status"
          data-testid="rd-status"
          role="status"
        >
          {sheet.hintStep === 1 ? (
            markHint(sheet, t)
          ) : (
            <InlineCode text={statusText(sheet, t)} />
          )}
        </p>
        {passed ? (
          <button
            aria-keyshortcuts={shortcut.ariaKeyShortcuts}
            className="rd-btn rd-btn--primary"
            data-testid="next"
            // A keyboard press reports no clicks (detail 0); only then does
            // the next editor take focus, so a tap does not raise a phone
            // keyboard.
            onClick={(event) => onNext(event.detail === 0)}
            type="button"
          >
            {nextLabel} <kbd aria-hidden="true">{keyLabel}</kbd>
          </button>
        ) : (
          <button
            aria-keyshortcuts={shortcut.ariaKeyShortcuts}
            className="rd-btn rd-btn--primary"
            data-testid="check"
            onClick={sheet.check}
            type="button"
          >
            {t("bar.check")} <kbd aria-hidden="true">{keyLabel}</kbd>
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * One document in the chosen layout (variant A, Jiwon 2026-11-04): goal on
 * the left, editor on the right with the verdict bar under it; on a phone
 * the two stack and the bar sticks to the bottom. A pass adds "what you
 * wrote" above the editor for side-by-side comparison.
 */
export function PracticeSheetView({
  item,
  progress,
  blankPage,
  onBlankPageChange,
  onChecked,
  onNext,
  nextLabel,
  focusOnOpen,
}: {
  item: PracticeItem
  progress: LangProgress
  blankPage: boolean
  onBlankPageChange: (blank: boolean) => void
  onChecked: (result: SheetResult) => void
  /** `fromKeyboard` asks the next document's editor to take focus. */
  onNext: (fromKeyboard: boolean) => void
  nextLabel: string
  /** Set when the learner moved here from the previous editor by keyboard. */
  focusOnOpen: boolean
}) {
  const sheet = usePracticeSheet(item, {
    blankPage,
    onBlankPageChange,
    onChecked,
  })
  // The teaching line belongs to marks the learner has not tried yet (plan
  // §4.1, removing the scaffold). Read once per document so it does not
  // vanish under the learner after their first check.
  const [showTeaching] = useState(() =>
    item.marks.some((mark) => markState(progress, mark) === "new"),
  )

  useEffect(() => {
    setCurrentProblemId(item.problem.id)
    return () => setCurrentProblemId(undefined)
  }, [item.problem.id])

  const passedSource = sheet.verdict?.kind === "pass" ? sheet.verdict.source : null
  const myRender = useMemo(
    () => (passedSource === null ? null : <MyRenderPanel source={passedSource} />),
    [passedSource],
  )

  return (
    <>
      <Instruction sheet={sheet} showTeaching={showTeaching} />
      <div className="rd-a-grid">
        <TargetPanel sheet={sheet} />
        <div className="rd-a-right">
          {myRender}
          <EditorPanel focusOnOpen={focusOnOpen} onNext={onNext} sheet={sheet} />
          <VerdictBar nextLabel={nextLabel} onNext={onNext} sheet={sheet} />
        </div>
      </div>
    </>
  )
}
