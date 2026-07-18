import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import { useEffect, useRef } from "react"
import { resolveCheckShortcut } from "./keyboardShortcut"

type StatusBarProps = {
  phase: LearningSession["phase"]
  evaluation: Evaluation | null
  hadFailure: boolean
  canCheck: boolean
  onCheck: () => void
  onNext: () => void
  onReview: () => void
}

function statusMessage(
  phase: LearningSession["phase"],
  evaluation: Evaluation | null,
): string {
  if (phase === "complete") return "Heading practice complete."
  if (!evaluation) return "Write the heading, then check your work."
  if (evaluation.status === "fail") return evaluation.message
  return "Matched. Your Markdown uses the requested skill."
}

export function StatusBar({
  phase,
  evaluation,
  hadFailure,
  canCheck,
  onCheck,
  onNext,
  onReview,
}: StatusBarProps) {
  const failed = evaluation?.status === "fail"
  const matched = evaluation?.status === "matched"
  const passed = matched
  const hasReview = matched && evaluation.reviewItems.length > 0
  const primaryActionRef = useRef<HTMLButtonElement>(null)
  const shortcut = resolveCheckShortcut(
    typeof navigator === "undefined" ? {} : navigator,
  )

  useEffect(() => {
    if (passed) primaryActionRef.current?.focus()
  }, [passed])

  if (phase === "complete") return null

  return (
    <footer className="status-bar">
      <p aria-live="polite" className="status-bar__message">
        {failed ? <strong>Try again: </strong> : null}
        <span>{statusMessage(phase, evaluation)}</span>
      </p>
      <div className="status-bar__actions">
        {hasReview ? (
          <button className="text-button" onClick={onReview} type="button">
            Review
          </button>
        ) : null}
        <button
          aria-keyshortcuts={passed ? undefined : shortcut.ariaKeyShortcuts}
          className="primary-button"
          disabled={!passed && !canCheck}
          onClick={passed ? onNext : onCheck}
          ref={primaryActionRef}
          type="button"
        >
          <span>
            {passed
              ? "Next"
              : failed || hadFailure
                ? "Check again"
                : "Check"}
          </span>
          {passed ? null : (
            <span aria-hidden="true" className="primary-button__shortcut">
              {shortcut.label}
            </span>
          )}
        </button>
      </div>
    </footer>
  )
}
