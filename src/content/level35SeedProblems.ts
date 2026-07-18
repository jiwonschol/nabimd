import { normalizeProblem } from "./normalizeProblem"
import type {
  CurriculumLevel,
  MatchCheck,
  NormalizedProblem,
  VocabularyProfile,
} from "./types"

const documentScope = { kind: "document" } as const

function section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

function commonCheck(id: string, priority: number, feedback: string) {
  return { id, priority, feedback }
}

type SeedProblemInput = {
  id: string
  level: CurriculumLevel
  familyId: string
  skillIds: readonly string[]
  retryFamily: string
  contentVariant: string
  vocabularyProfile: VocabularyProfile
  vocabularyDomains: readonly string[]
  vocabularyTerms: readonly string[]
  title: string
  prompt: string
  target: string
  teaching: {
    concept: string
    howTo: string
    example: string
  }
  syntaxTokens: readonly string[]
  matchChecks: readonly MatchCheck[]
  convention?: {
    id: string
    version: string
    reviewedOn: string
  }
  revision?: number
}

function createSeedProblem(input: SeedProblemInput): NormalizedProblem {
  return normalizeProblem({
    schemaVersion: 2,
    id: input.id,
    level: input.level,
    familyId: input.familyId,
    skillIds: input.skillIds,
    difficulty: "makeover",
    teachingMode: "recall",
    vocabulary: {
      profile: input.vocabularyProfile,
      domains: input.vocabularyDomains,
      terms: input.vocabularyTerms,
    },
    teaching: input.teaching,
    syntaxTokens: input.syntaxTokens,
    title: input.title,
    prompt: input.prompt,
    target: input.target,
    starterText: "",
    protectedContent: [],
    matchChecks: input.matchChecks,
    editorialChecks: [
      {
        id: "one-document-title",
        kind: "single-h1",
        review: "Keep one H1 as the document title; use H2 and H3 for sections.",
      },
    ],
    hints: [
      "Start with one # title, then divide the document with ## sections.",
      "Match the Goal's block types and their order; the wording is yours.",
      "Check each section for the requested list, emphasis, or code block.",
    ],
    retryFamily: input.retryFamily,
    reviewTags: ["one-document-title", "logical-heading-order"],
    sourceBatchId: "milestone-1-level-3-5-seeds",
    revision: input.revision ?? 1,
    curriculumVersion: "2026-07-19",
    contentVariant: input.contentVariant,
    ...(input.convention ? { convention: input.convention } : {}),
  })
}

function level3Checks(problemId: string): readonly MatchCheck[] {
  return [
    {
      ...commonCheck(
        `${problemId}-outline`,
        10,
        "Use one document title, an opening paragraph, and two H2 sections in the Goal's order.",
      ),
      kind: "block-sequence",
      scope: documentScope,
      sequence: [
        { block: "heading", depth: 1 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "list" },
      ],
    },
    {
      ...commonCheck(
        `${problemId}-hierarchy`,
        20,
        "Keep heading levels in order: move from H1 to H2 without skipping a level.",
      ),
      kind: "heading-depth-order",
      allowSkippedDepths: false,
    },
    {
      ...commonCheck(
        `${problemId}-sections`,
        15,
        "Keep exactly two H2 sections in this short workplace document.",
      ),
      kind: "block-count",
      scope: documentScope,
      block: "heading",
      depth: 2,
      min: 2,
      max: 2,
    },
    {
      ...commonCheck(
        `${problemId}-emphasis`,
        30,
        "Use bold emphasis inside the first H2 section.",
      ),
      kind: "inline-presence",
      scope: section(0),
      inline: "strong",
      min: 1,
    },
    {
      ...commonCheck(
        `${problemId}-actions`,
        40,
        "Finish the second H2 section with an unordered list of at least three items.",
      ),
      kind: "list-shape",
      scope: section(1),
      ordered: false,
      minItems: 3,
    },
  ]
}

