import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"

type HelpPanelProps = {
  coach: LearningSession["coach"]
  evaluation: Evaluation | null
  hintLevel: LearningSession["hintLevel"]
  hints: readonly [string, string, string]
  syntaxTokens: readonly string[]
  onClose: () => void
  onNextHint: () => void
  onOpenHint: () => void
}

export function HelpPanel({
  coach,
  evaluation,
  hintLevel,
  hints,
  syntaxTokens,
  onClose,
  onNextHint,
  onOpenHint,
}: HelpPanelProps) {
  const isOpen = coach !== "closed"
  const isReview = coach === "review"
  const label = isReview ? "Review" : "Hint"
  const actionLabel = isOpen ? `Hide ${label.toLowerCase()}` : "Show hint"
  const reviewItems =
    evaluation?.status === "matched" ? evaluation.reviewItems : []
  const visibleHint = hints[Math.max(0, hintLevel - 1)]

  return (
    <aside aria-label="Help" className={`help-panel help-panel--${coach}`}>
      <button
        aria-controls="help-panel-body"
        aria-expanded={isOpen}
        aria-label={actionLabel}
        className="help-panel__toggle"
        onClick={isOpen ? onClose : onOpenHint}
        type="button"
      >
        <span>{label}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen ? (
        <div className="help-panel__body" id="help-panel-body">
          {isReview ? (
            <ul className="help-panel__review-list">
              {reviewItems.map((item) => (
                <li key={item.id}>{item.message}</li>
              ))}
            </ul>
          ) : (
            <>
              <div aria-label="Heading syntax" className="syntax-sequence">
                {syntaxTokens.map((token) => (
                  <code key={token}>{token}</code>
                ))}
              </div>
              {evaluation?.status === "fail" ? (
                <div className="help-panel__coaching">
                  <p>{visibleHint}</p>
                  <p className="help-panel__step">{hintLevel} / 3</p>
                  {hintLevel < 3 ? (
                    <button
                      className="text-button"
                      onClick={onNextHint}
                      type="button"
                    >
                      Next hint
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </aside>
  )
}
