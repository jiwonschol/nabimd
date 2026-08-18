/**
 * The privacy boundary for error reporting.
 *
 * Nabi Markdown grades Markdown the learner wrote, and that text is persisted
 * (`ProgressV5.draftByProblemId`). None of it may reach an error report.
 *
 * So this does not delete the fields we currently know to be risky — it rebuilds
 * the event from an allowlist. Anything the SDK attaches today, or adds in a
 * future version, is dropped unless it is named here. Failing closed is the
 * whole point: a new field that leaks is a field we never copied.
 */

export type ScrubbedFrame = {
  filename?: string
  function?: string
  lineno?: number
  colno?: number
  in_app?: boolean
}

export type ScrubbedException = {
  type?: string
  value?: string
  mechanism?: { type?: string; handled?: boolean }
  stacktrace?: { frames?: ScrubbedFrame[] }
}

/**
 * Shape-only facts about the learner's draft. Never the draft itself — these
 * describe how big and roughly what kind, which is what a grading or rendering
 * bug actually needs in order to be reproduced.
 */
export type NabiErrorContext = {
  problemId?: string
  level?: number
  draftLength?: number
  draftLineCount?: number
  hasCodeFence?: boolean
  boundary?: string
}

export type ScrubbedEvent = {
  event_id?: string
  timestamp?: number
  platform?: string
  level?: string
  release?: string
  environment?: string
  exception?: { values: ScrubbedException[] }
  tags?: Record<string, string>
  contexts?: { nabi: NabiErrorContext }
}

/** The loose shape an SDK event arrives in. Deliberately not the vendor type. */
export type ScrubbableEvent = Record<string, unknown>

export const REDACTED_MESSAGE = "<redacted: message not on allowlist>"

/** Longest message kept verbatim; anything past this is truncated. */
const MAX_MESSAGE_LENGTH = 300

/** Deepest stack kept; deeper frames say little and cost quota. */
const MAX_FRAMES = 40

/**
 * Messages known to carry code, not content.
 *
 * Anything unmatched is replaced with REDACTED_MESSAGE — including messages
 * that would have been perfectly safe. That is the intended trade: an
 * over-redacted report is a nuisance, an under-redacted one publishes a
 * learner's writing. When a redacted message turns out to be needed, read the
 * exception type and stack frame first, then add a pattern here.
 */
const ALLOWED_MESSAGE_PATTERNS: readonly RegExp[] = [
  // Thrown by this app. Every interpolated value is an authored id or a number.
  /^Root element not found$/,
  /^The compiled problem bank must (?:use schema version 2|not be empty)$/,
  /^Unknown (?:problem|entry): [\w-]+$/,
  /^Unknown curriculum level: \d+$/,
  /^Session seed must be a nonnegative safe integer$/,
  // Runtime shapes that name code. Property and identifier names only.
  /^Cannot read propert(?:y|ies) of (?:undefined|null) \(reading '[\w$]+'\)$/,
  /^[\w$.]+ is not a (?:function|constructor|iterable|object)$/,
  /^Cannot access '[\w$]+' before initialization$/,
  /^Maximum call stack size exceeded$/,
  /^Out of memory$/i,
  // CodeMirror decoration invariants — the most likely real failure here.
  /^Ranges must be added sorted by `from` position and `startSide`$/,
  /^Decorations that replace line breaks may not be specified via plugins$/,
  /^Position \d+ is out of range for document of length \d+$/,
  // Our own chunks failing to load. The URL is a build asset path.
  /^Failed to fetch dynamically imported module: \S+$/,
  /^Loading chunk \S+ failed\.?$/,
]

function isAllowedMessage(message: string): boolean {
  return ALLOWED_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}

export function sanitizeMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "") return undefined
  if (!isAllowedMessage(trimmed)) return REDACTED_MESSAGE
  return trimmed.slice(0, MAX_MESSAGE_LENGTH)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

/**
 * Keeps only where the code was. Drops `vars` (which can hold the whole
 * progress object, drafts included) and the `*_context` source excerpts.
 */
