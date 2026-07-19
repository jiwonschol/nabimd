import { normalizeProblem } from "../normalizeProblem"
import type {
  MatchCheck,
  NormalizedProblem,
  ProblemInput,
  VocabularyProfile,
} from "../types"

export const advancedDocumentBatch017Id =
  "2026-07-20-l3-l5-advanced-documents-017"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

type AdvancedDocumentFamily =
  | "operational-impact-brief"
  | "integration-contract-spec"
  | "evidence-recovery-work-order"
  | "bounded-refactor-work-order"
  | "coordinated-rollout-work-order"

export type AdvancedDocumentBatch017Input = {
  id: string
  level: 3 | 4 | 5
  family: AdvancedDocumentFamily
  contentVariant: string
  title: string
  prompt: string
  vocabularyDomain: string
  vocabularyTerms: readonly string[]
  target: string
}

function h2Section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

function h3Section(occurrence: number) {
  return { kind: "section", headingDepth: 3, occurrence } as const
}

function bulletLines(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n")
}

function orderedLines(items: readonly string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n")
}

function documentTitle(title: string, prefix: "Specify " | "Write ") {
  const withoutInstruction = title.replace(prefix, "")
  return `${withoutInstruction.charAt(0).toUpperCase()}${withoutInstruction.slice(1)}`
}

function toBatchInput(
  source: Omit<AdvancedDocumentBatch017Input, "level" | "family" | "target">,
  level: 3 | 4 | 5,
  family: AdvancedDocumentFamily,
  target: string,
): AdvancedDocumentBatch017Input {
  return {
    id: source.id,
    level,
    family,
    contentVariant: source.contentVariant,
    title: source.title,
    prompt: source.prompt,
    vocabularyDomain: source.vocabularyDomain,
    vocabularyTerms: source.vocabularyTerms,
    target,
  }
}

function commonChecks(
  problemId: string,
  h2Count: number,
  sequence: Extract<MatchCheck, { kind: "block-sequence" }>["sequence"],
): MatchCheck[] {
  return [
    {
      id: `${problemId}-outline`,
      kind: "block-sequence",
      scope: documentScope,
      sequence,
      priority: 10,
      feedback:
        "Use one document title, an opening paragraph, and the Goal's section order.",
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
      feedback: `Use exactly ${h2Count} H2 sections in this document.`,
    },
    {
      id: `${problemId}-hierarchy`,
      kind: "heading-depth-order",
      allowSkippedDepths: false,
      priority: 20,
      feedback:
        "Keep heading levels in order: move from H1 to H2 and H3 without skipping a level.",
    },
  ]
}

function visibleListCheck(
  id: string,
  scope: ReturnType<typeof h2Section> | ReturnType<typeof h3Section>,
  ordered: boolean,
  minItems: number,
  priority: number,
  feedback: string,
): MatchCheck {
  return {
    id,
    kind: "list-shape",
    scope,
    ordered,
    minItems,
    requireVisibleItems: true,
    priority,
    feedback,
  }
}

function impactBriefChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 4, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "paragraph" },
    ]),
    {
      id: `${problemId}-observation`,
      kind: "blockquote-shape",
      scope: h2Section(0),
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Put one visible observation in a blockquote in the first H2 section.",
    },
    visibleListCheck(
      `${problemId}-known-impact`,
      h2Section(1),
      false,
      3,
      40,
      "Use at least three visible bullets in the second H2 section.",
    ),
    visibleListCheck(
      `${problemId}-response`,
      h2Section(2),
      true,
      3,
      50,
      "Use at least three visible numbered steps in the third H2 section.",
    ),
    {
      id: `${problemId}-owner`,
      kind: "inline-presence",
      scope: h2Section(3),
      inline: "strong",
      min: 1,
      priority: 60,
      feedback: "Use bold emphasis in the final H2 section.",
    },
    {
      id: `${problemId}-reference`,
      kind: "link-shape",
      scope: h2Section(3),
      min: 1,
      requireNonemptyLabel: true,
      requireNonemptyDestination: true,
      allowReferences: false,
      allowAutolinks: false,
      priority: 70,
      feedback: "Add one descriptive Markdown link in the final H2 section.",
    },
  ]
}

function integrationContractChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 6, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    visibleListCheck(
      `${problemId}-surface`,
      h2Section(0),
      false,
      4,
      30,
      "Use at least four visible bullets in the contract-surface section.",
    ),
    {
      id: `${problemId}-surface-code`,
      kind: "inline-code-shape",
      scope: h2Section(0),
      min: 1,
      requireNonemptyContent: true,
      priority: 35,
      feedback: "Add nonempty inline code to the contract-surface section.",
    },
    {
      id: `${problemId}-dependency-link`,
      kind: "link-shape",
      scope: h2Section(1),
      min: 1,
      requireNonemptyLabel: true,
      requireNonemptyDestination: true,
      allowReferences: false,
      allowAutolinks: false,
      priority: 40,
      feedback: "Add one descriptive Markdown link in the dependency section.",
    },
    {
      id: `${problemId}-dependency-code`,
      kind: "inline-code-shape",
      scope: h2Section(1),
      min: 1,
      requireNonemptyContent: true,
      priority: 45,
      feedback: "Add nonempty inline code to the dependency section.",
    },
    {
      id: `${problemId}-failure-rule`,
      kind: "blockquote-shape",
      scope: h2Section(2),
      requireNonemptyContent: true,
      priority: 50,
      feedback: "Put one visible invariant in a blockquote in the failure section.",
    },
    visibleListCheck(
      `${problemId}-failure-cases`,
      h2Section(2),
      false,
      3,
      55,
      "Use at least three visible failure cases in the third H2 section.",
    ),
    visibleListCheck(
      `${problemId}-implementation`,
      h2Section(3),
      true,
      4,
      60,
      "Use at least four visible numbered implementation steps.",
    ),
    visibleListCheck(
      `${problemId}-acceptance`,
      h2Section(4),
      false,
      4,
      70,
      "Use at least four visible acceptance bullets.",
    ),
    {
      id: `${problemId}-verification`,
      kind: "code-block",
      scope: h2Section(5),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
      priority: 80,
      feedback:
        "Use one fenced, language-tagged code block in the verification section.",
    },
  ]
}

