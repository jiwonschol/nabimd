import { normalizeProblem } from "../normalizeProblem"
import type { MatchCheck, NormalizedProblem, ProblemInput } from "../types"

export const readableDocumentBatch011Id =
  "2026-07-19-l3-composite-documents-011"

const curriculumVersion = "2026-07-19"
const documentScope = { kind: "document" } as const

type ReadableDocumentFamily =
  | "meeting-agenda"
  | "reference-note"
  | "recommendation-brief"

export type ReadableDocumentBatch011Input = {
  id: string
  family: ReadableDocumentFamily
  contentVariant: string
  title: string
  prompt: string
  vocabularyDomain: string
  vocabularyTerms: readonly string[]
  target: string
}

const familyTeaching: Record<
  ReadableDocumentFamily,
  ProblemInput["teaching"]
> = {
  "meeting-agenda": {
    concept:
      "A useful agenda separates the meeting purpose, the order of discussion, and what people should prepare.",
    howTo:
      "Use one H1, three H2 sections, a Markdown divider, an ordered agenda, and an unordered preparation list.",
    example:
      "# Team agenda\n\nUse this note before the meeting.\n\n## Purpose\n\nMake one decision.\n\n---\n\n## Agenda\n\n1. Review\n2. Discuss\n3. Decide\n\n## Preparation\n\n- Read the note\n- Bring a question\n- Check the date",
  },
  "reference-note": {
    concept:
      "A reference note points readers to one shared source and leaves them with an easy-to-find takeaway.",
    howTo:
      "Use one H1, two H2 sections, a descriptive Markdown link, a divider, and a nonempty blockquote.",
    example:
      "# Reference note\n\nKeep the source nearby.\n\n## Reference\n\nRead the [team guide](/guide).\n\n---\n\n## Takeaway\n\n> Check the guide before you begin.",
  },
  "recommendation-brief": {
    concept:
      "A recommendation brief separates the available options, the preferred direction, and the work needed to try it.",
    howTo:
      "Use one H1, three H2 sections, an unordered options list, a nonempty blockquote, and ordered next steps.",
    example:
      "# Recommendation\n\nCompare the choices before acting.\n\n## Options\n\n- Keep the current process\n- Try a shared form\n- Use email\n\n## Recommendation\n\n> Try the shared form first.\n\n## Next steps\n\n1. Draft the form\n2. Test it\n3. Publish the guide",
  },
}

const familyHints: Record<
  ReadableDocumentFamily,
  readonly [string, string, string]
> = {
  "meeting-agenda": [
    "Start with one # title, an introduction, and a ## Purpose paragraph.",
    "Put a Markdown divider on its own line in the first H2 section.",
    "Add at least three numbered Agenda items and three bulleted Preparation items.",
  ],
  "reference-note": [
    "Start with one # title and explain why the reference is useful.",
    "Put a descriptive Markdown link and a divider in the first H2 section.",
    "Put one useful takeaway directly inside a blockquote in the second H2 section.",
  ],
  "recommendation-brief": [
    "Start with one # title and a short introduction.",
    "Add at least three bullet points, then put the recommendation in a blockquote.",
    "Finish the third H2 section with at least three numbered next steps.",
  ],
}

const familyMetadata = {
  "meeting-agenda": {
    retryFamily: "level3-meeting-agenda-document",
    skillIds: [
      "document-outline",
      "markdown-divider",
      "ordered-agenda",
      "preparation-list",
    ],
    syntaxTokens: ["#", "##", "---", "1.", "-"],
  },
  "reference-note": {
    retryFamily: "level3-reference-note-document",
    skillIds: [
      "document-outline",
      "descriptive-link",
      "markdown-divider",
      "blockquote-takeaway",
    ],
    syntaxTokens: ["#", "##", "[ ]( )", "---", ">"],
  },
  "recommendation-brief": {
    retryFamily: "level3-recommendation-brief-document",
    skillIds: [
      "document-outline",
      "option-list",
      "blockquote-recommendation",
      "ordered-next-steps",
    ],
    syntaxTokens: ["#", "##", "-", ">", "1."],
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
      feedback: "Keep heading levels in order: move from H1 to H2 without skipping a level.",
    },
  ]
}

