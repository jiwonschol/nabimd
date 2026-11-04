import type { MatchCheck } from "../content/types"

export type SourceRange = {
  start: number
  end: number
}

/**
 * Where in the target a failed check points. The engine names the place; the
 * words ("Document title", "In “Next”", their Korean forms) live in the UI
 * dictionary (src/i18n), so the engine stays language-free.
 */
export type DiagnosticLocation =
  | { kind: "document" }
  | { kind: "document-title" }
  | { kind: "section"; heading: string }

export type MatchDiagnostic = {
  classification: "aggregate" | "specific"
  reason: "extra" | "malformed" | "missing"
  slotId: string
  slotOrder: number
  location: DiagnosticLocation
  expectedRange: SourceRange | null
  expectedSource: string | null
  observedRange: SourceRange | null
}

/**
 * Guidance the engine derives from the learner's source rather than from the
 * check's authored feedback. The UI dictionary owns the sentence for each key;
 * `message` keeps the authored feedback for callers that have no dictionary.
 */
export type EngineMessageKey = "list-bullet-space" | "list-number-space"

export type MatchFailureItem = {
  feedbackId: string
  message: string
  messageKey?: EngineMessageKey
  check: MatchCheck
  diagnostic?: MatchDiagnostic
}

export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
  messageKey?: EngineMessageKey
  failures: readonly MatchFailureItem[]
  checkedSource?: string
}

export type ReviewItem = {
  id: string
  message: string
}

export type PassedEvaluation = {
  status: "matched"
  reviewItems: readonly ReviewItem[]
}

export type Evaluation = MatchFailure | PassedEvaluation
