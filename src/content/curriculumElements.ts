import type { NormalizedProblem } from "./types"

export const curriculumElementIds = [
  "heading",
  "bold",
  "italic",
  "unordered-list",
  "ordered-list",
  "link",
  "inline-code",
  "code-block",
  "blockquote",
  "table",
  "task-list",
  "image",
  "bold-italic",
  "strikethrough",
  "thematic-break",
  "nested-list",
  "nested-blockquote",
  "code-block-language",
  "hard-line-break",
  "automatic-url",
  "link-title",
  "angle-bracket-url",
  "angle-bracket-email",
  "escape",
  "list-with-block",
  "footnote",
  "heading-id",
] as const

export type CurriculumElement = (typeof curriculumElementIds)[number]

export type CurriculumElementProblem = Pick<
  NormalizedProblem,
  "id" | "skillIds" | "syntaxTokens"
> & {
  flavor: "standard" | "transfer"
}

export type CurriculumElementEntry = {
  id: string
  elements: readonly CurriculumElement[]
  unimplementedElements: readonly CurriculumElement[]
}

const singleSkillElements: Readonly<Record<string, CurriculumElement>> = {
  blockquote: "blockquote",
  "bold-emphasis": "bold",
  "code-block": "code-block",
  "heading-h1": "heading",
  image: "image",
  "inline-image": "image",
  "inline-code": "inline-code",
  "inline-link": "link",
  italic: "italic",
  "italic-emphasis": "italic",
  "ordered-list": "ordered-list",
  "thematic-break": "thematic-break",
  "unordered-list": "unordered-list",
}

function isLanguageFence(token: string): boolean {
  return /^```[^`\s]+$/.test(token)
}

function isNestedListToken(token: string): boolean {
  return token === "Indent" || /^ {2,}(?:[-+*]|\d+[.)])/.test(token)
}

export function getCurriculumElement(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): CurriculumElement | null {
  if (problem.syntaxTokens.some(isNestedListToken)) return "nested-list"
  if (problem.syntaxTokens.some(isLanguageFence)) return "code-block-language"
  if (problem.skillIds.length !== 1) return null
  return singleSkillElements[problem.skillIds[0]!] ?? null
}

export function getImplementedElementsForEntry(
  entry: Pick<CurriculumElementEntry, "elements">,
  problems: readonly CurriculumElementProblem[],
): CurriculumElement[] {
  const implemented = new Set(
    problems
      .filter((problem) => problem.flavor === "standard")
      .map(getCurriculumElement)
      .filter((element) => element !== null),
  )
  return entry.elements.filter((element) => implemented.has(element))
}

export function validateCurriculumCoverage(
  entries: readonly CurriculumElementEntry[],
  problems: readonly CurriculumElementProblem[],
): string[] {
  const errors: string[] = []
  const declaredByElement = new Map<CurriculumElement, string>()

  for (const entry of entries) {
    const implemented = new Set(getImplementedElementsForEntry(entry, problems))
    const unimplemented = new Set(entry.unimplementedElements)

    for (const element of entry.elements) {
      const previousOwner = declaredByElement.get(element)
      if (previousOwner) {
        errors.push(`${element} is declared by both ${previousOwner} and ${entry.id}`)
      } else {
        declaredByElement.set(element, entry.id)
      }

      if (!implemented.has(element) && !unimplemented.has(element)) {
        errors.push(`${entry.id} declares ${element} but has no runtime problem`)
      }
      if (implemented.has(element) && unimplemented.has(element)) {
        errors.push(
          `${entry.id} still lists implemented ${element} as unimplemented`,
        )
      }
    }

    for (const element of unimplemented) {
      if (!entry.elements.includes(element)) {
        errors.push(`${entry.id} lists undeclared ${element} as unimplemented`)
      }
    }
  }

  for (const problem of problems) {
    const element = getCurriculumElement(problem)
    if (element && !declaredByElement.has(element)) {
      errors.push(`${problem.id} serves undeclared ${element}`)
    }
  }

  for (const element of curriculumElementIds) {
    if (!declaredByElement.has(element)) {
      errors.push(`curriculum omits ${element}`)
    }
  }

  return errors
}