function stageChecks(
  problemId: string,
  h2Occurrence: number,
  stageCount: number,
  priority: number,
): MatchCheck[] {
  return [
    {
      id: `${problemId}-stage-count`,
      kind: "block-count",
      scope: h2Section(h2Occurrence),
      block: "heading",
      depth: 3,
      min: stageCount,
      max: stageCount,
      priority,
      feedback: `Use exactly ${stageCount} H3 stages in the execution section.`,
    },
    ...Array.from({ length: stageCount }, (_, occurrence): MatchCheck =>
      visibleListCheck(
        `${problemId}-stage-${occurrence + 1}`,
        h3Section(occurrence),
        false,
        2,
        priority + occurrence + 1,
        `Use at least two visible bullets under H3 stage ${occurrence + 1}.`,
      ),
    ),
  ]
}

function codeCheck(
  problemId: string,
  suffix: string,
  occurrence: number,
  priority: number,
): MatchCheck {
  return {
    id: `${problemId}-${suffix}`,
    kind: "code-block",
    scope: h2Section(occurrence),
    min: 1,
    max: 1,
    requireLanguageTag: true,
    requireFenced: true,
    priority,
    feedback: "Use one fenced, language-tagged block in this section.",
  }
}

function evidenceRecoveryChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 10, [
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
      { block: "heading", depth: 2 },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    {
      id: `${problemId}-evidence`,
      kind: "blockquote-shape",
      scope: h2Section(0),
      requireNonemptyContent: true,
      priority: 30,
      feedback: "Put visible observed evidence in a blockquote in the first H2 section.",
    },
    {
      id: `${problemId}-evidence-divider`,
      kind: "block-count",
      scope: h2Section(0),
      block: "thematic-break",
      min: 1,
      max: 1,
      priority: 35,
      feedback: "Put one Markdown divider after the observed evidence.",
    },
    visibleListCheck(`${problemId}-authority`, h2Section(1), true, 4, 40, "Use at least four visible ordered authority sources."),
    visibleListCheck(`${problemId}-containment`, h2Section(2), false, 3, 50, "Use at least three visible containment bullets."),
    visibleListCheck(`${problemId}-investigation`, h2Section(3), true, 4, 60, "Use at least four visible numbered investigation steps."),
    ...stageChecks(problemId, 4, 3, 70),
    visibleListCheck(`${problemId}-rollback`, h2Section(5), true, 3, 80, "Use at least three visible numbered rollback steps."),
    visibleListCheck(`${problemId}-constraints`, h2Section(6), false, 4, 90, "Use at least four visible hard-constraint bullets."),
    visibleListCheck(`${problemId}-stops`, h2Section(7), false, 3, 100, "Use at least three visible stop-condition bullets."),
    codeCheck(problemId, "verification", 8, 110),
    codeCheck(problemId, "report", 9, 120),
  ]
}

function boundedRefactorChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 9, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    visibleListCheck(`${problemId}-reading`, h2Section(0), true, 4, 30, "Use at least four visible ordered authority sources."),
    visibleListCheck(`${problemId}-comprehension`, h2Section(1), true, 5, 40, "Use at least five visible numbered comprehension prompts."),
    visibleListCheck(`${problemId}-scope`, h2Section(2), false, 4, 50, "Use at least four visible allowed-scope bullets."),
    {
      id: `${problemId}-scope-code`,
      kind: "inline-code-shape",
      scope: h2Section(2),
      min: 2,
      requireNonemptyContent: true,
      priority: 55,
      feedback: "Use at least two nonempty inline-code items in the allowed-scope section.",
    },
    visibleListCheck(`${problemId}-forbidden`, h2Section(3), false, 4, 60, "Use at least four visible forbidden-shortcut bullets."),
    ...stageChecks(problemId, 4, 4, 70),
    codeCheck(problemId, "regression", 5, 80),
    visibleListCheck(`${problemId}-stops`, h2Section(6), false, 3, 90, "Use at least three visible stop-condition bullets."),
    visibleListCheck(`${problemId}-commits`, h2Section(7), true, 3, 100, "Use at least three visible numbered commit rules."),
    codeCheck(problemId, "report", 8, 110),
  ]
}

function coordinatedRolloutChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 8, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 3 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "code" },
    ]),
    visibleListCheck(`${problemId}-system-map`, h2Section(0), false, 3, 30, "Use a visible unordered system map with at least three top-level items."),
    {
      id: `${problemId}-nested-system-map`,
      kind: "list-shape",
      scope: h2Section(0),
      ordered: false,
      minItems: 2,
      recursive: true,
      descendantsOnly: true,
      requireVisibleItems: true,
      priority: 35,
      feedback: "Nest at least two visible details under one system-map item.",
    },
    visibleListCheck(`${problemId}-authority`, h2Section(1), true, 4, 40, "Use at least four visible ordered authority sources."),
    ...stageChecks(problemId, 2, 3, 50),
    visibleListCheck(`${problemId}-compatibility`, h2Section(3), false, 4, 60, "Use at least four visible compatibility-guard bullets."),
    visibleListCheck(`${problemId}-rollback`, h2Section(4), true, 4, 70, "Use at least four visible numbered rollback steps."),
    {
      id: `${problemId}-pause-rule`,
      kind: "blockquote-shape",
      scope: h2Section(5),
      requireNonemptyContent: true,
      priority: 80,
      feedback: "Put the rollout pause rule in a visible blockquote.",
    },
    visibleListCheck(`${problemId}-stops`, h2Section(5), false, 3, 85, "Use at least three visible stop-condition bullets."),
    visibleListCheck(`${problemId}-verification`, h2Section(6), false, 4, 90, "Use at least four visible verification bullets."),
    {
      id: `${problemId}-verification-code`,
      kind: "inline-code-shape",
      scope: h2Section(6),
      min: 4,
      requireNonemptyContent: true,
      priority: 95,
      feedback: "Use at least four nonempty inline-code items in the verification ledger.",
    },
    codeCheck(problemId, "report", 7, 100),
  ]
}