const level3Documents = [
  {
    id: "l3-weekly-handoff",
    contentVariant: "weekly-handoff",
    title: "Make a weekly handoff easy to scan",
    prompt:
      "Write a short team handoff with one title, a highlighted update, and a clear follow-up list.",
    terms: ["handoff", "owner", "follow-up"],
    target: `# Weekly handoff

The afternoon team can use this note to continue without repeating work.

## Current update

The **customer reply is ready** and the shared folder contains the latest draft.

## Follow-up

- Confirm the final owner
- Share the review date
- Archive the older draft`,
  },
  {
    id: "l3-customer-feedback-note",
    contentVariant: "customer-feedback",
    title: "Turn customer feedback into a readable note",
    prompt:
      "Organize a customer note with one title, a bold takeaway, and three follow-up items.",
    terms: ["customer", "feedback", "follow-up"],
    target: `# Customer feedback note

This summary helps the service team review the same information before tomorrow's meeting.

## What we heard

The **setup steps felt unclear** when customers reached the final screen.

## Follow-up

- Rewrite the last instruction
- Ask support to review the wording
- Compare the next five replies`,
  },
  {
    id: "l3-meeting-decision",
    contentVariant: "meeting-decision",
    title: "Record a meeting decision for another person",
    prompt:
      "Create a compact decision note with one title, a bold decision, and an action list.",
    terms: ["decision", "meeting", "action"],
    target: `# Meeting decision

This note records the choice for teammates who could not attend the planning call.

## Decision

The team will **keep the Friday review** and shorten the daily update instead.

## Actions

- Update the shared calendar
- Tell the support team
- Review the change next month`,
  },
  {
    id: "l3-new-teammate-guide",
    contentVariant: "new-teammate-guide",
    title: "Make a first-day guide easy to follow",
    prompt:
      "Write a welcoming guide with one title, a bold starting point, and three preparation items.",
    terms: ["onboarding", "checklist", "teammate"],
    target: `# New teammate guide

This short note helps a new teammate prepare for the first morning without searching through old messages.

## First day

The **shared checklist is the starting point** for accounts, introductions, and team routines.

## Before you begin

- Open the welcome calendar
- Save the team directory
- Bring one question to the check-in`,
  },
] as const

const level3Problems = level3Documents.map((document) =>
  createSeedProblem({
    ...document,
    level: 3,
    familyId: "readable-human-document",
    skillIds: ["document-outline", "restrained-emphasis", "action-list"],
    retryFamily: "level3-readable-document",
    vocabularyProfile: "workplace-document",
    vocabularyDomains: ["team communication", "workplace notes"],
    vocabularyTerms: document.terms,
    teaching: {
      concept: "Readable workplace documents combine hierarchy, emphasis, and lists.",
      howTo: "Use one H1, H2 sections, bold text for one key point, and bullets for unordered follow-up work.",
      example: "# Update\n\n## Summary\n\nThe **key point** is clear.\n\n## Next steps\n\n- Share\n- Review\n- Decide",
    },
    syntaxTokens: ["#", "##", "**", "-"],
    matchChecks: level3Checks(document.id),
  }),
)

function level4Checks(problemId: string): readonly MatchCheck[] {
  return [
    {
      ...commonCheck(
        `${problemId}-outline`,
        10,
        "Build the specification with one H1 and five ordered H2 sections.",
      ),
      kind: "block-sequence",
      scope: documentScope,
      sequence: [
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
        { block: "code" },
      ],
    },
    {
      ...commonCheck(
        `${problemId}-hierarchy`,
        20,
        "Keep the specification heading hierarchy in logical order.",
      ),
      kind: "heading-depth-order",
      allowSkippedDepths: false,
    },
    {
      ...commonCheck(
        `${problemId}-sections`,
        15,
        "Keep exactly five H2 sections in this development specification.",
      ),
      kind: "block-count",
      scope: documentScope,
      block: "heading",
      depth: 2,
      min: 5,
      max: 5,
    },
    {
      ...commonCheck(
        `${problemId}-implementation`,
        30,
        "Use an ordered list of at least three steps in the third H2 section.",
      ),
      kind: "list-shape",
      scope: section(2),
      ordered: true,
      minItems: 3,
    },
    {
      ...commonCheck(
        `${problemId}-acceptance`,
        40,
        "Use an unordered list of at least three acceptance items in the fourth H2 section.",
      ),
      kind: "list-shape",
      scope: section(3),
      ordered: false,
      minItems: 3,
    },
    {
      ...commonCheck(
        `${problemId}-verification`,
        50,
        "Add one fenced, language-tagged command block to the fifth H2 section.",
      ),
      kind: "code-block",
      scope: section(4),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
    },
  ]
}

