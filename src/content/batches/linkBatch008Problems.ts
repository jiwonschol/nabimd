import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-links-008"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "A Markdown link connects readable words to a web address without showing the full address.",
  howTo: "Put the readable words in square brackets. Put the web address in parentheses right after them.",
  example: "Find details in the [garden guide](https://example.com/garden).",
} as const

const hints = [
  "The words readers see go inside square brackets.",
  "Put the web address in parentheses immediately after the closing bracket.",
  "Example: `[garden guide](https://example.com/garden)`",
] as const

const focusedLinkCheck = {
  id: "keep-one-link",
  kind: "max-link-count",
  scope: { kind: "document" },
  max: 1,
  allowReferences: true,
  allowAutolinks: false,
  requireNonemptyLabel: true,
  requireNonemptyDestination: true,
  review: "Keep this short note focused on one link.",
} as const

type LinkInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  target: string
  plainText: string
  vocabularyDomain: string
}

function createLinkProblem({
  id,
  level,
  contentVariant,
  target,
  plainText,
  vocabularyDomain,
}: LinkInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "links",
    skillIds: ["inline-link"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["[", "Link text", "]", "(", "Web address", ")"],
    title: level === 1 ? "Markdown link" : "Markdown link recall",
    prompt:
      level === 1
        ? "Write the short note with one Markdown link."
        : "From memory, write the short note with one Markdown link.",
    target,
    starterText: "",
    protectedContent: [plainText],
    matchChecks: [
      {
        id: "use-link",
        kind: "link-shape",
        scope: { kind: "document" },
        min: 1,
        allowReferences: true,
        allowAutolinks: false,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        priority: 10,
        feedback: "Add a Markdown link with readable words and a web address.",
      },
    ],
    editorialChecks: [focusedLinkCheck],
    hints,
    retryFamily: level === 1 ? "level-1-link" : "level-2-link-recall",
    reviewTags: ["one-focused-link"],
    vocabulary: {
      profile: level === 1 ? "everyday" : "everyday-recall",
      domains: [vocabularyDomain],
      terms: [plainText],
    },
    sourceBatchId,
    revision: 1,
    curriculumVersion,
    contentVariant,
  }
}

