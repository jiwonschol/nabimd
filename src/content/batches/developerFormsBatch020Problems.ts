import { normalizeProblem } from "../normalizeProblem"
import type { MatchCheck, NormalizedProblem, ProblemInput } from "../types"

export const developerFormsBatch020Id =
  "2026-07-22-l5-developer-forms-020"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

export type DeveloperFormsBatch020Family =
  | "readme-quick-start"
  | "bug-report"
  | "pr-description"

export type DeveloperFormsBatch020Input = {
  id: string
  family: DeveloperFormsBatch020Family
  title: string
  prompt: string
  target: string
  teachingExample: string
  contentVariant: string
  domains: readonly string[]
  terms: readonly string[]
}

function h2Section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

function fenced(language: string, line: string) {
  return `\`\`\`${language}\n${line}\n\`\`\``
}

function readmeTarget(input: {
  title: string
  install: string
  firstStep: string
  secondStep: string
  guideLabel: string
  guidePath: string
}) {
  return `# ${input.title}

## Install

${fenced("bash", input.install)}

## Try it

1. ${input.firstStep}
2. ${input.secondStep}

[${input.guideLabel}](${input.guidePath})`
}

function bugReportTarget(input: {
  title: string
  observed: string
  firstStep: string
  secondStep: string
  evidence: string
  command: string
}) {
  return `# ${input.title}

## Observed

> ${input.observed}

## Reproduce

1. ${input.firstStep}
2. ${input.secondStep}

## Evidence

${fenced("text", input.evidence)}

Run \`${input.command}\`.`
}

function prDescriptionTarget(input: {
  title: string
  firstChange: string
  secondChange: string
  boundary: string
  command: string
  issueLabel: string
  issuePath: string
}) {
  return `# ${input.title}

## Change

- ${input.firstChange}
- ${input.secondChange}

## Boundary

> ${input.boundary}

## Verify

${fenced("bash", input.command)}

[${input.issueLabel}](${input.issuePath})`
}

function commonChecks(
  problemId: string,
  h2Count: 2 | 3,
  sequence: Extract<MatchCheck, { kind: "block-sequence" }>["sequence"],
): MatchCheck[] {
  return [
    {
      id: `${problemId}-limits`,
      kind: "document-limits",
      maxLines: 40,
      priority: 5,
      feedback: "Keep the Markdown document within 40 lines.",
    },
    {
      id: `${problemId}-outline`,
      kind: "block-sequence",
      scope: documentScope,
      sequence,
      priority: 10,
      feedback: "Match the Goal's compact block order.",
    },
    {
      id: `${problemId}-sections`,
      kind: "block-count",
      scope: documentScope,
      block: "heading",
      depth: 2,
      min: h2Count,
      max: h2Count,
      priority: 15,
      feedback: `Use exactly ${h2Count} H2 sections.`,
    },
  ]
}

function codeCheck(
  problemId: string,
  occurrence: number,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-code`,
    kind: "code-block",
    scope: h2Section(occurrence),
    min: 1,
    max: 1,
    requireLanguageTag: true,
    requireFenced: true,
    requireClosedFence: true,
    requireNonemptyContent: true,
    priority,
    feedback: "Use one closed, nonempty, language-tagged fenced block in this section.",
  }
}

function listCheck(
  problemId: string,
  occurrence: number,
  ordered: boolean,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-list`,
    kind: "list-shape",
    scope: h2Section(occurrence),
    ordered,
    minItems: 2,
    maxItems: 2,
    requireVisibleItems: true,
    priority,
    feedback: `Use a ${ordered ? "numbered" : "bullet"} list with two visible items in this section.`,
  }
}

function inlineCodeCheck(
  problemId: string,
  occurrence: number,
  min: 1 | 2,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-inline-code`,
    kind: "inline-code-shape",
    scope: h2Section(occurrence),
    min,
    max: min,
    requireNonemptyContent: true,
    priority,
    feedback: `Use ${min === 1 ? "one" : "two"} nonempty inline-code ${min === 1 ? "span" : "spans"} in this section.`,
  }
}

function linkCheck(
  problemId: string,
  occurrence: number,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-link`,
    kind: "link-shape",
    scope: h2Section(occurrence),
    min: 1,
    max: 1,
    requireNonemptyLabel: true,
    requireNonemptyDestination: true,
    allowReferences: true,
    allowAutolinks: false,
    priority,
    feedback: "Use one descriptive Markdown link in this section.",
  }
}