const level4Documents = [
  {
    id: "l4-search-filter-spec",
    contentVariant: "search-filter",
    title: "Write an executable search-filter spec",
    prompt:
      "Turn the request into a development spec with scope, dependencies, ordered implementation, acceptance criteria, and verification.",
    terms: ["scope", "dependency", "acceptance criteria", "verification"],
    target: `# Search filter specification

Add a saved status filter to the customer search page without changing the existing search contract.

## Scope

- Add one status control beside the search field
- Preserve the current query when the filter changes
- Keep the empty and loading states

## Dependencies

- Reuse the existing \`SearchStatus\` type
- Keep the current URL parameter names
- Follow the shared form-label pattern

## Implementation

1. Add the filter value to the page state
2. Connect the control to the existing query builder
3. Restore the value from the URL on load

## Acceptance criteria

- Keyboard users can reach and change the filter
- Refreshing the page preserves the selected value
- Clearing search also clears the filter

## Verification

\`\`\`sh
npm test -- search-filter
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-timezone-bug-spec",
    contentVariant: "timezone-bug",
    title: "Structure a reproducible bug-fix spec",
    prompt:
      "Write a bug-fix spec with bounded scope, dependencies, ordered work, acceptance criteria, and commands.",
    terms: ["regression", "constraint", "time zone", "test case"],
    target: `# Time-zone display fix

Correct the meeting date shown after daylight-saving changes while preserving stored UTC values.

## Scope

- Change display conversion only
- Preserve the saved API timestamp
- Cover both list and detail views

## Dependencies

- Use the installed date utility
- Keep the existing locale setting
- Reuse the meeting fixture factory

## Implementation

1. Reproduce the boundary with a focused test
2. Move conversion into the shared formatter
3. Replace the duplicate view calculations

## Acceptance criteria

- Spring boundary meetings show the expected local date
- Fall boundary meetings do not repeat an hour label
- Existing UTC snapshots remain unchanged

## Verification

\`\`\`sh
npm test -- timezone-display
npm run lint
\`\`\``,
  },
  {
    id: "l4-accessible-dialog-spec",
    contentVariant: "accessible-dialog",
    title: "Prepare an accessible dialog specification",
    prompt:
      "Compose a development spec for a dialog flow using clear structure, ordered steps, acceptance items, and a test command.",
    terms: ["accessibility", "focus", "acceptance criteria", "regression"],
    target: `# Accessible confirmation dialog

Update the delete confirmation flow so keyboard and screen-reader behavior follows the shared dialog contract.

## Scope

- Use the existing confirmation component
- Preserve the current delete request
- Update visible and accessible labels together

## Dependencies

- Follow the shared focus-return helper
- Keep the existing analytics event
- Reuse the dialog journey setup

## Implementation

1. Move focus to the dialog heading on open
2. Connect the description with the dialog body
3. Return focus to the original button on close

## Acceptance criteria

- Escape closes the dialog without deleting
- Tab remains inside the open dialog
- Focus returns after cancel and successful delete

## Verification

\`\`\`sh
npm test -- confirmation-dialog
npm run test:e2e -- dialog
\`\`\``,
  },
  {
    id: "l4-notification-retry-spec",
    contentVariant: "notification-retry",
    title: "Specify a bounded notification retry",
    prompt:
      "Create a development spec for retrying failed notifications with explicit scope, ordered implementation, acceptance criteria, and verification.",
    terms: ["retry", "dependency", "acceptance criteria", "idempotent"],
    target: `# Notification retry specification

Add one bounded retry for temporary delivery failures without duplicating messages or changing the public notification request.

## Scope

- Retry temporary provider failures only
- Preserve the current request payload
- Keep permanent failures visible to operators

## Dependencies

- Reuse the installed queue adapter
- Keep the existing delivery identifier
- Follow the shared logging policy

## Implementation

1. Classify temporary and permanent provider responses
2. Schedule one delayed retry with the same delivery identifier
3. Record the final outcome without storing message content

## Acceptance criteria

- A temporary failure produces one retry
- A successful first attempt produces no retry
- Repeated queue delivery does not duplicate the message

## Verification

\`\`\`sh
npm test -- notification-retry
npm run typecheck
\`\`\``,
  },
] as const

