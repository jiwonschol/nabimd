export type MatchCheck =
  | {
      id: string
      kind: "preserves-text"
      text: string
      priority: number
      feedback: string
    }
  | {
      id: string
      kind: "heading-spacing"
      level: 1
      text: string
      priority: number
      feedback: string
    }
  | {
      id: string
      kind: "has-heading"
      level: 1
      text: string
      priority: number
      feedback: string
    }

export type EditorialCheck = {
  id: string
  kind: "single-h1"
  review: string
}

export type Problem = {
  id: string
  familyId: "headings"
  skillIds: readonly ["heading-h1"]
  difficulty: "warmup"
  teachingMode: "introduce" | "recall"
  syntaxTokens: readonly string[]
  title: string
  prompt: string
  target: string
  starterText: string
  protectedContent: readonly string[]
  matchChecks: readonly MatchCheck[]
  editorialChecks: readonly EditorialCheck[]
  hints: readonly [string, string, string]
  retryFamily: "heading-h1"
  reviewTags: readonly ["one-document-title"]
}

export type FixtureKind =
  | "canonical"
  | "alternate"
  | "missing"
  | "malformed"
  | "matched-with-refinement"
  | "perfect"

export type ProblemFixture = {
  problemId: string
  kind: FixtureKind
  source: string
  expectedStatus: "fail" | "matched" | "perfect"
  expectedFeedbackId?: string
  expectedReviewIds?: readonly string[]
}
