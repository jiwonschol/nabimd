import { type FormEvent, useRef, useState } from "react"
import {
  SUMMARY_FEEDBACK_MAX_LENGTH,
  submitSummaryFeedback,
} from "../feedback/summaryFeedback"

type SummaryFeedbackFormProps = {
  level: number
  score: number
  total: number
}

type SubmissionState = "idle" | "submitting" | "sent" | "error" | "limited"

export function SummaryFeedbackForm({
  level,
  score,
  total,
}: SummaryFeedbackFormProps) {
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const lastSubmission = useRef<{ content: string; id: string } | null>(null)
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle")
  const trimmedMessage = message.trim()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedMessage || submissionState === "submitting") return

    setSubmissionState("submitting")
    try {
      const payload = {
        message: trimmedMessage,
        level,
        score,
        total,
        appRevision: __BUILD_SHA__,
      }
      const content = JSON.stringify(payload)
      if (lastSubmission.current?.content !== content) {
        lastSubmission.current = { content, id: crypto.randomUUID() }
      }
      const request = {
        ...payload,
        website,
        submissionId: lastSubmission.current.id,
      }
      await submitSummaryFeedback(request)
      setSubmissionState("sent")
    } catch (error) {
      setSubmissionState(
        error instanceof Error && error.message === "rate-limited"
          ? "limited"
          : "error",
      )
    }
  }

  if (submissionState === "sent") {
    return (
      <section
        aria-live="polite"
        className="run-summary__feedback run-summary__feedback--sent summary-ink summary-ink--actions"
      >
        <h3>Thank you.</h3>
        <p>Your note was sent.</p>
      </section>
    )
  }

  return (
    <form
      className="run-summary__feedback summary-ink summary-ink--actions"
      onSubmit={submit}
    >
      <div className="run-summary__feedback-heading">
        <div>
          <h3>Leave a note</h3>
          <p>Found a bug, have an improvement, or want to share how it felt?</p>
        </div>
        <span aria-live="polite">
          {message.length} / {SUMMARY_FEEDBACK_MAX_LENGTH}
        </span>
      </div>

      <label className="visually-hidden" htmlFor="summary-feedback">
        Bug report, improvement, or impression
      </label>
      <textarea
        aria-describedby="summary-feedback-privacy"
        disabled={submissionState === "submitting"}
        id="summary-feedback"
        maxLength={SUMMARY_FEEDBACK_MAX_LENGTH}
        onChange={(event) => {
          setMessage(event.target.value)
          if (submissionState !== "idle") setSubmissionState("idle")
        }}
        placeholder="What should we know?"
        rows={3}
        value={message}
      />

      <div className="run-summary__feedback-footer">
        <p id="summary-feedback-privacy">
          We keep your note, level, score, and app revision for up to 90 days.
          Your answer and account are not sent, and your IP is not saved with
          the note.
        </p>
        <button
          className="text-button run-summary__feedback-submit"
          disabled={!trimmedMessage || submissionState === "submitting"}
          type="submit"
        >
          {submissionState === "submitting" ? "Sending…" : "Send note"}
        </button>
      </div>

      {submissionState === "limited" ? (
        <p aria-live="polite" className="run-summary__feedback-status">
          Too many notes were sent from this network. Please try again in a
          minute.
        </p>
      ) : null}
      {submissionState === "error" ? (
        <p aria-live="polite" className="run-summary__feedback-status">
          We couldn’t confirm whether your note was sent. Your text is still here.
        </p>
      ) : null}

      <input
        aria-hidden="true"
        autoComplete="off"
        className="run-summary__feedback-honeypot"
        name="website"
        onChange={(event) => setWebsite(event.target.value)}
        tabIndex={-1}
        type="text"
        value={website}
      />
    </form>
  )
}
