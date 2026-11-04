import { getCurriculumElements } from "../content/curriculumElements"
import { problemBank } from "../content/problemBank"
import { isMark, type MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"

/**
 * English mode serves the existing bank as it is (plan §4.3): every standard
 * problem whose marks are all among the twelve. One mark makes a single-mark
 * document; two or more make a mixed one. Nested lists and thematic breaks
 * are outside the twelve and stay unserved.
 */
export function englishItems(): PracticeItem[] {
  const items: PracticeItem[] = []
  for (const problem of problemBank) {
    if (problem.flavor !== "standard") continue
    const elements = getCurriculumElements(problem)
    if (elements.length === 0 || !elements.every(isMark)) continue
    const marks = elements as MarkId[]
    items.push({
      problem,
      marks: [marks[0]!, ...marks.slice(1)],
      allMarks: marks,
      mixed: marks.length > 1,
    })
  }
  return items
}
