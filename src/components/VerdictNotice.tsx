import { useEffect, useRef, useState } from "react"
import type { Evaluation } from "../engine/types"
import { playSuccessSound } from "../sound/successSound"

type VerdictNoticeProps = {
  evaluation: Evaluation | null
}

export function VerdictNotice({ evaluation }: VerdictNoticeProps) {
  const [visible, setVisible] = useState(false)
  const previousStatus = useRef<Evaluation["status"] | null>(null)

  useEffect(() => {
    if (!evaluation) {
      previousStatus.current = null
      setVisible(false)
      return
    }
    if (
      previousStatus.current !== "matched" &&
      evaluation.status === "matched"
    ) {
      playSuccessSound()
    }
    previousStatus.current = evaluation.status
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 1600)
    return () => window.clearTimeout(timer)
  }, [evaluation])

  if (!evaluation || !visible) return null
  const matched = evaluation.status === "matched"

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className={`verdict-notice verdict-notice--${matched ? "matched" : "retry"}`}
      role="status"
    >
      <strong>{matched ? "Matched" : "Try again"}</strong>
      <span>
        {matched
          ? "The Markdown structure is correct."
          : "One part needs a Markdown mark."}
      </span>
    </div>
  )
}
