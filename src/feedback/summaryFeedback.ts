export const SUMMARY_FEEDBACK_MAX_LENGTH = 500

export type SummaryFeedbackPayload = {
  submissionId: string
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
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (response.ok) return
    if (response.status === 429) {
      throw new Error("rate-limited")
    }
    throw new Error("feedback-submit-failed")
  } finally {
    clearTimeout(timeout)
  }
}
