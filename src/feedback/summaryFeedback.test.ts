import { afterEach, expect, it, vi } from "vitest"
import { submitSummaryFeedback } from "./summaryFeedback"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it("ends a stalled submission after 15 seconds so the form can offer retry", async () => {
  vi.useFakeTimers()
  let signal: AbortSignal | null | undefined
  vi.stubGlobal("fetch", vi.fn((_input: RequestInfo, init?: RequestInit) => {
    signal = init?.signal
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))
    })
  }))
  const result = submitSummaryFeedback({
    submissionId: "60974476-aaf5-4ae0-9bc2-5d30cb17ceba",
    message: "Keep my note", level: 1, score: 5, total: 5,
    appRevision: "test", website: "",
  }).then(() => "sent", () => "unknown")
  await vi.advanceTimersByTimeAsync(15_000)
  expect(signal?.aborted).toBe(true)
  await expect(result).resolves.toBe("unknown")
})
