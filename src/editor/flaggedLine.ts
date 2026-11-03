import { type Extension, StateEffect, StateField } from "@codemirror/state"
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view"

/** 1-based, inclusive source lines a failed check points at. */
export type FlaggedLineRange = {
  from: number
  to: number
}

/**
 * Marks the source lines a failed check points at. The verdict text names
 * them ("3~4번째 줄: …") and this draws the matching underline in place.
 *
 * `null` or a range outside the document clears the mark. Any edit clears it
 * too: the underline belongs to the check that was just run, and keeping it
 * while the learner retypes would point at text that no longer exists.
 */
export const setFlaggedLines = StateEffect.define<FlaggedLineRange | null>()

const flaggedLineMark = Decoration.line({ class: "cm-flagged-line" })

const flaggedLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = transaction.docChanged ? Decoration.none : decorations
    for (const effect of transaction.effects) {
      if (!effect.is(setFlaggedLines)) continue
      const range = effect.value
      const lineCount = transaction.state.doc.lines
      if (
        range === null ||
        range.from < 1 ||
        range.to < range.from ||
        range.to > lineCount
      ) {
        next = Decoration.none
        continue
      }
      const marks = []
      for (let line = range.from; line <= range.to; line += 1) {
        marks.push(flaggedLineMark.range(transaction.state.doc.line(line).from))
      }
      next = Decoration.set(marks)
    }
    return next
  },
  provide: (field) => EditorView.decorations.from(field),
})

export function flaggedLines(): Extension {
  return flaggedLineField
}
