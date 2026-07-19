import { normalizeProblem } from "../normalizeProblem"
import type { MatchCheck, NormalizedProblem, ProblemInput } from "../types"

export const developmentSpecBatch012Id =
  "2026-07-19-l4-development-specs-012"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

type DevelopmentSpecFamily =
  | "feature-interface"
  | "bug-investigation"
  | "staged-migration"

export type DevelopmentSpecBatch012Input = {
  id: string
  family: DevelopmentSpecFamily
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

const familyTeaching: Record<
  DevelopmentSpecFamily,
  ProblemInput["teaching"]
> = {
  "feature-interface": {
    concept:
      "An interface feature specification separates scope, dependencies, constraints, implementation, acceptance, and verification.",
    howTo:
      "Use one H1, six H2 sections, bullets for scope and acceptance, a linked dependency with inline code, a quoted constraint, ordered implementation, and a fenced verification block.",
    example:
      "# Interface change\n\nDescribe the outcome.\n\n## Scope\n\n- Include one view\n- Preserve one state\n- Handle an empty result\n\n## Dependencies\n\nFollow the [interface guide](/guides/interface) for `ControlState`.\n\n## Constraints\n\n> Keep the current request contract.\n\n## Implementation\n\n1. Add the state\n2. Connect the control\n3. Cover the result\n\n## Acceptance\n\n- The control is reachable\n- Refresh keeps the choice\n- Empty results remain clear\n\n## Verification\n\n```sh\nnpm test -- interface-change\n```",
  },
  "bug-investigation": {
    concept:
      "A bug investigation specification preserves observed evidence, a reproducible path, bounded constraints, a fix plan, regression acceptance, and verification checks.",
    howTo:
      "Use one H1, seven H2 sections, a quoted observation with a divider, ordered reproduction and fix steps, bullet constraints and regression checks, an open-decision quote, and a verification checklist with inline code.",
    example:
      "# Repeat-action investigation\n\nDescribe the observed behavior.\n\n## Evidence\n\n> The action appears twice after one click.\n\n---\n\n## Reproduction\n\n1. Open the form\n2. Enter a value\n3. Submit once\n4. Review the result\n\n## Constraints\n\n- Keep the request shape\n- Preserve keyboard use\n- Avoid a second state owner\n\n## Fix plan\n\n1. Add a focused test\n2. Guard the action\n3. Remove the duplicate path\n\n## Regression acceptance\n\n- One action creates one result\n- A failed action can be tried again\n- Existing validation still appears\n\n## Open decision\n\n> Decide when the action becomes available again.\n\n## Verification checklist\n\n- Run `npm test -- repeat-action`\n- Run `npm run typecheck`",
  },
  "staged-migration": {
    concept:
      "A staged migration specification makes prerequisites, three bounded stages, rollback, acceptance, an open decision, and verification easy to inspect.",
    howTo:
      "Use one H1, six H2 sections, an unordered precondition list, exactly three H3 migration stages with bullet tasks, ordered rollback, bullet acceptance, a quoted open decision, and a fenced verification block.",
    example:
      "# Setting-name migration\n\nDescribe the compatible change.\n\n## Preconditions\n\n- Find current readers\n- Record the fallback\n- Add fixtures\n\n## Migration stages\n\n### Add compatibility\n\n- Read both names\n- Write the new name\n\n### Move callers\n\n- Update the form\n- Update the worker\n\n### Remove the old path\n\n- Delete the alias\n- Update the guide\n\n## Rollback\n\n1. Restore the alias\n2. Restore callers\n3. Run focused checks\n\n## Acceptance\n\n- Existing values still load\n- New values use one name\n- Tests cover both paths\n\n## Open decision\n\n> Decide how long compatibility remains.\n\n## Verification\n\n```sh\nnpm test -- setting-name\n```",
  },
}

const familyHints: Record<
  DevelopmentSpecFamily,
  readonly [string, string, string]
> = {
  "feature-interface": [
    "Start with one # title, an opening paragraph, and six ## sections.",
    "Use bullets for scope, a linked dependency with inline code, a quoted constraint, and numbered implementation steps.",
    "Finish with acceptance bullets and one fenced, language-tagged verification block.",
  ],
  "bug-investigation": [
    "Start with one # title and seven ## sections; keep the observed evidence in a blockquote followed by a Markdown divider.",
    "Use at least four numbered reproduction steps, three constraint bullets, three numbered fix steps, and three regression bullets.",
    "End with a quoted open decision and a bullet verification checklist containing at least two nonempty inline-code items.",
  ],
  "staged-migration": [
    "Start with one # title, an opening paragraph, and six ## sections.",
    "Inside the migration section, add exactly three ### stage headings with at least two bullet tasks under each one.",
    "Add numbered rollback steps, acceptance bullets, a quoted open decision, and one fenced, language-tagged verification block.",
  ],
}

const familyMetadata = {
  "feature-interface": {
    retryFamily: "level4-feature-interface-spec",
    skillIds: [
      "development-spec-outline",
      "dependency-reference",
      "constraint-blockquote",
      "ordered-implementation",
      "acceptance-list",
      "verification-code",
    ],
    syntaxTokens: ["#", "##", "-", "[ ]( )", "`", ">", "1.", "```sh"],
  },
  "bug-investigation": {
    retryFamily: "level4-bug-investigation-spec",
    skillIds: [
      "investigation-outline",
      "evidence-blockquote",
      "markdown-divider",
      "ordered-reproduction",
      "regression-acceptance",
      "verification-checklist",
    ],
    syntaxTokens: ["#", "##", ">", "---", "1.", "-", "`"],
  },
  "staged-migration": {
    retryFamily: "level4-staged-migration-spec",
    skillIds: [
      "migration-outline",
      "three-stage-hierarchy",
      "rollback-plan",
      "acceptance-list",
      "open-decision",
      "verification-code",
    ],
    syntaxTokens: ["#", "##", "###", "-", "1.", ">", "```sh"],
  },
} as const

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
        "Use one document title, an opening paragraph, and the Goal's section block order.",
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
      feedback: `Use exactly ${h2Count} H2 sections in this development specification.`,
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

function featureInterfaceChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 6, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
    ]),
    {
      id: `${problemId}-scope`,
      kind: "list-shape",
      scope: h2Section(0),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 30,
      feedback:
        "Use an unordered list of at least three items in the first H2 section.",
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
      feedback:
        "Add a descriptive Markdown link with a destination in the second H2 section.",
    },
    {
      id: `${problemId}-dependency-code`,
      kind: "inline-code-shape",
      scope: h2Section(1),
      min: 1,
      requireNonemptyContent: true,
      priority: 45,
      feedback:
        "Add at least one nonempty inline-code item in the second H2 section.",
    },
    {
      id: `${problemId}-constraint`,
      kind: "blockquote-shape",
      scope: h2Section(2),
      requireNonemptyContent: true,
      priority: 50,
      feedback: "Put a direct nonempty blockquote in the third H2 section.",
    },
    {
      id: `${problemId}-implementation`,
      kind: "list-shape",
      scope: h2Section(3),
      ordered: true,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 60,
      feedback:
        "Use an ordered list of at least three steps in the fourth H2 section.",
    },
    {
      id: `${problemId}-acceptance`,
      kind: "list-shape",
      scope: h2Section(4),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 70,
      feedback:
        "Use an unordered list of at least three items in the fifth H2 section.",
    },
    {
      id: `${problemId}-verification-section`,
      kind: "block-sequence",
      scope: h2Section(5),
      sequence: [
        { block: "heading", depth: 2 },
        { block: "code" },
      ],
      exact: true,
      priority: 80,
      feedback:
        "Keep only the H2 heading and one direct code block in the final H2 section.",
    },
    {
      id: `${problemId}-verification-code`,
      kind: "code-block",
      scope: h2Section(5),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
      priority: 90,
      feedback:
        "Use one fenced, language-tagged code block in the final H2 section.",
    },
  ]
}

function bugInvestigationChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 7, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
    ]),
    {
      id: `${problemId}-evidence-section`,
      kind: "block-sequence",
      scope: h2Section(0),
      sequence: [
        { block: "heading", depth: 2 },
        { block: "blockquote" },
        { block: "thematic-break" },
      ],
      exact: true,
      priority: 30,
      feedback:
        "Put one direct blockquote followed by one Markdown divider in the first H2 section.",
    },
    {
      id: `${problemId}-evidence`,
      kind: "blockquote-shape",
      scope: h2Section(0),
      requireNonemptyContent: true,
      priority: 35,
      feedback: "Put a nonempty blockquote in the first H2 section.",
    },
    {
      id: `${problemId}-reproduction`,
      kind: "list-shape",
      scope: h2Section(1),
      ordered: true,
      minItems: 4,
      requireNonemptyItems: true,
      priority: 40,
      feedback:
        "Use an ordered list of at least four steps in the second H2 section.",
    },
    {
      id: `${problemId}-constraints`,
      kind: "list-shape",
      scope: h2Section(2),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 50,
      feedback:
        "Use an unordered list of at least three items in the third H2 section.",
    },
    {
      id: `${problemId}-fix-plan`,
      kind: "list-shape",
      scope: h2Section(3),
      ordered: true,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 60,
      feedback:
        "Use an ordered list of at least three steps in the fourth H2 section.",
    },
    {
      id: `${problemId}-regression-acceptance`,
      kind: "list-shape",
      scope: h2Section(4),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 70,
      feedback:
        "Use an unordered list of at least three items in the fifth H2 section.",
    },
    {
      id: `${problemId}-open-decision`,
      kind: "blockquote-shape",
      scope: h2Section(5),
      requireNonemptyContent: true,
      priority: 80,
      feedback: "Put a direct nonempty blockquote in the sixth H2 section.",
    },
    {
      id: `${problemId}-verification-section`,
      kind: "block-sequence",
      scope: h2Section(6),
      sequence: [
        { block: "heading", depth: 2 },
        { block: "list" },
      ],
      exact: true,
      priority: 90,
      feedback:
        "Keep only the H2 heading and one direct checklist in the final H2 section.",
    },
    {
      id: `${problemId}-verification-list`,
      kind: "list-shape",
      scope: h2Section(6),
      ordered: false,
      minItems: 2,
      requireNonemptyItems: true,
      priority: 95,
      feedback:
        "Use an unordered list of at least two checks in the final H2 section.",
    },
    {
      id: `${problemId}-verification-code`,
      kind: "inline-code-shape",
      scope: h2Section(6),
      min: 2,
      requireNonemptyContent: true,
      priority: 100,
      feedback:
        "Add at least two nonempty inline-code items to the final checklist.",
    },
  ]
}