const level4Problems = level4Documents.map((document) =>
  createSeedProblem({
    ...document,
    level: 4,
    familyId: "executable-development-spec",
    skillIds: ["spec-outline", "ordered-implementation", "verification-code"],
    retryFamily: "level4-development-spec",
    vocabularyProfile: "development-spec",
    vocabularyDomains: ["software delivery", "technical planning"],
    vocabularyTerms: document.terms,
    teaching: {
      concept: "An executable spec separates scope, dependencies, implementation, acceptance, and verification.",
      howTo: "Use ordered steps for work sequence, bullets for conditions, and a fenced command block for verification.",
      example: "# Feature spec\n\n## Scope\n\n- One change\n\n## Implementation\n\n1. Add\n2. Test\n3. Review\n\n## Verification\n\n```sh\nnpm test\n```",
    },
    syntaxTokens: ["#", "##", "-", "1.", "```sh"],
    matchChecks: level4Checks(document.id),
  }),
)

type WorkOrderStage = {
  name: string
  purpose: string
  actions: readonly string[]
}

type WorkOrderSource = {
  id: string
  contentVariant: string
  title: string
  prompt: string
  terms: readonly string[]
  documentTitle: string
  mission: readonly string[]
  reading: readonly string[]
  stages: readonly WorkOrderStage[]
  constraints: readonly string[]
  stops: readonly string[]
  commands: readonly string[]
  report: readonly string[]
}

function bulletLines(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n")
}

function orderedLines(items: readonly string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n")
}

function buildWorkOrder(source: WorkOrderSource): string {
  const stages = source.stages
    .map(
      (stage, index) => `### Stage ${index + 1} — ${stage.name}

${stage.purpose}

${bulletLines(stage.actions)}`,
    )
    .join("\n\n")

  return `# ${source.documentTitle}

${source.mission.join("\n\n")}

## Mission and context

The outcome must remain reviewable from the repository history and the final report. Continue through ordinary implementation difficulty, but do not invent authority when evidence conflicts with this work order.

## Required reading and authority order

Read the sources before editing and apply them in this order:

${orderedLines(source.reading)}

If two sources disagree, use the stop conditions instead of silently choosing the convenient interpretation.

## Execution contract

Complete the stages in order. Run the focused check after each stage and preserve truthful evidence about failures and fixes.

${stages}

## Hard constraints

Reject the result if any of these conditions is violated, even when a broad test command passes:

${bulletLines(source.constraints)}

## Stop conditions

Stop only when new authority or contradictory evidence prevents safe progress:

${bulletLines(source.stops)}

Do not stop for an ordinary failing test until the failure has been investigated inside the approved scope.

## Verification

Run the focused checks during implementation, then run the complete gate before reporting completion.

\`\`\`bash
${source.commands.join("\n")}
\`\`\`

Review the final diff against the hard constraints after the commands finish.

## Final report

Return a compact report that lets a maintainer audit the work without reconstructing the session.

\`\`\`markdown
# Implementation report

## Stage outcomes
${bulletLines(source.report)}

## Verification evidence
- Focused checks: pass or fail with counts
- Complete gate: pass or fail with counts
- Regression review: observed result

## Remaining owner decisions
- List only decisions that require new authority
\`\`\``
}

