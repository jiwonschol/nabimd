export const SUMMARY_FEEDBACK_MAX_LENGTH = 500

export type SummaryFeedbackPayload = {
  message: string
  level: number
  score: number
  total: number
  appRevision: string
  website: string
}

export async function submitSummaryFeedback(
  payload: SummaryFeedbackPayload,
): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  })

  if (response.ok) return
  if (response.status === 429) {
    throw new Error("rate-limited")
  }
  throw new Error("feedback-submit-failed")
}
