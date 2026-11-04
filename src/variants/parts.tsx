import { type ReactNode, useId } from "react"
import {
  type FlaggedSourceLines,
  MarkdownSourceEditor,
} from "../components/MarkdownSourceEditor"
import {
  getPlatformFamily,
  resolveActionShortcut,
} from "../components/keyboardShortcut"
import { RenderedDocumentBody } from "../components/RenderedDocument"
import type { PracticeSheet, SheetVerdict } from "./usePracticeSheet"
import { retryMessage } from "./usePracticeSheet"

const navigatorLike = typeof navigator === "undefined" ? {} : navigator

export function RedesignHeader() {
  const base = import.meta.env.BASE_URL
  return (
    <header className="rd-header">
      <a className="rd-logo" href={base}>
        <img alt="" height="28" src={`${base}brand/bfly-favicon.png`} width="28" />
        <span>Nabi Markdown</span>
      </a>
      <div className="rd-tools">
        {/* 언어 전환은 2단계(WS2)가 사전과 함께 연결한다. 자리와 모양만 허브와 같다. */}
        <button aria-label="English로 보기" className="rd-lang" type="button">
          English
        </button>
      </div>
    </header>
  )
}

export function Instruction({ sheet }: { sheet: PracticeSheet }) {
  const { problem } = sheet.sample
  return (
    <div className="rd-instruction-block">
      <p className="rd-instruction">
        {problem.prompt} 이번 기호: <strong>{sheet.sample.focusMark}</strong>
      </p>
      <p className="rd-teaching">{problem.teaching.howTo}</p>
    </div>
  )
}

export function TargetPanel({
  sheet,
  title = "목표",
}: {
  sheet: PracticeSheet
  title?: string
}) {
  const headingId = useId()
  const { target } = sheet.sample.problem
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-target"
      data-testid="rd-target"
    >
      <h2 className="rd-panel__title" id={headingId}>
        {title}
      </h2>
      <div className="rd-doc">
        <RenderedDocumentBody source={target} />
      </div>
      {sheet.answerShown ? (
        <pre className="rd-answer" data-testid="rd-answer">
          <code>{target}</code>
        </pre>
      ) : null}
    </section>
  )
}

export function MyRenderPanel({ source }: { source: string }) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-mine"
      data-testid="rd-mine"
    >
      <h2 className="rd-panel__title" id={headingId}>
        내가 쓴 것
      </h2>
      <div className="rd-doc">
        <RenderedDocumentBody source={source} />
      </div>
    </section>
  )
}

export function PreviewPanel({ source }: { source: string }) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-preview"
      data-testid="rd-preview"
    >
      <h2 className="rd-panel__title" id={headingId}>
        미리보기
      </h2>
      <div className="rd-doc">
        <RenderedDocumentBody
          emptyMessage="아직 쓴 것이 없다."
          source={source}
        />
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

export function EditorPanel({ sheet }: { sheet: PracticeSheet }) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      className="rd-panel rd-editor"
      data-testid="rd-editor"
    >
      <h2 className="rd-panel__title" id={headingId}>
        내 마크다운
      </h2>
      <MarkdownSourceEditor
        active={false}
        flaggedLines={flaggedLinesOf(sheet.verdict)}
        label="내 마크다운"
        onChange={sheet.changeDraft}
        // 통과한 뒤에는 같은 단축키가 판정 바의 "다음 장"과 같은 일을 한다.
        onCheck={sheet.verdict?.kind === "pass" ? sheet.next : sheet.check}
        placeholder="여기에 마크다운을 쓴다"
        value={sheet.draft}
      />
    </section>
  )
}

function statusText(sheet: PracticeSheet): string {
  if (sheet.hintShown) return sheet.sample.problem.hints[0]
  const { verdict } = sheet
  if (!verdict) return ""
  if (verdict.kind === "retry") {
    return retryMessage(verdict.message, verdict.lines)
  }
  const review = verdict.reviews[0]
  return `통과 — ${sheet.sample.focusMark} 기호를 바르게 썼다.${review ? ` ${review}` : ""}`
}

export function VerdictBar({
  sheet,
  className = "",
  extra,
}: {
  sheet: PracticeSheet
  className?: string
  /** Variant B puts 건너뛰기 beside the hint; the others have nothing extra. */
  extra?: ReactNode
}) {
  const passed = sheet.verdict?.kind === "pass"
  const tone = sheet.hintShown ? "hint" : (sheet.verdict?.kind ?? "idle")
  const shortcut = resolveActionShortcut(navigatorLike)
  const keyLabel = getPlatformFamily(navigatorLike) === "apple" ? "⌘↩" : "Ctrl+↩"
  const text = statusText(sheet)

  return (
    <div
      className={`rd-bar rd-bar--${tone} ${className}`.trim()}
      data-testid="rd-bar"
      data-tone={tone}
    >
      <div className="rd-bar__inner">
        <div className="rd-bar__left">
          <button
            aria-pressed={sheet.hintShown}
            className="rd-btn rd-btn--ghost"
            onClick={sheet.toggleHint}
            type="button"
          >
            힌트
          </button>
          {sheet.canShowAnswer ? (
            <button
              className="rd-btn rd-btn--ghost"
              onClick={sheet.showAnswer}
              type="button"
            >
              정답 보기
            </button>
          ) : null}
          {extra}
        </div>
        <p
          aria-atomic="true"
          aria-live="polite"
          className="rd-bar__status"
          data-testid="rd-status"
          role="status"
        >
          {text}
        </p>
        {passed ? (
          <button
            aria-keyshortcuts={shortcut.ariaKeyShortcuts}
            className="rd-btn rd-btn--primary"
            onClick={sheet.next}
            type="button"
          >
            다음 장 <kbd aria-hidden="true">{keyLabel}</kbd>
          </button>
        ) : (
          <button
            aria-keyshortcuts={shortcut.ariaKeyShortcuts}
            className="rd-btn rd-btn--primary"
            onClick={sheet.check}
            type="button"
          >
            확인 <kbd aria-hidden="true">{keyLabel}</kbd>
          </button>
        )}
      </div>
    </div>
  )
}
