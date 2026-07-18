import { problemBank } from "./problemBank"
import type { CurriculumLevel, NormalizedProblem } from "./types"

export const entryChoices = [
  {
    id: "level-1",
    level: 1,
    label: "Level 1 — Learn with the pattern",
    autoOpenHelp: true,
  },
  {
    id: "level-2",
    level: 2,
    label: "Level 2 — Recall the syntax",
    autoOpenHelp: false,
  },
  {
    id: "level-3",
    level: 3,
    label: "Level 3 — Write for people",
    autoOpenHelp: false,
  },
  {
    id: "level-4",
    level: 4,
    label: "Level 4 — Write a development spec",
    autoOpenHelp: false,
  },
  {
    id: "level-5",
    level: 5,
    label: "Level 5 — Write an agent work order",
    autoOpenHelp: false,
  },
] as const satisfies readonly {
  id: string
  level: CurriculumLevel
  label: string
  autoOpenHelp: boolean
}[]

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
  return createRunProblemIdsForBank(entryId, runNumber, problemBank)
}

export function createRunProblemIdsForBank(
  entryId: EntryId,
  runNumber: number,
  problems: readonly Pick<NormalizedProblem, "id" | "level" | "flavor">[],
): string[] {
  const entry = getEntryChoice(entryId)
  const eligibleIds = problems
    .filter(
      (problem) =>
        problem.level === entry.level && problem.flavor === "standard",
    )
    .map((problem) => problem.id)

  if (eligibleIds.length === 0) {
    throw new Error(`No standard problems available for ${entryId}`)
  }

  const runLength = Math.min(3, eligibleIds.length)
  const offset = runNumber % eligibleIds.length
  return Array.from(
    { length: runLength },
    (_, index) => eligibleIds[(offset + index) % eligibleIds.length]!,
  )
}
