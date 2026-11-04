import type { CurriculumElement } from "../content/curriculumElements"
import type { TextKey } from "../i18n/ko"

/**
 * The twelve marks of the home map, in map order (plan §4.1·§4.2). Each id is
 * the curriculum element the engine-side classification already uses, so a
 * problem's marks come from `getCurriculumElements` without a second table.
 */
export const MARKS = [
  "heading",
  "bold",
  "italic",
  "unordered-list",
  "ordered-list",
  "link",
  "inline-code",
  "code-block",
  "blockquote",
  "image",
  "table",
  "task-list",
] as const satisfies readonly CurriculumElement[]

export type MarkId = (typeof MARKS)[number]

const markSet: ReadonlySet<string> = new Set(MARKS)

export function isMark(value: string): value is MarkId {
  return markSet.has(value)
}

/**
 * The syntax each map cell shows. Most marks are the same in every language;
 * link and image carry placeholder words, so those come from the dictionary.
 */
export const MARK_EXAMPLES: Readonly<Record<MarkId, string | TextKey>> = {
  heading: "# ",
  bold: "**",
  italic: "*",
  "unordered-list": "- ",
  "ordered-list": "1. ",
  link: "markExample.link",
  "inline-code": "`",
  "code-block": "```",
  blockquote: "> ",
  image: "markExample.image",
  table: "| a | b |",
  "task-list": "- [ ] ",
}

export function markNameKey(mark: MarkId): TextKey {
  return `mark.${mark}`
}
