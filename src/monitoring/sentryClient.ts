import { captureException, init, withScope } from "@sentry/browser"
import type { NabiErrorContext } from "./scrubEvent"

/**
 * The only module that touches the SDK.
 *
 * It uses static named imports so the bundler can drop everything we do not
 * call. That matters more than it looks: pulling the SDK in as a namespace
 * (`import * as Sentry`) defeats tree shaking and drags Session Replay and the
 * user-feedback widget in with it — measured at 156 KB gzipped rather than the
 * ~30 KB an errors-only client costs. `errorMonitoring` imports *this* module
 * dynamically, which is what puts the SDK in its own chunk.
 */

export type CaptureFn = (error: unknown, context: NabiErrorContext) => void

export type StartSentryOptions = {
  dsn: string
  release: string
  /** Returns the event to send, or null to drop it. See `scrubEvent`. */
  beforeSend: (event: unknown) => unknown
}

export function startSentry({
  dsn,
  release,
  beforeSend,
}: StartSentryOptions): CaptureFn {
  init({
    dsn,
    release,
    environment: "production",
    sendDefaultPii: false,
    // Exceptions only. Tracing and replay are never loaded.
    tracesSampleRate: 0,
    normalizeDepth: 1,
    maxValueLength: 300,
    integrations: (defaults) =>
      defaults.filter(
        (integration) =>
          // Records DOM interaction and console output — both can carry the
          // learner's typing verbatim.
          integration.name !== "Breadcrumbs" &&
          // Attaches the request URL and headers.
          integration.name !== "HttpContext" &&
          // Release-health pings we have no use for.
          integration.name !== "BrowserSession",
      ),
    beforeBreadcrumb: () => null,
    beforeSend: (event) => beforeSend(event) as typeof event | null,
  })

  return (error, context) => {
    withScope((scope) => {
      scope.setContext("nabi", { ...context })
      if (context.problemId) scope.setTag("problemId", context.problemId)
      if (context.boundary) scope.setTag("boundary", context.boundary)
      captureException(error)
    })
  }
}