const familyTeaching: Record<AdvancedDocumentFamily, ProblemInput["teaching"]> = {
  "operational-impact-brief": {
    concept: "An operational brief separates observation, known impact, response order, and the next update.",
    howTo: "Use four H2 sections, a blockquote for what was observed, bullets for known impact, numbered response steps, and a linked owner update.",
    example: "# Service update\n\nShare a short overview.\n\n## Observation\n\n> One delay was reported.\n\nThe report is being reviewed.\n\n## Known impact\n\n- One queue\n- One team\n- One time window\n\n## Response\n\n1. Confirm\n2. Update\n3. Review\n\n## Owner and update\n\n**Owner:** Operations. Read the [update page](/updates).",
  },
  "integration-contract-spec": {
    concept: "An integration contract makes its surface, dependency, failure boundary, implementation, acceptance, and verification inspectable.",
    howTo: "Use six H2 sections, lists for the contract and failure cases, a linked dependency, a quoted invariant, ordered implementation, and a fenced verification block.",
    example: "# Import contract\n\nDefine one boundary.\n\n## Contract surface\n\n- Accept `Record`\n- Return one result\n- Keep identifiers\n- Reject invalid input\n\n## Dependency\n\nFollow the [contract guide](/guides/contracts) for `Record`.\n\n## Failure boundary\n\n> Invalid input never becomes a stored record.\n\n- Missing field\n- Invalid type\n- Duplicate identifier\n\n## Implementation\n\n1. Parse\n2. Validate\n3. Store\n4. Report\n\n## Acceptance\n\n- Valid input succeeds\n- Invalid input fails\n- Duplicates are stable\n- Errors are visible\n\n## Verification\n\n```sh\nnpm test -- import\n```",
  },
  "evidence-recovery-work-order": {
    concept: "An evidence-led recovery order separates observation, containment, investigation, recovery, rollback, constraints, stops, proof, and reporting.",
    howTo: "Use ordered authority and investigation lists, three H3 recovery stages, explicit rollback and stop lists, and fenced verification and report blocks.",
    example: "# Recovery order\n\nState the mission.\n\n## Evidence boundary\n\n> Record one observed failure.\n\n---\n\n## Authority order\n\n1. Rules\n2. Policy\n3. Decision\n4. Current code\n\n## Recovery stages\n\n### Contain\n\n- Limit impact\n- Preserve evidence\n\n### Repair\n\n- Make one change\n- Run focused checks\n\n### Prove\n\n- Run the full gate\n- Record results",
  },
  "bounded-refactor-work-order": {
    concept: "A bounded refactor order grants autonomy only inside explicit reading, comprehension, scope, shortcut, execution, regression, stop, commit, and reporting contracts.",
    howTo: "Use ordered authority and comprehension lists, four H3 execution stages, scope and prohibition bullets, a regression command block, and a report template.",
    example: "# Refactor order\n\nState the invariant.\n\n## Required reading\n\n1. Rules\n2. Decision\n3. Tests\n4. Current adapter\n\n## Allowed scope\n\n- Edit `adapter.ts`\n- Edit `adapter.test.ts`\n- Preserve callers\n- Preserve output\n\n## Execution contract\n\n### Pin behavior\n\n- Add tests\n- Run them",
  },
  "coordinated-rollout-work-order": {
    concept: "A coordinated rollout order maps consumers, authority, phases, compatibility, rollback, stop conditions, verification, and reporting.",
    howTo: "Use a nested system map, an ordered authority list, three H3 rollout phases, compatibility and stop lists, an inline-code verification ledger, and a fenced report template.",
    example: "# Rollout order\n\nState the shared contract.\n\n## System map\n\n- Provider\n  - Schema\n  - Compatibility\n- Web consumer\n- Worker consumer\n\n## Authority order\n\n1. Rules\n2. Contract\n3. Plan\n4. Current code",
  },
}

const familyMetadata: Record<AdvancedDocumentFamily, {
  level: 3 | 4 | 5
  retryFamily: string
  familyId: string
  profile: VocabularyProfile
  skillIds: readonly string[]
  syntaxTokens: readonly string[]
  hints: readonly [string, string, string]
}> = {
  "operational-impact-brief": {
    level: 3,
    retryFamily: "level3-operational-impact-brief",
    familyId: "readable-human-document",
    profile: "workplace-document",
    skillIds: ["impact-brief-outline", "observed-quote", "response-order", "owner-reference"],
    syntaxTokens: ["#", "##", ">", "-", "1.", "**", "[ ]( )"],
    hints: ["Start with one # title, an opening paragraph, and four ## sections.", "Use a quote for the observation, bullets for known impact, and numbers for the response.", "Finish with bold owner text and one descriptive Markdown link."],
  },
  "integration-contract-spec": {
    level: 4,
    retryFamily: "level4-integration-contract-spec",
    familyId: "executable-development-spec",
    profile: "development-spec",
    skillIds: ["contract-surface", "dependency-reference", "failure-boundary", "ordered-implementation", "acceptance-list", "verification-code"],
    syntaxTokens: ["#", "##", "-", "`", "[ ]( )", ">", "1.", "```sh"],
    hints: ["Start with one # title, an opening paragraph, and six ## sections.", "Use bullets and inline code for the contract, then quote the failure invariant before listing cases.", "Finish with numbered implementation, acceptance bullets, and one fenced verification block."],
  },
  "evidence-recovery-work-order": {
    level: 5,
    retryFamily: "level5-evidence-recovery-work-order",
    familyId: "agent-ready-work-order",
    profile: "agent-workflow",
    skillIds: ["evidence-boundary", "authority-order", "containment", "recovery-stages", "rollback-contract", "stop-conditions", "verification-contract", "final-report"],
    syntaxTokens: ["#", "##", "###", ">", "---", "1.", "-", "```bash", "```markdown"],
    hints: ["Separate evidence, authority, containment, investigation, and recovery before writing verification.", "Use exactly three ### recovery stages and keep rollback, constraints, and stop conditions distinct.", "Finish with fenced command evidence and a fenced final-report template."],
  },
  "bounded-refactor-work-order": {
    level: 5,
    retryFamily: "level5-bounded-refactor-work-order",
    familyId: "agent-ready-work-order",
    profile: "agent-workflow",
    skillIds: ["authority-order", "comprehension-gate", "scope-boundary", "forbidden-shortcuts", "four-stage-execution", "regression-guards", "commit-contract", "final-report"],
    syntaxTokens: ["#", "##", "###", "1.", "-", "`", "```bash", "```markdown"],
    hints: ["Order the reading and comprehension gates before granting implementation scope.", "Use exactly four ### stages and separate allowed scope from forbidden shortcuts.", "Finish with regression commands, stop conditions, commit rules, and a report template."],
  },
  "coordinated-rollout-work-order": {
    level: 5,
    retryFamily: "level5-coordinated-rollout-work-order",
    familyId: "agent-ready-work-order",
    profile: "agent-workflow",
    skillIds: ["nested-system-map", "authority-order", "rollout-phases", "compatibility-guards", "rollback-contract", "pause-conditions", "verification-ledger", "final-report"],
    syntaxTokens: ["#", "##", "###", "-", "  -", "1.", ">", "`", "```markdown"],
    hints: ["Map the provider and consumers with one nested list before ordering the authority sources.", "Use exactly three ### rollout phases, then add compatibility guards and numbered rollback.", "Finish with a quoted pause rule, inline-code verification bullets, and a report template."],
  },
}

