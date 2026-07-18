import { headingProblems } from "./headingProblems"

export const entryChoices = [
  {
    id: "level-1",
    label: "New to Markdown — start at Level 1",
    startingProblemId: "heading-apple",
    autoOpenHelp: true,
  },
  {
    id: "basics",
    label: "I know the basics",
    startingProblemId: "heading-rainy-day",
    autoOpenHelp: false,
  },
  {
    id: "challenge",
    label: "Challenge me",
    startingProblemId: "heading-study-tools",
    autoOpenHelp: false,
  },
] as const

export type EntryId = (typeof entryChoices)[number]["id"]

export function isEntryId(value: unknown): value is EntryId {
  return entryChoices.some((entry) => entry.id === value)
}

export function getEntryChoice(entryId: EntryId) {
  const entry = entryChoices.find((candidate) => candidate.id === entryId)
  if (!entry) throw new Error(`Unknown entry: ${entryId}`)
  return entry
}

export function createRunProblemIds(
  entryId: EntryId,
  runNumber: number,
): string[] {
  const entry = getEntryChoice(entryId)
  const startingIndex = headingProblems.findIndex(
    (problem) => problem.id === entry.startingProblemId,
  )
  const offset = (startingIndex + runNumber) % headingProblems.length
  const problemIds = headingProblems.map((problem) => problem.id)

  return [...problemIds.slice(offset), ...problemIds.slice(0, offset)]
}