function scrubFrame(value: unknown): ScrubbedFrame | null {
  if (!isRecord(value)) return null
  const frame: ScrubbedFrame = {}
  const filename = optionalString(value.filename)
  if (filename !== undefined) frame.filename = filename
  const fn = optionalString(value.function)
  if (fn !== undefined) frame.function = fn
  const lineno = optionalNumber(value.lineno)
  if (lineno !== undefined) frame.lineno = lineno
  const colno = optionalNumber(value.colno)
  if (colno !== undefined) frame.colno = colno
  const inApp = optionalBoolean(value.in_app)
  if (inApp !== undefined) frame.in_app = inApp
  return frame
}

function scrubException(value: unknown): ScrubbedException {
  if (!isRecord(value)) return {}
  const scrubbed: ScrubbedException = {}

  const type = optionalString(value.type)
  if (type !== undefined) scrubbed.type = type

  const message = sanitizeMessage(value.value)
  if (message !== undefined) scrubbed.value = message

  if (isRecord(value.mechanism)) {
    const mechanism: { type?: string; handled?: boolean } = {}
    const mechanismType = optionalString(value.mechanism.type)
    if (mechanismType !== undefined) mechanism.type = mechanismType
    const handled = optionalBoolean(value.mechanism.handled)
    if (handled !== undefined) mechanism.handled = handled
    scrubbed.mechanism = mechanism
  }

  if (isRecord(value.stacktrace) && Array.isArray(value.stacktrace.frames)) {
    const frames = value.stacktrace.frames
      .slice(-MAX_FRAMES)
      .map(scrubFrame)
      .filter((frame): frame is ScrubbedFrame => frame !== null)
    scrubbed.stacktrace = { frames }
  }

  return scrubbed
}

/** Rebuilt field by field so no sibling key can ride along. */
function scrubNabiContext(value: unknown): NabiErrorContext | undefined {
  if (!isRecord(value)) return undefined
  const context: NabiErrorContext = {}

  const problemId = optionalString(value.problemId)
  if (problemId !== undefined) context.problemId = problemId
  const level = optionalNumber(value.level)
  if (level !== undefined) context.level = level
  const draftLength = optionalNumber(value.draftLength)
  if (draftLength !== undefined) context.draftLength = draftLength
  const draftLineCount = optionalNumber(value.draftLineCount)
  if (draftLineCount !== undefined) context.draftLineCount = draftLineCount
  const hasCodeFence = optionalBoolean(value.hasCodeFence)
  if (hasCodeFence !== undefined) context.hasCodeFence = hasCodeFence
  const boundary = optionalString(value.boundary)
  if (boundary !== undefined) context.boundary = boundary

  return Object.keys(context).length > 0 ? context : undefined
}

/** Tag keys that name authored content or the build — never learner input. */
const ALLOWED_TAG_KEYS = ["problemId", "level", "boundary"] as const

function scrubTags(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  const tags: Record<string, string> = {}
  for (const key of ALLOWED_TAG_KEYS) {
    const tag = value[key]
    if (typeof tag === "string") tags[key] = tag.slice(0, 64)
    else if (typeof tag === "number") tags[key] = String(tag)
  }
  return Object.keys(tags).length > 0 ? tags : undefined
}

/**
 * Rebuild an outgoing event from the allowlist above.
 *
 * Returns null when there is no exception left to report, so an event stripped
 * down to nothing does not spend quota.
 */
export function scrubEvent(event: ScrubbableEvent): ScrubbedEvent | null {
  const values =
    isRecord(event.exception) && Array.isArray(event.exception.values)
      ? event.exception.values
      : []
  if (values.length === 0) return null

  const scrubbed: ScrubbedEvent = {
    exception: { values: values.map(scrubException) },
  }

  const eventId = optionalString(event.event_id)
  if (eventId !== undefined) scrubbed.event_id = eventId
  const timestamp = optionalNumber(event.timestamp)
  if (timestamp !== undefined) scrubbed.timestamp = timestamp
  const platform = optionalString(event.platform)
  if (platform !== undefined) scrubbed.platform = platform
  const level = optionalString(event.level)
  if (level !== undefined) scrubbed.level = level
  const release = optionalString(event.release)
  if (release !== undefined) scrubbed.release = release
  const environment = optionalString(event.environment)
  if (environment !== undefined) scrubbed.environment = environment

  const tags = scrubTags(event.tags)
  if (tags !== undefined) scrubbed.tags = tags

  const nabi = isRecord(event.contexts)
    ? scrubNabiContext(event.contexts.nabi)
    : undefined
  if (nabi !== undefined) scrubbed.contexts = { nabi }

  return scrubbed
}
