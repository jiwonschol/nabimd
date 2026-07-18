import { useEffect, useState } from "react"
import type { Evaluation } from "../engine/types"

type VerdictNoticeProps = {
  evaluation: Evaluation | null
}

export function VerdictNotice({ evaluation }: VerdictNoticeProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!evaluation) {
      setVisible(false)
      return
    }
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

