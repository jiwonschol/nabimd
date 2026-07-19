import type { MatchCheck, NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l3-readable-documents-010"
const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

function section(occurrence: number) {
  return { kind: "section", headingDepth: 2, occurrence } as const
}

type ReadableDocumentFamily =
  | "status-handoff"
  | "how-to"
  | "decision-record"

type ReadableDocumentInput = {
  id: string
  family: ReadableDocumentFamily
  contentVariant: string
  title: string
  prompt: string
  target: string
  vocabularyDomain: string
  vocabularyTerms: readonly [string, string, string]
}

const familyTeaching = {
  "status-handoff": {
    concept:
      "A readable status or handoff separates the current state from the work that comes next.",
    howTo:
      "Use one H1, an opening paragraph, two H2 sections, one bold status, and an unordered action list.",
    example:
      "# Service update\n\nThis note prepares the next team.\n\n## Current state\n\nThe **morning review is complete**.\n\n## Next steps\n\n- Confirm the owner\n- Share the date\n- File the note",
  },
  "how-to": {
    concept:
      "A readable how-to separates what a coworker needs from the steps they should follow.",
    howTo:
      "Use one H1, an opening paragraph, a preparation list, ordered steps, and inline code for an exact file name or interface label.",
    example:
      "# Share a note\n\nUse this guide before sending the file.\n\n## Before you start\n\n- Find the draft\n- Confirm the owner\n- Check the date\n\n## Steps\n\n1. Open `draft.md`\n2. Choose Share\n3. Send the link",
  },
  "decision-record": {
    concept:
      "A readable decision record gives the context, preserves the agreed wording, and lists the follow-up work.",
    howTo:
      "Use one H1, an opening paragraph, three H2 sections, a nonempty blockquote for the decision, and an unordered action list.",
    example:
      "# Schedule decision\n\nThis note records a change for the team.\n\n## Context\n\nTwo review times were available.\n\n## Decision\n\n> Use the earlier time.\n\n## Actions\n\n- Update the invite\n- Tell the team\n- Review next month",
  },
} as const

const familyHints = {
  "status-handoff": [
    "Start with one # title and a short opening paragraph.",
    "Use two ## sections, with one bold status in the first section.",
    "Finish the second section with at least three unordered list items.",
  ],
  "how-to": [
    "Start with one # title and a short explanation of the task.",
    "Use the first ## section for at least three unordered preparation items.",
    "Use the second ## section for at least three ordered steps and wrap one exact item in backticks.",
  ],
  "decision-record": [
    "Start with one # title and an opening paragraph, then add three ## sections.",
    "Put a regular paragraph in the first section and a nonempty > blockquote in the second.",
    "Finish the third section with at least three unordered action items.",
  ],
} as const

const familyMetadata = {
  "status-handoff": {
    retryFamily: "level3-status-handoff-document",
    skillIds: ["document-outline", "restrained-emphasis", "action-list"],
    syntaxTokens: ["#", "##", "**", "-"],
  },
  "how-to": {
    retryFamily: "level3-how-to-document",
    skillIds: [
      "document-outline",
      "preparation-list",
      "ordered-procedure",
      "inline-code",
    ],
    syntaxTokens: ["#", "##", "-", "1.", "`"],
  },
  "decision-record": {
    retryFamily: "level3-decision-record",
    skillIds: ["document-outline", "decision-context", "blockquote", "action-list"],
    syntaxTokens: ["#", "##", ">", "-"],
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
        "Use one document title, an opening paragraph, and the Goal's H2 block order.",
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
      feedback: `Use exactly ${h2Count} H2 sections in this short document.`,
    },
    {
      id: `${problemId}-hierarchy`,
      kind: "heading-depth-order",
      allowSkippedDepths: false,
      priority: 20,
      feedback:
        "Keep heading levels in order: move from H1 to H2 without skipping a level.",
    },
  ]
}