const impactBriefInputs: readonly AdvancedDocumentBatch017Input[] = [
  {
    id: "l3-support-queue-impact-brief",
    level: 3,
    family: "operational-impact-brief",
    contentVariant: "support-queue-delay",
    title: "Write a customer support delay brief",
    prompt: "Compose a readable update that separates one observed report, known customer impact, response steps, and the next owner update.",
    vocabularyDomain: "customer-operations",
    vocabularyTerms: ["customer impact", "observed report", "response owner", "next update"],
    target: `# Customer support queue update

This brief gives support leads one shared view of the response delay without turning the update into a long incident log.

## What people reported

> New requests are receiving a later first reply than the posted service window.

The report came from the morning queue review and is still being checked against the full day.

## What we know

- The delay affects new email requests
- Existing conversations remain assigned
- Phone support continues on its normal schedule

## What happens next

1. Confirm the oldest waiting request
2. Move an available responder to the new-request queue
3. Review the reply window after the afternoon handoff

## Owner and next update

**Owner:** Customer Operations will post the next confirmed update on the [service update page](/updates/support-queue).`,
  },
  {
    id: "l3-badge-reader-impact-brief",
    level: 3,
    family: "operational-impact-brief",
    contentVariant: "office-badge-reader-interruption",
    title: "Write an office access interruption brief",
    prompt: "Compose a calm workplace update with an observed access report, known impact, ordered response, and a linked owner update.",
    vocabularyDomain: "workplace-operations",
    vocabularyTerms: ["access interruption", "workaround", "response owner", "next update"],
    target: `# East entrance badge reader update

This brief helps coworkers use the available entrance while Facilities checks an intermittent badge reader.

## What people reported

> Several valid badges did not open the east entrance during the morning arrival period.

The reader is being inspected, and no other entrance has been reported unavailable.

## What we know

- The interruption is limited to the east entrance
- The lobby entrance remains staffed
- Existing visitor check-in steps remain available

## What happens next

1. Place a clear direction sign at the east entrance
2. Test the reader with Facilities and Security
3. Share the result before the evening arrival period

## Owner and next update

**Owner:** Facilities will record the next confirmed update on the [building notice page](/notices/east-entrance).`,
  },
]

type IntegrationSpecSource = Omit<AdvancedDocumentBatch017Input, "level" | "family" | "target"> & {
  purpose: string
  surface: readonly string[]
  dependency: string
  invariant: string
  failures: readonly string[]
  implementation: readonly string[]
  acceptance: readonly string[]
  commands: readonly string[]
}

function buildIntegrationSpec(source: IntegrationSpecSource) {
  return `# ${documentTitle(source.title, "Specify ")}

${source.purpose}

## Contract surface

${bulletLines(source.surface)}

## Dependency contract

${source.dependency}

## Failure boundary

> ${source.invariant}

${bulletLines(source.failures)}

## Implementation plan

${orderedLines(source.implementation)}

## Acceptance

${bulletLines(source.acceptance)}

## Verification

\`\`\`sh
${source.commands.join("\n")}
\`\`\``
}

