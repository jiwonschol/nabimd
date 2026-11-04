import { type FormEvent, useId, useRef, useState } from "react"
import {
  SUMMARY_FEEDBACK_MAX_LENGTH,
  submitSummaryFeedback,
} from "../feedback/summaryFeedback"
import { useText } from "../i18n/useText"

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
  const { t } = useText()
  const fieldId = useId()
  const privacyId = useId()
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
      <p aria-live="polite" className="rd-feedback__sent" data-testid="feedback-sent">
        {t("feedback.sent")}
      </p>
    )
  }

  return (
    <form className="rd-feedback" onSubmit={submit}>
      <div className="rd-feedback__head">
        <p className="rd-feedback__lead">{t("feedback.lead")}</p>
        <span aria-live="polite" className="rd-feedback__count">
          {t("feedback.count", {
            count: message.length,
            max: SUMMARY_FEEDBACK_MAX_LENGTH,
          })}
        </span>
      </div>

      <label className="visually-hidden" htmlFor={fieldId}>
        {t("feedback.label")}
      </label>
      <textarea
        aria-describedby={privacyId}
        className="rd-feedback__field"
        disabled={submissionState === "submitting"}
        id={fieldId}
        maxLength={SUMMARY_FEEDBACK_MAX_LENGTH}
        onChange={(event) => {
          setMessage(event.target.value)
          if (submissionState !== "idle") setSubmissionState("idle")
        }}
        placeholder={t("feedback.placeholder")}
        rows={3}
        value={message}
      />

      <div className="rd-feedback__foot">
        <p className="rd-feedback__privacy" id={privacyId}>
          {t("feedback.privacy")}
        </p>
        <button
          className="rd-btn rd-btn--ghost"
          disabled={!trimmedMessage || submissionState === "submitting"}
          type="submit"
        >
          {submissionState === "submitting"
            ? t("feedback.sending")
            : t("feedback.send")}
        </button>
      </div>

      {submissionState === "limited" ? (
        <p aria-live="polite" className="rd-feedback__status">
          {t("feedback.limited")}
        </p>
      ) : null}
      {submissionState === "error" ? (
        <p aria-live="polite" className="rd-feedback__status">
          {t("feedback.error")}
        </p>
      ) : null}

      <input
        aria-hidden="true"
        autoComplete="off"
        className="rd-feedback__honeypot"
        name="website"
        onChange={(event) => setWebsite(event.target.value)}
        tabIndex={-1}
        type="text"
        value={website}
      />
    </form>
  )
}
