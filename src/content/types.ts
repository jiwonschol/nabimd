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
      kind: "block"
      block: BlockKind
      occurrence: number
    }
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

export type LinkShapeOptions = {
  requireNonemptyLabel: boolean
  requireNonemptyDestination: boolean
  allowReferences: boolean
  allowAutolinks: boolean
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
      recursive?: boolean
      min?: number
      max?: number
    })
  | (MatchCheckBase & {
      kind: "inline-presence"
      scope: CheckScope
      inline: InlineKind
      min?: number
      max?: number
      requireNonemptyContent?: boolean
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
      recursive?: boolean
      requireNonemptyItems?: boolean
    })
  | (MatchCheckBase & {
      kind: "blockquote-shape"
      scope: CheckScope
      recursive?: boolean
      requireNonemptyContent?: boolean
    })
  | (MatchCheckBase & {
      kind: "inline-code-shape"
      scope: CheckScope
      min?: number
      max?: number
      requireNonemptyContent?: boolean
    })
  | (MatchCheckBase &
      LinkShapeOptions & {
        kind: "link-shape"
        scope: CheckScope
        min?: number
        max?: number
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
  | {
      id: string
      kind: "max-block-count"
      scope: CheckScope
      block: BlockKind
      depth?: 1 | 2 | 3 | 4 | 5 | 6
      recursive?: boolean
      max: number
      review: string
    }
  | (LinkShapeOptions & {
      id: string
      kind: "max-link-count"
      scope: CheckScope
      max: number
      review: string
    })

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
  | "asterisk-bullet"
  | "plus-bullet"
  | "ordered-list"
  | "too-short-list"
  | "inline-code-list"
  | "multiple-lists"
  | "blockquote-list"
  | "empty-list"
  | "image-alt-list"
  | "empty-image-alt-list"
  | "repeated-one"
  | "parenthesis-marker"
  | "non-one-start"
  | "nonsequential-numbers"
  | "unordered-list"
  | "one-empty-item"
  | "split-two-plus-one"
  | "fenced-code-list"
  | "indented-code-list"
  | "nested-under-unordered"
  | "mixed-delimiters"
  | "blank-lines"
  | "nested-under-ordered"
  | "empty-parents-with-children"
  | "blockquote-no-space"
  | "blockquote-three-space-indent"
  | "blockquote-lazy-continuation"
  | "blockquote-image-alt"
  | "blockquote-heading-content"
  | "blockquote-list-content"
  | "blockquote-code-content"
  | "blockquote-list-wrapper"
  | "nested-blockquote"
  | "multiple-blockquotes"
  | "empty-blockquote"
  | "empty-image-alt-blockquote"
  | "thematic-break-blockquote"
  | "blockquote-nbsp-only"
  | "blockquote-zero-width-only"
  | "blockquote-definition-only"
  | "blockquote-comment-only"
  | "blockquote-empty-html-only"
  | "escaped-blockquote"
  | "inline-code-blockquote"
  | "fenced-code-blockquote"
  | "indented-code-blockquote"
  | "html-blockquote"
  | "blockquote-fullwidth-marker"
  | "double-backtick-code"
  | "literal-backtick-inline-code"
  | "spaced-inline-code"
  | "multiline-inline-code"
  | "inline-code-heading"
  | "inline-code-list-item"
  | "inline-code-blockquote-content"
  | "inline-code-link-label"
  | "inline-code-emphasis-wrapper"
  | "entity-literal-inline-code"
  | "multiple-inline-code"
  | "empty-plus-real-inline-code"
  | "unmatched-backtick"
  | "mismatched-backticks"
  | "whitespace-only-inline-code"
  | "nbsp-only-inline-code"
  | "ideographic-space-only-inline-code"
  | "zero-width-only-inline-code"
  | "bom-bidi-only-inline-code"
  | "control-only-inline-code"
  | "null-plus-visible-inline-code"
  | "null-only-inline-code"
  | "braille-blank-only-inline-code"
  | "escaped-inline-code"
  | "fenced-code-only"
  | "indented-code-only"
  | "raw-html-code"
  | "inline-code-image-alt"
  | "inline-code-definition"
  | "inline-code-autolink"
  | "inline-code-comment"
  | "fullwidth-backtick"
  | "apostrophe-code"
  | "empty-backticks"
  | `italic-${string}`
  | `link-${string}`
  | "multiple-explicit-links"
  | "multiple-reference-links"
  | "multiple-mixed-links"
  | "multiple-unsafe-links"
  | `thematic-break-${string}`

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
