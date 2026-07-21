import { normalizeProblem } from "../normalizeProblem"
import type {
  MatchCheck,
  NormalizedProblem,
  ProblemInput,
} from "../types"
import { developmentSpecBatch012Problems } from "./developmentSpecBatch012Problems"
import { advancedDocumentBatch017Problems } from "./advancedDocumentBatch017Problems"
import { level35SeedProblems } from "../level35SeedProblems"

export const advancedDocumentReplacementBatch018Id =
  "2026-07-22-advanced-document-replacements-018"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

type ReplacementFamily =
  | "level4-migration"
  | "level4-investigation"
  | "level5-agent-brief"
  | "level5-recovery"
  | "level5-refactor"
  | "level5-rollout"

export type AdvancedDocumentReplacementBatch018Input = {
  id: string
  revision: 2 | 3
  family: ReplacementFamily
  prompt: string
  target: string
}

function h2Section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

function bullets(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n")
}

function ordered(items: readonly string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n")
}

function fence(language: string, lines: readonly string[]) {
  return [`\`\`\`${language}`, ...lines, "\`\`\`"].join("\n")
}

type MigrationDraft = {
  title: string
  overview: string
  preconditions: readonly [string, string]
  steps: readonly [string, string, string]
  guardrail: string
  acceptance: readonly [string, string]
  command: string
}

function migrationTarget(draft: MigrationDraft) {
  return `# ${draft.title}

${draft.overview}

## Before

${bullets(draft.preconditions)}

## Steps

${ordered(draft.steps)}

## Keep

> ${draft.guardrail}

## Done when

${bullets(draft.acceptance)}

## Record

${fence("text", [draft.command])}`
}

type InvestigationDraft = {
  title: string
  overview: string
  evidence: string
  reproduction: readonly [string, string, string]
  fix: readonly [string, string]
  checks: readonly [string, string]
}

function investigationTarget(draft: InvestigationDraft) {
  return `# ${draft.title}

${draft.overview}

## Evidence

> ${draft.evidence}

---

## Reproduce

${ordered(draft.reproduction)}

## What changes

${bullets(draft.fix)}

## Verification

${bullets(draft.checks)}`
}

type AgentBriefDraft = {
  title: string
  overview: string
  authority: readonly [string, string]
  scope: readonly [string, string]
  plan: readonly [string, string, string]
  stop: string
  command: string
  report: readonly [string, string]
}

function agentBriefTarget(draft: AgentBriefDraft) {
  return `# ${draft.title}

${draft.overview}

## Read first

${ordered(draft.authority)}

## Scope

${bullets(draft.scope)}

## Plan

${ordered(draft.plan)}

## Stop

> ${draft.stop}

## Verify

${fence("bash", [draft.command])}

## Report

${bullets(draft.report)}`
}

type RefactorDraft = {
  title: string
  overview: string
  files: readonly [string, string]
  plan: readonly [string, string, string]
  guardrails: readonly [string, string]
  command: string
  report: readonly [string, string]
}

function refactorTarget(draft: RefactorDraft) {
  return `# ${draft.title}

${draft.overview}

## Files

${bullets(draft.files)}

## Refactor

${ordered(draft.plan)}

## Guardrails

${bullets(draft.guardrails)}

## Verify

${fence("bash", [draft.command])}

## Report

${bullets(draft.report)}`
}

type RecoveryDraft = {
  title: string
  overview: string
  evidence: string
  recovery: readonly [string, string, string]
  constraints: readonly [string, string]
  command: string
  report: readonly [string, string]
}

function recoveryTarget(draft: RecoveryDraft) {
  return `# ${draft.title}

${draft.overview}

## Evidence

> ${draft.evidence}

---

## Recovery

${ordered(draft.recovery)}

## Constraints

${bullets(draft.constraints)}

## Verify

${fence("bash", [draft.command])}

## Report

${bullets(draft.report)}`
}

type RolloutDraft = {
  title: string
  overview: string
  provider: string
  details: readonly [string, string]
  consumer: string
  rollout: readonly [string, string, string]
  pause: string
  checks: readonly [string, string]
  reportTitle: string
}