const integrationSources: readonly IntegrationSpecSource[] = [
  {
    id: "l4-support-webhook-contract-spec",
    contentVariant: "inbound-support-webhook",
    title: "Specify an inbound support webhook contract",
    prompt: "Compose a development spec for a signed support webhook with an inspectable contract, bounded failures, implementation order, acceptance, and verification.",
    vocabularyDomain: "service-integrations",
    vocabularyTerms: ["payload", "signature", "event identifier", "idempotency"],
    purpose: "Define how the support service accepts signed conversation events without duplicating updates or exposing provider details to the rest of the application.",
    surface: ["Accept one `SupportEvent` payload", "Preserve the provider event identifier", "Return one documented acknowledgment", "Store no raw signing secret"],
    dependency: "Follow the [webhook security guide](/guides/webhook-security) and keep verification behind `SupportEventVerifier`.",
    invariant: "An event is never processed until its signature and stable identifier have been verified.",
    failures: ["Missing or malformed signature", "Repeated event identifier", "Unsupported event type"],
    implementation: ["Freeze valid and invalid payload fixtures", "Verify the signature at the adapter boundary", "Record the stable identifier before dispatch", "Return the documented acknowledgment for every handled result"],
    acceptance: ["A valid new event is processed once", "A repeated identifier produces no duplicate update", "An invalid signature changes no stored data", "Logs contain no signing secret or full payload"],
    commands: ["npm test -- support-webhook", "npm run typecheck"],
  },
  {
    id: "l4-contact-import-contract-spec",
    contentVariant: "csv-contact-import",
    title: "Specify a CSV contact import contract",
    prompt: "Compose a development spec for validating and importing contact rows while making partial failures and duplicate handling reviewable.",
    vocabularyDomain: "data-import",
    vocabularyTerms: ["schema", "validation", "partial failure", "duplicate record"],
    purpose: "Define a bounded CSV import that preserves valid contact rows, reports invalid rows clearly, and never creates a second record for the same external identifier.",
    surface: ["Accept one `ContactRow` schema", "Preserve the source row number", "Return imported and rejected counts", "Keep the external identifier stable"],
    dependency: "Follow the [import validation guide](/guides/import-validation) and reuse `ContactRowSchema` at the file boundary.",
    invariant: "A rejected row never becomes a partial contact record.",
    failures: ["Missing required identifier", "Invalid email field", "Duplicate external identifier"],
    implementation: ["Parse the header and source row numbers", "Validate each row before mapping fields", "Write valid contacts in one bounded operation", "Return a row-level rejection summary"],
    acceptance: ["Valid rows retain their source order", "Invalid rows are reported without partial records", "Repeated identifiers do not create duplicates", "A fully invalid file returns a useful summary"],
    commands: ["npm test -- contact-import", "npm run typecheck"],
  },
  {
    id: "l4-customer-digest-contract-spec",
    contentVariant: "scheduled-customer-digest",
    title: "Specify a scheduled customer digest contract",
    prompt: "Compose a development spec for a scheduled digest with a stable delivery window, deduplication boundary, fallback behavior, and verification.",
    vocabularyDomain: "background-delivery",
    vocabularyTerms: ["delivery window", "deduplication", "scheduler", "fallback"],
    purpose: "Define one scheduled digest run that selects eligible updates, sends at most one message per recipient window, and records unavailable delivery without inventing content.",
    surface: ["Accept one `DigestWindow` value", "Select only eligible updates", "Reuse one delivery identifier", "Return a recorded delivery outcome"],
    dependency: "Follow the [scheduled delivery guide](/guides/scheduled-delivery) and declare the job through `DigestScheduler`.",
    invariant: "A repeated scheduler delivery never creates a second digest for the same recipient window.",
    failures: ["Missing recipient preference", "Temporary delivery provider failure", "Repeated scheduler invocation"],
    implementation: ["Freeze the delivery-window calculation", "Select updates through the existing repository", "Claim the stable delivery identifier", "Record sent, deferred, or unavailable outcomes"],
    acceptance: ["One window produces at most one digest", "An empty update set produces no message", "A temporary failure can be retried safely", "Unavailable data is never replaced with invented copy"],
    commands: ["npm test -- customer-digest", "npm run typecheck"],
  },
  {
    id: "l4-audit-archive-contract-spec",
    contentVariant: "downloadable-audit-archive",
    title: "Specify a downloadable audit archive contract",
    prompt: "Compose a development spec for creating an authorized audit archive with a manifest, checksum, retention boundary, acceptance, and verification.",
    vocabularyDomain: "secure-export",
    vocabularyTerms: ["manifest", "checksum", "retention", "authorization"],
    purpose: "Define an authorized archive export that records its contents, verifies the completed file, and expires according to the existing retention policy.",
    surface: ["Accept one `ArchiveRequest`", "Preserve the requesting account identifier", "Produce one manifest and checksum", "Return a time-bounded download reference"],
    dependency: "Follow the [secure export guide](/guides/secure-exports) and keep authorization inside `ArchiveRequestPolicy`.",
    invariant: "An archive is never exposed before authorization and checksum verification both succeed.",
    failures: ["Unauthorized requesting account", "Missing source record", "Checksum mismatch after archive creation"],
    implementation: ["Authorize the request before reading records", "Build the manifest from approved fields", "Create and verify the archive checksum", "Store the download reference with its expiration"],
    acceptance: ["Unauthorized requests create no archive", "The manifest lists every included file", "A checksum mismatch exposes no download", "Expired references cannot retrieve the archive"],
    commands: ["npm test -- audit-archive", "npm run typecheck"],
  },
]

const integrationInputs = integrationSources.map((source) =>
  toBatchInput(
    source,
    4,
    "integration-contract-spec",
    buildIntegrationSpec(source),
  ),
)

type RecoverySource = Omit<AdvancedDocumentBatch017Input, "level" | "family" | "target"> & {
  mission: string
  evidence: string
  authority: readonly string[]
  containment: readonly string[]
  investigation: readonly string[]
  stages: readonly { title: string; actions: readonly string[] }[]
  rollback: readonly string[]
  constraints: readonly string[]
  stops: readonly string[]
  commands: readonly string[]
  reportItems: readonly string[]
}

function buildRecoveryOrder(source: RecoverySource) {
  const stages = source.stages.map((stage) => `### ${stage.title}\n\n${bulletLines(stage.actions)}`).join("\n\n")
  return `# ${documentTitle(source.title, "Write ")}

${source.mission}

## Evidence boundary

> ${source.evidence}

---

## Authority order

${orderedLines(source.authority)}

## Containment

${bulletLines(source.containment)}

## Investigation plan

${orderedLines(source.investigation)}

## Recovery stages

${stages}

## Rollback plan

${orderedLines(source.rollback)}

## Hard constraints

${bulletLines(source.constraints)}

## Stop conditions

${bulletLines(source.stops)}

## Verification evidence

\`\`\`bash
${source.commands.join("\n")}
\`\`\`

## Final recovery report

\`\`\`markdown
# Recovery report

## Evidence reviewed
${bulletLines(source.reportItems)}

## Verification result
- Focused checks and observed counts
- Complete gate and observed counts
- Remaining owner decisions
\`\`\``
}