function matchChecksFor(input: ReadableDocumentInput): readonly MatchCheck[] {
  switch (input.family) {
    case "status-handoff":
      return [
        ...commonChecks(input.id, 2, [
          { block: "heading", depth: 1 },
          { block: "paragraph" },
          { block: "heading", depth: 2 },
          { block: "paragraph" },
          { block: "heading", depth: 2 },
          { block: "list" },
        ]),
        {
          id: `${input.id}-status`,
          kind: "inline-presence",
          scope: section(0),
          inline: "strong",
          min: 1,
          priority: 30,
          feedback: "Use bold emphasis for the key status in the first H2 section.",
        },
        {
          id: `${input.id}-actions`,
          kind: "list-shape",
          scope: section(1),
          ordered: false,
          minItems: 3,
          requireNonemptyItems: true,
          priority: 40,
          feedback:
            "Finish the second H2 section with an unordered list of at least three actions.",
        },
      ]
    case "how-to":
      return [
        ...commonChecks(input.id, 2, [
          { block: "heading", depth: 1 },
          { block: "paragraph" },
          { block: "heading", depth: 2 },
          { block: "list" },
          { block: "heading", depth: 2 },
          { block: "list" },
        ]),
        {
          id: `${input.id}-preparation`,
          kind: "list-shape",
          scope: section(0),
          ordered: false,
          minItems: 3,
          requireNonemptyItems: true,
          priority: 30,
          feedback:
            "Use an unordered preparation list with at least three items in the first H2 section.",
        },
        {
          id: `${input.id}-steps`,
          kind: "list-shape",
          scope: section(1),
          ordered: true,
          minItems: 3,
          requireNonemptyItems: true,
          priority: 40,
          feedback:
            "Use an ordered list of at least three steps in the second H2 section.",
        },
        {
          id: `${input.id}-exact-item`,
          kind: "inline-code-shape",
          scope: section(1),
          min: 1,
          requireNonemptyContent: true,
          priority: 50,
          feedback:
            "Mark at least one exact file name or interface label as inline code in the second H2 section.",
        },
      ]
    case "decision-record":
      return [
        ...commonChecks(input.id, 3, [
          { block: "heading", depth: 1 },
          { block: "paragraph" },
          { block: "heading", depth: 2 },
          { block: "paragraph" },
          { block: "heading", depth: 2 },
          { block: "blockquote" },
          { block: "heading", depth: 2 },
          { block: "list" },
        ]),
        {
          id: `${input.id}-decision`,
          kind: "blockquote-shape",
          scope: section(1),
          requireNonemptyContent: true,
          priority: 30,
          feedback: "Put the decision in a nonempty blockquote in the second H2 section.",
        },
        {
          id: `${input.id}-actions`,
          kind: "list-shape",
          scope: section(2),
          ordered: false,
          minItems: 3,
          requireNonemptyItems: true,
          priority: 40,
          feedback:
            "Finish the third H2 section with an unordered list of at least three actions.",
        },
      ]
  }
}

function createReadableDocumentProblem(
  input: ReadableDocumentInput,
): NormalizedProblem {
  const metadata = familyMetadata[input.family]

  return {
    id: input.id,
    schemaVersion: 2,
    level: 3,
    flavor: "standard",
    familyId: "readable-human-document",
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
        review: "Keep one H1 as the document title; use H2 for sections.",
      },
    ],
    hints: familyHints[input.family],
    retryFamily: metadata.retryFamily,
    reviewTags: ["one-document-title", "logical-heading-order", input.family],
    vocabulary: {
      profile: "workplace-document",
      domains: [input.vocabularyDomain],
      terms: input.vocabularyTerms,
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  }
}

