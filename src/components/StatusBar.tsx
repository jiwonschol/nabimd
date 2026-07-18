import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"

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
  if (evaluation.status === "matched") {
    return "Matched. Your Markdown uses the requested skill."
  }
  return "Perfect. Every check for this exercise passed."
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
  if (phase === "complete") return null

  const failed = evaluation?.status === "fail"
  const matched = evaluation?.status === "matched"
  const passed = matched || evaluation?.status === "perfect"

  return (
    <footer className="status-bar">
      <p aria-live="polite" className="status-bar__message">
        {failed ? <strong>Fail: </strong> : null}
        <span>{statusMessage(phase, evaluation)}</span>
      </p>
      <div className="status-bar__actions">
        {matched ? (
          <button className="text-button" onClick={onReview} type="button">
            Review
          </button>
        ) : null}
        <button
          className="primary-button"
          disabled={!passed && !canCheck}
          onClick={passed ? onNext : onCheck}
          type="button"
        >
          {passed
            ? "Next"
            : failed || hadFailure
              ? "Check again"
              : "Check"}
        </button>
      </div>
    </footer>
  )
}