const recoverySources: readonly RecoverySource[] = [
  {
    id: "l5-duplicate-job-recovery-work-order",
    contentVariant: "duplicate-job-delivery-recovery",
    title: "Write a duplicate job recovery work order",
    prompt: "Compose an evidence-led work order for containing and repairing duplicate job deliveries while preserving rollback and audit evidence.",
    vocabularyDomain: "production-recovery",
    vocabularyTerms: ["evidence boundary", "containment", "idempotency", "rollback trigger", "audit trail"],
    mission: "Recover the fictional Northstar Queue worker after one deployment produced duplicate invoice-notification jobs. Preserve customer records, delivery identifiers, and truthful evidence while restoring one idempotent processing path.",
    evidence: "The same delivery identifier appears twice in the worker log after one queue message is acknowledged.",
    authority: ["Read `AGENTS.md` for repository rules", "Read the queue safety policy", "Read ADR-018 for delivery idempotency", "Inspect the worker, migration, and retry test conventions"],
    containment: ["Pause only the affected notification job", "Preserve duplicate delivery identifiers for review", "Keep unrelated queue consumers running"],
    investigation: ["Reproduce one duplicate with the approved fixture", "Trace the acknowledgment and retry boundaries", "Compare the deployed migration with repository history", "Record the smallest evidence-supported repair"],
    stages: [{ title: "Stage 1 — pin the failure", actions: ["Add a focused duplicate-delivery test", "Prove the verified default behavior before editing"] }, { title: "Stage 2 — restore idempotency", actions: ["Apply one bounded worker change", "Preserve the existing delivery identifier"] }, { title: "Stage 3 — prove recovery", actions: ["Run queue and notification suites", "Review logs and migrations against the constraints"] }],
    rollback: ["Disable the affected worker deployment", "Restore the prior verified worker artifact", "Replay only reviewed delivery identifiers"],
    constraints: ["No customer record is deleted to make counts agree", "One delivery identifier creates at most one notification", "Unrelated queue consumers remain available", "Logs contain no notification body or credential"],
    stops: ["Repository history cannot explain the deployed migration", "Safe replay requires deleting customer data", "The queue platform contradicts the approved acknowledgment contract"],
    commands: ["npm test --workspace apps/worker -- duplicate-delivery", "npm run typecheck", "rg \"skipIdempotency|forceAcknowledge\" apps/worker/src"],
    reportItems: ["Observed duplicate evidence", "Containment and repair stages", "Replay and regression results"],
  },
  {
    id: "l5-search-index-recovery-work-order",
    contentVariant: "search-index-consistency-recovery",
    title: "Write a search index recovery work order",
    prompt: "Compose an evidence-led work order for restoring index consistency after a schema rollout without weakening the source-of-truth boundary.",
    vocabularyDomain: "search-operations",
    vocabularyTerms: ["baseline", "index consistency", "rebuild boundary", "rollback trigger", "regression guard"],
    mission: "Restore the fictional Atlas Desk search index after a schema rollout left a subset of records with stale facets. Treat the primary database as the source of truth and keep the recovery measurable, reversible, and reviewable.",
    evidence: "The same record has the current category in the database and the previous category in the search index snapshot.",
    authority: ["Read `AGENTS.md` for repository rules", "Read the search recovery policy", "Read ADR-024 for index ownership", "Inspect current indexing and rebuild conventions"],
    containment: ["Pause the affected incremental indexer", "Preserve the inconsistent snapshot", "Keep database reads available"],
    investigation: ["Measure the inconsistent record set", "Compare schema and indexer deployment versions", "Reproduce one stale facet from a fixed fixture", "Identify the bounded rebuild range"],
    stages: [{ title: "Stage 1 — establish the baseline", actions: ["Record database and index counts", "Freeze one representative mismatch"] }, { title: "Stage 2 — repair the boundary", actions: ["Update the approved index mapping", "Rebuild only the verified range"] }, { title: "Stage 3 — compare and guard", actions: ["Repeat the baseline method", "Add a stable consistency regression"] }],
    rollback: ["Stop the bounded rebuild", "Restore the previous verified mapping", "Resume reads from the last consistent snapshot"],
    constraints: ["The database remains the source of truth", "No missing result is replaced with invented content", "The rebuild does not alter primary records", "A smaller fixture does not count as recovery evidence"],
    stops: ["The baseline cannot reproduce the reported mismatch", "The approved mapping conflicts with current primary data", "Recovery requires changing the public search contract"],
    commands: ["npm test --workspace apps/search -- consistency", "npm run benchmark -- index-compare", "rg \"writePrimaryRecord|ignoreMismatch\" apps/search/src"],
    reportItems: ["Baseline and mismatch set", "Mapping and rebuild changes", "Consistency and regression results"],
  },
]

type RefactorSource = Omit<AdvancedDocumentBatch017Input, "level" | "family" | "target"> & {
  mission: string
  reading: readonly string[]
  comprehension: readonly string[]
  allowed: readonly string[]
  forbidden: readonly string[]
  stages: readonly { title: string; actions: readonly string[] }[]
  commands: readonly string[]
  stops: readonly string[]
  commits: readonly string[]
  reportItems: readonly string[]
}

function buildRefactorOrder(source: RefactorSource) {
  const stages = source.stages.map((stage) => `### ${stage.title}\n\n${bulletLines(stage.actions)}`).join("\n\n")
  return `# ${documentTitle(source.title, "Write ")}

${source.mission}

## Required reading and authority

${orderedLines(source.reading)}

## Comprehension gate

${orderedLines(source.comprehension)}

## Allowed scope

${bulletLines(source.allowed)}

## Forbidden shortcuts

${bulletLines(source.forbidden)}

## Execution contract

${stages}

## Regression guards

\`\`\`bash
${source.commands.join("\n")}
\`\`\`

## Stop conditions

${bulletLines(source.stops)}

## Commit contract

${orderedLines(source.commits)}

## Final report

\`\`\`markdown
# Refactor report

## Stage outcomes
${bulletLines(source.reportItems)}

## Verification
- Focused checks with observed counts
- Full gate with observed counts
- Regression searches with observed results

## Owner decisions
- List only decisions that require new authority
\`\`\``
}

