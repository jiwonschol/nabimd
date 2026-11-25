import {
  EditorState,
  type Extension,
  Facet,
  StateEffect,
  StateField,
  type Text,
  type Transaction,
} from "@codemirror/state"
import {
  type Command,
  Decoration,
  type DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view"
import type { FlaggedLineRange } from "./flaggedLine"
import {
  matchedMarkerCount,
  type MarkdownBlankGuideSource,
} from "./markdownBlankGuides"

/**
 * One place where the target has a mark and the starter text does not: the
 * only text the learner can type in fill mode. `from..to` covers what they
 * typed there so far; `markers` are the target's characters and never reach
 * the screen.
 */
export type MarkSlot = {
  /** Position in the problem's guide list; stable while the draft changes. */
  id: number
  from: number
  to: number
  markers: string
}

function isFilled(doc: string, slot: MarkSlot): boolean {
  return (
    matchedMarkerCount(doc.slice(slot.from, slot.to), slot.markers) >=
    slot.markers.length
  )
}

/**
 * Places one starter line inside the learner's line: the column of every
 * starter character, or null when the learner's line is not that prose with
 * extra text only where a slot is. Backtracks, because a mark can equal the
 * prose character after it (`3. ` before `./start.sh`).
 */
function placeProse(
  starterLine: string,
  docLine: string,
  slotColumns: ReadonlySet<number>,
): number[] | null {
  const columns: number[] = []
  const dead = new Set<number>()
  const place = (index: number, from: number): boolean => {
    if (index === starterLine.length) {
      return from === docLine.length || slotColumns.has(index)
    }
    const key = index * (docLine.length + 1) + from
    if (dead.has(key)) return false
    const last = slotColumns.has(index) ? docLine.length - 1 : from
    for (let column = from; column <= last; column += 1) {
      if (docLine[column] !== starterLine[index]) continue
      columns[index] = column
      if (place(index + 1, column + 1)) return true
    }
    dead.add(key)
    return false
  }
  return place(0, 0) ? columns : null
}

/**
 * Finds the slots in a draft, or null when the draft is not "the starter
 * text plus whatever sits in the slots". That rule is the whole lock: an
 * edit is allowed exactly when the prose it leaves behind is untouched, so
 * typing in a slot and pasting a finished answer both pass, while a change
 * to any other character does not.
 */
export function alignMarkSlots(
  doc: string,
  source: MarkdownBlankGuideSource,
): MarkSlot[] | null {
  const starterLines = source.starterText.split("\n")
  const docLines = doc.split("\n")
  if (docLines.length !== starterLines.length) return null

  // Guides are in document order, so one pass hands each line its own.
  const slots: MarkSlot[] = []
  let guideIndex = 0
  let starterStart = 0
  let docStart = 0
  for (const [lineIndex, starterLine] of starterLines.entries()) {
    const docLine = docLines[lineIndex] ?? ""
    const lineGuides: { id: number; column: number; markers: string }[] = []
    while (guideIndex < source.guides.length) {
      const guide = source.guides[guideIndex]
      if (!guide || guide.from > starterStart + starterLine.length) break
      lineGuides.push({
        id: guideIndex,
        column: guide.from - starterStart,
        markers: guide.markers,
      })
      guideIndex += 1
    }
    const columns = placeProse(
      starterLine,
      docLine,
      new Set(lineGuides.map((guide) => guide.column)),
    )
    if (!columns) return null
    for (const guide of lineGuides) {
      const previous = columns[guide.column - 1]
      slots.push({
        id: guide.id,
        from: docStart + (previous === undefined ? 0 : previous + 1),
        to: docStart + (columns[guide.column] ?? docLine.length),
        markers: guide.markers,
      })
    }
    starterStart += starterLine.length + 1
    docStart += docLine.length + 1
  }
  return slots
}

type SlotState = {
  slots: readonly MarkSlot[]
  /** Slot ids a failed check sent the learner to and that are still unfixed. */
  flagged: ReadonlySet<number>
  /** Grows with every jump so the arrival pulse can play again. */
  jumps: number
  decorations: DecorationSet
}

/**
 * Marks the slots a failed check points at. The value is the lines of the
 * failed checks, or null when the engine could not place every failure.
 */
const flagFailedSlots = StateEffect.define<readonly FlaggedLineRange[] | null>()
const jumpedToSlot = StateEffect.define<null>()

/**
 * The slots a failed check sends the learner to. A slot counts as missing
 * when the target's marks are not all there, which is stricter than the
 * engine (it also accepts `_x_` for `*x*`), so missing slots are narrowed to
 * the failed lines when the engine placed every failure. A failed line with
 * no missing slot has a mark typed wrong, and its slots are flagged instead.
 */
function failedSlotIds(
  doc: Text,
  slots: readonly MarkSlot[],
  failedLines: readonly FlaggedLineRange[] | null,
): Set<number> {
  const text = doc.toString()
  const onFailedLine = (slot: MarkSlot) => {
    const line = doc.lineAt(slot.from).number
    return (failedLines ?? []).some(
      (range) => line >= range.from && line <= range.to,
    )
  }
  const missing = slots.filter((slot) => !isFilled(text, slot))
  const narrowed = failedLines ? missing.filter(onFailedLine) : missing
  const chosen =
    narrowed.length > 0
      ? narrowed
      : missing.length > 0
        ? missing
        : slots.filter(onFailedLine)
  return new Set(chosen.map((slot) => slot.id))
}

class EmptySlotWidget extends WidgetType {
  constructor(private readonly className: string) {
    super()
  }

  override eq(other: EmptySlotWidget): boolean {
    return this.className === other.className
  }

  override toDOM(): HTMLElement {
    const slot = document.createElement("span")
    slot.ariaHidden = "true"
    slot.className = `${this.className} cm-mark-slot--empty`
    return slot
  }

  override ignoreEvent(): boolean {
    return false
  }
}

function slotAt(slots: readonly MarkSlot[], head: number): number {
  return slots.findIndex((slot) => head >= slot.from && head <= slot.to)
}

function decorate(state: Omit<SlotState, "decorations">, head: number) {
  const active = slotAt(state.slots, head)
  return Decoration.set(
    state.slots.map((slot, index) => {
      const className = [
        "cm-mark-slot",
        state.flagged.has(slot.id) ? "cm-mark-slot--flagged" : "",
        // Two identical animations take turns so a jump onto the slot the
        // cursor is already styled for still replays the pulse.
        index === active
          ? `cm-mark-slot--active cm-mark-slot--pulse-${state.jumps % 2}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
      return slot.from === slot.to
        ? Decoration.widget({
            side: 1,
            widget: new EmptySlotWidget(className),
          }).range(slot.from)
        : Decoration.mark({ class: className }).range(slot.from, slot.to)
    }),
    true,
  )
}

/** The problem's guides; present exactly while the editor is in fill mode. */
const slotSource = Facet.define<
  MarkdownBlankGuideSource,
  MarkdownBlankGuideSource | null
>({ combine: (values) => values[0] ?? null })

function align(state: EditorState, doc: string): MarkSlot[] {
  const source = state.facet(slotSource)
  return (source && alignMarkSlots(doc, source)) ?? []
}

const slotField = StateField.define<SlotState>({
    create(state) {
      const base = {
        slots: align(state, state.doc.toString()),
        flagged: new Set<number>(),
        jumps: 0,
      }
      return { ...base, decorations: decorate(base, state.selection.main.head) }
    },
    update(value, transaction) {
      let { slots, flagged, jumps } = value
      if (transaction.docChanged) {
        const text = transaction.state.doc.toString()
        slots = align(transaction.state, text)
        const stillFlagged = slots.filter(
          (slot) => flagged.has(slot.id) && !isFilled(text, slot),
        )
        if (stillFlagged.length !== flagged.size) {
          flagged = new Set(stillFlagged.map((slot) => slot.id))
        }
      }
      for (const effect of transaction.effects) {
        if (effect.is(flagFailedSlots)) {
          flagged = failedSlotIds(transaction.state.doc, slots, effect.value)
          jumps += 1
        } else if (effect.is(jumpedToSlot)) {
          jumps += 1
        }
      }
      if (
        slots === value.slots &&
        flagged === value.flagged &&
        jumps === value.jumps &&
        !transaction.selection
      ) {
        return value
      }
      const base = { slots, flagged, jumps }
      return {
        ...base,
        decorations: decorate(base, transaction.state.selection.main.head),
      }
    },
    provide: (field) =>
      EditorView.decorations.from(field, (value) => value.decorations),
})

/** Where a selection that left the slots lands. */
function snapTarget(
  slots: readonly MarkSlot[],
  from: number,
  head: number,
  pointer: boolean,
): number | null {
  if (slots.length === 0) return null
  const nearest = () =>
    slots.reduce((best, slot) => {
      const distance = (candidate: MarkSlot) =>
        head < candidate.from
          ? candidate.from - head
          : head > candidate.to
            ? head - candidate.to
            : 0
      return distance(slot) < distance(best) ? slot : best
    })
  const current = slotAt(slots, from)
  if (pointer || current < 0 || head === from) {
    const slot = nearest()
    return Math.min(Math.max(head, slot.from), slot.to)
  }
  // A key moved the cursor out of its slot: step to the neighbouring slot in
  // that direction, or stay at this slot's edge when there is none.
  if (head > from) {
    return slots[current + 1]?.from ?? slots[current]?.to ?? null
  }
  return slots[current - 1]?.to ?? slots[current]?.from ?? null
}

function lock(
  source: MarkdownBlankGuideSource,
  isExternal: (transaction: Transaction) => boolean,
) {
  return EditorState.transactionFilter.of((transaction) => {
    // The app replacing the draft (a mode switch) is not the learner typing.
    if (isExternal(transaction)) return transaction

    let slots = transaction.startState.field(slotField).slots
    if (transaction.docChanged) {
      const aligned = alignMarkSlots(transaction.newDoc.toString(), source)
      if (!aligned) return []
      slots = aligned
    }
    if (!transaction.docChanged && !transaction.selection) return transaction

    const selection = transaction.newSelection.main
    const inside = slots.some(
      (slot) => selection.from >= slot.from && selection.to <= slot.to,
    )
    if (inside) return transaction

    const before = transaction.changes.mapPos(
      transaction.startState.selection.main.head,
      1,
    )
    const target = snapTarget(
      slots,
      before,
      selection.head,
      transaction.isUserEvent("select.pointer"),
    )
    if (target === null) return transaction
    return [transaction, { selection: { anchor: target }, sequential: true }]
  })
}

/** The live slots, or an empty list when the editor is not in fill mode. */
export function markSlotsOf(view: EditorView): readonly MarkSlot[] {
  return view.state.field(slotField, false)?.slots ?? []
}

function jumpTo(view: EditorView, position: number): void {
  view.dispatch({
    selection: { anchor: position },
    effects: [jumpedToSlot.of(null), EditorView.scrollIntoView(position)],
  })
}

function moveBetweenSlots(direction: 1 | -1): Command {
  return (view) => {
    const state = view.state.field(slotField, false)
    // Not in fill mode: the key keeps its ordinary meaning.
    if (!state) return false
    // After a failed check the key walks only what is left to fix.
    const flagged = state.slots.filter((slot) => state.flagged.has(slot.id))
    const stops = flagged.length > 0 ? flagged : state.slots
    if (stops.length === 0) return true
    const head = view.state.selection.main.head
    const current = slotAt(stops, head)
    let next: MarkSlot | undefined
    if (current >= 0) {
      next = stops[(current + direction + stops.length) % stops.length]
    } else if (direction === 1) {
      next = stops.find((slot) => slot.from > head) ?? stops[0]
    } else {
      next = stops.filter((slot) => slot.to < head).at(-1) ?? stops.at(-1)
    }
    if (next) jumpTo(view, next.to)
    return true
  }
}

/** Tab: the next slot, wrapping after the last one. */
export const nextMarkSlot = moveBetweenSlots(1)
/** Shift+Tab: the previous slot. */
export const previousMarkSlot = moveBetweenSlots(-1)

/** Puts the cursor in the first slot, as when a document opens. */
export function enterFirstMarkSlot(view: EditorView): void {
  const first = markSlotsOf(view)[0]
  if (first) view.dispatch({ selection: { anchor: first.to } })
}

/**
 * After a failed check: flags the slots to fix and puts the cursor in the
 * first. Returns false when the editor is not in fill mode.
 */
export function showFailedMarkSlots(
  view: EditorView,
  failedLines: readonly FlaggedLineRange[] | null,
): boolean {
  if (!view.state.field(slotField, false)) return false
  view.dispatch({ effects: flagFailedSlots.of(failedLines) })
  const state = view.state.field(slotField)
  const first = state.slots.find((slot) => state.flagged.has(slot.id))
  if (first) jumpTo(view, first.to)
  return true
}

/**
 * Fill mode: the prose is fixed and only the mark slots take input. The
 * cursor lives in the slots, so a learner never has to travel through text
 * they cannot change.
 */
export function markSlots(
  source: MarkdownBlankGuideSource,
  isExternal: (transaction: Transaction) => boolean,
): Extension {
  return [
    slotSource.of(source),
    slotField,
    lock(source, isExternal),
    EditorView.editorAttributes.of({ class: "cm-mark-slot-mode" }),
  ]
}