const level5Sources: readonly WorkOrderSource[] = [
  {
    id: "l5-release-context-work-order",
    contentVariant: "release-context",
    title: "Write a bounded release-context work order",
    prompt:
      "Structure an agent work order with authority order, staged execution, hard constraints, stop conditions, verification, and a final report.",
    terms: ["authority order", "hard constraint", "stop condition", "evidence"],
    documentTitle: "Work order: restore shared release context",
    mission: [
      "Implement the approved database-backed release context in the Harbor Notes monorepo. Replace the discarded in-memory path while preserving one request path and the public response contract.",
      "The required outcome is a tested implementation, updated repository documentation, and evidence that the rejected split-call design did not return.",
    ],
    reading: [
      "Read `AGENTS.md` for repository-wide working rules",
      "Read the release-safety policy for fallback requirements",
      "Read ADR-014 for the approved storage architecture",
      "Inspect the current database and scheduler conventions",
    ],
    stages: [
      {
        name: "establish the boundary",
        purpose: "Define the typed context contract before changing runtime behavior.",
        actions: [
          "Add focused contract fixtures",
          "Keep raw provider data outside the public type",
          "Run the API type check and unit tests",
        ],
      },
      {
        name: "persist and refresh",
        purpose: "Add idempotent storage and a scheduled refresh using repository conventions.",
        actions: [
          "Generate the migration and journal entry",
          "Declare the schedule as infrastructure code",
          "Test repeated refreshes and missing credentials",
        ],
      },
      {
        name: "replace and verify",
        purpose: "Move the user path to stored context and prove the old architecture is absent.",
        actions: [
          "Read the latest usable stored row",
          "Keep upstream access out of the normal request path",
          "Run integration tests and regression searches",
        ],
      },
    ],
    constraints: [
      "One release request makes one agent call",
      "Production never reads mock provider data",
      "Provider failure returns unavailable data rather than invented content",
      "Schedules remain committed as infrastructure code",
    ],
    stops: [
      "An authority source conflicts with the approved decision",
      "Migration history cannot be reconciled safely",
      "The platform cannot represent the committed schedule",
    ],
    commands: [
      "npm run typecheck --workspace apps/api",
      "npm test --workspace apps/api",
      "npm run test:e2e",
      "rg \"primaryAgentCall|followUpAgentCall\" apps/api/src",
    ],
    report: [
      "Boundary and contract changes",
      "Storage and schedule changes",
      "Request-path and regression results",
    ],
  },
  {
    id: "l5-auth-migration-work-order",
    contentVariant: "auth-migration",
    title: "Prepare a safe authentication migration order",
    prompt:
      "Write a human-reviewable work order for an authentication migration with staged autonomy and explicit safety boundaries.",
    terms: ["source of truth", "migration", "rollback", "regression guard"],
    documentTitle: "Work order: migrate session verification",
    mission: [
      "Move session verification from the legacy token adapter to the approved signed-session library without changing the public login flow or existing account identifiers.",
      "The finished change must support a reversible rollout, preserve active-session behavior during the transition, and document every owner-managed environment value.",
    ],
    reading: [
      "Read `AGENTS.md` and the security policy",
      "Read ADR-021 for the signed-session decision",
      "Inspect current middleware and cookie conventions",
      "Inspect deployment configuration and rollback scripts",
    ],
    stages: [
      {
        name: "pin compatibility",
        purpose: "Describe the existing session contract with focused tests before replacing its implementation.",
        actions: [
          "Add fixtures for active, expired, and missing sessions",
          "Record cookie attributes and response codes",
          "Run the authentication test package",
        ],
      },
      {
        name: "add the signed path",
        purpose: "Introduce the approved verifier behind the existing middleware boundary.",
        actions: [
          "Load keys only through the configuration adapter",
          "Keep secrets out of logs and fixtures",
          "Add rotation and invalid-signature tests",
        ],
      },
      {
        name: "stage the rollout",
        purpose: "Provide an observable cutover and a tested rollback without two competing sources of truth.",
        actions: [
          "Add the approved compatibility window",
          "Verify metrics without storing token contents",
          "Run login journeys before enabling the new default",
        ],
      },
    ],
    constraints: [
      "No credential, signing key, or raw token enters source control",
      "Account identifiers remain stable through migration",
      "Production never falls back to a test verifier",
      "Rollback does not invalidate every active user session",
    ],
    stops: [
      "The installed library cannot express the approved cookie contract",
      "A production configuration source conflicts with the security policy",
      "Safe rollback requires changing the public login contract",
    ],
    commands: [
      "npm run typecheck --workspace apps/auth",
      "npm test --workspace apps/auth",
      "npm run test:e2e -- login",
      "rg \"token|secret|privateKey\" apps/auth/src",
    ],
    report: [
      "Compatibility evidence",
      "Signed-session implementation",
      "Rollout and rollback verification",
    ],
  },
  {
    id: "l5-performance-recovery-work-order",
    contentVariant: "performance-recovery",
    title: "Build an auditable performance recovery order",
    prompt:
      "Compose a work order that lets an agent improve a slow report safely while a maintainer can audit its measurements and limits.",
    terms: ["baseline", "performance budget", "stop condition", "final report"],
    documentTitle: "Work order: recover report performance",
    mission: [
      "Reduce the verified loading time of the monthly account report while preserving result order, authorization checks, and the current export format.",
      "Use measured evidence rather than speculative rewrites. The result must include before-and-after observations from the same fixture and environment.",
    ],
    reading: [
      "Read `AGENTS.md` and the data-access rules",
      "Read the report performance budget",
      "Inspect the existing query and authorization boundary",
      "Inspect the benchmark fixture and production index conventions",
    ],
    stages: [
      {
        name: "measure the baseline",
        purpose: "Reproduce the slow path and capture a stable baseline before edits.",
        actions: [
          "Warm the test database consistently",
          "Record query count and elapsed-time distribution",
          "Confirm output ordering and authorization behavior",
        ],
      },
      {
        name: "make one bounded change",
        purpose: "Apply the smallest evidence-supported change within the approved data boundary.",
        actions: [
          "Add or revise one repository-managed index",
          "Keep pagination and export contracts unchanged",
          "Run focused correctness tests after the change",
        ],
      },
      {
        name: "compare and guard",
        purpose: "Repeat the baseline method and add a stable regression guard.",
        actions: [
          "Compare the same fixture and environment",
          "Record variance instead of one best run",
          "Run the full report and authorization suites",
        ],
      },
    ],
    constraints: [
      "Authorization checks stay inside the report query path",
      "Result order and export fields remain unchanged",
      "Production indexes use repository migration conventions",
      "A faster empty fixture does not count as evidence",
    ],
    stops: [
      "The baseline cannot reproduce the reported slow path",
      "The required index conflicts with the approved migration policy",
      "Meeting the budget requires changing the public report contract",
    ],
    commands: [
      "npm run benchmark -- monthly-report",
      "npm test --workspace apps/reports",
      "npm run typecheck",
      "rg \"skipAuthorization|disablePolicy\" apps/reports/src",
    ],
    report: [
      "Baseline method and measurements",
      "Bounded implementation change",
      "Comparison and regression evidence",
    ],
  },
  {
    id: "l5-dependency-upgrade-work-order",
    contentVariant: "dependency-upgrade",
    title: "Write a controlled dependency-upgrade order",
    prompt:
      "Prepare an auditable work order for a security-sensitive dependency upgrade with staged execution, stop conditions, verification, and reporting.",
    terms: ["advisory", "compatibility", "rollback", "authority boundary"],
    documentTitle: "Work order: upgrade the request-signing library",
    mission: [
      "Upgrade the request-signing library to the approved security release while preserving the public client contract, supported runtime versions, and current credential-loading boundary.",
      "The completed change must document compatibility evidence, keep a reversible lockfile path, and prove that no private key or signed payload enters logs, fixtures, or repository history.",
    ],
    reading: [
      "Read `AGENTS.md` and the repository security policy",
      "Read the approved dependency advisory and upgrade decision",
      "Inspect the current signing adapter and runtime support matrix",
      "Inspect lockfile, release-note, and rollback conventions",
    ],
    stages: [
      {
        name: "capture compatibility",
        purpose: "Pin the existing signing contract with public, deterministic fixtures before changing the installed package.",
        actions: [
          "Record supported algorithms and error shapes",
          "Use generated test keys that cannot reach production",
          "Run the focused adapter and runtime-version suites",
        ],
      },
      {
        name: "perform the bounded upgrade",
        purpose: "Update the direct dependency and adapt only the documented compatibility differences.",
        actions: [
          "Use the repository package-manager workflow",
          "Keep credential loading behind the existing adapter",
          "Review transitive changes against the advisory scope",
        ],
      },
      {
        name: "verify and prepare rollback",
        purpose: "Prove behavior across supported runtimes and leave a clear recovery path for deployment review.",
        actions: [
          "Run signing, integration, and compatibility tests",
          "Search logs and fixtures for sensitive material",
          "Document the reversible package and lockfile change",
        ],
      },
    ],
    constraints: [
      "No production credential or private key enters a test fixture",
      "The public request-signing contract remains unchanged",
      "Supported runtime versions continue to pass the same contract suite",
      "The upgrade does not weaken verification to accept old signatures",
    ],
    stops: [
      "The approved release drops a required runtime version",
      "The advisory conflicts with the repository security policy",
      "Compatibility requires changing the public client contract",
    ],
    commands: [
      "npm test --workspace packages/request-signing",
      "npm run test:compatibility -- request-signing",
      "npm run typecheck",
      "rg \"privateKey|signedPayload|credentialValue\" packages/request-signing",
    ],
    report: [
      "Compatibility baseline and package changes",
      "Security and sensitive-data audit",
      "Verification matrix and rollback path",
    ],
  },
]

