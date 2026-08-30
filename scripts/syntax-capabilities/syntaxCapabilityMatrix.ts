export const SYNTAX_CAPABILITY_IDS = [
  "bold-italic",
  "strikethrough",
  "nested-blockquote",
  "code-block-language",
  "hard-line-break",
  "automatic-url",
  "link-title",
  "angle-bracket-url",
  "angle-bracket-email",
  "escape",
  "list-with-block",
  "footnote",
  "heading-id",
] as const

import { normalizeProblem } from "../../src/content/normalizeProblem"
import { derivePlaintextStarter } from "../../src/content/plaintextStarter"
import type {
  NormalizedProblem,
  SyntaxPresenceKind,
} from "../../src/content/types"
import { createEvaluationContext } from "../../src/engine/evaluationContext"
import { evaluateProblem } from "../../src/engine/evaluateProblem"
import { countSyntaxPresence } from "../../src/engine/syntaxPresence"
import {
  deriveSyntaxCheckpoints,
  syntaxCheckpointTerms,
} from "../../src/guided/guidedSyntax"

export type SyntaxCapabilityRow = {
  id: (typeof SYNTAX_CAPABILITY_IDS)[number]
  level: 2 | 3
  parser: { opens: boolean }
  grading: { acceptsCanonical: boolean; rejectsMissing: boolean }
  guided: {
    createsCheckpoint: boolean
    hasSpecificTerm: boolean
    terms: readonly string[]
  }
  decision: "candidate" | "blocked-parser" | "intentional-exclusion"
  notes: string
}

type Probe = {
  id: SyntaxPresenceKind
  level: 2 | 3
  target: string
  missing: string
  checkpointInput: (input: string) => boolean
  expectedTerms: readonly string[]
  notes?: string
}

