import { ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react"
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import type {
  CheckpointContext,
  CheckpointHintRow,
  SyntaxCheckpoint,
} from "../guided/guidedSyntax"
import {
  inputSegments,
  type CenterCardSlotVerdict,
} from "../guided/useCenterCard"
import { RenderedDocumentBody } from "./RenderedDocument"

type CenterCardProps = {
  checkpoint: SyntaxCheckpoint
  interactive?: boolean
  slotIndex: number
  slotTotal: number
  segmentValues: readonly string[]
  mirroredSegmentIndexes: readonly number[]
  verdict: CenterCardSlotVerdict
  context: CheckpointContext
  hintOpen: boolean
  hintRows: readonly CheckpointHintRow[]
  focusRequest: number
  canGoToPreviousSlot: boolean
  canGoToNextSlot: boolean
  onEditSegment: (index: number, value: string) => void
  onPreviousSlot: () => void
  onNextSlot: () => void
  onToggleHint: () => void
  onCloseHint: () => void
  onSubmit: () => void
}

export type CheckpointInstruction = {
  prefix: string
  term: string
  suffix: string
}

function instruction(
  prefix: string,
  term: string,
  suffix = ".",
): CheckpointInstruction {
  return { prefix, term, suffix }
}

export function describeCheckpoint(
  checkpoint: SyntaxCheckpoint,
): CheckpointInstruction {
  const mark = checkpoint.canonicalInput.trim()
  const lockedBreak = checkpoint.segments.some(
    (segment) => segment.kind === "locked" && segment.value.includes("\n"),
  )

  if (/^(?:=+|-+)$/.test(mark) && lockedBreak) {
    return instruction(
      "Type the Markdown underline for a ",
      `level ${mark.startsWith("=") ? "1" : "2"} Setext heading`,
    )
  }
  if (mark.startsWith("#")) {
    const depth = mark.match(/^#+/)?.[0]?.length ?? 1
    return instruction(
      "Type the Markdown marks and space for a ",
      `level ${depth} heading`,
    )
  }
  if (["---", "***", "___"].includes(mark)) {
    return instruction("Type the Markdown marks for a ", "section break")
  }
  if (/^[-+*]\s*$/.test(mark) || /^[-+*]\s+\S?/.test(checkpoint.canonicalInput)) {
    return instruction("Type the Markdown mark and space for a ", "bullet item")
  }
  if (/^\d+[.)]/.test(mark)) {
    return instruction(
      "Type the Markdown number, delimiter, and space for a ",
      "numbered step",
    )
  }
  if (mark.startsWith(">")) {
    return instruction("Type the Markdown mark and space for a ", "block quote")
  }
  if (mark.startsWith("```") || mark.startsWith("~~~")) {
    return instruction(
      "Type the opening and closing Markdown marks for a ",
      "fenced code block",
    )
  }
  if (mark === "**" || mark === "__") {
    return instruction("Wrap the phrase in Markdown marks for ", "italic text")
  }
  if (mark.startsWith("**") || mark.startsWith("__")) {
    return instruction("Wrap the phrase in Markdown marks for ", "bold text")
  }
  if (mark.startsWith("![")) {
    return instruction("Add the Markdown punctuation for an ", "image")
  }
  if (mark.startsWith("[")) {
    return instruction("Add the Markdown punctuation for a ", "link")
  }
  if (mark.startsWith("`")) {
    return instruction("Wrap the phrase in Markdown marks for ", "inline code")
  }
  if (mark.startsWith("*") || mark.startsWith("_")) {
    return instruction("Wrap the phrase in Markdown marks for ", "italic text")
  }
  return instruction("Type the Markdown marks for this ", "structure")
}

export function CenterCard({
  checkpoint,
  interactive = true,
  slotIndex,
  slotTotal,
  segmentValues,
  mirroredSegmentIndexes,
  verdict,
  context,
  hintOpen,
  hintRows,
  focusRequest,
  canGoToPreviousSlot,
  canGoToNextSlot,
  onEditSegment,
  onPreviousSlot,
  onNextSlot,
  onToggleHint,
  onCloseHint,
  onSubmit,
}: CenterCardProps) {
  const groups = inputSegments(checkpoint)
  const mirroredSegments = new Set(mirroredSegmentIndexes)
  const editableGroupIndexes = groups
    .map((_, index) => index)
    .filter((index) => !mirroredSegments.has(index))
  const checkpointInstruction = describeCheckpoint(checkpoint)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedGroup, setFocusedGroup] = useState<number | null>(null)
  const hintId = useId()

  useEffect(() => {
    if (!interactive) return
    const firstOpen = segmentValues.findIndex(
      (value, index) => value.length < (groups[index]?.value.length ?? 0),
    )
    inputRefs.current[firstOpen < 0 ? 0 : firstOpen]?.focus()
    // Focus follows the slot, not every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint.id, interactive, slotIndex])

  useEffect(() => {
    // A rejected Enter empties the boxes; typing restarts at the first box.
    if (interactive && verdict === "retry") inputRefs.current[0]?.focus()
  }, [interactive, verdict])

  useEffect(() => {
    if (interactive && focusRequest > 0) inputRefs.current[0]?.focus()
  }, [focusRequest, interactive])

  const editGroup = (index: number, raw: string) => {
    // macOS Korean input sources type ₩ on the backtick key, which would
    // lock Korean learners out of every code slot. The won sign is never a
    // Markdown mark, so it safely normalizes to a backtick (and the box
    // shows the real mark).
    // Fast typing (or a paste) can hand one group more characters than it
    // holds; the overflow spills into the following groups instead of being
    // dropped.
    let rest = raw.replace(/₩/g, "`")
    let cursor = index
    while (cursor < groups.length) {
      const capacity = groups[cursor]?.value.length ?? 0
      const value = rest.slice(0, capacity)
      onEditSegment(cursor, value)
      rest = rest.slice(capacity)
      if (rest.length === 0) {
        if (value.length >= capacity && cursor < groups.length - 1) {
          inputRefs.current[cursor + 1]?.focus()
        }
        break
      }
      cursor += 1
    }
    if (cursor > index) inputRefs.current[Math.min(cursor, groups.length - 1)]?.focus()
  }

  const keyDownInGroup = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!interactive) return
    if (event.key === "Enter") {
      // An Enter that finishes an IME composition is not a submission.
      if (event.nativeEvent.isComposing) return
      event.preventDefault()
      onSubmit()
      return
    }
    if (event.key === "?" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      onToggleHint()
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      onPreviousSlot()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      onNextSlot()
      return
    }
    if (
      event.key === "Backspace" &&
      (segmentValues[index] ?? "") === "" &&
      index > 0
    ) {
      event.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
  }

  let groupIndex = -1

  return (
    <section aria-label="Markdown syntax practice" className="center-card">
      <header className="center-card__header">
        <div className="center-card__heading">
          <span className="center-card__slot">
            Mark {Math.min(slotIndex + 1, slotTotal)} of {slotTotal}
          </span>
          <h2 className="center-card__instruction">
            {checkpointInstruction.prefix}
            <strong>{checkpointInstruction.term}</strong>
            {checkpointInstruction.suffix}
          </h2>
        </div>
        <div className="center-card__controls">
          <button
            aria-keyshortcuts="ArrowUp"
            aria-label="Previous mark"
            className="center-card__control"
            data-tooltip="Previous mark (↑)"
            disabled={!interactive || !canGoToPreviousSlot}
            onClick={onPreviousSlot}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
          <button
            aria-keyshortcuts="ArrowDown"
            aria-label="Next mark"
            className="center-card__control"
            data-tooltip="Next mark (↓)"
            disabled={!interactive || !canGoToNextSlot}
            onClick={onNextSlot}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div aria-label="Rendered context" className="center-card__context">
        {context.before ? (
          <div className="center-card__context-row center-card__context-row--quiet">
            <RenderedDocumentBody source={context.before} />
          </div>
        ) : null}
        <div className="center-card__context-row center-card__context-row--current">
          <RenderedDocumentBody source={context.current} />
        </div>
        {context.after ? (
          <div className="center-card__context-row center-card__context-row--quiet">
            <RenderedDocumentBody source={context.after} />
          </div>
        ) : null}
      </div>

      <div className="center-card__line" data-verdict={verdict}>
        {checkpoint.segments.map((segment, segmentIndex) => {
          if (segment.kind === "locked") {
            return (
              <span className="center-card__locked" key={segmentIndex}>
                {segment.value}
              </span>
            )
          }

          groupIndex += 1
          const index = groupIndex
          const value = segmentValues[index] ?? ""
          const capacity = segment.value.length
          const caretAt = focusedGroup === index ? value.length : -1

          if (mirroredSegments.has(index)) {
            return (
              <span
                aria-label="Mirrored closing mark"
                className="center-card__mirrored-mark"
                data-empty={value === ""}
                key={segmentIndex}
              >
                {value}
              </span>
            )
          }

          const editablePosition = editableGroupIndexes.indexOf(index)
          return (
            <span className="center-card__boxgroup" key={segmentIndex}>
              {Array.from({ length: capacity }, (_, box) => (
                <span
                  aria-hidden="true"
                  className={`center-card__box${
                    box === caretAt || (caretAt >= capacity && box === capacity - 1)
                      ? " center-card__box--active"
                      : ""
                  }`}
                  key={box}
                >
                  {value[box] === " " ? (
                    // A typed space stays visible in its box, using the same
                    // middle-dot convention as the book's invisible marks.
                    <span className="center-card__box-space">·</span>
                  ) : (
                    value[box] ?? ""
                  )}
                </span>
              ))}
              <input
                aria-label={`Marks ${editablePosition + 1} of ${editableGroupIndexes.length}`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="center-card__boxinput"
                onBlur={() => setFocusedGroup((focused) =>
                  focused === index ? null : focused,
                )}
                onChange={(event) => editGroup(index, event.target.value)}
                onFocus={() => setFocusedGroup(index)}
                onKeyDown={(event) => keyDownInGroup(event, index)}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                readOnly={!interactive}
                spellCheck={false}
                type="text"
                value={value}
              />
            </span>
          )
        })}
      </div>

      <div className="center-card__actions">
        <button
          aria-label="Hint"
          aria-controls={hintId}
          aria-expanded={hintOpen}
          className="center-card__hint-button"
          disabled={!interactive}
          onClick={onToggleHint}
          type="button"
        >
          <Lightbulb aria-hidden="true" size={18} strokeWidth={1.7} />
          Hint
        </button>
        {verdict === "retry" ? (
          <p className="center-card__verdict" role="status">
            Try again
          </p>
        ) : null}
        <button
          aria-keyshortcuts="Enter"
          aria-label="Check marks"
          className="center-card__submit"
          disabled={!interactive}
          onClick={onSubmit}
          type="button"
        >
          Enter <span aria-hidden="true">↵</span>
        </button>
      </div>

      {hintOpen ? (
        <section
          aria-label="Exact Markdown hint"
          className="center-card__exact-hint"
          id={hintId}
          role="region"
        >
          <div className="center-card__exact-hint-heading">
            <span>Use either accepted form</span>
            <button
              aria-label="Close hint"
              className="center-card__hint-close"
              disabled={!interactive}
              onClick={onCloseHint}
              type="button"
            >
              <X aria-hidden="true" size={17} strokeWidth={1.8} />
            </button>
          </div>
          <ul className="center-card__hint-list">
            {hintRows.map((row) => (
              <li className="center-card__hint-row" key={`${row.input}:${row.source}`}>
                <span aria-label={`Type ${row.input}`} className="center-card__keycaps">
                  {Array.from(row.input).map((character, index) => (
                    <kbd key={`${character}:${index}`}>
                      {character === " " ? "Space" : character}
                    </kbd>
                  ))}
                </span>
                <code>{row.source}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
