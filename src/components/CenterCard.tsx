import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import type { SyntaxCheckpoint } from "../guided/guidedSyntax"
import {
  inputSegments,
  type CenterCardSlotVerdict,
} from "../guided/useCenterCard"

type CenterCardProps = {
  checkpoint: SyntaxCheckpoint
  slotIndex: number
  slotTotal: number
  segmentValues: readonly string[]
  verdict: CenterCardSlotVerdict
  canGoToPreviousSlot: boolean
  canGoToNextSlot: boolean
  onEditSegment: (index: number, value: string) => void
  onPreviousSlot: () => void
  onNextSlot: () => void
  onPeekHint: () => void
  onSubmit: () => void
}

export function describeCheckpoint(checkpoint: SyntaxCheckpoint): string {
  const mark = checkpoint.canonicalInput.trim()
  const lockedBreak = checkpoint.segments.some(
    (segment) => segment.kind === "locked" && segment.value.includes("\n"),
  )

  if (/^(?:=+|-+)$/.test(mark) && lockedBreak) {
    // Setext: equals signs make an H1, dashes an H2.
    return `Underline the ${mark.startsWith("=") ? "H1" : "H2"} heading`
  }
  if (mark.startsWith("#")) {
    // The rendered Goal cannot teach depth by eye alone, so the exercise
    // names it outright: writing the right Hn is the skill being asked for.
    const depth = mark.match(/^#+/)?.[0]?.length ?? 1
    return `Give this line its H${depth} heading marks`
  }
  if (["---", "***", "___"].includes(mark)) return "Add the section divider"
  if (/^[-+*]\s*$/.test(mark) || /^[-+*]\s+\S?/.test(checkpoint.canonicalInput)) {
    return "Mark this line as a bullet item"
  }
  if (/^\d+[.)]/.test(mark)) return "Number this step"
  if (mark.startsWith(">")) return "Quote this line"
  if (mark.startsWith("```") || mark.startsWith("~~~")) {
    return "Fence the code block"
  }
  if (mark.startsWith("**") || mark.startsWith("__")) return "Bold the phrase"
  if (mark.startsWith("![")) return "Build the image marks"
  if (mark.startsWith("[")) return "Build the link marks"
  if (mark.startsWith("`")) return "Wrap the code in backticks"
  if (mark.startsWith("*") || mark.startsWith("_")) {
    return "Italicize the phrase"
  }
  return "Add the Markdown marks"
}

export function CenterCard({
  checkpoint,
  slotIndex,
  slotTotal,
  segmentValues,
  verdict,
  canGoToPreviousSlot,
  canGoToNextSlot,
  onEditSegment,
  onPreviousSlot,
  onNextSlot,
  onPeekHint,
  onSubmit,
}: CenterCardProps) {
  const groups = inputSegments(checkpoint)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedGroup, setFocusedGroup] = useState<number | null>(null)

  useEffect(() => {
    const firstOpen = segmentValues.findIndex(
      (value, index) => value.length < (groups[index]?.value.length ?? 0),
    )
    inputRefs.current[firstOpen < 0 ? 0 : firstOpen]?.focus()
    // Focus follows the slot, not every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkpoint.id, slotIndex])

  useEffect(() => {
    // A rejected Enter empties the boxes; typing restarts at the first box.
    if (verdict === "retry") inputRefs.current[0]?.focus()
  }, [verdict])

  const editGroup = (index: number, raw: string) => {
    // Fast typing (or a paste) can hand one group more characters than it
    // holds; the overflow spills into the following groups instead of being
    // dropped.
    let rest = raw
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
    if (event.key === "Enter") {
      event.preventDefault()
      onSubmit()
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
    <section aria-label="Syntax input" className="center-card">
      <header className="center-card__header">
        <div className="center-card__heading">
          <span className="center-card__slot">
            Mark {Math.min(slotIndex + 1, slotTotal)} of {slotTotal}
          </span>
          <h3 className="center-card__instruction">
            {describeCheckpoint(checkpoint)}
          </h3>
        </div>
        <div className="center-card__controls">
          <button
            aria-keyshortcuts="ArrowUp"
            aria-label="Previous mark"
            className="center-card__control"
            data-tooltip="Previous mark (↑)"
            disabled={!canGoToPreviousSlot}
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
            disabled={!canGoToNextSlot}
            onClick={onNextSlot}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
          <button
            aria-keyshortcuts="Alt+H"
            aria-label="Peek at the hint"
            className="center-card__control"
            data-tooltip="Hint (Alt+H)"
            onClick={onPeekHint}
            type="button"
          >
            <Lightbulb aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </div>
      </header>

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
                aria-label={`Marks ${index + 1} of ${groups.length}`}
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
                spellCheck={false}
                type="text"
                value={value}
              />
            </span>
          )
        })}
      </div>

      {verdict === "retry" ? (
        <p className="center-card__verdict" role="status">
          <strong>Try again</strong> — that is not the mark this spot needs.
          Compare the Goal line, or open the Hint.
        </p>
      ) : (
        <p className="center-card__hint">
          Type the Markdown marks into the boxes, then press Enter.
        </p>
      )}
    </section>
  )
}
