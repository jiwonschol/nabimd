import { getCurriculumElements } from "../content/curriculumElements"
import { koSamples } from "../content/ko/_samples"
import { derivePlaintextStarter } from "../content/plaintextStarter"
import { ko } from "../i18n/ko"
import { isMark, MARKS, type MarkId } from "./marks"
import type { PracticeItem } from "./practiceItem"

/**
 * The Korean bank (issue #253) will export its documents from
 * `src/content/ko/index.ts` as `koItems: readonly PracticeItem[]`. Until that
 * file exists, Korean mode runs on the three samples. This glob is the
 * one-line switch; it is empty while the file is absent.
 */
const koIndex = import.meta.glob<{ koItems: readonly PracticeItem[] }>(
  "../content/ko/index.ts",
)

function markByKoreanName(name: string): MarkId | null {
  return MARKS.find((mark) => ko[`mark.${mark}`] === name) ?? null
}

function sampleItems(): PracticeItem[] {
  return koSamples.flatMap(({ problem, focusMark }) => {
    const focus = markByKoreanName(focusMark)
    if (!focus) return []
    return [
      {
        problem: {
          ...problem,
          starterText: derivePlaintextStarter(problem.target),
        },
        marks: [focus],
        allMarks: getCurriculumElements(problem).filter(isMark),
        mixed: false,
      },
    ]
  })
}

export async function koreanItems(): Promise<readonly PracticeItem[]> {
  const loadIndex = Object.values(koIndex)[0]
  if (loadIndex) return (await loadIndex()).koItems
  return sampleItems()
}