function rolloutTarget(draft: RolloutDraft) {
  return `# ${draft.title}

${draft.overview}

## System map

- ${draft.provider}
  - ${draft.details[0]}
  - ${draft.details[1]}
- ${draft.consumer}

## Rollout

${ordered(draft.rollout)}

## Pause

> ${draft.pause}

## Checks

${bullets(draft.checks)}

## Report

${fence("markdown", [`# ${draft.reportTitle}`, "- Result:", "- Evidence:"])}`
}

function limitsCheck(problemId: string): MatchCheck {
  return {
    id: `${problemId}-limits`,
    kind: "document-limits",
    maxLines: 40,
    priority: 5,
    feedback: "Keep the Markdown document within 40 lines.",
  }
}

function commonChecks(
  problemId: string,
  h2Count: number,
  sequence: Extract<MatchCheck, { kind: "block-sequence" }>["sequence"],
): MatchCheck[] {
  return [
    limitsCheck(problemId),
    {
      id: `${problemId}-outline`,
      kind: "block-sequence",
      scope: documentScope,
      sequence,
      exact: true,
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
    {
      id: `${problemId}-hierarchy`,
      kind: "heading-depth-order",
      allowSkippedDepths: false,
      priority: 20,
      feedback: "Keep one H1 title followed by H2 sections.",
    },
  ]
}

function listCheck(
  problemId: string,
  suffix: string,
  occurrence: number,
  orderedList: boolean,
  minItems: 2 | 3,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-${suffix}`,
    kind: "list-shape",
    scope: h2Section(occurrence),
    ordered: orderedList,
    minItems,
    maxItems: minItems,
    requireVisibleItems: true,
    priority,
    feedback: `Use a ${orderedList ? "numbered" : "bullet"} list with ${minItems} visible items in this section.`,
  }
}

function quoteCheck(
  problemId: string,
  suffix: string,
  occurrence: number,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-${suffix}`,
    kind: "blockquote-shape",
    scope: h2Section(occurrence),
    requireNonemptyContent: true,
    priority,
    feedback: "Use one visible blockquote in this section.",
  }
}