export const readableDocumentBatch010Inputs: readonly ReadableDocumentInput[] = [
  {
    id: "l3-status-help-center-refresh",
    family: "status-handoff",
    contentVariant: "help-center-refresh",
    title: "Make a help center update easy to scan",
    prompt:
      "Write a short status note with one highlighted update and a clear action list.",
    vocabularyDomain: "content-operations",
    vocabularyTerms: ["help center", "article owner", "publish date"],
    target: `# Help center refresh

This note gives the support team a quick view of the article work before the next publishing window.

## Current status

The **billing article has passed its content review**, and the new screenshots are stored with the latest draft.

## Next actions

- Confirm the article owner
- Add the approved screenshots
- Share the publish date with support`,
  },
  {
    id: "l3-status-office-move",
    family: "status-handoff",
    contentVariant: "office-move-status",
    title: "Turn an office move update into a clear note",
    prompt:
      "Create a short move status with one highlighted fact and three next actions.",
    vocabularyDomain: "workplace-operations",
    vocabularyTerms: ["floor plan", "desk labels", "move day"],
    target: `# Office move status

This update helps each team prepare for the move without searching through older email threads.

## Current status

The **new floor plan is approved**, and desk labels are ready for every group moving on Friday.

## Next actions

- Send the floor plan to the team
- Place labels on the packed boxes
- Confirm the move-day contact`,
  },
  {
    id: "l3-handoff-event-registration",
    family: "status-handoff",
    contentVariant: "event-registration-handoff",
    title: "Make an event registration handoff easy to continue",
    prompt:
      "Write a concise handoff with a highlighted current state and three follow-up actions.",
    vocabularyDomain: "event-operations",
    vocabularyTerms: ["guest list", "name badges", "registration desk"],
    target: `# Event registration handoff

The evening team can use this note to continue registration work without repeating the earlier afternoon checks.

## Current status

The **guest list is current through noon**, and printed name badges are sorted beside the registration desk.

## Next actions

- Add the late registrations
- Print badges for new guests
- Count the remaining welcome packets`,
  },
  {
    id: "l3-handoff-document-review",
    family: "status-handoff",
    contentVariant: "document-review-handoff",
    title: "Prepare a document review handoff",
    prompt:
      "Organize a review handoff with one highlighted result and a practical action list.",
    vocabularyDomain: "document-operations",
    vocabularyTerms: ["opening page", "review comments", "final editor"],
    target: `# Document review handoff

This note tells the next editor what is finished and where the remaining review work should begin.

## Current status

The **opening page is approved**, and all resolved comments have been removed from the working draft.

## Next actions

- Review the final two sections
- Confirm the chart labels
- Send the clean draft to the final editor`,
  },
  {
    id: "l3-how-to-organize-project-folder",
    family: "how-to",
    contentVariant: "organize-project-folder",
    title: "Write a guide for organizing a project folder",
    prompt:
      "Create a short how-to with preparation items, ordered steps, and one exact folder label.",
    vocabularyDomain: "shared-file-organization",
    vocabularyTerms: ["project folder", "current files", "archive"],
    target: `# Organize a project folder

Use this guide when a shared folder has several drafts and coworkers need one clear place to start.

## Before you start

- Find the approved draft
- Confirm the project owner
- Check the latest review date

## Steps

1. Create a folder named \`Current\`
2. Move the approved draft into it
3. Place older drafts in the archive folder`,
  },
  {
    id: "l3-how-to-publish-meeting-notes",
    family: "how-to",
    contentVariant: "publish-meeting-notes",
    title: "Make meeting-note sharing easy to follow",
    prompt:
      "Write a workplace how-to with a preparation list, ordered steps, and an exact file name.",
    vocabularyDomain: "meeting-documentation",
    vocabularyTerms: ["meeting notes", "action owners", "meeting-notes.md"],
    target: `# Publish meeting notes

Follow this process so teammates can find the final notes and understand who owns each action.

## Before you start

- Review the attendee list
- Confirm each action owner
- Remove private working comments

## Steps

1. Save the final copy as \`meeting-notes.md\`
2. Add the file to the shared meeting folder
3. Send the folder link to all attendees`,
  },
  {
    id: "l3-how-to-update-team-calendar",
    family: "how-to",
    contentVariant: "update-team-calendar",
    title: "Create a clear team-calendar guide",
    prompt:
      "Explain the calendar update with preparation items, ordered steps, and one exact interface label.",
    vocabularyDomain: "schedule-maintenance",
    vocabularyTerms: ["team calendar", "time zone", "Save"],
    target: `# Update the team calendar

Use these steps when a work session changes and everyone needs the same confirmed date and time.

## Before you start

- Confirm the new time
- Check the team's time zone
- Find the current calendar entry

## Steps

1. Open the existing event
2. Change the date and attendee list
3. Choose \`Save\` and send the update`,
  },
  {
    id: "l3-how-to-review-inventory-sheet",
    family: "how-to",
    contentVariant: "review-inventory-sheet",
    title: "Write a guide for checking an inventory sheet",
    prompt:
      "Create a short checking guide with preparation items, ordered steps, and an exact status value.",
    vocabularyDomain: "inventory-review",
    vocabularyTerms: ["inventory sheet", "item count", "checked"],
    target: `# Review an inventory sheet

Use this guide before the weekly order so the shared sheet reflects what is actually on hand.

## Before you start

- Open the latest inventory sheet
- Bring the current item count
- Confirm who will place the order

## Steps

1. Compare each row with the counted items
2. Mark reviewed rows as \`checked\`
3. Share the completed sheet with the order owner`,
  },
  {
    id: "l3-decision-shared-file-names",
    family: "decision-record",
    contentVariant: "shared-file-names-decision",
    title: "Record a shared-file naming decision",
    prompt:
      "Write a short decision record with context, a quoted decision, and three actions.",
    vocabularyDomain: "file-governance",
    vocabularyTerms: ["file name", "project date", "shared folder"],
    target: `# Shared file name decision

This record explains the naming rule chosen for reports that several teams edit during the month.

## Context

Recent files were difficult to sort because dates appeared in different places and several names used unclear labels.

## Decision

> Put the project date first in every final report file name.

## Actions

- Rename the current reports
- Add an example to the team guide
- Check the shared folder next Friday`,
  },
  {
    id: "l3-decision-report-schedule",
    family: "decision-record",
    contentVariant: "report-schedule-decision",
    title: "Make a report schedule decision easy to find",
    prompt:
      "Create a compact decision note with background, the quoted choice, and follow-up actions.",
    vocabularyDomain: "reporting-routines",
    vocabularyTerms: ["weekly report", "Thursday deadline", "calendar reminder"],
    target: `# Weekly report schedule

This note records when the operations team will share its weekly report with the rest of the company.

## Context

Friday delivery left little time for questions before the weekend, while Wednesday did not include late updates.

## Decision

> Send the weekly report each Thursday by 3:00 p.m.

## Actions

- Update the reporting calendar
- Move the reminder to Thursday morning
- Review the schedule after one month`,
  },
  {
    id: "l3-decision-reply-template-review",
    family: "decision-record",
    contentVariant: "reply-template-review-decision",
    title: "Document a reply-template review decision",
    prompt:
      "Organize the decision with a context paragraph, quoted agreement, and three action items.",
    vocabularyDomain: "customer-communication",
    vocabularyTerms: ["reply template", "content review", "support lead"],
    target: `# Reply template review decision

This record keeps the review process clear when the support team creates or changes a customer reply template.

## Context

Small wording changes were reaching customers before another teammate checked the tone and required details.

## Decision

> One teammate reviews every new reply template before it is shared.

## Actions

- Add a review step to the checklist
- Name a backup reviewer
- Ask the support lead to confirm the process`,
  },
  {
    id: "l3-decision-quiet-room-booking",
    family: "decision-record",
    contentVariant: "quiet-room-booking-decision",
    title: "Record a quiet-room booking decision",
    prompt:
      "Write a readable booking decision with context, a quoted rule, and clear follow-up work.",
    vocabularyDomain: "office-scheduling",
    vocabularyTerms: ["quiet room", "booking block", "room guide"],
    target: `# Quiet room booking decision

This note records the shared rule for reserving small quiet rooms during the busiest part of the workday.

## Context

Long reservations made it hard for coworkers to find a private space for short calls and focused work.

## Decision

> Reserve quiet rooms in 30-minute blocks between noon and 4:00 p.m.

## Actions

- Update the room guide
- Add the limit to each calendar
- Review booking patterns next month`,
  },
] as const

export const readableDocumentBatch010Problems: readonly NormalizedProblem[] =
  readableDocumentBatch010Inputs.map(createReadableDocumentProblem)