function quoteCheck(problemId: string, priority: number): MatchCheck {
  return {
    id: `${problemId}-quote`,
    kind: "blockquote-shape",
    scope: h2Section(1),
    requireNonemptyContent: true,
    priority,
    feedback: "Use one visible blockquote in the Boundary section.",
  }
}

function readmeChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 2, [
      { block: "heading", depth: 1 },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "paragraph" },
    ]),
    codeCheck(problemId, 0, 30),
    listCheck(problemId, 1, true, 40),
    inlineCodeCheck(problemId, 1, 2, 50),
    linkCheck(problemId, 1, 60),
  ]
}

function bugReportChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 3, [
      { block: "heading", depth: 1 },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "paragraph" },
    ]),
    {
      id: `${problemId}-observation`,
      kind: "blockquote-shape",
      scope: h2Section(0),
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Use one visible blockquote in the Observed section.",
    },
    listCheck(problemId, 1, true, 40),
    codeCheck(problemId, 2, 50),
    inlineCodeCheck(problemId, 2, 1, 60),
  ]
}

function prDescriptionChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 3, [
      { block: "heading", depth: 1 },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "paragraph" },
    ]),
    listCheck(problemId, 0, false, 30),
    inlineCodeCheck(problemId, 0, 1, 40),
    quoteCheck(problemId, 50),
    codeCheck(problemId, 2, 60),
    linkCheck(problemId, 2, 70),
  ]
}

const familyChecks: Record<
  DeveloperFormsBatch020Family,
  (problemId: string) => MatchCheck[]
> = {
  "readme-quick-start": readmeChecks,
  "bug-report": bugReportChecks,
  "pr-description": prDescriptionChecks,
}

const familyMetadata: Record<DeveloperFormsBatch020Family, {
  familyId: string
  retryFamily: string
  skillIds: readonly string[]
  teaching: ProblemInput["teaching"]
  syntaxTokens: readonly string[]
  hints: readonly [string, string, string]
}> = {
  "readme-quick-start": {
    familyId: "developer-readme",
    retryFamily: "level5-readme-quick-start",
    skillIds: ["readme-outline", "fenced-install", "ordered-usage", "inline-code", "meaningful-link"],
    teaching: {
      concept: "A compact README quick start separates installation, usage, commands, and supporting documentation.",
      howTo: "Use one title, two H2 sections, a language-tagged command fence, two numbered steps, two inline-code spans in the Try it section, and one descriptive link.",
      example: "# Tool quick start\n\n## Install\n\n```bash\nnpm install tool\n```",
    },
    syntaxTokens: ["#", "##", "```bash", "1.", "`", "[ ]( )"],
    hints: ["Start with one # title and two ## sections.", "Put the install command in a language-tagged fence.", "Number two usage steps, add two inline-code spans in the Try it section, and finish with one link."],
  },
  "bug-report": {
    familyId: "developer-bug-report",
    retryFamily: "level5-bug-report",
    skillIds: ["bug-report-outline", "observed-quote", "ordered-reproduction", "fenced-evidence", "inline-code-verification"],
    teaching: {
      concept: "A compact bug report separates the observed symptom, reproduction, evidence, and a verification command.",
      howTo: "Use one title, three H2 sections, a quote, two numbered steps, a fenced evidence block, and one inline command.",
      example: "# Cache bug\n\n## Observed\n\n> The saved value stays stale.\n\n## Reproduce",
    },
    syntaxTokens: ["#", "##", ">", "1.", "```text", "`"],
    hints: ["Start with one # title and three ## sections.", "Quote the observation and number two reproduction steps.", "Finish with a fenced evidence line and one inline command."],
  },
  "pr-description": {
    familyId: "developer-pr-description",
    retryFamily: "level5-pr-description",
    skillIds: ["pr-outline", "change-list", "inline-code-file", "boundary-quote", "fenced-verification", "issue-link"],
    teaching: {
      concept: "A compact pull-request description makes the change, boundary, verification, and related issue easy to review.",
      howTo: "Use one title, three H2 sections, two bullets, inline code, one boundary quote, a command fence, and one descriptive link.",
      example: "# Restore draft state\n\n## Change\n\n- Update `draftStore.ts`\n- Keep saved text intact",
    },
    syntaxTokens: ["#", "##", "-", "`", ">", "```bash", "[ ]( )"],
    hints: ["Start with one # title and three ## sections.", "Use two change bullets, with one file or symbol in inline code, then quote the boundary.", "Finish with a fenced verification command and one related link."],
  },
}