function codeCheck(
  problemId: string,
  occurrence: number,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-verification-code`,
    kind: "code-block",
    scope: h2Section(occurrence),
    min: 1,
    max: 1,
    requireLanguageTag: true,
    requireFenced: true,
    requireNonemptyContent: true,
    priority,
    feedback: "Use one nonempty, language-tagged fenced block in this section.",
  }
}

function migrationChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 5, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    listCheck(problemId, "preconditions", 0, false, 2, 30),
    listCheck(problemId, "migration", 1, true, 3, 40),
    quoteCheck(problemId, "guardrail", 2, 50),
    listCheck(problemId, "acceptance", 3, false, 2, 60),
    codeCheck(problemId, 4, 70),
  ]
}

function investigationChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 4, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "thematic-break" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    quoteCheck(problemId, "evidence", 0, 30),
    {
      id: `${problemId}-divider`,
      kind: "block-count",
      scope: h2Section(0),
      block: "thematic-break",
      min: 1,
      max: 1,
      priority: 35,
      feedback: "Put one Markdown divider after the evidence.",
    },
    listCheck(problemId, "reproduction", 1, true, 3, 40),
    listCheck(problemId, "fix", 2, false, 2, 50),
    listCheck(problemId, "verification", 3, false, 2, 60),
    {
      id: `${problemId}-verification-code`,
      kind: "inline-code-shape",
      scope: h2Section(3),
      min: 2,
      requireNonemptyContent: true,
      priority: 65,
      feedback: "Put nonempty inline code in both verification bullets.",
    },
  ]
}

function agentBriefChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 6, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    listCheck(problemId, "authority", 0, true, 2, 30),
    {
      id: `${problemId}-authority-link`,
      kind: "link-shape",
      scope: h2Section(0),
      min: 1,
      requireNonemptyLabel: true,
      requireNonemptyDestination: true,
      allowReferences: true,
      allowAutolinks: false,
      priority: 35,
      feedback: "Use one descriptive Markdown link in the reading list.",
    },
    listCheck(problemId, "scope", 1, false, 2, 40),
    {
      id: `${problemId}-scope-code`,
      kind: "inline-code-shape",
      scope: h2Section(1),
      min: 1,
      requireNonemptyContent: true,
      priority: 45,
      feedback: "Use nonempty inline code in the scope list.",
    },
    listCheck(problemId, "plan", 2, true, 3, 50),
    quoteCheck(problemId, "stop", 3, 60),
    codeCheck(problemId, 4, 70),
    listCheck(problemId, "report", 5, false, 2, 80),
    {
      id: `${problemId}-report-emphasis`,
      kind: "inline-presence",
      scope: h2Section(5),
      inline: "strong",
      min: 2,
      priority: 85,
      feedback: "Use bold labels in both report bullets.",
    },
  ]
}

function refactorChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 5, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    listCheck(problemId, "files", 0, false, 2, 30),
    {
      id: `${problemId}-file-code`,
      kind: "inline-code-shape",
      scope: h2Section(0),
      min: 2,
      requireNonemptyContent: true,
      priority: 35,
      feedback: "Write both file paths as nonempty inline code.",
    },
    listCheck(problemId, "plan", 1, true, 3, 40),
    listCheck(problemId, "guardrails", 2, false, 2, 50),
    codeCheck(problemId, 3, 60),
    listCheck(problemId, "report", 4, false, 2, 70),
    {
      id: `${problemId}-report-emphasis`,
      kind: "inline-presence",
      scope: h2Section(4),
      inline: "strong",
      min: 2,
      priority: 75,
      feedback: "Use bold labels in both report bullets.",
    },
  ]
}

function recoveryChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 5, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "thematic-break" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    quoteCheck(problemId, "evidence", 0, 30),
    {
      id: `${problemId}-divider`,
      kind: "block-count",
      scope: h2Section(0),
      block: "thematic-break",
      min: 1,
      max: 1,
      priority: 35,
      feedback: "Put one Markdown divider after the evidence.",
    },
    listCheck(problemId, "recovery", 1, true, 3, 40),
    listCheck(problemId, "constraints", 2, false, 2, 50),
    codeCheck(problemId, 3, 60),
    listCheck(problemId, "report", 4, false, 2, 70),
    {
      id: `${problemId}-report-emphasis`,
      kind: "inline-presence",
      scope: h2Section(4),
      inline: "strong",
      min: 1,
      priority: 75,
      feedback: "Use a bold label in the report list.",
    },
    {
      id: `${problemId}-report-link`,
      kind: "link-shape",
      scope: h2Section(4),
      min: 1,
      requireNonemptyLabel: true,
      requireNonemptyDestination: true,
      allowReferences: true,
      allowAutolinks: false,
      priority: 80,
      feedback: "Use one descriptive Markdown link in the report list.",
    },
  ]
}

function rolloutChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 5, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    listCheck(problemId, "system-map", 0, false, 2, 30),
    {
      id: `${problemId}-nested-map`,
      kind: "list-shape",
      scope: h2Section(0),
      ordered: false,
      minItems: 2,
      maxItems: 2,
      recursive: true,
      descendantsOnly: true,
      requireVisibleItems: true,
      priority: 35,
      feedback: "Nest two visible details under the provider.",
    },
    listCheck(problemId, "rollout", 1, true, 3, 40),
    quoteCheck(problemId, "pause", 2, 50),
    listCheck(problemId, "checks", 3, false, 2, 60),
    {
      id: `${problemId}-check-code`,
      kind: "inline-code-shape",
      scope: h2Section(3),
      min: 2,
      requireNonemptyContent: true,
      priority: 65,
      feedback: "Put nonempty inline code in both check bullets.",
    },
    codeCheck(problemId, 4, 70),
  ]
}

const familyChecks: Record<
  ReplacementFamily,
  (problemId: string) => MatchCheck[]
> = {
  "level4-migration": migrationChecks,
  "level4-investigation": investigationChecks,
  "level5-agent-brief": agentBriefChecks,
  "level5-recovery": recoveryChecks,
  "level5-refactor": refactorChecks,
  "level5-rollout": rolloutChecks,
}

const replacementFamilyId: Partial<Record<ReplacementFamily, string>> = {
  "level4-migration": "workplace-process-change",
  "level4-investigation": "workplace-issue-note",
}

const singleTitleReview = {
  id: "one-document-title",
  kind: "single-h1",
  review: "Keep one H1 as the document title; use H2 for sections.",
} as const

function editorialChecksFor(
  family: ReplacementFamily,
): ProblemInput["editorialChecks"] {
  if (family === "level5-refactor") {
    return [
      singleTitleReview,
      {
        id: "keep-report-labels-focused",
        kind: "max-inline-count",
        scope: documentScope,
        inline: "strong",
        max: 2,
        review: "Keep bold focused on the two report labels.",
      },
    ]
  }
  return [
    singleTitleReview,
    {
      id: "keep-one-blockquote",
      kind: "max-block-count",
      scope: documentScope,
      block: "blockquote",
      recursive: true,
      max: 1,
      review: "Keep the callout focused in one blockquote.",
    },
  ]
}

const familyTeaching: Record<ReplacementFamily, ProblemInput["teaching"]> = {
  "level4-migration": {
    concept: "A compact workplace change note separates preparation, ordered steps, what must stay safe, completion checks, and a record.",
    howTo: "Use five H2 sections, short lists, one blockquote, and one fenced text record.",
    example: "# Schedule change\n\nKeep the handoff small.\n\n## Change\n\n1. Post the new time\n2. Notify the team\n3. Archive the old notice",
  },
  "level4-investigation": {
    concept: "A compact workplace issue note separates observed evidence, reproduction, what changes, and checks.",
    howTo: "Use a quote and divider for evidence, numbered reproduction, short bullets, and inline-code labels.",
    example: "# Handoff note issue\n\nTrace one missing update.\n\n## Evidence\n\n> The afternoon note was absent.\n\n---",
  },
  "level5-agent-brief": {
    concept: "A compact agent brief makes authority, scope, action, stopping, proof, and reporting easy to scan.",
    howTo: "Use ordered reading and action lists, inline code, a linked authority, a stop quote, a command fence, and bold report labels.",
    example: "# Agent brief\n\nKeep one boundary.\n\n## Scope\n\n- Edit `adapter.ts`\n- Preserve callers",
  },
  "level5-recovery": {
    concept: "A recovery brief keeps evidence, repair order, constraints, proof, and reporting visible without becoming an incident report.",
    howTo: "Use quoted evidence, one divider, three numbered actions, short constraints, a command fence, and a linked report item.",
    example: "# Recovery brief\n\nRestore one path.\n\n## Evidence\n\n> One job ran twice.\n\n---",
  },
  "level5-refactor": {
    concept: "A refactor brief names the files, ordered changes, guardrails, proof, and report shape.",
    howTo: "Use inline-code file paths, three numbered actions, short guardrails, a command fence, and bold report labels.",
    example: "# Refactor brief\n\nKeep behavior stable.\n\n## Files\n\n- `source.ts`\n- `source.test.ts`",
  },
  "level5-rollout": {
    concept: "A rollout brief maps ownership, orders the release, states a pause rule, and records proof.",
    howTo: "Use a nested system map, three numbered rollout steps, a pause quote, inline-code checks, and a fenced report template.",
    example: "# Rollout brief\n\nMove one contract.\n\n## System map\n\n- Provider\n  - Schema\n  - Adapter\n- Consumer",
  },
}

const familyMetadata: Record<ReplacementFamily, {
  skillIds: readonly string[]
  syntaxTokens: readonly string[]
  hints: readonly [string, string, string]
}> = {
  "level4-migration": {
    skillIds: ["change-outline", "ordered-change", "guardrail-quote", "fenced-record"],
    syntaxTokens: ["#", "##", "-", "1.", ">", "```text"],
    hints: ["Start with one # title and five ## sections.", "Use bullets for preparation, numbers for the steps, and a quote for what must stay safe.", "Finish with completion bullets and one fenced text record."],
  },
  "level4-investigation": {
    skillIds: ["investigation-outline", "evidence-blockquote", "markdown-divider", "ordered-reproduction", "inline-code-verification"],
    syntaxTokens: ["#", "##", ">", "---", "1.", "-", "`"],
    hints: ["Start with one # title and four ## sections.", "Quote the evidence, add one divider, then number three reproduction steps.", "Finish with change bullets and two checks written with inline code."],
  },
  "level5-agent-brief": {
    skillIds: ["authority-order", "scope-boundary", "ordered-execution", "stop-condition", "verification-contract", "final-report"],
    syntaxTokens: ["#", "##", "1.", "-", "[ ]( )", "`", ">", "```bash", "**"],
    hints: ["Separate authority, scope, and the ordered plan before the stop rule.", "Use a link in Read first and inline code for the file boundary.", "Finish with a command fence and two bold report labels."],
  },
  "level5-recovery": {
    skillIds: ["evidence-boundary", "ordered-recovery", "constraint-list", "verification-contract", "linked-report"],
    syntaxTokens: ["#", "##", ">", "---", "1.", "-", "```bash", "**", "[ ]( )"],
    hints: ["Quote the evidence and separate it with one divider.", "Use three numbered recovery actions and two short constraints.", "Finish with a command fence, a bold result, and one report link."],
  },
  "level5-refactor": {
    skillIds: ["scope-boundary", "ordered-refactor", "guardrail-list", "verification-contract", "final-report"],
    syntaxTokens: ["#", "##", "`", "-", "1.", "```bash", "**"],
    hints: ["Name two files with inline code before the ordered refactor.", "Use three numbered actions and two guardrails.", "Finish with a command fence and two bold report labels."],
  },
  "level5-rollout": {
    skillIds: ["nested-system-map", "ordered-rollout", "pause-condition", "inline-code-verification", "final-report"],
    syntaxTokens: ["#", "##", "-", "  -", "1.", ">", "`", "```markdown"],
    hints: ["Start with one nested provider map and one consumer.", "Number three rollout steps, then quote the pause rule.", "Finish with two inline-code checks and one fenced report template."],
  },
}

