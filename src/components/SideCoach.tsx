import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"

type SideCoachProps = {
  coach: LearningSession["coach"]
  evaluation: Evaluation | null
  hintLevel: LearningSession["hintLevel"]
  hints: readonly [string, string, string]
  onClose: () => void
  onNextHint: () => void
}

export function SideCoach({
  coach,
  evaluation,
  hintLevel,
  hints,
  onClose,
  onNextHint,
}: SideCoachProps) {
  if (coach === "closed") return null

  const isHint = coach === "hint"
  const visibleHint = hints[Math.max(0, hintLevel - 1)]
  const reviewItems =
    evaluation?.status === "matched" ? evaluation.reviewItems : []

  return (
    <aside aria-label="Coach" className="side-coach">
      <div className="side-coach__header">
        <h2>{isHint ? "Hint" : "Review"}</h2>
        <button
          aria-label="Close coach"
          className="side-coach__close"
          onClick={onClose}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      {isHint ? (
        <div className="side-coach__body">
          <p>{visibleHint}</p>
          <p className="side-coach__step">{hintLevel} / 3</p>
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
      ) : (
        <ul className="side-coach__review-list">
          {reviewItems.map((item) => (
            <li key={item.id}>{item.message}</li>
          ))}
        </ul>
      )}
    </aside>
  )
}