const singleTitleReview = {
  id: "one-document-title",
  kind: "single-h1",
  review: "Keep one H1 as the document title; use H2 for sections.",
} as const

const familyEditorialChecks: Record<
  DeveloperFormsBatch020Family,
  ProblemInput["editorialChecks"]
> = {
  "readme-quick-start": [
    singleTitleReview,
    {
      id: "keep-inline-code-focused",
      kind: "max-inline-count",
      scope: documentScope,
      inline: "inline-code",
      max: 2,
      review: "Keep inline code focused on the two usage commands.",
    },
  ],
  "bug-report": [
    singleTitleReview,
    {
      id: "keep-one-observation",
      kind: "max-block-count",
      scope: documentScope,
      block: "blockquote",
      recursive: true,
      max: 1,
      review: "Keep the observed symptom in one short blockquote.",
    },
  ],
  "pr-description": [
    singleTitleReview,
    {
      id: "keep-one-boundary",
      kind: "max-block-count",
      scope: documentScope,
      block: "blockquote",
      recursive: true,
      max: 1,
      review: "Keep the review boundary in one short blockquote.",
    },
  ],
}

export const developerFormsBatch020Inputs: readonly DeveloperFormsBatch020Input[] = [
  {
    id: "l5-readme-log-filter-quick-start",
    family: "readme-quick-start",
    title: "Write a log filter quick start",
    prompt: "Rebuild a compact README quick start for installing and trying a log filter.",
    target: readmeTarget({
      title: "Log filter quick start",
      install: "npm install clear-log",
      firstStep: "Run `clear-log app.log`",
      secondStep: "Open `filtered.log`",
      guideLabel: "Read the filter guide",
      guidePath: "/docs/filter-guide",
    }),
    teachingExample: "# Image sizer\n\n## Install\n\n```bash\nnpm install image-size\n```",
    contentVariant: "log-filter-quick-start",
    domains: ["developer-tools", "documentation"],
    terms: ["log", "filter", "command", "guide"],
  },
  {
    id: "l5-readme-csv-preview-quick-start",
    family: "readme-quick-start",
    title: "Write a CSV preview quick start",
    prompt: "Rebuild a compact README quick start for installing and trying a CSV preview tool.",
    target: readmeTarget({
      title: "CSV preview quick start",
      install: "npm install csv-window",
      firstStep: "Run `csv-window sample.csv`",
      secondStep: "Open `preview.html`",
      guideLabel: "Read the preview guide",
      guidePath: "/docs/preview-guide",
    }),
    teachingExample: "# JSON viewer\n\n## Install\n\n```bash\nnpm install json-view\n```",
    contentVariant: "csv-preview-quick-start",
    domains: ["developer-tools", "documentation"],
    terms: ["CSV", "preview", "file", "guide"],
  },
  {
    id: "l5-readme-release-note-quick-start",
    family: "readme-quick-start",
    title: "Write a release-note checker quick start",
    prompt: "Rebuild a compact README quick start for installing and trying a release-note checker.",
    target: readmeTarget({
      title: "Release-note checker quick start",
      install: "npm install note-check",
      firstStep: "Run `note-check CHANGELOG.md`",
      secondStep: "Open `note-report.txt`",
      guideLabel: "Read the checker guide",
      guidePath: "/docs/checker-guide",
    }),
    teachingExample: "# Port checker\n\n## Install\n\n```bash\nnpm install port-check\n```",
    contentVariant: "release-note-checker-quick-start",
    domains: ["developer-tools", "documentation"],
    terms: ["release note", "checker", "report", "guide"],
  },
  {
    id: "l5-readme-config-validator-quick-start",
    family: "readme-quick-start",
    title: "Write a config validator quick start",
    prompt: "Rebuild a compact README quick start for installing and trying a config validator.",
    target: readmeTarget({
      title: "Config validator quick start",
      install: "npm install config-lens",
      firstStep: "Run `config-lens app.json`",
      secondStep: "Open `validation.txt`",
      guideLabel: "Read the validation guide",
      guidePath: "/docs/validation-guide",
    }),
    teachingExample: "# Name formatter\n\n## Install\n\n```bash\nnpm install name-format\n```",
    contentVariant: "config-validator-quick-start",
    domains: ["developer-tools", "documentation"],
    terms: ["config", "validator", "report", "guide"],
  },
  {
    id: "l5-bug-stale-config-cache-report",
    family: "bug-report",
    title: "Write a stale config cache report",
    prompt: "Rebuild a compact bug report with an observed symptom, reproduction, evidence, and a verification command.",
    target: bugReportTarget({
      title: "Stale config cache",
      observed: "A saved theme still uses the previous value after reload.",
      firstStep: "Save the new theme",
      secondStep: "Reload the settings page",
      evidence: "expected=light actual=dark",
      command: "npm test -- config-cache",
    }),
    teachingExample: "# Delayed search\n\n## Observed\n\n> Results appear after the spinner stops.\n\n## Reproduce",
    contentVariant: "stale-config-cache-report",
    domains: ["software-debugging", "configuration"],
    terms: ["cache", "config", "reload", "test"],
  },
  {
    id: "l5-bug-lost-draft-shortcut-report",
    family: "bug-report",
    title: "Write a lost draft shortcut report",
    prompt: "Rebuild a compact bug report for a keyboard shortcut that clears a saved draft.",
    target: bugReportTarget({
      title: "Lost draft shortcut",
      observed: "The save shortcut clears the second paragraph before storage finishes.",
      firstStep: "Write two paragraphs",
      secondStep: "Press the save shortcut",
      evidence: "savedLines=1 expectedLines=2",
      command: "npm test -- draft-shortcut",
    }),
    teachingExample: "# Double toast\n\n## Observed\n\n> One save shows the same message twice.\n\n## Reproduce",
    contentVariant: "lost-draft-shortcut-report",
    domains: ["software-debugging", "editor"],
    terms: ["draft", "shortcut", "storage", "test"],
  },
  {
    id: "l5-bug-duplicate-webhook-retry-report",
    family: "bug-report",
    title: "Write a duplicate webhook retry report",
    prompt: "Rebuild a compact bug report for a webhook retry that records one event twice.",
    target: bugReportTarget({
      title: "Duplicate webhook retry",
      observed: "One retry stores the same delivery identifier twice.",
      firstStep: "Send one delayed callback",
      secondStep: "Allow the retry to finish",
      evidence: "deliveryRows=2 expectedRows=1",
      command: "npm test -- webhook-retry",
    }),
    teachingExample: "# Blank export\n\n## Observed\n\n> The downloaded report has no rows.\n\n## Reproduce",
    contentVariant: "duplicate-webhook-retry-report",
    domains: ["software-debugging", "webhooks"],
    terms: ["webhook", "retry", "delivery", "test"],
  },
  {
    id: "l5-bug-missing-cli-flag-report",
    family: "bug-report",
    title: "Write a missing CLI flag report",
    prompt: "Rebuild a compact bug report for a CLI flag that disappears from help output.",
    target: bugReportTarget({
      title: "Missing CLI flag",
      observed: "The quiet flag works but does not appear in the help list.",
      firstStep: "Generate the command help output",
      secondStep: "Search for the quiet flag",
      evidence: "flag=--quiet helpEntry=missing",
      command: "npm test -- cli-help",
    }),
    teachingExample: "# Late status\n\n## Observed\n\n> The ready label appears after navigation.\n\n## Reproduce",
    contentVariant: "missing-cli-flag-report",
    domains: ["software-debugging", "command-line"],
    terms: ["CLI", "flag", "help", "test"],
  },
  {
    id: "l5-pr-guard-duplicate-export-description",
    family: "pr-description",
    title: "Write a duplicate export PR description",
    prompt: "Rebuild a compact pull-request description for preventing duplicate exports.",
    target: prDescriptionTarget({
      title: "Guard duplicate exports",
      firstChange: "Update `exportQueue.ts`",
      secondChange: "Keep existing file names",
      boundary: "Do not merge separate export requests.",
      command: "npm test -- export-queue",
      issueLabel: "Related export issue",
      issuePath: "/issues/export-duplicates",
    }),
    teachingExample: "# Keep upload order\n\n## Change\n\n- Update `uploadQueue.ts`\n- Preserve file order",
    contentVariant: "guard-duplicate-export-description",
    domains: ["code-review", "exports"],
    terms: ["pull request", "export", "queue", "verification"],
  },
  {
    id: "l5-pr-restore-saved-draft-description",
    family: "pr-description",
    title: "Write a saved draft PR description",
    prompt: "Rebuild a compact pull-request description for restoring saved drafts.",
    target: prDescriptionTarget({
      title: "Restore saved drafts",
      firstChange: "Update `draftStore.ts`",
      secondChange: "Preserve unsent text",
      boundary: "Do not replace a newer local draft.",
      command: "npm test -- draft-store",
      issueLabel: "Related draft issue",
      issuePath: "/issues/saved-drafts",
    }),
    teachingExample: "# Retain scroll position\n\n## Change\n\n- Update `scrollStore.ts`\n- Preserve the current row",
    contentVariant: "restore-saved-draft-description",
    domains: ["code-review", "editor"],
    terms: ["pull request", "draft", "storage", "verification"],
  },
  {
    id: "l5-pr-normalize-timeout-description",
    family: "pr-description",
    title: "Write a timeout handling PR description",
    prompt: "Rebuild a compact pull-request description for consistent timeout handling.",
    target: prDescriptionTarget({
      title: "Normalize timeout handling",
      firstChange: "Update `requestTimeout.ts`",
      secondChange: "Preserve retry limits",
      boundary: "Do not turn cancellations into retries.",
      command: "npm test -- request-timeout",
      issueLabel: "Related timeout issue",
      issuePath: "/issues/timeout-handling",
    }),
    teachingExample: "# Bound upload retries\n\n## Change\n\n- Update `uploadRetry.ts`\n- Keep the retry cap",
    contentVariant: "normalize-timeout-handling-description",
    domains: ["code-review", "networking"],
    terms: ["pull request", "timeout", "retry", "verification"],
  },
  {
    id: "l5-pr-response-version-description",
    family: "pr-description",
    title: "Write a response version PR description",
    prompt: "Rebuild a compact pull-request description for documenting one response version.",
    target: prDescriptionTarget({
      title: "Document response version",
      firstChange: "Update `responseSchema.md`",
      secondChange: "Keep current examples",
      boundary: "Do not promise fields outside the schema.",
      command: "npm test -- response-schema",
      issueLabel: "Related schema issue",
      issuePath: "/issues/response-version",
    }),
    teachingExample: "# Explain the cache key\n\n## Change\n\n- Update `cacheGuide.md`\n- Keep the current examples",
    contentVariant: "document-response-version-description",
    domains: ["code-review", "api-documentation"],
    terms: ["pull request", "response", "schema", "verification"],
  },
] as const