const refactorSources: readonly RefactorSource[] = [
  {
    id: "l5-date-format-refactor-work-order",
    contentVariant: "shared-date-format-refactor",
    title: "Write a bounded date formatting refactor order",
    prompt: "Compose an agent work order for consolidating duplicated date formatting while preserving locale, time-zone, and display contracts.",
    vocabularyDomain: "repository-maintenance",
    vocabularyTerms: ["source precedence", "comprehension gate", "scope boundary", "regression guard", "commit contract"],
    mission: "Consolidate duplicated date and time formatting in the fictional Beacon Office monorepo. Keep locale, time-zone, accessibility, and snapshot behavior unchanged while giving the agent autonomy inside an explicit file boundary.",
    reading: ["Read `AGENTS.md`", "Read the date display decision record", "Inspect shared formatting tests", "Inspect current web and email call sites"],
    comprehension: ["Restate which layer owns time-zone conversion", "Restate which locale comes from the user profile", "List the displays that must remain unchanged", "Identify the shared helper boundary", "Name the checks that guard snapshots and accessibility"],
    allowed: ["Edit `packages/formatting/src/date.ts`", "Edit `packages/formatting/src/date.test.ts`", "Update approved web and email callers", "Update focused documentation for the shared helper"],
    forbidden: ["Do not change stored timestamps", "Do not replace locale-aware formatting with fixed strings", "Do not update snapshots before reviewing the rendered difference", "Do not introduce a second formatting dependency"],
    stages: [{ title: "Stage 1 — pin current behavior", actions: ["Add boundary fixtures for locale and time zone", "Run the focused formatting suite"] }, { title: "Stage 2 — create the shared helper", actions: ["Move one verified behavior at a time", "Keep the public helper signature narrow"] }, { title: "Stage 3 — migrate callers", actions: ["Update web and email consumers", "Remove only proven duplicate helpers"] }, { title: "Stage 4 — verify the boundary", actions: ["Run accessibility and snapshot checks", "Search for remaining duplicate formatting paths"] }],
    commands: ["npm test --workspace packages/formatting", "npm run typecheck", "rg \"toLocaleString|formatDisplayDate\" apps packages"],
    stops: ["An approved display requires conflicting time-zone ownership", "A caller depends on undocumented fixed output", "The shared helper would change a public serialization contract"],
    commits: ["Commit the behavior fixtures separately", "Commit each verified caller migration with its checks", "Keep formatting-only cleanup out of behavior commits"],
    reportItems: ["Pinned behavior and helper boundary", "Migrated callers and removed duplicates", "Snapshot, accessibility, and regression evidence"],
  },
  {
    id: "l5-analytics-adapter-refactor-work-order",
    contentVariant: "analytics-adapter-replacement",
    title: "Write a bounded analytics adapter refactor order",
    prompt: "Compose an agent work order for replacing a legacy analytics adapter without changing event names, payload boundaries, privacy rules, or caller behavior.",
    vocabularyDomain: "event-instrumentation",
    vocabularyTerms: ["authority boundary", "event contract", "forbidden shortcut", "regression guard", "commit contract"],
    mission: "Replace the fictional Cedar Metrics legacy analytics adapter with the approved event client. Preserve public event names, payload allowlists, consent behavior, and caller ownership while keeping raw customer values out of tests and logs.",
    reading: ["Read `AGENTS.md` and the privacy policy", "Read ADR-031 for the approved event client", "Inspect the event contract fixtures", "Inspect current web and worker callers"],
    comprehension: ["Restate which layer owns consent", "List the fields allowed in an event payload", "Identify the stable public event names", "Explain when the adapter returns without sending", "Name the checks that detect direct client calls"],
    allowed: ["Edit `packages/analytics/src/adapter.ts`", "Edit `packages/analytics/src/adapter.test.ts`", "Update approved callers behind the adapter", "Update the event contract reference"],
    forbidden: ["Do not rename public events", "Do not add raw customer text to payloads", "Do not bypass consent to satisfy a fixture", "Do not let callers import the vendor client directly"],
    stages: [{ title: "Stage 1 — freeze the event contract", actions: ["Add deterministic allowlist fixtures", "Record consent and unavailable-client behavior"] }, { title: "Stage 2 — add the approved client", actions: ["Keep vendor code behind the adapter", "Map only allowlisted payload fields"] }, { title: "Stage 3 — migrate callers", actions: ["Update web and worker imports", "Remove verified legacy adapter paths"] }, { title: "Stage 4 — audit and verify", actions: ["Search for direct client imports", "Run privacy, event, and integration suites"] }],
    commands: ["npm test --workspace packages/analytics", "npm run typecheck", "rg \"vendorAnalytics|rawCustomerText\" apps packages"],
    stops: ["The approved client cannot preserve consent behavior", "A documented event contract conflicts with production callers", "Safe migration requires storing a prohibited payload field"],
    commits: ["Commit contract fixtures before implementation", "Commit the adapter and callers in reviewable stages", "Do not mix event changes with unrelated instrumentation cleanup"],
    reportItems: ["Event contract and consent evidence", "Adapter and caller migrations", "Privacy and regression audit"],
  },
]

type RolloutSource = Omit<AdvancedDocumentBatch017Input, "level" | "family" | "target"> & {
  mission: string
  systemMap: readonly { name: string; details?: readonly string[] }[]
  authority: readonly string[]
  phases: readonly { title: string; actions: readonly string[] }[]
  compatibility: readonly string[]
  rollback: readonly string[]
  pauseRule: string
  stops: readonly string[]
  verification: readonly string[]
  reportItems: readonly string[]
}

function nestedMapLines(items: RolloutSource["systemMap"]) {
  return items.map((item) => [`- ${item.name}`, ...(item.details ?? []).map((detail) => `  - ${detail}`)].join("\n")).join("\n")
}

function buildRolloutOrder(source: RolloutSource) {
  const phases = source.phases.map((phase) => `### ${phase.title}\n\n${bulletLines(phase.actions)}`).join("\n\n")
  return `# ${documentTitle(source.title, "Write ")}

${source.mission}

## System map

${nestedMapLines(source.systemMap)}

## Authority order

${orderedLines(source.authority)}

## Rollout phases

${phases}

## Compatibility guards

${bulletLines(source.compatibility)}

## Rollback plan

${orderedLines(source.rollback)}

## Pause and stop conditions

> ${source.pauseRule}

${bulletLines(source.stops)}

## Verification ledger

${bulletLines(source.verification)}

## Release report

\`\`\`markdown
# Coordinated rollout report

## Consumer outcomes
${bulletLines(source.reportItems)}

## Verification evidence
- Compatibility checks with observed counts
- Rollback rehearsal with observed result
- Remaining owner decisions
\`\`\``
}

