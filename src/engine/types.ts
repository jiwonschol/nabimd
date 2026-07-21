import type { MatchCheck } from "../content/types"

export type SourceRange = {
  start: number
  end: number
}

export type MatchDiagnostic = {
  classification: "aggregate" | "specific"
  reason: "extra" | "malformed" | "missing"
  slotId: string
  slotOrder: number
  location: string
  expectedRange: SourceRange | null
  expectedSource: string | null
  observedRange: SourceRange | null
}

export type MatchFailureItem = {
  feedbackId: string
  message: string
  check: MatchCheck
  diagnostic?: MatchDiagnostic
}

export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
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