const linkInputs: readonly LinkInput[] = [
  { id: "l1-link-neighborhood-map", level: 1, contentVariant: "neighborhood-map", target: "The [neighborhood map](https://example.com/everyday/neighborhood-map) shows nearby paths.", plainText: "The neighborhood map shows nearby paths.", vocabularyDomain: "neighborhood-navigation" },
  { id: "l1-link-library-hours", level: 1, contentVariant: "library-hours", target: "Today's [library hours](https://example.com/everyday/library-hours) are online.", plainText: "Today's library hours are online.", vocabularyDomain: "public-library" },
  { id: "l1-link-meal-ideas", level: 1, contentVariant: "meal-ideas", target: "Find a new option on the [meal ideas page](https://example.com/everyday/meal-ideas).", plainText: "Find a new option on the meal ideas page.", vocabularyDomain: "everyday-meals" },
  { id: "l1-link-local-events", level: 1, contentVariant: "local-events", target: "Upcoming activities are listed under [local events](https://example.com/everyday/local-events).", plainText: "Upcoming activities are listed under local events.", vocabularyDomain: "community-activities" },
  { id: "l1-link-music-playlist", level: 1, contentVariant: "music-playlist", target: "Listen to the [music playlist](https://example.com/everyday/music-playlist).", plainText: "Listen to the music playlist.", vocabularyDomain: "everyday-music" },
  { id: "l1-link-craft-guide", level: 1, contentVariant: "craft-guide", target: "The [craft guide](https://example.com/everyday/craft-guide) explains each step.", plainText: "The craft guide explains each step.", vocabularyDomain: "leisure-crafts" },
  { id: "l1-link-stretching-tips", level: 1, contentVariant: "stretching-tips", target: "Start with these [stretching tips](https://example.com/everyday/stretching-tips).", plainText: "Start with these stretching tips.", vocabularyDomain: "everyday-movement" },
  { id: "l1-link-train-map", level: 1, contentVariant: "train-map", target: "Use the [train map](https://example.com/everyday/train-map) before leaving.", plainText: "Use the train map before leaving.", vocabularyDomain: "local-travel" },
  { id: "l1-link-community-notice", level: 1, contentVariant: "community-notice", target: "The latest update is in the [community notice](https://example.com/everyday/community-notice).", plainText: "The latest update is in the community notice.", vocabularyDomain: "community-information" },
  { id: "l1-link-repair-guide", level: 1, contentVariant: "repair-guide", target: "Follow the [repair guide](https://example.com/everyday/repair-guide) for simple fixes.", plainText: "Follow the repair guide for simple fixes.", vocabularyDomain: "home-reference" },
  { id: "l1-link-reading-list", level: 1, contentVariant: "reading-list", target: "Choose a title from the [reading list](https://example.com/everyday/reading-list).", plainText: "Choose a title from the reading list.", vocabularyDomain: "leisure-reading" },
  { id: "l1-link-size-chart", level: 1, contentVariant: "size-chart", target: "Compare the options with the [size chart](https://example.com/everyday/size-chart).", plainText: "Compare the options with the size chart.", vocabularyDomain: "everyday-reference" },
  { id: "l2-link-project-brief", level: 2, contentVariant: "project-brief", target: "Start with the [project brief](https://example.com/work/project-brief).", plainText: "Start with the project brief.", vocabularyDomain: "project-orientation" },
  { id: "l2-link-project-board", level: 2, contentVariant: "project-board", target: "Track the next task on the [project board](https://example.com/work/project-board).", plainText: "Track the next task on the project board.", vocabularyDomain: "task-planning" },
  { id: "l2-link-setup-guide", level: 2, contentVariant: "setup-guide", target: "Follow the [setup guide](https://example.com/work/setup-guide) before running the project.", plainText: "Follow the setup guide before running the project.", vocabularyDomain: "local-setup" },
  { id: "l2-link-prompt-guide", level: 2, contentVariant: "prompt-guide", target: "Use the [prompt guide](https://example.com/work/prompt-guide) to refine the request.", plainText: "Use the prompt guide to refine the request.", vocabularyDomain: "vibe-coding-prompts" },
  { id: "l2-link-issue-template", level: 2, contentVariant: "issue-template", target: "Add the needed details with the [issue template](https://example.com/work/issue-template).", plainText: "Add the needed details with the issue template.", vocabularyDomain: "issue-writing" },
  { id: "l2-link-test-report", level: 2, contentVariant: "test-report", target: "Review the [test report](https://example.com/work/test-report) before sharing.", plainText: "Review the test report before sharing.", vocabularyDomain: "software-testing" },
  { id: "l2-link-preview-build", level: 2, contentVariant: "preview-build", target: "Open the [preview build](https://example.com/work/preview-build) for a quick check.", plainText: "Open the preview build for a quick check.", vocabularyDomain: "preview-review" },
  { id: "l2-link-release-checklist", level: 2, contentVariant: "release-checklist", target: "Confirm the steps in the [release checklist](https://example.com/work/release-checklist).", plainText: "Confirm the steps in the release checklist.", vocabularyDomain: "release-planning" },
  { id: "l2-link-api-reference", level: 2, contentVariant: "api-reference", target: "Look up the endpoint in the [API reference](https://example.com/work/api-reference).", plainText: "Look up the endpoint in the API reference.", vocabularyDomain: "api-reading" },
  { id: "l2-link-deployment-log", level: 2, contentVariant: "deployment-log", target: "Check the [deployment log](https://example.com/work/deployment-log) after publishing.", plainText: "Check the deployment log after publishing.", vocabularyDomain: "deployment-observation" },
  { id: "l2-link-agent-instructions", level: 2, contentVariant: "agent-instructions", target: "Read the [agent instructions](https://example.com/work/agent-instructions) before coding.", plainText: "Read the agent instructions before coding.", vocabularyDomain: "agent-context" },
  { id: "l2-link-pull-request", level: 2, contentVariant: "pull-request", target: "Leave feedback on the [pull request](https://example.com/work/pull-request).", plainText: "Leave feedback on the pull request.", vocabularyDomain: "code-review" },
]

export const linkBatch008Problems: readonly NormalizedProblem[] =
  linkInputs.map(createLinkProblem)
