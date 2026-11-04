import { Component, type ErrorInfo, type ReactNode } from "react"
import { getCurrentProblemId } from "../app/currentProblem"
import { readBrowserLang, translator } from "../i18n/text"
import { reportError } from "../monitoring/errorMonitoring"
import { sanitizeMessage } from "../monitoring/scrubEvent"

const ISSUE_URL = "https://github.com/jiwonschol/nabimd/issues/new"

type ErrorBoundaryProps = {
  children: ReactNode
  /** Names which boundary caught it, so reports can be told apart. */
  boundary?: string
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * Builds a prefilled bug report.
 *
 * The message is put through `sanitizeMessage` first. The learner can see the
 * real message on screen, but the issue tracker is public — prefilling it with
 * text that might contain their own writing would publish it on their behalf.
 * The "what you typed" field is deliberately left empty: pasting it is their
 * decision, made while looking at it.
 */
function buildIssueUrl(error: Error, problemId: string | undefined): string {
  const detail = [
    "The app stopped and showed the error screen.",
    "",
    `- Error: ${error.name}`,
    `- Detail: ${sanitizeMessage(error.message) ?? "(none)"}`,
    `- Build: ${__BUILD_SHA__.slice(0, 12)}`,
    `- Version: ${__APP_VERSION__}`,
  ].join("\n")

  const params = new URLSearchParams({
    template: "bug_report.yml",
    title: `Error screen${problemId ? ` on ${problemId}` : ""}`,
    "what-happened": detail,
  })
  if (problemId) params.set("where", problemId)

  return `${ISSUE_URL}?${params.toString()}`
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, {
      boundary: this.props.boundary ?? "app-root",
      problemId: getCurrentProblemId(),
    })
    // Keeps the component trace in the browser console for local debugging; it
    // is not sent anywhere.
    console.error("Nabi Markdown stopped:", error, info.componentStack)
  }

  private readonly retry = () => {
    this.setState({ error: null })
  }

  private readonly reload = () => {
    window.location.reload()
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    // The boundary sits outside the language provider, so it reads the same
    // stored choice the provider starts from.
    const t = translator(readBrowserLang())
    const problemId = getCurrentProblemId()

    return (
      <div className="error-screen" role="alert">
        <div className="error-screen__panel">
          <h1 className="error-screen__title">{t("error.title")}</h1>
          <p className="error-screen__lead">{t("error.lead")}</p>

          <div className="error-screen__actions">
            <button
              className="rd-btn rd-btn--primary"
              onClick={this.retry}
              type="button"
            >
              {t("error.retry")}
            </button>
            <button
              className="rd-btn rd-btn--ghost"
              onClick={this.reload}
              type="button"
            >
              {t("error.reload")}
            </button>
          </div>

          <details className="error-screen__details">
            <summary>{t("error.details")}</summary>
            <dl className="error-screen__facts">
              <dt>{t("error.name")}</dt>
              <dd>{error.name}</dd>
              <dt>{t("error.message")}</dt>
              <dd>{error.message || t("error.none")}</dd>
              {problemId ? (
                <>
                  <dt>{t("error.problem")}</dt>
                  <dd>{problemId}</dd>
                </>
              ) : null}
              <dt>{t("error.build")}</dt>
              <dd>{__BUILD_SHA__.slice(0, 12)}</dd>
            </dl>
          </details>

          <p className="error-screen__report">
            <a
              href={buildIssueUrl(error, problemId)}
              rel="noreferrer"
              target="_blank"
            >
              {t("error.report")}
            </a>{" "}
            {t("error.reportNote")}
          </p>
        </div>
      </div>
    )
  }
}
