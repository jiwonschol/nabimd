export const CURRICULUM_LEVELS = [1, 2, 3, 4, 5] as const

export type CurriculumLevel = (typeof CURRICULUM_LEVELS)[number]
export type MarkdownFlavor = "standard"

export type VocabularyProfile =
  | "everyday"
  | "everyday-recall"
  | "workplace-document"
  | "development-spec"
  | "agent-workflow"

export type VocabularyMetadata = {
  profile: VocabularyProfile
  domains: readonly string[]
  terms: readonly string[]
}

export type CheckScope =
  | { kind: "document" }
  | {
      kind: "section"
      headingDepth: 1 | 2 | 3 | 4 | 5 | 6
      occurrence: number
    }

export type BlockKind =
  | "heading"
  | "paragraph"
  | "list"
  | "code"
  | "blockquote"
  | "thematic-break"

export type InlineKind =
  | "emphasis"
  | "strong"
  | "inline-code"
  | "link"
  | "image"

type MatchCheckBase = {
  id: string
  priority: number
  feedback: string
}

type HeadingMatchCheck = MatchCheckBase & {
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** Legacy generation metadata; never used as a learner-answer operand. */
  text?: string
}

export type BlockSelector = {
  block: BlockKind
  depth?: 1 | 2 | 3 | 4 | 5 | 6
}

export type MatchCheck =
  | (HeadingMatchCheck & { kind: "heading-spacing" })
  | (HeadingMatchCheck & { kind: "hash-heading-style" })
  | (HeadingMatchCheck & { kind: "has-heading" })
  | (MatchCheckBase & {
      kind: "block-count"
      scope: CheckScope
      block: BlockKind
      depth?: 1 | 2 | 3 | 4 | 5 | 6
      min?: number
      max?: number
    })
  | (MatchCheckBase & {
      kind: "inline-presence"
      scope: CheckScope
      inline: InlineKind
      min?: number
      max?: number
    })
  | (MatchCheckBase & {
      kind: "heading-depth-order"
      allowSkippedDepths: false
    })
  | (MatchCheckBase & {
      kind: "list-shape"
      scope: CheckScope
      ordered: boolean | "either"
      minItems: number
      maxItems?: number
    })
  | (MatchCheckBase & {
      kind: "code-block"
      scope: CheckScope
      min: number
      max?: number
      requireLanguageTag?: boolean
      requireFenced?: boolean
    })
  | (MatchCheckBase & {
      kind: "block-sequence"
      scope: CheckScope
      sequence: readonly BlockSelector[]
      exact?: boolean
    })
  | (MatchCheckBase & {
      kind: "document-limits"
      minBlocks?: number
      maxBlocks?: number
      minLines?: number
      maxLines?: number
      minSourceCharacters?: number
      maxSourceCharacters?: number
    })

export type EditorialCheck =
  | {
      id: string
      kind: "single-h1"
      review: string
    }
  | {
      id: string
      kind: "max-inline-count"
      scope: CheckScope
      inline: InlineKind
      max: number
      review: string
    }

type ProblemBase = {
  id: string
  teachingMode: "introduce" | "recall"
  teaching: {
    concept: string
    howTo: string
    example: string
  }
  syntaxTokens: readonly string[]
  title: string
  prompt: string
  target: string
  starterText: string
  protectedContent: readonly string[]
  matchChecks: readonly MatchCheck[]
  editorialChecks: readonly EditorialCheck[]
  hints: readonly [string, string, string]
  reviewTags: readonly string[]
  convention?: {
    id: string
    version: string
    reviewedOn: string
  }
}

/** Transitional authoring shape for the accepted schema-v1 heading bank. */
export type Problem = ProblemBase & {
  familyId: "headings"
  skillIds: readonly ["heading-h1"]
  difficulty: "warmup"
  retryFamily: "heading-h1"
  schemaVersion?: never
  level?: never
  flavor?: never
  vocabulary?: never
  sourceBatchId?: never
  revision?: never
  curriculumVersion?: never
  contentVariant?: never
}

export type ProblemInput = ProblemBase & {
  familyId: string
  skillIds: readonly string[]
  difficulty: "warmup" | "mixed" | "makeover"
  retryFamily: string
  schemaVersion: 2
  level: CurriculumLevel
  flavor?: MarkdownFlavor
  vocabulary: VocabularyMetadata
  sourceBatchId: string
  revision: number
  curriculumVersion: string
  contentVariant: string
}

export type NormalizedProblem = Omit<ProblemInput, "flavor"> & {
  flavor: MarkdownFlavor
}

export type GradableProblem = Problem | NormalizedProblem

export type FixtureRole =
  | "canonical"
  | "different-prose"
  | "case-spelling-variation"
  | "missing"
  | "malformed"
  | "matched-with-review"
  | "edge-case"

export type FixtureKind =
  | "canonical"
  | "alternate"
  | "missing"
  | "malformed"
  | "matched-with-refinement"
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
  | "case-variation"
  | "setext"
  | "nbsp-separator"
  | "ideographic-space-separator"
  | "inline-emphasis"
  | "underscore-strong"
  | "inline-code"
  | "inline-link"
  | "extra-paragraph"
  | "extra-h2"
  | "duplicate-h1"
  | "malformed-plus-correct"
  | "normalized-whitespace"

export type ProblemFixture = {
  id?: string
  problemId: string
  problemRevision?: number
  role?: FixtureRole
  exercisesCheckId?: string
  kind: FixtureKind
  source: string
  expectedStatus: "fail" | "matched"
  expectedFeedbackId?: string
  expectedReviewIds?: readonly string[]
}
