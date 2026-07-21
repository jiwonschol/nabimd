import type { MatchCheck } from "../content/types"

export type MatchFailureItem = {
  feedbackId: string
  message: string
  check: MatchCheck
}

export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
  failures: readonly MatchFailureItem[]
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
