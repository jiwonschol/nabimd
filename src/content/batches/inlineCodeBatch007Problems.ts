import type { NormalizedProblem } from "../types"

const sourceBatchId = "2026-07-19-l1-l2-inline-code-007"
const curriculumVersion = "2026-07-19"

const teaching = {
  concept: "Inline code sets apart a short item such as text to type, a key, a file name, or a command.",
  howTo: "Wrap the item with one backtick on each side.",
  example: "Open `notes.txt`.",
} as const

const hints = [
  "The marked item has a matching symbol on both sides.",
  "Type one backtick, the item, then one more backtick.",
  "Example: ``Open `notes.txt`.``",
] as const

const focusedInlineCodeCheck = {
  id: "keep-one-inline-code",
  kind: "max-inline-count",
  scope: { kind: "document" },
  inline: "inline-code",
  max: 1,
  review: "Keep inline code focused on one short item in this note.",
} as const

type InlineCodeInput = {
  id: string
  level: 1 | 2
  contentVariant: string
  target: string
  plainText: string
  vocabularyDomain: string
}

function createInlineCodeProblem({
  id,
  level,
  contentVariant,
  target,
  plainText,
  vocabularyDomain,
}: InlineCodeInput): NormalizedProblem {
  return {
    id,
    schemaVersion: 2,
    level,
    flavor: "standard",
    familyId: "inline-code",
    skillIds: ["inline-code"],
    difficulty: "warmup",
    teachingMode: level === 1 ? "introduce" : "recall",
    teaching,
    syntaxTokens: ["`", "Item", "`"],
    title: level === 1 ? "Inline code" : "Inline code recall",
    prompt:
      level === 1
        ? "Write the short note with one item as inline code."
        : "From memory, mark one item in the short note as inline code.",
    target,
    starterText: "",
    protectedContent: [plainText],
    matchChecks: [
      {
        id: "use-inline-code",
        kind: "inline-code-shape",
        scope: { kind: "document" },
        min: 1,
        requireNonemptyContent: true,
        priority: 10,
        feedback: "Wrap at least one meaningful item in backticks.",
      },
    ],
    editorialChecks: [focusedInlineCodeCheck],
    hints,
    retryFamily:
      level === 1 ? "level-1-inline-code" : "level-2-inline-code-recall",
    reviewTags: ["one-focused-inline-code"],
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

const inlineCodeInputs: readonly InlineCodeInput[] = [
  { id: "l1-inline-code-notes-file", level: 1, contentVariant: "notes-file", target: "Save the note as `notes.md`.", plainText: "Save the note as notes.md.", vocabularyDomain: "simple-files" },
  { id: "l1-inline-code-today-list", level: 1, contentVariant: "today-list-file", target: "Name the list `today.txt`.", plainText: "Name the list today.txt.", vocabularyDomain: "simple-files" },
  { id: "l1-inline-code-photo-file", level: 1, contentVariant: "photo-file", target: "Find `photo.jpg`.", plainText: "Find photo.jpg.", vocabularyDomain: "simple-files" },
  { id: "l1-inline-code-enter-key", level: 1, contentVariant: "enter-key", target: "Press `Enter` to continue.", plainText: "Press Enter to continue.", vocabularyDomain: "keyboard-keys" },
  { id: "l1-inline-code-space-key", level: 1, contentVariant: "space-key", target: "Press `Space` to pause.", plainText: "Press Space to pause.", vocabularyDomain: "keyboard-keys" },
  { id: "l1-inline-code-escape-key", level: 1, contentVariant: "escape-key", target: "Press `Escape` to close the menu.", plainText: "Press Escape to close the menu.", vocabularyDomain: "keyboard-keys" },
  { id: "l1-inline-code-yes-value", level: 1, contentVariant: "yes-value", target: "Type `yes` in the box.", plainText: "Type yes in the box.", vocabularyDomain: "simple-input" },
  { id: "l1-inline-code-blue-value", level: 1, contentVariant: "blue-value", target: "Set the color to `blue`.", plainText: "Set the color to blue.", vocabularyDomain: "simple-settings" },
  { id: "l1-inline-code-small-value", level: 1, contentVariant: "small-value", target: "Choose `small` for the size.", plainText: "Choose small for the size.", vocabularyDomain: "simple-settings" },
  { id: "l1-inline-code-ready-label", level: 1, contentVariant: "ready-label", target: "Set the label to `ready`.", plainText: "Set the label to ready.", vocabularyDomain: "simple-labels" },
  { id: "l1-inline-code-search-word", level: 1, contentVariant: "search-word", target: "Search for `rain`.", plainText: "Search for rain.", vocabularyDomain: "simple-search" },
  { id: "l1-inline-code-greeting-command", level: 1, contentVariant: "greeting-command", target: "Run `echo hello` to show a greeting.", plainText: "Run echo hello to show a greeting.", vocabularyDomain: "beginner-commands" },
  { id: "l2-inline-code-readme-file", level: 2, contentVariant: "readme-file", target: "Read `README.md` before you start.", plainText: "Read README.md before you start.", vocabularyDomain: "document-reading" },
  { id: "l2-inline-code-meeting-file", level: 2, contentVariant: "meeting-file", target: "Save the meeting notes in `meeting.md`.", plainText: "Save the meeting notes in meeting.md.", vocabularyDomain: "meeting-notes" },
  { id: "l2-inline-code-agenda-file", level: 2, contentVariant: "agenda-file", target: "Attach `agenda.pdf` to the invite.", plainText: "Attach agenda.pdf to the invite.", vocabularyDomain: "meeting-materials" },
  { id: "l2-inline-code-tab-key", level: 2, contentVariant: "tab-key", target: "Press `Tab` to move to the next field.", plainText: "Press Tab to move to the next field.", vocabularyDomain: "form-navigation" },
  { id: "l2-inline-code-new-line-shortcut", level: 2, contentVariant: "new-line-shortcut", target: "Press `Shift+Enter` for a new line.", plainText: "Press Shift+Enter for a new line.", vocabularyDomain: "chat-writing" },
  { id: "l2-inline-code-draft-status", level: 2, contentVariant: "draft-status", target: "Set the status to `draft`.", plainText: "Set the status to draft.", vocabularyDomain: "work-status" },
  { id: "l2-inline-code-done-task", level: 2, contentVariant: "done-task", target: "Set the task to `done`.", plainText: "Set the task to done.", vocabularyDomain: "task-tracking" },
  { id: "l2-inline-code-short-reply", level: 2, contentVariant: "short-reply", target: "Set the reply length to `short`.", plainText: "Set the reply length to short.", vocabularyDomain: "ai-response-setting" },
  { id: "l2-inline-code-notifications-off", level: 2, contentVariant: "notifications-off", target: "Set notifications to `off`.", plainText: "Set notifications to off.", vocabularyDomain: "notification-setting" },
  { id: "l2-inline-code-test-command", level: 2, contentVariant: "test-command", target: "Run `npm test` before sharing your changes.", plainText: "Run npm test before sharing your changes.", vocabularyDomain: "software-testing" },
  { id: "l2-inline-code-git-status-command", level: 2, contentVariant: "git-status-command", target: "Run `git status` before you commit.", plainText: "Run git status before you commit.", vocabularyDomain: "version-control" },
  { id: "l2-inline-code-help-command", level: 2, contentVariant: "help-command", target: "Type `/help` to see available commands.", plainText: "Type /help to see available commands.", vocabularyDomain: "chat-help" },
]

export const inlineCodeBatch007Problems: readonly NormalizedProblem[] =
  inlineCodeInputs.map(createInlineCodeProblem)