const probes: readonly Probe[] = [
  {
    id: "bold-italic",
    level: 2,
    target: "***Priority***",
    missing: "Priority",
    checkpointInput: (input) => /[*_]{6}/.test(input),
    expectedTerms: ["bold text", "italic text"],
  },
  {
    id: "strikethrough",
    level: 2,
    target: "~~Old plan~~",
    missing: "Old plan",
    checkpointInput: (input) => input.includes("~~~~"),
    expectedTerms: ["strikethrough text"],
  },
  {
    id: "nested-blockquote",
    level: 2,
    target: "> Outer note\n> > Inner note",
    missing: "> Outer note\n> Inner note",
    checkpointInput: (input) => input.includes(">"),
    expectedTerms: ["quote inside a quote"],
  },
  {
    id: "code-block-language",
    level: 2,
    target: "```js\nconst value = 1\n```",
    missing: "```\nconst value = 1\n```",
    checkpointInput: (input) => /[A-Za-z]/.test(input),
    expectedTerms: ["syntax-highlighted code block"],
    notes: "The language name must be an answer, not locked Goal prose.",
  },
  {
    id: "hard-line-break",
    level: 2,
    target: "First line  \nSecond line",
    missing: "First line\nSecond line",
    checkpointInput: (input) => input.includes("  "),
    expectedTerms: ["line break"],
  },
  {
    id: "automatic-url",
    level: 2,
    target: "Visit https://example.com today.",
    missing: "Visit example.com today.",
    checkpointInput: (input) => /(?:https?:\/\/|www\.)/.test(input),
    expectedTerms: ["automatic URL"],
  },
  {
    id: "link-title",
    level: 3,
    target: "[Guide](https://example.com \"Guide title\")",
    missing: "[Guide](https://example.com)",
    checkpointInput: (input) => /[\"']/.test(input),
    expectedTerms: ["link title"],
  },
  {
    id: "angle-bracket-url",
    level: 3,
    target: "<https://example.com>",
    missing: "[Example](https://example.com)",
    checkpointInput: (input) => input.includes("<") && input.includes(">"),
    expectedTerms: ["angle-bracket URL"],
  },
  {
    id: "angle-bracket-email",
    level: 3,
    target: "<learn@example.com>",
    missing: "learn@example.com",
    checkpointInput: (input) => input.includes("<") && input.includes(">"),
    expectedTerms: ["angle-bracket email"],
  },
  {
    id: "escape",
    level: 3,
    target: "\\*Literal asterisks\\*",
    missing: "*Literal asterisks*",
    checkpointInput: (input) => input.includes("\\"),
    expectedTerms: ["escape"],
  },
  {
    id: "list-with-block",
    level: 3,
    target: "- Parent item\n\n  > Nested note",
    missing: "- Parent item",
    checkpointInput: (input) => /^[-+*] /.test(input),
    expectedTerms: ["bullet item", "block quote"],
    notes: "The learner gets one card for the list marker and one for its nested block marker.",
  },
  {
    id: "footnote",
    level: 3,
    target: "Claim[^1]\n\n[^1]: Source note",
    missing: "Claim\n\nSource note",
    checkpointInput: (input) => input.includes("[^") || input.includes("]:"),
    expectedTerms: ["footnote"],
    notes: "The reference and definition markers are taught together so their labels stay matched.",
  },
  {
    id: "heading-id",
    level: 3,
    target: "## Release notes {#release-notes}",
    missing: "## Release notes",
    checkpointInput: (input) => input.includes("{#"),
    expectedTerms: ["heading ID"],
    notes: "GFM parser has no heading ID extension; intentionally excluded.",
  },
]

function probeProblem(probe: Probe): NormalizedProblem {
  const starterText = derivePlaintextStarter(probe.target)
  return normalizeProblem({
    id: `syntax-capability-${probe.id}`,
    schemaVersion: 2,
    level: probe.level,
    flavor: "standard",
    familyId: `syntax-capability-${probe.id}`,
    skillIds: [`syntax-capability-${probe.id}`],
    difficulty: "warmup",
    teachingMode: "introduce",
    teaching: {
      concept: `Probe ${probe.id} through the learner engine.`,
      howTo: `Use ${probe.id} syntax.`,
      example: probe.target,
    },
    syntaxTokens: [probe.id],
    title: probe.id,
    prompt: `Write the ${probe.id} form.`,
    target: probe.target,
    starterText,
    protectedContent: [],
    matchChecks: [
      {
        id: `require-${probe.id}`,
        kind: "syntax-presence",
        syntax: probe.id,
        min: 1,
        priority: 10,
        feedback: `Use ${probe.id} syntax.`,
      },
    ],
    editorialChecks: [],
    hints: ["Read the Goal.", "Type the Markdown marks.", "Compare the preview."],
    retryFamily: `syntax-capability-${probe.id}`,
    reviewTags: ["syntax-capability"],
    vocabulary: {
      profile: probe.level === 2 ? "everyday-recall" : "workplace-document",
      domains: ["syntax-capability"],
      terms: [probe.id],
    },
    sourceBatchId: "syntax-capability-matrix",
    revision: 1,
    curriculumVersion: "2026-07-19",
    contentVariant: probe.id,
  })
}

export function buildSyntaxCapabilityMatrix(): SyntaxCapabilityRow[] {
  return probes.map((probe) => {
    const problem = probeProblem(probe)
    const context = createEvaluationContext(probe.target)
    const parserOpens = countSyntaxPresence(context, probe.id) > 0
    const checkpoints = deriveSyntaxCheckpoints(
      problem.target,
      problem.starterText,
    )
    const terms = [...new Set(checkpoints.flatMap(syntaxCheckpointTerms))]
    const createsCheckpoint = checkpoints.some((checkpoint) =>
      probe.checkpointInput(checkpoint.canonicalInput),
    )
    const hasSpecificTerm = probe.expectedTerms.every((term) =>
      terms.includes(term),
    )

    return {
      id: probe.id,
      level: probe.level,
      parser: { opens: parserOpens },
      grading: {
        acceptsCanonical: evaluateProblem(problem, probe.target).status === "matched",
        rejectsMissing: evaluateProblem(problem, probe.missing).status === "fail",
      },
      guided: { createsCheckpoint, hasSpecificTerm, terms },
      decision:
        probe.id === "heading-id"
          ? "intentional-exclusion"
          : parserOpens
            ? "candidate"
            : "blocked-parser",
      notes: probe.notes ?? "",
    }
  })
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no"
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>")
}

export function renderSyntaxCapabilityMarkdown(
  matrix: readonly SyntaxCapabilityRow[],
): string {
  const rows = matrix.map((row) => {
    const terms = row.guided.hasSpecificTerm
      ? row.guided.terms.join(", ")
      : row.guided.terms.length > 0
        ? `missing specific term (observed: ${row.guided.terms.join(", ")})`
        : "missing"
    return `| ${row.level} | ${row.id} | ${yesNo(row.parser.opens)} | ${yesNo(row.grading.acceptsCanonical)} | ${yesNo(row.guided.createsCheckpoint)} | ${escapeCell(terms)} | ${row.decision} | ${escapeCell(row.notes)} |`
  })
  return `# Level 2 and Level 3 syntax capability matrix

Generated by \`npm run syntax:capabilities:write\`. Do not edit measured cells by hand.

The generator normalizes a real problem candidate, parses its target through the shared Markdown parser, grades canonical and missing forms with \`evaluateProblem\`, derives the plaintext starter, and sends the target through \`deriveSyntaxCheckpoints\` and \`syntaxCheckpointTerms\`.

| Level | Syntax | Parser opens | Grading accepts | Guided blank | Learner terms | Decision | Notes |
|---:|---|:---:|:---:|:---:|---|---|---|
${rows.join("\n")}
`
}