const rolloutSources: readonly RolloutSource[] = [
  {
    id: "l5-api-contract-rollout-work-order",
    contentVariant: "versioned-api-contract-rollout",
    title: "Write a coordinated API contract rollout order",
    prompt: "Compose an agent work order for rolling out a versioned response contract across API, web, and mobile consumers with compatibility and rollback proof.",
    vocabularyDomain: "multi-consumer-delivery",
    vocabularyTerms: ["consumer contract", "compatibility window", "dependency order", "release gate", "rollback trigger"],
    mission: "Roll out the fictional Harbor Tasks versioned project response across the API, web client, and mobile client. Preserve the current version during the compatibility window and require evidence from every consumer before removing it.",
    systemMap: [{ name: "API provider", details: ["Versioned schema", "Compatibility serializer"] }, { name: "Web consumer", details: ["Typed client", "Browser journey"] }, { name: "Mobile consumer", details: ["Cached response", "Offline journey"] }],
    authority: ["Read `AGENTS.md` in each repository", "Read the shared response contract", "Read the approved rollout decision", "Inspect current consumer fixtures and release rules"],
    phases: [{ title: "Phase 1 — add compatibility", actions: ["Publish the new typed response beside the current version", "Add provider contract fixtures"] }, { title: "Phase 2 — move consumers", actions: ["Update web before mobile release", "Record both consumer verification results"] }, { title: "Phase 3 — retire the old path", actions: ["Confirm the compatibility window has closed", "Remove only the verified old serializer"] }],
    compatibility: ["Existing clients continue to read the current version", "Unknown optional fields remain safe", "Cached mobile data remains readable", "The provider emits one declared version per response"],
    rollback: ["Restore the prior provider serializer", "Restore the previous typed clients", "Redeploy web before mobile rollback review", "Run the complete compatibility suite"],
    pauseRule: "Pause the rollout when one consumer cannot prove the shared response contract on its supported release.",
    stops: ["Repository authority files disagree on version ownership", "The mobile release cannot represent the compatibility window", "Rollback requires deleting user data"],
    verification: ["Run `npm test --workspace apps/api -- contract`", "Run `npm test --workspace apps/web -- project-response`", "Run `npm test --workspace apps/mobile -- project-response`", "Run `npm run test:e2e -- compatibility`"],
    reportItems: ["Provider and compatibility results", "Web and mobile consumer results", "Retirement or rollback decision"],
  },
  {
    id: "l5-notification-schema-rollout-work-order",
    contentVariant: "notification-preference-schema-rollout",
    title: "Write a coordinated preference schema rollout order",
    prompt: "Compose an agent work order for coordinating a notification preference schema across an API, worker, and admin console with pause and rollback gates.",
    vocabularyDomain: "cross-service-delivery",
    vocabularyTerms: ["schema owner", "consumer order", "compatibility guard", "pause condition", "owner evidence"],
    mission: "Roll out the fictional Willow Mail notification preference schema across the API, delivery worker, and admin console. Keep one schema owner, preserve existing choices, and require consumer evidence before removing compatibility fields.",
    systemMap: [{ name: "API schema owner", details: ["Preference contract", "Compatibility mapping"] }, { name: "Delivery worker", details: ["Read path", "Delivery decision"] }, { name: "Admin console", details: ["Edit form", "Audit view"] }],
    authority: ["Read repository-wide agent rules", "Read the preference data policy", "Read ADR-027 for schema ownership", "Inspect API, worker, and console contract tests"],
    phases: [{ title: "Phase 1 — establish one owner", actions: ["Add the new schema and compatibility mapping", "Freeze existing preference fixtures"] }, { title: "Phase 2 — move readers and writers", actions: ["Move the worker read path first", "Move the admin form after worker verification"] }, { title: "Phase 3 — remove compatibility", actions: ["Confirm every supported consumer is migrated", "Remove old fields through the repository workflow"] }],
    compatibility: ["Existing preference choices retain their meaning", "Missing optional values use the documented fallback", "The worker reads only the API-owned contract", "The console never becomes a second schema owner"],
    rollback: ["Restore compatibility mapping in the API", "Restore the previous worker reader", "Restore the previous console form mapping", "Run preference and delivery journeys"],
    pauseRule: "Pause when any consumer writes a preference value the API-owned schema cannot represent safely.",
    stops: ["The data policy conflicts with the approved fallback", "A supported worker version cannot read the compatibility mapping", "Rollback would discard an existing user choice"],
    verification: ["Run `npm test --workspace apps/api -- preferences`", "Run `npm test --workspace apps/worker -- delivery-choice`", "Run `npm test --workspace apps/admin -- preference-form`", "Run `npm run test:e2e -- notification-preferences`"],
    reportItems: ["Schema owner and compatibility result", "Worker and console migration result", "Removal, pause, or rollback evidence"],
  },
]

const level5Inputs: readonly AdvancedDocumentBatch017Input[] = [
  ...recoverySources.map((source) =>
    toBatchInput(
      source,
      5,
      "evidence-recovery-work-order",
      buildRecoveryOrder(source),
    ),
  ),
  ...refactorSources.map((source) =>
    toBatchInput(
      source,
      5,
      "bounded-refactor-work-order",
      buildRefactorOrder(source),
    ),
  ),
  ...rolloutSources.map((source) =>
    toBatchInput(
      source,
      5,
      "coordinated-rollout-work-order",
      buildRolloutOrder(source),
    ),
  ),
]

export const advancedDocumentBatch017Inputs: readonly AdvancedDocumentBatch017Input[] = [
  ...impactBriefInputs,
  ...integrationInputs,
  ...level5Inputs,
]

function checksFor(input: AdvancedDocumentBatch017Input): MatchCheck[] {
  switch (input.family) {
    case "operational-impact-brief": return impactBriefChecks(input.id)
    case "integration-contract-spec": return integrationContractChecks(input.id)
    case "evidence-recovery-work-order": return evidenceRecoveryChecks(input.id)
    case "bounded-refactor-work-order": return boundedRefactorChecks(input.id)
    case "coordinated-rollout-work-order": return coordinatedRolloutChecks(input.id)
  }
}

const convention = {
  id: "nabi-agent-work-order",
  version: "2026.07",
  reviewedOn: "2026-07-20",
} as const

function makeProblem(input: AdvancedDocumentBatch017Input): NormalizedProblem {
  const metadata = familyMetadata[input.family]
  if (metadata.level !== input.level) {
    throw new Error(`Family ${input.family} cannot publish at Level ${input.level}`)
  }
  return normalizeProblem({
    id: input.id,
    schemaVersion: 2,
    level: input.level,
    familyId: metadata.familyId,
    skillIds: metadata.skillIds,
    difficulty: "makeover",
    teachingMode: "recall",
    teaching: familyTeaching[input.family],
    syntaxTokens: metadata.syntaxTokens,
    title: input.title,
    prompt: input.prompt,
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: checksFor(input),
    editorialChecks: [{ id: "one-document-title", kind: "single-h1", review: "Keep one H1 as the document title; use H2 and H3 for sections." }],
    hints: metadata.hints,
    retryFamily: metadata.retryFamily,
    reviewTags: ["one-document-title", "logical-heading-order", input.family],
    vocabulary: { profile: metadata.profile, domains: [input.vocabularyDomain], terms: input.vocabularyTerms },
    sourceBatchId: advancedDocumentBatch017Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
    ...(input.level === 5 ? { convention } : {}),
  })
}

export const advancedDocumentBatch017Problems: readonly NormalizedProblem[] =
  advancedDocumentBatch017Inputs.map(makeProblem)
