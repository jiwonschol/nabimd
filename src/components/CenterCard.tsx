import { ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react"
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import {
  syntaxCheckpointTerms,
  type CheckpointContext,
  type CheckpointHintRow,
  type SyntaxCheckpoint,
} from "../guided/guidedSyntax"
import {
  instructionFor,
  type CheckpointInstruction,
} from "../guided/checkpointInstruction"
import { checkpointShape } from "../guided/checkpointShape"
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

export type { CheckpointInstruction } from "../guided/checkpointInstruction"

/**
 * The sentence above the boxes.
 *
 * The judgment lives in `instructionFor`, which takes a shape and cannot see
 * `canonicalInput`. Every blank joined with nothing between them cannot tell
 * one mark from several, and nine defects came from deciding the sentence
 * from that value; keeping the checkpoint on this side of the call is what
 * stops the next branch from reaching for it again.
 */
export function describeCheckpoint(
  checkpoint: SyntaxCheckpoint,
): CheckpointInstruction {
  return instructionFor(checkpointShape(checkpoint))
}

export type SyntaxReference = {
  name: string
  notation: string
  example: string
}

function visibleMark(value: string): string {
  return value.replace(/ /g, "␠")
}

function titleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

// The Level 2 families this card can now name. The chain below grew one nested
// ternary per family and is left as it stands; new families are looked up here
// first. Each string is Markdown source — the panel renders it — so the hard
// break carries two real trailing spaces, and both table terms share a whole
// table, since one row on its own renders as a paragraph.
const LEVEL_TWO_EXAMPLES: Record<string, string> = {
  "Strikethrough text": "~~Example~~",
  "Bold italic text": "***Example***",
  "Quote inside a quote": "> Example\n> > Example",
  "Syntax-highlighted code block": "```js\nlet example = 1\n```",
  "Line break": "First line  \nSecond line",
  "Table row": "Fruit | Count\n--- | ---\nApples | 3",
  "Column headers": "Fruit | Count\n--- | ---\nApples | 3",
  "Checkbox item": "- [ ] Example",
  "Checked-off item": "- [x] Example",
}

export function buildSyntaxReference(
  checkpoint: SyntaxCheckpoint,
): SyntaxReference {
  const groups = inputSegments(checkpoint).map((segment) => segment.value)
  const terms = syntaxCheckpointTerms(checkpoint)
  const instruction = describeCheckpoint(checkpoint)
  const term = instruction.term
  const hasInlineCode = groups.some((value) => value.startsWith("`"))
  const hasLink = groups.some((value) => value.startsWith("["))
  const isBullet = term === "bullet item"
  const isNumbered = term === "numbered step"
  const isBold = term === "bold text"
  // `syntaxCheckpointTerms` names each blank on its own, so it splits families
  // whose marks arrive in more than one group: a checkbox reads as "bullet
  // item + link" because `[ ]` starts with a bracket, and a fence that asks
  // for its language reads as "fenced code block + Markdown mark".
  // `describeCheckpoint` sees the whole checkpoint and knows the family, so
  // where it names one of these it wins over the per-group join.
  const ownFamily = LEVEL_TWO_EXAMPLES[titleCase(term)]
  const name =
    ownFamily !== undefined
      ? titleCase(term)
      : terms.length > 1
      ? terms.map(titleCase).join(" + ")
      : isBullet && hasInlineCode
        ? "Bullet item with inline code"
        : isNumbered && hasInlineCode
          ? "Numbered step with inline code"
          : isBold && hasLink
            ? "Bold link"
            : term === "structure"
              ? "Markdown structure"
              : titleCase(term)
  const headingDepth = /^level (\d) heading$/.exec(term)?.[1]
  const setextDepth = /^level (\d) Setext heading$/.exec(term)?.[1]
  const example =
    ownFamily !== undefined
      ? ownFamily
      : terms.length > 1
      ? checkpoint.segments.map((segment) => segment.value).join("")
      : setextDepth
        ? `Example\n${setextDepth === "1" ? "=======" : "-------"}`
        : headingDepth
          ? `${"#".repeat(Number(headingDepth))} Example`
          : name === "Section break"
            ? "Before\n\n---\n\nAfter"
            : name.startsWith("Bullet item")
              ? hasInlineCode
                ? "- `Example`"
                : "- Example"
              : name.startsWith("Numbered step")
                ? hasInlineCode
                  ? "1. `Example`"
                  : "1. Example"
                : name === "Block quote"
                  ? "> Example"
                  : name === "Fenced code block"
                    ? "```\nExample\n```"
                    : name === "Italic text"
                      ? "*Example*"
                      : name === "Bold text"
                        ? "**Example**"
                        : name === "Bold link"
                          ? "**[Example](https://example.com)**"
                          : name === "Image"
                            ? "![Example](image.png)"
                            : name === "Link"
                              ? "[Example](https://example.com)"
                              : name === "Inline code"
                                ? "`Example`"
                                : "Example"

  return {
    name,
    notation: groups.map(visibleMark).join(" … "),
    example,
  }
}

export function CenterCard({
  checkpoint,
  interactive = true,
  slotIndex,
  slotTotal,
  segmentValues,
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
  const checkpointInstruction = describeCheckpoint(checkpoint)
  const syntaxReference = buildSyntaxReference(checkpoint)
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
      {/* The left leaf teaches the current Markdown form. The right leaf keeps
          the complete practice flow together: instruction, Goal context,
          marks, and confirmation. */}
      <div className="center-card__leaf center-card__leaf--read">
        <section
          aria-label="Current Markdown syntax"
          className="syntax-reference"
          role="region"
        >
          <p className="syntax-reference__eyebrow">Now learning</p>
          <p className="syntax-reference__name">{syntaxReference.name}</p>
          <code className="syntax-reference__notation">
            {syntaxReference.notation}
          </code>
          <div className="syntax-reference__example">
            <span>Rendered example</span>
            <RenderedDocumentBody source={syntaxReference.example} />
          </div>
        </section>
      </div>

      <div className="center-card__leaf center-card__leaf--write">
        <header className="center-card__header">
        <div className="center-card__heading">
          {slotTotal > 1 ? (
            <span
              aria-label={`Current problem progress, part ${slotIndex + 1} of ${slotTotal}`}
              aria-live="polite"
              aria-valuemax={slotTotal}
              aria-valuemin={1}
              aria-valuenow={slotIndex + 1}
              className="center-card__slot"
              role="progressbar"
            >
              Part {slotIndex + 1} of {slotTotal}
            </span>
          ) : null}
          <h2 className="center-card__instruction">
            {checkpointInstruction.prefix}
            <strong>{checkpointInstruction.term}</strong>
            {checkpointInstruction.suffix}
          </h2>
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
        {/* The slot controls change which mark the entry line shows, so they sit
          on the writing leaf with that line (issue #140) — the same reasoning
          that keeps Check beside its input. They come before the line in the
          DOM: tabbing reaches "which mark" before the marks themselves. */}
      <div className="center-card__controls">
        <button
          aria-keyshortcuts="ArrowUp"
          aria-label="Previous part"
          className="center-card__control"
          data-tooltip="Previous part (↑)"
          disabled={!interactive || !canGoToPreviousSlot}
          onClick={onPreviousSlot}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={17} strokeWidth={1.8} />
        </button>
        <button
          aria-keyshortcuts="ArrowDown"
          aria-label="Next part"
          className="center-card__control"
          data-tooltip="Next part (↓)"
          disabled={!interactive || !canGoToNextSlot}
          onClick={onNextSlot}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </button>
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
          // Two syntax groups that touch (`> ` then `**`) would read as one
          // long mark run. A quiet slash marks the boundary; it is punctuation
          // the card draws, never a character the learner types.
          const separator =
            checkpoint.segments[segmentIndex - 1]?.kind === "input" ? (
              <span aria-hidden="true" className="center-card__group-divider">
                /
              </span>
            ) : null

          return (
            <Fragment key={segmentIndex}>
              {separator}
              <span className="center-card__boxgroup">
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
                  {value[box] === " " ||
                  (value[box] === undefined && segment.value[box] === " ") ? (
                    // A hard-break card has no visible glyph otherwise. Its
                    // empty boxes preview the book's middle-dot convention;
                    // a typed space uses the same glyph at full hint weight.
                    <span
                      className={`center-card__box-space${
                        value[box] === undefined
                          ? " center-card__box-space--placeholder"
                          : ""
                      }`}
                    >
                      ·
                    </span>
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
                readOnly={!interactive}
                spellCheck={false}
                type="text"
                value={value}
              />
              </span>
            </Fragment>
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
      </div>
    </section>
  )
}
