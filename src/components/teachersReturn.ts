import { problemBank } from "../content/problemBank"
import {
  deriveSyntaxCheckpoints,
  type SyntaxMistake,
} from "../guided/guidedSyntax"
import type { LineCorrections } from "./RenderedDocument"

export type CompletedPracticePage = {
  problemId: string
  title: string
  source: string
}

/** One numbered note on the right page, tied to one mark on the left page. */
export type TeacherNote = {
  number: number
  /** The syntax family, named the way the note names it. */
  term: string
  /** Every key sequence the missed group accepts. */
  expected: readonly string[]
}

export type MarkedPage = CompletedPracticePage & {
  corrections: LineCorrections
}

export type TeachersReturn = {
  pages: readonly MarkedPage[]
  notes: readonly TeacherNote[]
}

function checkpointLine(
  problemId: string,
  checkpointId: string,
): number | null {
  // A ledger entry can outlive the problem it names once the bank changes.
  // The teacher's return drops that mark rather than failing the whole page.
  const problem = problemBank.find((candidate) => candidate.id === problemId)
  if (!problem) return null
  const checkpoint = deriveSyntaxCheckpoints(
    problem.target,
    problem.starterText,
  ).find((candidate) => candidate.id === checkpointId)
  return checkpoint?.line ?? null
}

/**
 * Turns the run's mistake ledger into the two halves of the teacher's return:
 * the numbers drawn beside the work, and the matching numbered notes.
 *
 * Numbering follows the page, not the order the misses happened, so a reader
 * moving down the left page meets 1, 2, 3 in order.
 */
export function buildTeachersReturn(
  pages: readonly CompletedPracticePage[],
  mistakes: readonly SyntaxMistake[],
): TeachersReturn {
  const located = mistakes.flatMap((mistake) => {
    const pageIndex = pages.findIndex(
      (page) => page.problemId === mistake.problemId,
    )
    // A miss on a problem that never finished has nothing to mark: the work
    // it belongs to is not on the page.
    if (pageIndex < 0) return []
    const line = checkpointLine(mistake.problemId, mistake.checkpointId)
    if (line === null) return []
    return [{ mistake, pageIndex, line }]
  })

  located.sort(
    (left, right) =>
      left.pageIndex - right.pageIndex ||
      left.line - right.line ||
      left.mistake.groupIndex - right.mistake.groupIndex,
  )

  const notes: TeacherNote[] = []
  const correctionsByPage = new Map<number, Map<number, number[]>>()

  located.forEach((entry, index) => {
    const number = index + 1
    notes.push({
      number,
      term: entry.mistake.term,
      expected: entry.mistake.expected,
    })
    const pageCorrections =
      correctionsByPage.get(entry.pageIndex) ?? new Map<number, number[]>()
    pageCorrections.set(entry.line, [
      ...(pageCorrections.get(entry.line) ?? []),
      number,
    ])
    correctionsByPage.set(entry.pageIndex, pageCorrections)
  })

  return {
    pages: pages.map((page, pageIndex) => ({
      ...page,
      corrections: correctionsByPage.get(pageIndex) ?? new Map(),
    })),
    notes,
  }
}