function stagedMigrationChecks(problemId: string): MatchCheck[] {
  return [
    ...commonChecks(problemId, 6, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 3 },
      { block: "heading", depth: 3 },
      { block: "heading", depth: 3 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
      { block: "heading", depth: 2 },
    ]),
    {
      id: `${problemId}-stage-count`,
      kind: "block-count",
      scope: documentScope,
      block: "heading",
      depth: 3,
      min: 3,
      max: 3,
      priority: 25,
      feedback: "Use exactly three H3 stage headings in this migration specification.",
    },
    {
      id: `${problemId}-preconditions`,
      kind: "list-shape",
      scope: h2Section(0),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 30,
      feedback:
        "Use an unordered list of at least three items in the first H2 section.",
    },
    {
      id: `${problemId}-migration-section`,
      kind: "block-sequence",
      scope: h2Section(1),
      sequence: [
        { block: "heading", depth: 2 },
        { block: "heading", depth: 3 },
        { block: "list" },
        { block: "heading", depth: 3 },
        { block: "list" },
        { block: "heading", depth: 3 },
        { block: "list" },
      ],
      exact: true,
      priority: 40,
      feedback:
        "Use exactly three H3 stages, each followed directly by one list, in the second H2 section.",
    },
    ...([0, 1, 2] as const).map<MatchCheck>((occurrence) => ({
      id: `${problemId}-stage-${occurrence + 1}`,
      kind: "list-shape",
      scope: h3Section(occurrence),
      ordered: false,
      minItems: 2,
      requireNonemptyItems: true,
      priority: 50 + occurrence,
      feedback: `Use an unordered list of at least two items under H3 stage ${occurrence + 1}.`,
    })),
    {
      id: `${problemId}-rollback`,
      kind: "list-shape",
      scope: h2Section(2),
      ordered: true,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 60,
      feedback:
        "Use an ordered list of at least three steps in the third H2 section.",
    },
    {
      id: `${problemId}-acceptance`,
      kind: "list-shape",
      scope: h2Section(3),
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 70,
      feedback:
        "Use an unordered list of at least three items in the fourth H2 section.",
    },
    {
      id: `${problemId}-open-decision`,
      kind: "blockquote-shape",
      scope: h2Section(4),
      requireNonemptyContent: true,
      priority: 80,
      feedback: "Put a direct nonempty blockquote in the fifth H2 section.",
    },
    {
      id: `${problemId}-verification-section`,
      kind: "block-sequence",
      scope: h2Section(5),
      sequence: [
        { block: "heading", depth: 2 },
        { block: "code" },
      ],
      exact: true,
      priority: 90,
      feedback:
        "Keep only the H2 heading and one direct code block in the final H2 section.",
    },
    {
      id: `${problemId}-verification-code`,
      kind: "code-block",
      scope: h2Section(5),
      min: 1,
      max: 1,
      requireLanguageTag: true,
      requireFenced: true,
      priority: 100,
      feedback:
        "Use one fenced, language-tagged code block in the final H2 section.",
    },
  ]
}

