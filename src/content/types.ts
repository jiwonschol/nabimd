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
      kind: "heading-capitalization"
      level: 1
      text: string
      priority: number
      feedback: string
    }
  | {
      id: string
      kind: "hash-heading-style"
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

export type EditorialCheck =
  | {
      id: string
      kind: "matches-target-exactly"
      review: string
    }
  | {
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
  | "leading-atx"
  | "indented-code"
  | "tab-separator"
  | "fullwidth-hash"
  | "raw-html-h1"
  | "h2"
  | "escaped-hash"
  | "blockquote-h1"
  | "empty"
  | "compound-missing-space"
  | "lowercase-compound"
  | "capitalization"
  | "setext"
  | "nbsp-separator"
  | "inline-emphasis"
  | "inline-code"
  | "inline-link"
  | "extra-paragraph"
  | "extra-h2"
  | "duplicate-h1"
  | "malformed-plus-correct"
  | "normalized-whitespace"

export type ProblemFixture = {
  problemId: string
  kind: FixtureKind
  source: string
  expectedStatus: "fail" | "matched" | "perfect"
  expectedFeedbackId?: string
  expectedReviewIds?: readonly string[]
}