export const advancedDocumentReplacementBatch018Inputs: readonly AdvancedDocumentReplacementBatch018Input[] = [
  {
    id: "l4-api-field-deprecation-migration",
    revision: 2,
    family: "level4-migration",
    prompt: "Rebuild a compact meeting-room change note with preparation, ordered steps, one safety note, completion checks, and a record.",
    target: migrationTarget({
      title: "Meeting room name change",
      overview: "Rename one shared room while the old sign remains visible for a short handoff.",
      preconditions: ["Record the current bookings", "List teams using the room"],
      steps: ["Post the new room name", "Update future bookings", "Remove the old sign"],
      guardrail: "Existing bookings must keep their original times.",
      acceptance: ["New notices use one room name", "Reception has the updated map"],
      command: "Owner: Office team | Status: confirmed",
    }),
  },
  {
    id: "l4-cache-namespace-migration",
    revision: 2,
    family: "level4-migration",
    prompt: "Rebuild a compact supply-cabinet change note with preparation, three ordered steps, a safety note, completion checks, and a record.",
    target: migrationTarget({
      title: "Supply cabinet relabeling",
      overview: "Move shared supplies to clearer shelves without interrupting the morning shift.",
      preconditions: ["Photograph the current shelves", "Count frequently used items"],
      steps: ["Place temporary labels", "Move one shelf at a time", "Remove outdated labels"],
      guardrail: "Keep daily supplies available during the move.",
      acceptance: ["Every shelf has one label", "The stock sheet matches the cabinet"],
      command: "Owner: Facilities | Status: checked",
    }),
  },
  {
    id: "l4-configuration-key-migration",
    revision: 2,
    family: "level4-migration",
    prompt: "Rebuild a compact shift-handoff change note with a short preparation list and clear proof.",
    target: migrationTarget({
      title: "Shift handoff format change",
      overview: "Move the closing note to one shared format while teams learn the new headings.",
      preconditions: ["Save one current handoff", "List required details"],
      steps: ["Post the new template", "Use it for one shift", "Archive the old template"],
      guardrail: "Urgent items must remain visible during the change.",
      acceptance: ["Each note has one owner", "Open items carry into the next shift"],
      command: "Owner: Store lead | Status: adopted",
    }),
  },
  {
    id: "l4-nullable-column-backfill-migration",
    revision: 2,
    family: "level4-migration",
    prompt: "Rebuild a compact contact-card update note with a short preparation list, ordered work, a safety note, and proof.",
    target: migrationTarget({
      title: "Emergency contact card update",
      overview: "Add one missing contact label in small groups before printing the next card set.",
      preconditions: ["Count cards missing a label", "Confirm the approved wording"],
      steps: ["Update one small group", "Review the remaining cards", "Print the approved set"],
      guardrail: "Do not replace a label that is already correct.",
      acceptance: ["Existing labels remain unchanged", "The update log names each group"],
      command: "Owner: People team | Status: reviewed",
    }),
  },
  {
    id: "l4-duplicate-form-submission-investigation",
    revision: 2,
    family: "level4-investigation",
    prompt: "Rebuild a compact duplicate-request issue note with evidence, reproduction, what changes, and checks.",
    target: investigationTarget({
      title: "Duplicate supply request issue",
      overview: "Trace why one paper request can appear twice on the weekly order sheet.",
      evidence: "Request SR-18 appeared in two rows after one handoff.",
      reproduction: ["Open the order sheet", "Copy the afternoon notes", "Review request `SR-18`"],
      fix: ["Keep one sheet owner", "Preserve the original request date"],
      checks: ["Compare label `SR-18`", "Confirm status `ready`"],
    }),
  },
  {
    id: "l4-lost-pagination-cursor-investigation",
    revision: 2,
    family: "level4-investigation",
    prompt: "Rebuild a compact missing-handoff issue note with quoted evidence and two visible label checks.",
    target: investigationTarget({
      title: "Missing handoff note issue",
      overview: "Trace why one closing note can disappear before the morning team reads it.",
      evidence: "The morning board did not show note H-24 after the evening close.",
      reproduction: ["Open the closing folder", "Post note `H-24`", "Check the morning board"],
      fix: ["Keep one handoff folder", "Preserve the closing timestamp"],
      checks: ["Find label `H-24`", "Confirm state `posted`"],
    }),
  },
  {
    id: "l4-offline-retry-banner-investigation",
    revision: 2,
    family: "level4-investigation",
    prompt: "Rebuild a compact delivery-board issue note with a short reproduction path and inline-code checks.",
    target: investigationTarget({
      title: "Stale delivery board issue",
      overview: "Trace why a completed delivery can remain on the waiting board.",
      evidence: "Delivery D-07 was logged as received, but its card stayed under Waiting.",
      reproduction: ["Open the delivery log", "Mark item `D-07` complete", "Review the waiting board"],
      fix: ["Keep one board owner", "Preserve the receipt time"],
      checks: ["Find card `D-07`", "Confirm state `complete`"],
    }),
  },
  {
    id: "l4-stale-permission-badge-investigation",
    revision: 2,
    family: "level4-investigation",
    prompt: "Rebuild a compact stale-roster issue note with clear evidence, reproduction, boundaries, and checks.",
    target: investigationTarget({
      title: "Stale training roster issue",
      overview: "Trace why a completed course can remain marked open on the weekly roster.",
      evidence: "Course T-12 stayed open after the attendance sheet was signed.",
      reproduction: ["Open the weekly roster", "Mark course `T-12` complete", "Return to the team list"],
      fix: ["Keep one roster owner", "Preserve the attendance record"],
      checks: ["Find course `T-12`", "Confirm state `complete`"],
    }),
  },
  {
    id: "l5-auth-migration-work-order",
    revision: 3,
    family: "level5-agent-brief",
    prompt: "Rebuild a compact developer brief for migrating session verification safely.",
    target: agentBriefTarget({
      title: "Session verification migration brief",
      overview: "Move verification behind the approved signed-session adapter without changing login behavior.",
      authority: ["Read [agent rules](/AGENTS.md)", "Read the signed-session decision"],
      scope: ["Edit `sessionVerifier.ts`", "Preserve account identifiers"],
      plan: ["Pin current session fixtures", "Add the signed verifier", "Test the login flows"],
      stop: "Stop if rollback would invalidate every active session.",
      command: "npm test --workspace apps/auth -- sessions",
      report: ["**Changed:** verifier boundary", "**Checked:** login and rollback"],
    }),
  },
  {
    id: "l5-dependency-upgrade-work-order",
    revision: 3,
    family: "level5-agent-brief",
    prompt: "Rebuild a compact developer brief for a controlled request-signing dependency upgrade.",
    target: agentBriefTarget({
      title: "Request-signing upgrade brief",
      overview: "Upgrade the approved library while preserving the public signing contract and runtime support.",
      authority: ["Read [agent rules](/AGENTS.md)", "Read the security advisory"],
      scope: ["Edit `requestSigning.ts`", "Keep credentials out of fixtures"],
      plan: ["Pin compatibility fixtures", "Upgrade the direct dependency", "Review transitive changes"],
      stop: "Stop if the approved release drops a required runtime.",
      command: "npm test --workspace packages/request-signing",
      report: ["**Changed:** package and adapter", "**Checked:** compatibility matrix"],
    }),
  },
  {
    id: "l5-performance-recovery-work-order",
    revision: 3,
    family: "level5-agent-brief",
    prompt: "Rebuild a compact developer brief for evidence-led report performance recovery.",
    target: agentBriefTarget({
      title: "Report performance recovery brief",
      overview: "Improve one measured report path while preserving authorization, order, and export fields.",
      authority: ["Read [agent rules](/AGENTS.md)", "Read the performance budget"],
      scope: ["Edit `monthlyReport.ts`", "Use the existing benchmark fixture"],
      plan: ["Record a stable baseline", "Make one bounded change", "Repeat the same benchmark"],
      stop: "Stop if the baseline cannot reproduce the slow path.",
      command: "npm run benchmark -- monthly-report",
      report: ["**Changed:** measured query path", "**Checked:** order and authorization"],
    }),
  },
  {
    id: "l5-release-context-work-order",
    revision: 3,
    family: "level5-agent-brief",
    prompt: "Rebuild a compact developer brief for restoring shared release context.",
    target: agentBriefTarget({
      title: "Shared release context brief",
      overview: "Restore the approved release context from storage without fetching it during requests.",
      authority: ["Read [agent rules](/AGENTS.md)", "Read the storage decision"],
      scope: ["Edit `releaseContext.ts`", "Preserve the public response type"],
      plan: ["Pin the context contract", "Add idempotent storage", "Move the request reader"],
      stop: "Stop if migration history cannot be reconciled safely.",
      command: "npm test --workspace apps/api -- release-context",
      report: ["**Changed:** storage and reader", "**Checked:** request regression"],
    }),
  },
  {
    id: "l5-duplicate-job-recovery-work-order",
    revision: 2,
    family: "level5-recovery",
    prompt: "Rebuild a compact developer recovery brief for duplicate job delivery.",
    target: recoveryTarget({
      title: "Duplicate job recovery brief",
      overview: "Restore one idempotent worker path while preserving delivery evidence.",
      evidence: "One queue message produced the same delivery identifier twice.",
      recovery: ["Add a duplicate-delivery fixture", "Guard the stable identifier", "Run the worker suite"],
      constraints: ["Keep customer records", "Exclude message bodies from logs"],
      command: "npm test --workspace apps/worker -- duplicate-delivery",
      report: ["**Result:** one delivery path", "[Recovery note](/reports/job-recovery)"],
    }),
  },
  {
    id: "l5-search-index-recovery-work-order",
    revision: 2,
    family: "level5-recovery",
    prompt: "Rebuild a compact developer recovery brief for a stale search index.",
    target: recoveryTarget({
      title: "Search index recovery brief",
      overview: "Repair stale facets while the primary database remains the source of truth.",
      evidence: "One record has different categories in the database and index.",
      recovery: ["Capture one mismatch in a fixture", "Update the index mapping", "Rebuild only the checked records"],
      constraints: ["Keep primary records unchanged", "Do not invent missing results"],
      command: "npm test --workspace apps/search -- consistency",
      report: ["**Result:** consistent facets", "[Recovery note](/reports/index-recovery)"],
    }),
  },
  {
    id: "l5-date-format-refactor-work-order",
    revision: 2,
    family: "level5-refactor",
    prompt: "Rebuild a compact developer refactor brief for shared date formatting.",
    target: refactorTarget({
      title: "Date formatting refactor brief",
      overview: "Consolidate duplicate formatting while preserving locale, time-zone, and accessibility behavior.",
      files: ["Edit `date.ts`", "Edit `date.test.ts`"],
      plan: ["Pin current display fixtures", "Create one shared helper", "Move approved callers"],
      guardrails: ["Keep stored timestamps unchanged", "Review snapshots before updating"],
      command: "npm test --workspace packages/formatting",
      report: ["**Changed:** shared helper", "**Checked:** locale boundaries"],
    }),
  },
  {
    id: "l5-analytics-adapter-refactor-work-order",
    revision: 2,
    family: "level5-refactor",
    prompt: "Rebuild a compact developer refactor brief for replacing an analytics adapter.",
    target: refactorTarget({
      title: "Analytics adapter refactor brief",
      overview: "Replace the legacy adapter while preserving event names, consent, and payload allowlists.",
      files: ["Edit `adapter.ts`", "Edit `adapter.test.ts`"],
      plan: ["Pin event fixtures", "Add the approved client", "Move verified callers"],
      guardrails: ["Keep raw customer text out", "Do not bypass consent"],
      command: "npm test --workspace packages/analytics",
      report: ["**Changed:** adapter boundary", "**Checked:** consent and payloads"],
    }),
  },
  {
    id: "l5-api-contract-rollout-work-order",
    revision: 2,
    family: "level5-rollout",
    prompt: "Rebuild a compact developer rollout brief for one versioned API response.",
    target: rolloutTarget({
      title: "API contract rollout brief",
      overview: "Move one versioned response from the provider to supported consumers with a pause rule.",
      provider: "API provider",
      details: ["Versioned schema", "Compatibility adapter"],
      consumer: "Web and mobile consumers",
      rollout: ["Publish the compatible response", "Move supported consumers", "Remove the old adapter"],
      pause: "Pause when one supported consumer cannot read the response.",
      checks: ["Run `npm test --workspace apps/api`", "Run `npm test --workspace apps/web`"],
      reportTitle: "API rollout report",
    }),
  },
  {
    id: "l5-notification-schema-rollout-work-order",
    revision: 2,
    family: "level5-rollout",
    prompt: "Rebuild a compact developer rollout brief for notification preferences.",
    target: rolloutTarget({
      title: "Preference schema rollout brief",
      overview: "Move one preference schema across the API and worker without changing saved choices.",
      provider: "API schema owner",
      details: ["Preference contract", "Compatibility mapping"],
      consumer: "Delivery worker",
      rollout: ["Add the compatible schema", "Move the worker reader", "Remove old fields"],
      pause: "Pause when a saved choice cannot map to the new schema.",
      checks: ["Run `npm test --workspace apps/api`", "Run `npm test --workspace apps/worker`"],
      reportTitle: "Preference rollout report",
    }),
  },
] as const