function matchChecksFor(input: DevelopmentSpecBatch012Input): MatchCheck[] {
  switch (input.family) {
    case "feature-interface":
      return featureInterfaceChecks(input.id)
    case "bug-investigation":
      return bugInvestigationChecks(input.id)
    case "staged-migration":
      return stagedMigrationChecks(input.id)
  }
}

function makeProblem(input: DevelopmentSpecBatch012Input): NormalizedProblem {
  const metadata = familyMetadata[input.family]
  return normalizeProblem({
    id: input.id,
    schemaVersion: 2,
    level: 4,
    familyId: "executable-development-spec",
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
    matchChecks: matchChecksFor(input),
    editorialChecks: [
      {
        id: "one-document-title",
        kind: "single-h1",
        review: "Keep one H1 as the document title; use H2 and H3 for sections.",
      },
    ],
    hints: familyHints[input.family],
    retryFamily: metadata.retryFamily,
    reviewTags: [
      "one-document-title",
      "logical-heading-order",
      input.family,
    ],
    vocabulary: {
      profile: "development-spec",
      domains: [input.vocabularyDomain],
      terms: input.vocabularyTerms,
    },
    sourceBatchId: developmentSpecBatch012Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  })
}

export const developmentSpecBatch012Inputs: readonly DevelopmentSpecBatch012Input[] = [
  {
    id: "l4-project-list-export-spec",
    family: "feature-interface",
    contentVariant: "project-list-export",
    title: "Specify a project-list export",
    prompt:
      "Write an interface feature spec with bounded scope, an explicit dependency, a constraint, ordered implementation, acceptance items, and verification.",
    vocabularyDomain: "project-list-export",
    vocabularyTerms: ["export format", "visible columns", "download name", "empty result"],
    target: `# Project list export

Add a download action for the currently displayed project list without changing how the list is filtered or sorted.

## Scope

- Export only the rows shown by the active filters
- Include the columns visible in the current view
- Show a clear empty result when no rows are available

## Dependencies

Follow the [project list interface guide](/guides/project-list) and reuse the existing \`ProjectRow\` type.

## Constraints

> Keep filtering, sorting, and row selection in the current list owner.

## Implementation

1. Add the download action beside the list controls
2. Map visible rows and columns into the export format
3. Start the browser download with a clear file name

## Acceptance criteria

- Active filters affect the downloaded rows
- Hidden columns do not appear in the file
- An empty list does not create a misleading file

## Verification

\`\`\`sh
npm test -- project-list-export
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-editor-save-status-spec",
    family: "feature-interface",
    contentVariant: "editor-save-status",
    title: "Define an editor save-status feature",
    prompt:
      "Turn the save-status request into a structured interface specification with dependencies, constraints, implementation steps, acceptance items, and verification.",
    vocabularyDomain: "note-editor-save-status",
    vocabularyTerms: ["save state", "status label", "offline pause", "unsaved edit"],
    target: `# Editor save status

Show a compact save status in the note editor so a writer can distinguish unsaved, saving, saved, and paused work.

## Scope

- Add one status label to the editor header
- Reflect the state already reported by the save controller
- Keep the label readable during a temporary connection pause

## Dependencies

Use the [editor status pattern](/guides/editor-status) with the existing \`SaveState\` value.

## Constraints

> Do not create another timer or a second owner for the saved note state.

## Implementation

1. Map each save state to one short label
2. Render the label beside the document title
3. Cover state changes with focused component tests

## Acceptance criteria

- A new edit changes the label from saved to unsaved
- An active save shows a distinct saving state
- A connection pause does not claim that the note was saved

## Verification

\`\`\`sh
npm test -- editor-save-status
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-project-archive-spec",
    family: "feature-interface",
    contentVariant: "project-archive-action",
    title: "Structure a project archive feature",
    prompt:
      "Create a bounded interface spec for archiving completed projects with a linked dependency, quoted constraint, ordered work, acceptance items, and verification.",
    vocabularyDomain: "project-archiving",
    vocabularyTerms: ["archive action", "confirmation step", "restore period", "active project"],
    target: `# Project archive action

Add a reversible archive action for completed projects while keeping active work visible in the normal project list.

## Scope

- Offer the action only from a completed project
- Ask for confirmation before changing the project state
- Keep archived projects available from the archive view

## Dependencies

Follow the [project state guide](/guides/project-state) and reuse the \`ProjectStatus\` model.

## Constraints

> This change archives a project; it does not permanently delete project content.

## Implementation

1. Add the archive action to the completed-project menu
2. Connect the confirmation step to the existing state update
3. Add the archived state to the archive view query

## Acceptance criteria

- Canceling confirmation leaves the project unchanged
- An archived project leaves the active project list
- Restoring a project returns it to the completed list

## Verification

\`\`\`sh
npm test -- project-archive
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-table-density-spec",
    family: "feature-interface",
    contentVariant: "table-density-setting",
    title: "Write a table-density specification",
    prompt:
      "Write an interface feature spec for a table-density control with clear scope, a dependency, a quoted constraint, ordered work, acceptance items, and verification.",
    vocabularyDomain: "data-table-density",
    vocabularyTerms: ["display density", "row spacing", "saved preference", "default view"],
    target: `# Table density setting

Let people choose comfortable or compact row spacing for the shared project table without hiding any table content.

## Scope

- Add two density choices to the table controls
- Apply the choice to header and body rows together
- Restore the saved preference when the view opens

## Dependencies

Use the [table control pattern](/guides/table-controls) and the existing \`TableDensity\` value.

## Constraints

> Density changes spacing only; columns, labels, and row actions remain available.

## Implementation

1. Add the density control to the table toolbar
2. Map each choice to the shared spacing tokens
3. Save and restore the selected preference

## Acceptance criteria

- Both choices update all table rows
- Refreshing the view preserves the selected density
- A missing preference uses the comfortable default

## Verification

\`\`\`sh
npm test -- table-density
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-duplicate-form-submission-investigation",
    family: "bug-investigation",
    contentVariant: "duplicate-form-submission",
    title: "Investigate a duplicate form submission",
    prompt:
      "Write a reproducible bug investigation with quoted evidence, a divider, ordered reproduction, bounded constraints, a fix plan, regression acceptance, and a verification checklist.",
    vocabularyDomain: "form-submission-investigation",
    vocabularyTerms: ["duplicate request", "submit state", "reproduction path", "regression check"],
    target: `# Duplicate form submission investigation

A settings form sometimes sends the same update twice when the submit button is pressed again before the first request finishes.

## Evidence

> One click produces one request, but a fast second click produces another request before the first response returns.

---

## Reproduction

1. Open the notification settings form
2. Change one preference
3. Submit the form twice in quick succession
4. Review the recorded requests and final status

## Constraints

- Preserve the current request payload
- Keep validation messages visible
- Allow another attempt after a failed request

## Fix plan

1. Add a focused test for an in-flight submission
2. Disable repeated submission while the request is pending
3. Restore the action after success or failure

## Regression acceptance

- One completed action produces one update request
- A failed request can be submitted again
- Existing required-field messages still appear

## Open decision

> Decide whether the pending state needs a text label in addition to the disabled action.

## Verification checklist

- Run \`npm test -- settings-submit\`
- Run \`npm run typecheck\``,
  },
  {
    id: "l4-stale-permission-badge-investigation",
    family: "bug-investigation",
    contentVariant: "stale-permission-badge",
    title: "Investigate a stale access badge",
    prompt:
      "Structure an investigation for a stale interface badge using evidence, reproduction, constraints, a fix plan, regression acceptance, an open decision, and inline-code checks.",
    vocabularyDomain: "access-badge-investigation",
    vocabularyTerms: ["display badge", "membership update", "cached view", "refresh boundary"],
    target: `# Stale access badge investigation

The member list can keep an old access badge after a team owner changes a coworker's project role in the same session.

## Evidence

> The detail panel shows the new role while the member-list badge continues to show the earlier role.

---

## Reproduction

1. Open a project member list
2. Change one test member from viewer to editor
3. Close the detail panel
4. Compare the list badge with the updated detail value

## Constraints

- Preserve the existing role update request
- Keep one source for the member collection
- Avoid a full page reload after every change

## Fix plan

1. Add a fixture for the updated member response
2. Update the shared collection after the request succeeds
3. Remove the separate badge-only cache path

## Regression acceptance

- The list and detail panel show the same role after an update
- Canceling an edit leaves both views unchanged
- Reloading the page preserves the updated role

## Open decision

> Decide whether another open member panel should refresh immediately or when it becomes active.

## Verification checklist

- Run \`npm test -- member-role-badge\`
- Run \`npm run typecheck\``,
  },
  {
    id: "l4-lost-pagination-cursor-investigation",
    family: "bug-investigation",
    contentVariant: "lost-pagination-cursor",
    title: "Trace a lost pagination cursor",
    prompt:
      "Create a structured bug investigation for pagination state with reproducible evidence and a two-item inline-code verification checklist.",
    vocabularyDomain: "pagination-cursor-investigation",
    vocabularyTerms: ["page cursor", "detail return", "list position", "history state"],
    target: `# Lost pagination cursor investigation

Returning from a project detail page can reset the project list to its first page instead of restoring the page the reader left.

## Evidence

> The browser returns to the list route, but the next page cursor is missing from the restored list state.

---

## Reproduction

1. Open the second page of the project list
2. Select a project near the middle of the page
3. Use the browser back action from the detail view
4. Compare the restored page and list position

## Constraints

- Keep the current route names
- Preserve active list filters
- Avoid storing the complete result set in history

## Fix plan

1. Add a navigation fixture with a second-page cursor
2. Save the cursor in the existing list route state
3. Restore the cursor before requesting the list page

## Regression acceptance

- Back navigation restores the prior page
- A new list visit still starts on the first page
- Changing filters clears an incompatible cursor

## Open decision

> Decide whether the exact row position should also be restored after the page loads.

## Verification checklist

- Run \`npm test -- project-pagination\`
- Run \`npm run test:e2e -- list-return\``,
  },
  {
    id: "l4-offline-retry-banner-investigation",
    family: "bug-investigation",
    contentVariant: "offline-retry-banner",
    title: "Investigate an offline retry banner",
    prompt:
      "Write an investigation spec for a banner that remains visible after recovery, using the full evidence-to-verification anatomy.",
    vocabularyDomain: "offline-banner-investigation",
    vocabularyTerms: ["offline banner", "retry result", "connection recovery", "visible status"],
    target: `# Offline retry banner investigation

The editor can keep showing its offline retry banner after a paused save succeeds when the connection becomes available again.

## Evidence

> The saved status returns, but the offline banner remains above the editor until the page is refreshed.

---

## Reproduction

1. Open a note in the editor
2. Pause the test connection
3. Make an edit and wait for the offline banner
4. Restore the connection and observe the completed retry

## Constraints

- Keep the current retry limit
- Preserve unsaved text during the connection pause
- Use the existing save-state owner

## Fix plan

1. Add a test for a successful retry after recovery
2. Derive banner visibility from the current save state
3. Remove the stale local banner flag

## Regression acceptance

- The banner appears while the save is paused
- A successful retry removes the banner
- A failed retry keeps a useful visible status

## Open decision

> Decide whether a brief recovered message should replace the banner after success.

## Verification checklist

- Run \`npm test -- offline-save-banner\`
- Run \`npm run typecheck\``,
  },
  {
    id: "l4-configuration-key-migration",
    family: "staged-migration",
    contentVariant: "configuration-key-rename",
    title: "Plan a configuration-key rename",
    prompt:
      "Write a three-stage migration spec with preconditions, H3 stage lists, rollback, acceptance, an open decision, and fenced verification.",
    vocabularyDomain: "configuration-key-migration",
    vocabularyTerms: ["configuration key", "compatibility read", "call site", "removal window"],
    target: `# Configuration key rename

Rename the local preview configuration key while keeping existing developer setups readable during a bounded compatibility period.

## Preconditions

- Find every reader and writer of the current key
- Record the current fallback behavior
- Add fixtures for old, new, and missing values

## Migration stages

### Add compatibility

- Read the new key before the old key
- Write only the new key from updated settings

### Move call sites

- Update the preview launcher
- Update the local setup command

### Remove the old path

- Delete the compatibility read
- Update the repository setup guide

## Rollback

1. Restore the old-key reader
2. Restore the previous call-site values
3. Run the configuration fixtures

## Acceptance criteria

- Existing local values remain readable during compatibility
- Updated tools write one configuration key
- A missing value keeps the documented fallback

## Open decision

> Decide which release removes the compatibility read.

## Verification

\`\`\`sh
npm test -- preview-config
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-nullable-column-backfill-migration",
    family: "staged-migration",
    contentVariant: "nullable-column-backfill",
    title: "Structure a nullable-column backfill",
    prompt:
      "Create a staged data migration specification with three explicit H3 stages, reversible work, acceptance items, an open decision, and verification.",
    vocabularyDomain: "nullable-column-migration",
    vocabularyTerms: ["nullable column", "backfill batch", "fallback value", "migration journal"],
    target: `# Nullable display-name backfill

Populate the optional project display-name column before the application begins using it as the preferred label.

## Preconditions

- Count rows with a missing display name
- Record the existing project-name fallback
- Prepare a repeatable backfill fixture

## Migration stages

### Add compatible reads

- Prefer the display name when it exists
- Keep the project name as the fallback

### Backfill rows

- Process missing values in bounded batches
- Record the completed batch cursor

### Switch new writes

- Populate the display name for new projects
- Keep the fallback while old rows remain

## Rollback

1. Restore project name as the preferred label
2. Pause the next backfill batch
3. Preserve the migration journal for review

## Acceptance criteria

- Repeating a completed batch does not change filled rows
- Missing values keep a readable fallback
- New projects receive a display name

## Open decision

> Decide when the column can become required for new records.

## Verification

\`\`\`sh
npm test -- display-name-backfill
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-cache-namespace-migration",
    family: "staged-migration",
    contentVariant: "cache-namespace-switch",
    title: "Plan a cache-namespace switch",
    prompt:
      "Write a staged cache migration with three H3 task groups, ordered rollback, acceptance bullets, an open decision, and a fenced check block.",
    vocabularyDomain: "cache-namespace-migration",
    vocabularyTerms: ["cache namespace", "dual read", "key prefix", "expiration window"],
    target: `# Cache namespace switch

Move project-summary entries to a versioned cache namespace without making the application depend on both key formats permanently.

## Preconditions

- Inventory current project-summary keys
- Record the existing expiration behavior
- Add fixtures for hit, miss, and expired entries

## Migration stages

### Introduce the namespace

- Write new summaries with the versioned prefix
- Read the new prefix before the old prefix

### Observe compatibility

- Track old-prefix fallback reads
- Keep cache misses on the existing data path

### Finish the switch

- Remove the old-prefix fallback
- Delete obsolete namespace helpers

## Rollback

1. Restore the old-prefix reader
2. Stop new namespace writes
3. Run the cache behavior fixtures

## Acceptance criteria

- New writes use one versioned prefix
- Old entries remain readable during compatibility
- A cache miss still uses the normal data path

## Open decision

> Decide how many expiration windows compatibility should remain.

## Verification

\`\`\`sh
npm test -- project-summary-cache
npm run typecheck
\`\`\``,
  },
  {
    id: "l4-api-field-deprecation-migration",
    family: "staged-migration",
    contentVariant: "api-field-deprecation",
    title: "Structure an API-field deprecation",
    prompt:
      "Create a compatibility-focused migration spec with exactly three H3 stages, rollback steps, acceptance items, an open decision, and fenced verification.",
    vocabularyDomain: "api-field-migration",
    vocabularyTerms: ["response field", "compatibility alias", "consumer fixture", "deprecation window"],
    target: `# Project owner field deprecation

Replace the older project-owner response field with a clearer field name while keeping known consumers compatible during the transition.

## Preconditions

- Inventory readers of the existing response field
- Capture fixtures for current response shapes
- Record the documented compatibility window

## Migration stages

### Add the new field

- Populate the clearer field from the same source
- Keep the older field as a compatibility alias

### Move consumers

- Update the project list reader
- Update the project detail reader

### Complete deprecation

- Remove the older response field
- Update examples and contract fixtures

## Rollback

1. Restore the compatibility alias
2. Revert consumers to the earlier field
3. Run the response-contract fixtures

## Acceptance criteria

- Both fields agree during compatibility
- Updated consumers use the clearer field
- Removing the alias leaves contract tests passing

## Open decision

> Decide which release ends the compatibility window.

## Verification

\`\`\`sh
npm test -- project-owner-contract
npm run typecheck
\`\`\``,
  },
] as const

export const developmentSpecBatch012Problems: readonly NormalizedProblem[] =
  developmentSpecBatch012Inputs.map(makeProblem)

export const developmentSpecBatch012PrototypeProblems = [
  developmentSpecBatch012Problems[0]!,
  developmentSpecBatch012Problems[4]!,
  developmentSpecBatch012Problems[8]!,
] as const
