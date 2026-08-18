import { describe, expect, it } from "vitest"
import {
  REDACTED_MESSAGE,
  sanitizeMessage,
  scrubEvent,
  type ScrubbableEvent,
} from "./scrubEvent"

/** Text only a learner could have written. Must never survive scrubbing. */
const LEARNER_MARKDOWN = [
  "# My private diary entry",
  "",
  "- I am worried about my medical appointment on Tuesday",
  "- password hunter2 for the library site",
  "",
  "> Please do not share this with anyone.",
].join("\n")

/**
 * An event with the learner's writing stuffed into every slot the SDK is known
 * to populate, plus a few it does not, standing in for whatever a future
 * version adds.
 */
function eventCarryingLearnerText(): ScrubbableEvent {
  return {
    event_id: "abc123",
    timestamp: 1_700_000_000,
    platform: "javascript",
    level: "error",
    release: "0.1.0",
    environment: "production",
    message: LEARNER_MARKDOWN,
    exception: {
      values: [
        {
          type: "TypeError",
          value: `Cannot parse: ${LEARNER_MARKDOWN}`,
          mechanism: { type: "onerror", handled: false },
          stacktrace: {
            frames: [
              {
                filename: "/assets/index-abc.js",
                function: "buildDecorations",
                lineno: 286,
                colno: 12,
                in_app: true,
                context_line: LEARNER_MARKDOWN,
                pre_context: [LEARNER_MARKDOWN],
                post_context: [LEARNER_MARKDOWN],
                vars: { draft: LEARNER_MARKDOWN },
              },
            ],
          },
        },
      ],
    },
    request: {
      url: `https://nabimd.vercel.app/?draft=${encodeURIComponent(LEARNER_MARKDOWN)}`,
      headers: { Cookie: "session=secret" },
      data: LEARNER_MARKDOWN,
    },
    user: { id: "u1", email: "learner@example.com", ip_address: "203.0.113.7" },
    breadcrumbs: [
      { category: "ui.input", message: LEARNER_MARKDOWN },
      { category: "console", message: LEARNER_MARKDOWN },
    ],
    extra: { draft: LEARNER_MARKDOWN, progress: { d: LEARNER_MARKDOWN } },
    contexts: {
      nabi: {
        problemId: "l1-heading-apple",
        level: 1,
        draftLength: 128,
        draftLineCount: 6,
        hasCodeFence: false,
        boundary: "app-root",
        draft: LEARNER_MARKDOWN,
      },
      state: { state: { value: { draft: LEARNER_MARKDOWN } } },
      device: { name: "Jiwon's MacBook Pro" },
    },
    server_name: "Jiwon-MacBook",
    sdkProcessingMetadata: { request: { body: LEARNER_MARKDOWN } },
    someFutureFieldTheSdkHasNotInventedYet: LEARNER_MARKDOWN,
  }
}

describe("scrubEvent", () => {
  it("lets no fragment of the learner's writing through", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText())
    const serialized = JSON.stringify(scrubbed)

    // Every distinctive line, not just the whole blob, so a partial copy fails.
    for (const line of LEARNER_MARKDOWN.split("\n").filter(Boolean)) {
      expect(serialized).not.toContain(line)
    }
    expect(serialized).not.toContain("hunter2")
    expect(serialized).not.toContain("medical appointment")
    expect(serialized).not.toContain("diary")
  })

  it("drops every container the learner's text could hide in", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText()) as Record<
      string,
      unknown
    >

    expect(scrubbed.request).toBeUndefined()
    expect(scrubbed.user).toBeUndefined()
    expect(scrubbed.breadcrumbs).toBeUndefined()
    expect(scrubbed.extra).toBeUndefined()
    expect(scrubbed.message).toBeUndefined()
    expect(scrubbed.server_name).toBeUndefined()
    expect(scrubbed.sdkProcessingMetadata).toBeUndefined()
  })

  it("drops unknown top-level fields rather than copying them", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText()) as Record<
      string,
      unknown
    >
    expect(scrubbed.someFutureFieldTheSdkHasNotInventedYet).toBeUndefined()
  })

  it("strips frame vars and source excerpts but keeps where the code was", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText())
    const frame = scrubbed?.exception?.values[0]?.stacktrace?.frames?.[0] as
      | Record<string, unknown>
      | undefined

    expect(frame?.filename).toBe("/assets/index-abc.js")
    expect(frame?.function).toBe("buildDecorations")
    expect(frame?.lineno).toBe(286)
    expect(frame?.vars).toBeUndefined()
    expect(frame?.context_line).toBeUndefined()
    expect(frame?.pre_context).toBeUndefined()
    expect(frame?.post_context).toBeUndefined()
  })

  it("keeps only the named shape facts inside the nabi context", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText())
    expect(scrubbed?.contexts?.nabi).toEqual({
      problemId: "l1-heading-apple",
      level: 1,
      draftLength: 128,
      draftLineCount: 6,
      hasCodeFence: false,
      boundary: "app-root",
    })
    expect(scrubbed?.contexts).not.toHaveProperty("state")
    expect(scrubbed?.contexts).not.toHaveProperty("device")
  })

  it("keeps the exception type even when the message is redacted", () => {
    const scrubbed = scrubEvent(eventCarryingLearnerText())
    expect(scrubbed?.exception?.values[0]?.type).toBe("TypeError")
    expect(scrubbed?.exception?.values[0]?.value).toBe(REDACTED_MESSAGE)
  })

  it("returns null when there is no exception left to report", () => {
    expect(scrubEvent({ message: LEARNER_MARKDOWN })).toBeNull()
    expect(scrubEvent({ exception: { values: [] } })).toBeNull()
  })
})

describe("sanitizeMessage", () => {
  it("keeps messages this app throws itself", () => {
    expect(sanitizeMessage("Root element not found")).toBe(
      "Root element not found",
    )
    expect(sanitizeMessage("Unknown problem: l1-heading-apple")).toBe(
      "Unknown problem: l1-heading-apple",
    )
    expect(sanitizeMessage("Unknown curriculum level: 3")).toBe(
      "Unknown curriculum level: 3",
    )
  })

  it("keeps the CodeMirror decoration invariants we expect to hit", () => {
    const message =
      "Ranges must be added sorted by `from` position and `startSide`"
    expect(sanitizeMessage(message)).toBe(message)
    expect(sanitizeMessage("Position 42 is out of range for document of length 7"))
      .toBe("Position 42 is out of range for document of length 7")
  })

  it("keeps runtime messages that name code rather than content", () => {
    expect(
      sanitizeMessage("Cannot read properties of undefined (reading 'slice')"),
    ).toBe("Cannot read properties of undefined (reading 'slice')")
    expect(sanitizeMessage("view.dispatch is not a function")).toBe(
      "view.dispatch is not a function",
    )
  })

  it("redacts anything not on the allowlist, including plausible prose", () => {
    expect(sanitizeMessage("Failed to parse: # My heading")).toBe(
      REDACTED_MESSAGE,
    )
    expect(sanitizeMessage(LEARNER_MARKDOWN)).toBe(REDACTED_MESSAGE)
    expect(sanitizeMessage("Something unexpected happened")).toBe(
      REDACTED_MESSAGE,
    )
  })

  it("ignores non-strings and blanks", () => {
    expect(sanitizeMessage(undefined)).toBeUndefined()
    expect(sanitizeMessage(42)).toBeUndefined()
    expect(sanitizeMessage("   ")).toBeUndefined()
  })
})
