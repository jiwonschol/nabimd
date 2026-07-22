import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { GradableProblem } from "../content/types"
import type { Evaluation } from "../engine/types"
import { buildReviewCorrections } from "../feedback/reviewCorrections"
import type { LearningSession } from "../session/learningSession"
import { playFeedbackSound } from "../sound/feedbackSound"

type VerdictNoticeProps = {
  evaluation: Evaluation | null
  draft: string
  phase: LearningSession["phase"]
  problem: GradableProblem
}

const MATCHED_FLASH_MS = 1600

export function VerdictNotice({
  evaluation,
  draft,
  phase,
  problem,
}: VerdictNoticeProps) {
  const [matchedVisible, setMatchedVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const previousStatus = useRef<Evaluation["status"] | null>(null)
  const soundedEvaluation = useRef<Evaluation | null>(null)

  useEffect(() => {
    if (!evaluation) {
      previousStatus.current = null
      soundedEvaluation.current = null
      setMatchedVisible(false)
      return
    }
    if (
      soundedEvaluation.current !== evaluation &&
      (evaluation.status === "fail" ||
        previousStatus.current !== "matched")
    ) {
      playFeedbackSound(evaluation.status === "matched" ? "matched" : "retry")
    }
    soundedEvaluation.current = evaluation
    previousStatus.current = evaluation.status
    if (evaluation.status !== "matched") return
    setMatchedVisible(true)
    const timer = window.setTimeout(
      () => setMatchedVisible(false),
      MATCHED_FLASH_MS,
    )
    return () => window.clearTimeout(timer)
  }, [evaluation])

  // Each fresh Check reopens the holding panel even after an explicit close.
  useEffect(() => {
    setDismissed(false)
  }, [evaluation])

  // The failed verdict holds: it stays until the learner starts retyping
  // (phase leaves "evaluated") or closes it, instead of vanishing on a timer.
  const holding =
    evaluation?.status === "fail" && phase === "evaluated" && !dismissed

  useEffect(() => {
    if (!holding) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return
      }
      event.preventDefault()
      setDismissed(true)
    }
    document.addEventListener("keydown", closeOnEscape, true)
    return () => document.removeEventListener("keydown", closeOnEscape, true)
  }, [holding])

  if (evaluation?.status === "fail") {
    if (!holding) return null
    const corrections = buildReviewCorrections(problem, evaluation, draft)
    const correction = corrections.at(0)

    return (
      <div
        aria-atomic="true"
        aria-live="polite"
        className="verdict-notice verdict-notice--retry verdict-notice--holding"
        role="status"
      >
        <div className="verdict-notice__verdict">
          <strong>Try again</strong>
          <span>
            {corrections.length > 1
              ? `${corrections.length} marks need fixing.`
              : "One part needs a Markdown mark."}
          </span>
        </div>
        {correction ? (
          <div className="verdict-notice__correction">
            <h4>
              {correction.label}
              <small>{correction.location}</small>
            </h4>
            {correction.learnerExcerpt ? (
              <span className="verdict-notice__source">
                You wrote <code>{correction.learnerExcerpt}</code>
              </span>
            ) : null}
            {correction.requiredSource ? (
              <span className="verdict-notice__source">
                Use <code>{correction.requiredSource}</code>
              </span>
            ) : null}
            <p>{correction.repairInstruction}</p>
            {corrections.length > 1 ? (
              <p className="verdict-notice__more">
                {corrections.length - 1} more in the Review tab
              </p>
            ) : null}
          </div>
        ) : null}
        <button
          aria-label="Close verdict"
          className="verdict-notice__close"
          onClick={() => setDismissed(true)}
          type="button"
        >
          <X aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>
    )
  }

  if (!evaluation || !matchedVisible) return null

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="verdict-notice verdict-notice--matched"
      role="status"
    >
      <strong>Matched</strong>
      <span>The Markdown structure is correct.</span>
    </div>
  )
}
