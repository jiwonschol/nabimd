export type MatchFailure = {
  status: "fail"
  feedbackId: string
  message: string
}

export type ReviewItem = {
  id: string
  message: string
}

export type PassedEvaluation =
  | { status: "matched"; reviewItems: readonly ReviewItem[] }
  | { status: "perfect"; reviewItems: readonly [] }

export type Evaluation = MatchFailure | PassedEvaluation