function matchChecksFor(input: ReadableDocumentBatch011Input): MatchCheck[] {
  if (input.family === "meeting-agenda") {
    return [
      ...commonChecks(input.id, 3, [
        { block: "heading", depth: 1 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "list" },
        { block: "heading", depth: 2 },
        { block: "list" },
      ]),
      {
        id: `${input.id}-divider`,
        kind: "block-count",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        block: "thematic-break",
        min: 1,
        priority: 30,
        feedback: "Put a Markdown divider in the first H2 section.",
      },
      {
        id: `${input.id}-agenda`,
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        ordered: true,
        minItems: 3,
        requireNonemptyItems: true,
        priority: 40,
        feedback: "Use at least three ordered agenda items in the second H2 section.",
      },
      {
        id: `${input.id}-preparation`,
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 2 },
        ordered: false,
        minItems: 3,
        requireNonemptyItems: true,
        priority: 50,
        feedback:
          "Use at least three unordered preparation items in the third H2 section.",
      },
    ]
  }

  if (input.family === "reference-note") {
    return [
      ...commonChecks(input.id, 2, [
        { block: "heading", depth: 1 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "paragraph" },
        { block: "heading", depth: 2 },
        { block: "blockquote" },
      ]),
      {
        id: `${input.id}-divider`,
        kind: "block-count",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        block: "thematic-break",
        min: 1,
        priority: 30,
        feedback: "Put a Markdown divider in the first H2 section.",
      },
      {
        id: `${input.id}-reference-link`,
        kind: "link-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        min: 1,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: true,
        allowAutolinks: false,
        priority: 40,
        feedback:
          "Add a Markdown link with readable words and a destination in the first H2 section.",
      },
      {
        id: `${input.id}-takeaway`,
        kind: "blockquote-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        requireNonemptyContent: true,
        priority: 50,
        feedback: "Put a nonempty blockquote in the second H2 section.",
      },
    ]
  }

  return [
    ...commonChecks(input.id, 3, [
      { block: "heading", depth: 1 },
      { block: "paragraph" },
      { block: "heading", depth: 2 },
      { block: "list" },
      { block: "heading", depth: 2 },
      { block: "blockquote" },
      { block: "heading", depth: 2 },
      { block: "list" },
    ]),
    {
      id: `${input.id}-options`,
      kind: "list-shape",
      scope: { kind: "section", headingDepth: 2, occurrence: 0 },
      ordered: false,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 30,
      feedback: "Use at least three unordered options in the first H2 section.",
    },
    {
      id: `${input.id}-recommendation`,
      kind: "blockquote-shape",
      scope: { kind: "section", headingDepth: 2, occurrence: 1 },
      requireNonemptyContent: true,
      priority: 40,
      feedback: "Put a nonempty blockquote in the second H2 section.",
    },
    {
      id: `${input.id}-next-steps`,
      kind: "list-shape",
      scope: { kind: "section", headingDepth: 2, occurrence: 2 },
      ordered: true,
      minItems: 3,
      requireNonemptyItems: true,
      priority: 50,
      feedback: "Use at least three ordered steps in the third H2 section.",
    },
  ]
}

function makeProblem(input: ReadableDocumentBatch011Input): NormalizedProblem {
  const metadata = familyMetadata[input.family]
  return normalizeProblem({
    id: input.id,
    schemaVersion: 2,
    level: 3,
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
    sourceBatchId: readableDocumentBatch011Id,
    revision: 1,
    curriculumVersion,
    contentVariant: input.contentVariant,
  })
}

