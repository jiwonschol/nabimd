import { Component, type ErrorInfo, type ReactNode } from "react"
import { reportError } from "../monitoring/errorMonitoring"
import { sanitizeMessage } from "../monitoring/scrubEvent"
import { resolveBrowserStorage } from "../progress/browserStorage"
import {
  clearPersistedDrafts,
  PROGRESS_STORAGE_KEY,
} from "../progress/progressStore"

const ISSUE_URL = "https://github.com/jiwonschol/nabimd/issues/new"

type ErrorBoundaryProps = {
  children: ReactNode
  /** Names which boundary caught it, so reports can be told apart. */
  boundary?: string
}

type ErrorBoundaryState = {
  error: Error | null
}

/** The authored problem id, which tells us which exercise broke. */
function readCurrentProblemId(): string | undefined {
  try {
    const saved = resolveBrowserStorage().getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return undefined
    const parsed: unknown = JSON.parse(saved)
    if (typeof parsed !== "object" || parsed === null) return undefined
    const id = (parsed as { currentProblemId?: unknown }).currentProblemId
    return typeof id === "string" ? id : undefined
  } catch {
    return undefined
  }
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
      problemId: readCurrentProblemId(),
    })
    // Keeps the component trace in the browser console for local debugging; it
    // is not sent anywhere.
    console.error("Nabi Markdown stopped:", error, info.componentStack)
  }

  private readonly retry = () => {
    this.setState({ error: null })
  }

  private readonly clearDraftsAndReload = () => {
    clearPersistedDrafts(resolveBrowserStorage())
    window.location.reload()
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    const problemId = readCurrentProblemId()

    return (
      <div className="error-screen" role="alert">
        <div className="error-screen__panel">
          <h1 className="error-screen__title">Something went wrong.</h1>
          <p className="error-screen__lead">
            Nabi Markdown stopped before it could finish drawing this page. Your
            saved progress is still here.
          </p>

          <div className="error-screen__actions">
            <button
              className="error-screen__button error-screen__button--primary"
              onClick={this.retry}
              type="button"
            >
              Try again
            </button>
            <button
              className="error-screen__button"
              onClick={this.clearDraftsAndReload}
              type="button"
            >
              Clear saved answers and reload
            </button>
          </div>

          <p className="error-screen__hint">
            If “Try again” keeps landing back here, the answer saved for this
            exercise is what triggers it — clearing saved answers gets you
            moving again. Your levels and completed exercises are kept.
          </p>

          <details className="error-screen__details">
            <summary>Technical detail</summary>
            <dl className="error-screen__facts">
              <dt>Error</dt>
              <dd>{error.name}</dd>
              <dt>Detail</dt>
              <dd>{error.message || "(none)"}</dd>
              {problemId ? (
                <>
                  <dt>Exercise</dt>
                  <dd>{problemId}</dd>
                </>
              ) : null}
              <dt>Build</dt>
              <dd>{__BUILD_SHA__.slice(0, 12)}</dd>
            </dl>
          </details>

          <p className="error-screen__report">
            <a
              href={buildIssueUrl(error, problemId)}
              rel="noreferrer"
              target="_blank"
            >
              Report this on GitHub
            </a>{" "}
            — the form opens with the technical detail filled in. It asks for
            the Markdown you typed, but that field starts empty: paste it only
            if you are happy for it to be public.
          </p>
        </div>
      </div>
    )
  }
}