const level5Documents = level5Sources.map((source) => ({
  ...source,
  target: buildWorkOrder(source),
}))

function level5Checks(problemId: string): readonly MatchCheck[] {
  return [
    {
      ...commonCheck(
        `${problemId}-outline`,
        10,
        "Use one H1 followed by the seven H2 work-order sections shown in the Goal.",
      ),
      kind: "block-sequence",
      scope: documentScope,
      sequence: [
        { block: "heading", depth: 1 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
        { block: "heading", depth: 2 },
      ],
    },
    {
      ...commonCheck(
        `${problemId}-hierarchy`,
        20,
        "Keep the work-order heading hierarchy in logical H1, H2, and H3 order.",
      ),
      kind: "heading-depth-order",
      allowSkippedDepths: false,
    },
    {
      ...commonCheck(
        `${problemId}-sections`,
        15,
        "Keep exactly seven H2 sections in this agent work order.",
      ),
      kind: "block-count",
      scope: documentScope,
      block: "heading",
      depth: 2,
      min: 7,
      max: 7,
    },
    {
      ...commonCheck(
        `${problemId}-authority`,
        30,
        "Use an ordered list of at least four sources in the second H2 section.",
      ),
      kind: "list-shape",
      scope: section(1),
      ordered: true,
      minItems: 4,
    },
    {
      ...commonCheck(
        `${problemId}-stages`,
        40,
        "Divide the execution section into at least three H3 stages.",
      ),
      kind: "block-count",
      scope: section(2),
      block: "heading",
      depth: 3,
      min: 3,
    },
    {
      ...commonCheck(
        `${problemId}-constraints`,
        50,
        "Use an unordered list of at least four hard constraints in the fourth H2 section.",
      ),
      kind: "list-shape",
      scope: section(3),
      ordered: false,
      minItems: 4,
    },
    {
      ...commonCheck(
        `${problemId}-stops`,
        60,
        "Use an unordered list of at least three stop conditions in the fifth H2 section.",
      ),
      kind: "list-shape",
      scope: section(4),
      ordered: false,
      minItems: 3,
    },
    {
      ...commonCheck(
        `${problemId}-verification`,
        70,
        "Add a fenced, language-tagged command block to the verification section.",
      ),
      kind: "code-block",
      scope: section(5),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
    },
    {
      ...commonCheck(
        `${problemId}-report`,
        80,
        "Add a fenced, language-tagged template to the final-report section.",
      ),
      kind: "code-block",
      scope: section(6),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
    },
  ]
}

const convention = {
  id: "nabi-agent-work-order",
  version: "2026.07",
  reviewedOn: "2026-07-19",
} as const

const level5Problems = level5Documents.map((document) =>
  createSeedProblem({
    ...document,
    level: 5,
    familyId: "agent-ready-work-order",
    skillIds: [
      "authority-order",
      "staged-execution",
      "hard-constraints",
      "stop-conditions",
      "verification-contract",
      "final-report",
    ],
    retryFamily: "level5-agent-work-order",
    vocabularyProfile: "agent-workflow",
    vocabularyDomains: ["AI-assisted development", "engineering operations"],
    vocabularyTerms: document.terms,
    teaching: {
      concept: "An agent work order separates authority, execution, prohibitions, stops, verification, and reporting.",
      howTo: "Use H2 sections for the contract, H3 headings for stages, lists for boundaries, and fenced blocks for commands and report shape.",
      example: "# Work order\n\n## Authority\n\n1. Rules\n2. Decision\n\n## Execution\n\n### Stage 1\n\n- Act\n\n## Verification\n\n```bash\nnpm test\n```",
    },
    syntaxTokens: ["#", "##", "###", "1.", "-", "```bash", "```markdown"],
    matchChecks: level5Checks(document.id),
    convention,
    revision: 2,
  }),
)

export const level35SeedProblems: readonly NormalizedProblem[] = [
  ...level3Problems,
  ...level4Problems,
  ...level5Problems,
]