const convention = {
  id: "nabi-agent-work-order",
  version: "2026.07",
  reviewedOn: "2026-07-22",
} as const

function makeProblem(input: DeveloperFormsBatch020Input): NormalizedProblem {
  const metadata = familyMetadata[input.family]
  return normalizeProblem({
    id: input.id,
    schemaVersion: 2,
    revision: 1,
    curriculumVersion,
    level: 5,
    flavor: "standard",
    teachingMode: "recall",
    difficulty: "makeover",
    familyId: metadata.familyId,
    retryFamily: metadata.retryFamily,
    skillIds: metadata.skillIds,
    teaching: {
      ...metadata.teaching,
      example: input.teachingExample,
    },
    syntaxTokens: metadata.syntaxTokens,
    title: input.title,
    prompt: input.prompt,
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: familyChecks[input.family](input.id),
    editorialChecks: familyEditorialChecks[input.family],
    hints: metadata.hints,
    reviewTags: ["one-document-title", "compact-document", `level5-${input.family}`],
    vocabulary: {
      profile: "agent-workflow",
      domains: input.domains,
      terms: input.terms,
    },
    sourceBatchId: developerFormsBatch020Id,
    contentVariant: input.contentVariant,
    convention,
  })
}

export const developerFormsBatch020Problems: readonly NormalizedProblem[] =
  developerFormsBatch020Inputs.map(makeProblem)
