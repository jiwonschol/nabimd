import { scrubEvent, type NabiErrorContext } from "./scrubEvent"
import type { CaptureFn } from "./sentryClient"

/**
 * Error monitoring, wired so the app never depends on it.
 *
 * Three deliberate constraints:
 *
 * 1. The SDK is reached through a dynamic import of `sentryClient`, so it lands
 *    in its own chunk and the first paint never waits on it.
 * 2. Every outgoing event goes through `scrubEvent`, which rebuilds it from an
 *    allowlist. See that module for why.
 * 3. A page load may send at most MAX_EVENTS_PER_PAGE_LOAD events. A bug inside
 *    a render path can fire hundreds of times in one session, and the free
 *    plan's monthly quota is shared with the other projects in the org — a loop
 *    here must not silence error reporting everywhere else.
 */

const dsn = import.meta.env.VITE_SENTRY_DSN

const MAX_EVENTS_PER_PAGE_LOAD = 5

/** Errors raised before the SDK finishes loading, replayed once it has. */
const MAX_PENDING = 3

type PendingReport = { error: unknown; context: NabiErrorContext }

let sentEventCount = 0
let status: "idle" | "loading" | "ready" | "disabled" = "idle"
let capture: CaptureFn | null = null
const pending: PendingReport[] = []

/**
 * Load and configure the SDK. Safe to call when no DSN is configured — local
 * dev and preview deployments simply run without it.
 */
export async function startErrorMonitoring(): Promise<boolean> {
  if (!dsn) {
    status = "disabled"
    return false
  }
  if (status !== "idle") return status === "ready"
  status = "loading"

  try {
    const { startSentry } = await import("./sentryClient")

    capture = startSentry({
      dsn,
      // The commit, not the package version: this is what production health
      // compares against, so a report points at an exact deployed build.
      release: __BUILD_SHA__,
      beforeSend: (event) => {
        if (sentEventCount >= MAX_EVENTS_PER_PAGE_LOAD) return null
        const scrubbed = scrubEvent(event as Record<string, unknown>)
        if (scrubbed === null) return null
        sentEventCount += 1
        return scrubbed
      },
    })

    status = "ready"
    for (const report of pending.splice(0)) {
      capture(report.error, report.context)
    }
    return true
  } catch {
    // A blocked or failed SDK chunk must not take the app down with it.
    status = "disabled"
    pending.length = 0
    return false
  }
}

/**
 * Report an error. A no-op when monitoring is disabled, and queued (briefly)
 * while the SDK is still loading — early boot errors are the ones worth having.
 */
export function reportError(
  error: unknown,
  context: NabiErrorContext = {},
): void {
  if (status === "disabled") return
  if (capture) {
    capture(error, context)
    return
  }
  if (pending.length < MAX_PENDING) pending.push({ error, context })
}

/**
 * Shape-only facts about a draft: how big it is and roughly what is in it.
 * Never the text. This is what a grading or rendering bug needs to reproduce.
 */
export function describeDraft(draft: string): NabiErrorContext {
  return {
    draftLength: draft.length,
    draftLineCount: draft === "" ? 0 : draft.split("\n").length,
    hasCodeFence: /^ {0,3}(?:`{3,}|~{3,})/m.test(draft),
  }
}
