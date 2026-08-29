import type { NormalizedProblem } from "./types"
import { curriculumLevels } from "./curriculumLevels"
import { isEligibleMixedExercise } from "./mixedExercisePolicy"

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
export type EntryId = (typeof curriculumLevels)[number]["id"]

export type CurriculumElementProblem = Pick<
  NormalizedProblem,
  "id" | "skillIds" | "syntaxTokens" | "target" | "starterText"
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
  table: "table",
  "task-list": "task-list",
  "thematic-break": "thematic-break",
  "unordered-list": "unordered-list",
}

function isLanguageFence(token: string): boolean {
  return /^```[^`\s]+$/.test(token)
}

function isNestedListToken(token: string): boolean {
  return token === "Indent" || /^ {2,}(?:[-+*]|\d+[.)])/.test(token)
}

function getMixedTokenElement(token: string): CurriculumElement | null {
  if (isNestedListToken(token)) return "nested-list"
  // A language tag inside a mixed document is still part of applying a code
  // block. Dedicated one-syntax exercises own code-block-language in Level 2.
  if (token.startsWith("```")) return "code-block"
  if (token === "---") return "thematic-break"
  if (/^#{1,6}(?:\s|$)/.test(token)) return "heading"
  if (token.startsWith("**") || token.startsWith("__")) return "bold"
  if (token === "*" || token === "_") return "italic"
  if (/^[-+*](?:\s|$)/.test(token)) return "unordered-list"
  if (/^\d+[.)](?:\s|$)/.test(token)) return "ordered-list"
  if (token.startsWith(">")) return "blockquote"
  if (token.startsWith("`")) return "inline-code"
  if (token.startsWith("![")) return "image"
  if (token.startsWith("[")) return "link"
  return null
}

export function getCurriculumElements(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): CurriculumElement[] {
  if (problem.skillIds.length === 1) {
    if (problem.syntaxTokens.some(isNestedListToken)) return ["nested-list"]
    if (problem.syntaxTokens.some(isLanguageFence)) {
      return ["code-block-language"]
    }
    const element = singleSkillElements[problem.skillIds[0]!]
    return element ? [element] : []
  }

  return Array.from(
    new Set(
      problem.syntaxTokens
        .map(getMixedTokenElement)
        .filter((element) => element !== null),
    ),
  )
}

export function getCurriculumElement(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): CurriculumElement | null {
  const elements = getCurriculumElements(problem)
  return elements.length === 1 ? elements[0]! : null
}

export function getProblemEntryId(
  problem: Pick<NormalizedProblem, "skillIds" | "syntaxTokens">,
): EntryId | null {
  const elements = getCurriculumElements(problem)
  if (elements.length === 0) return null

  let owner: (typeof curriculumLevels)[number] | null = null
  for (const element of elements) {
    const candidate = curriculumLevels.find((entry) =>
      (entry.elements as readonly CurriculumElement[]).includes(element),
    )
    if (!candidate) return null
    if (owner === null || candidate.level > owner.level) owner = candidate
  }
  return owner?.id ?? null
}

export function isEntryAvailableForBank(
  entry: Pick<CurriculumElementEntry, "id" | "elements">,
  problems: readonly CurriculumElementProblem[],
  turnSize: number,
): boolean {
  const hasEnoughDedicatedElements =
    getImplementedElementsForEntry(entry, problems).length >= turnSize
  const hasOwnedMixedExercise = problems.some(
    (problem) =>
      problem.flavor === "standard" &&
      getCurriculumElements(problem).length > 1 &&
      getProblemEntryId(problem) === entry.id &&
      isEligibleMixedExercise(problem),
  )
  return hasEnoughDedicatedElements && hasOwnedMixedExercise
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
    for (const element of getCurriculumElements(problem)) {
      if (!declaredByElement.has(element)) {
        errors.push(`${problem.id} serves undeclared ${element}`)
      }
    }
  }

  for (const element of curriculumElementIds) {
    if (!declaredByElement.has(element)) {
      errors.push(`curriculum omits ${element}`)
    }
  }

  return errors
}