const sourceProblems: readonly NormalizedProblem[] = [
  ...developmentSpecBatch012Problems,
  ...level35SeedProblems,
  ...advancedDocumentBatch017Problems,
]

function sourceProblem(id: string) {
  const matches = sourceProblems.filter((problem) => problem.id === id)
  if (matches.length !== 1) {
    throw new Error(`Expected one source problem for ${id}; received ${matches.length}`)
  }
  return matches[0]!
}

const convention = {
  id: "nabi-agent-work-order",
  version: "2026.07",
  reviewedOn: "2026-07-22",
} as const

function makeProblem(
  input: AdvancedDocumentReplacementBatch018Input,
): NormalizedProblem {
  const base = sourceProblem(input.id)
  const metadata = familyMetadata[input.family]
  const example = input.target.split("\n").slice(0, 7).join("\n")

  return normalizeProblem({
    ...base,
    skillIds: metadata.skillIds,
    teaching: { ...familyTeaching[input.family], example },
    syntaxTokens: metadata.syntaxTokens,
    familyId: replacementFamilyId[input.family] ?? base.familyId,
    prompt: input.prompt,
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: familyChecks[input.family](input.id),
    editorialChecks: editorialChecksFor(input.family),
    hints: metadata.hints,
    reviewTags: ["one-document-title", "compact-document", input.family],
    sourceBatchId: advancedDocumentReplacementBatch018Id,
    revision: input.revision,
    curriculumVersion,
    contentVariant: `${base.contentVariant}-compact-r${input.revision}`,
    ...(base.level === 5 ? { convention } : {}),
  })
}

export const advancedDocumentReplacementBatch018Problems: readonly NormalizedProblem[] =
  advancedDocumentReplacementBatch018Inputs.map(makeProblem)