export const readableDocumentBatch011Inputs: readonly ReadableDocumentBatch011Input[] = [
  {
    id: "l3-agenda-website-navigation",
    family: "meeting-agenda",
    contentVariant: "website-navigation-review-agenda",
    title: "Build a website navigation review agenda",
    prompt:
      "Organize a review meeting with a purpose, numbered agenda, and preparation list.",
    vocabularyDomain: "website-content-review",
    vocabularyTerms: ["navigation", "visitor path", "page outline"],
    target: `# Website navigation review

This agenda helps the content team examine how visitors find common information and leave with a small set of clear improvements.

## Purpose

Review the labels and paths that caused unnecessary searching during the latest walkthrough.

---

## Agenda

1. Compare the current section labels
2. Review the most common visitor paths
3. Choose two changes for another walkthrough

## Preparation

- Open the current page outline
- Bring notes from the walkthrough
- List one label that needs clarification`,
  },
  {
    id: "l3-agenda-internal-newsletter",
    family: "meeting-agenda",
    contentVariant: "internal-newsletter-planning-agenda",
    title: "Plan an internal newsletter meeting",
    prompt:
      "Create a focused newsletter agenda with a purpose, numbered discussion order, and preparation list.",
    vocabularyDomain: "internal-newsletter",
    vocabularyTerms: ["section owner", "topic suggestion", "review date"],
    target: `# Internal newsletter planning

Use this agenda to keep the next newsletter meeting focused on useful company updates and realistic writing deadlines.

## Purpose

Agree on the edition's three sections and assign a clear owner to each one.

---

## Agenda

1. Review the proposed topics
2. Choose the order of the sections
3. Confirm the final review date

## Preparation

- Read the topic suggestions
- Bring one short update
- Check your availability for review`,
  },
  {
    id: "l3-agenda-break-room-supplies",
    family: "meeting-agenda",
    contentVariant: "break-room-supply-review-agenda",
    title: "Structure a supply review agenda",
    prompt:
      "Make an office supply meeting easy to follow with numbered agenda items and preparation bullets.",
    vocabularyDomain: "shared-office-supplies",
    vocabularyTerms: ["supply count", "request list", "order summary"],
    target: `# Break room supply review

This agenda gives the office team a simple way to review frequently used supplies without spending the meeting on individual requests.

## Purpose

Decide which items need a regular count and which can be ordered only when requested.

---

## Agenda

1. Compare the latest supply counts
2. Review items that were rarely used
3. Set the next check date

## Preparation

- Open the shared request list
- Note any empty shelf
- Bring last month's order summary`,
  },
  {
    id: "l3-agenda-volunteer-day",
    family: "meeting-agenda",
    contentVariant: "volunteer-day-planning-agenda",
    title: "Prepare a volunteer day planning agenda",
    prompt: "Write a clear planning agenda for an optional company activity.",
    vocabularyDomain: "company-volunteer-day",
    vocabularyTerms: ["activity summary", "interest form", "scheduling concern"],
    target: `# Volunteer day planning

This agenda helps the planning group prepare an optional company volunteer day with clear activities and enough notice for coworkers.

## Purpose

Choose two practical activities and decide what information employees need before expressing interest.

---

## Agenda

1. Compare the proposed activities
2. Estimate the time for each option
3. Choose a date for the interest form

## Preparation

- Read the activity summaries
- Bring one scheduling concern
- Note any material the announcement needs`,
  },
  {
    id: "l3-reference-presentation-writing",
    family: "reference-note",
    contentVariant: "presentation-writing-reference",
    title: "Make a presentation reference note",
    prompt:
      "Organize one useful reference and a quoted takeaway for presentation contributors.",
    vocabularyDomain: "presentation-guidance",
    vocabularyTerms: ["writing guide", "supporting detail", "audience question"],
    target: `# Presentation writing reference

This note gives contributors one shared reference for preparing a clear internal presentation, making it easier to follow the same approach before the first draft is reviewed.

## Reference

Read the [presentation writing guide](/guides/presentations) for advice on headings, short sections, and useful supporting details.

---

## Takeaway

> Start with the audience's main question, then keep each section focused on one answer.`,
  },
  {
    id: "l3-reference-workplace-survey",
    family: "reference-note",
    contentVariant: "workplace-survey-reference",
    title: "Create a workplace survey reference",
    prompt:
      "Present a survey-writing reference and one memorable takeaway in a scannable note.",
    vocabularyDomain: "workplace-surveys",
    vocabularyTerms: ["neutral question", "response option", "survey guide"],
    target: `# Workplace survey reference

Use this note when a team is preparing a short internal survey and needs a shared reminder about writing neutral, easy-to-answer questions.

## Reference

Open the [survey question guide](/guides/surveys) before drafting choices or asking another teammate to review the form.

---

## Takeaway

> Ask one thing at a time and give every response option a clear, consistent meaning.`,
  },
  {
    id: "l3-reference-office-purchase",
    family: "reference-note",
    contentVariant: "office-purchase-reference",
    title: "Write an office purchase reference",
    prompt:
      "Make routine purchase guidance easy to find with one link and a quoted takeaway.",
    vocabularyDomain: "office-purchase-requests",
    vocabularyTerms: ["request category", "needed date", "delivery location"],
    target: `# Office purchase reference

This note points coworkers to the standard guidance for requesting routine office supplies without repeating the same process in several messages.

## Reference

Review the [purchase request guide](/guides/purchases) before choosing a category, needed date, or delivery location.

---

## Takeaway

> Explain what the team needs, when it is needed, and where the supplies should arrive.`,
  },
  {
    id: "l3-reference-learning-session",
    family: "reference-note",
    contentVariant: "learning-session-reference",
    title: "Build a learning session reference",
    prompt:
      "Create a short preparation reference with a descriptive link and quoted reminder.",
    vocabularyDomain: "internal-learning",
    vocabularyTerms: ["preparation guide", "reading", "discussion question"],
    target: `# Learning session reference

This note keeps one preparation reference easy to find when coworkers are joining an internal learning session for the first time.

## Reference

Read the [session preparation guide](/guides/learning) before choosing the reading, writing a question, or joining the discussion.

---

## Takeaway

> Review one resource in advance and bring one question that the group can explore together.`,
  },
  {
    id: "l3-recommendation-town-hall-format",
    family: "recommendation-brief",
    contentVariant: "town-hall-format-recommendation",
    title: "Compare town hall formats",
    prompt:
      "Write a recommendation brief that compares three town hall formats and proposes clear next steps.",
    vocabularyDomain: "company-meeting-formats",
    vocabularyTerms: ["town hall", "hybrid session", "written questions"],
    target: `# Quarterly town hall format

This brief compares ways to make the next company town hall useful for coworkers working in different locations.

## Options

- Hold one in-person session
- Stream the session live
- Use a hybrid session with written questions

## Recommendation

> Use a hybrid session so people can join remotely while the local audience still shares the same discussion.

## Next steps

1. Confirm the available meeting space
2. Test the streaming setup
3. Open a form for questions`,
  },
  {
    id: "l3-recommendation-office-plant-care",
    family: "recommendation-brief",
    contentVariant: "office-plant-care-recommendation",
    title: "Recommend a plant care approach",
    prompt:
      "Compare practical ways to care for shared office plants, then recommend one approach and outline the follow-up work.",
    vocabularyDomain: "shared-office-care",
    vocabularyTerms: ["shared plants", "staff rotation", "care visit"],
    target: `# Office plant care approach

This brief reviews simple ways to keep shared plants healthy without adding unclear chores to individual teams.

## Options

- Ask each area to manage its plants
- Create a weekly staff rotation
- Arrange one regular care visit

## Recommendation

> Arrange a regular care visit so watering and basic checks happen consistently across the office.

## Next steps

1. Count the shared plants
2. Ask for a basic service estimate
3. Review the approach after one month`,
  },
  {
    id: "l3-recommendation-internal-tool-demo",
    family: "recommendation-brief",
    contentVariant: "internal-tool-demo-recommendation",
    title: "Recommend an internal tool demonstration",
    prompt:
      "Compare three demonstration formats and recommend an accessible way to introduce an internal tool.",
    vocabularyDomain: "internal-tool-learning",
    vocabularyTerms: ["live demonstration", "recorded walkthrough", "guided practice"],
    target: `# Internal tool demonstration format

This brief compares practical formats for showing a new internal tool to coworkers who have different schedules and experience levels.

## Options

- Give one live demonstration
- Share a recorded walkthrough
- Host a short guided practice session

## Recommendation

> Share a recorded walkthrough first, then offer guided practice for coworkers who want to try the tool.

## Next steps

1. Outline the main demonstration
2. Record a short walkthrough
3. Invite questions before practice`,
  },
  {
    id: "l3-recommendation-community-bulletin",
    family: "recommendation-brief",
    contentVariant: "community-bulletin-recommendation",
    title: "Recommend a community bulletin format",
    prompt:
      "Compare ways to share optional workplace notices and recommend one maintainable format.",
    vocabularyDomain: "workplace-community-notices",
    vocabularyTerms: ["bulletin board", "monthly digest", "posting guidelines"],
    target: `# Workplace community bulletin

This brief compares ways to share optional clubs, local events, and coworker announcements without filling the main company update with small notices.

## Options

- Maintain a physical bulletin board
- Send a separate monthly digest
- Create one shared bulletin page

## Recommendation

> Use a shared page for current notices and send a short monthly reminder that points people to it.

## Next steps

1. Draft simple posting guidelines
2. Choose an owner for outdated notices
3. Review participation after two months`,
  },
] as const

export const readableDocumentBatch011Problems: readonly NormalizedProblem[] =
  readableDocumentBatch011Inputs.map(makeProblem)

export const readableDocumentBatch011PrototypeProblems = [
  readableDocumentBatch011Problems[0]!,
  readableDocumentBatch011Problems[4]!,
  readableDocumentBatch011Problems[8]!,
] as const
