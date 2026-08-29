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

// Small counts read as words in the rest of the card's copy ("two spaces"),
// and a blank wide enough to need a numeral is not a shape the content ever
// asks for — but the sentence still has to be able to say it.
function spelledCount(count: number): string {
  return ["zero", "one", "two", "three", "four", "five"][count] ?? String(count)
}

export function describeCheckpoint(
  checkpoint: SyntaxCheckpoint,
): CheckpointInstruction {
  const mark = checkpoint.canonicalInput.trim()
  const lockedBreak = checkpoint.segments.some(
    (segment) => segment.kind === "locked" && segment.value.includes("\n"),
  )
  // Two blanks that touch, with nothing between them. Marks that nest are
  // adjacent; marks that merely repeat down a card have the line's prose
  // between them, and the two join to the same value.
  const touchingInputs = (first: string, second: string): boolean =>
    checkpoint.segments.some(
      (segment, index) =>
        segment.kind === "input" &&
        segment.value === first &&
        checkpoint.segments[index + 1]?.kind === "input" &&
        checkpoint.segments[index + 1]?.value === second,
    )
  // #176 gathers every blank of one family onto a single card, so a sentence
  // that says "a bullet item" can be standing in front of three of them.
  const markerCount = (pattern: RegExp): number =>
    checkpoint.segments.filter(
      (segment) => segment.kind === "input" && pattern.test(segment.value),
    ).length
  const lockedValues = checkpoint.segments
    .filter((segment) => segment.kind === "locked")
    .map((segment) => segment.value)

  // A hard line break is spaces and nothing else, so trimming erases the only
  // mark there is. It has to be read before `mark` is consulted, and it is the
  // one family whose instruction names an action instead of a mark: there is
  // no mark to name. The boxes already show what was typed (a space renders as
  // a middle dot), so the sentence only has to say how many and why — and the
  // count comes from the blank, since two is the minimum a break needs but not
  // the only width a source can carry.
  const spaceRuns = checkpoint.segments.filter(
    (segment) => segment.kind === "input" && /^ {2,}$/.test(segment.value),
  )
  const everyBlankIsSpaces =
    spaceRuns.length > 0 &&
    spaceRuns.length ===
      checkpoint.segments.filter((segment) => segment.kind === "input").length
  if (everyBlankIsSpaces) {
    // #176 gathers several breaks onto one card, and their spaces join. The
    // count has to come from one blank, not from all of them added up: three
    // lines each ending in two spaces is not one line ending in six.
    const widths = new Set(spaceRuns.map((segment) => segment.value.length))
    if (spaceRuns.length === 1) {
      return instruction(
        `End the line with ${spelledCount(spaceRuns[0]!.value.length)} spaces to force a `,
        "line break",
      )
    }
    return widths.size === 1
      ? instruction(
          `End each line with ${spelledCount(spaceRuns[0]!.value.length)} spaces to force a `,
          "line break",
        )
      : // Lines asking for different widths have no one number to name, and
        // the boxes already show how many each one wants.
        instruction("Fill the spaces at the end of each line to force a ", "line break")
  }

  // Table rows are the one family the mark cannot name on its own: a header
  // row and the divider under it can both come out as nothing but bars. So the
  // bar has to be found in the checkpoint rather than in the mark — but only
  // where it is grammar. A bar sitting in locked prose ("- Compare A | B") is
  // a character in a sentence, and reading it as a table turned a bullet item
  // into a table row. A bar counts when the learner types it, or when it is in
  // a locked run that holds nothing but table punctuation, which is what keeps
  // a divider whose dashes are the blank from reading as a Setext underline.
  const barIsTyped = checkpoint.segments.some(
    (segment) => segment.kind === "input" && segment.value.includes("|"),
  )
  // A divider can hide its bars in locked text and blank only the dashes, so
  // locked bars have to count — but only when the learner is typing dash runs.
  // A bullet whose entire text is punctuation ("- |", "- :|:") also has a
  // locked bar and a mark made of table characters; what it does not have is a
  // learner typing table syntax.
  const dashRunsAreTyped = checkpoint.segments.every(
    (segment) =>
      segment.kind === "locked" || /^:?-{3,}:?$/.test(segment.value.trim()),
  )
  const barIsLockedPunctuation = checkpoint.segments.some(
    (segment) =>
      segment.kind === "locked" &&
      segment.value.includes("|") &&
      /^[|\s:-]+$/.test(segment.value),
  )
  const inTableRow =
    /^[|\s:-]+$/.test(mark) &&
    (barIsTyped || (barIsLockedPunctuation && dashRunsAreTyped)) &&
    // A Setext underline under a heading that happens to contain a bar is a
    // dash run with a locked newline; that shape stays a heading.
    !(lockedBreak && /^(?:=+|-+)$/.test(mark))
  if (inTableRow) {
    const barsTyped = (mark.match(/\|/g) ?? []).length
    const dashesTyped = /-{3,}/.test(mark)
    const dividerRow =
      dashesTyped ||
      lockedValues.some((value) => /^\s*:?-{3,}:?\s*$/.test(value))
    if (dividerRow) {
      // #157 designs Level 2 tables with no outer bars, so a two-column row
      // asks for a single bar. Noun and verb both have to follow that count.
      const typed =
        dashesTyped && barsTyped > 1
          ? "bars and dashes that make"
          : dashesTyped && barsTyped === 1
            ? "bar and dashes that make"
            : dashesTyped
              ? "dashes that make"
              : barsTyped > 1
                ? "bars that make"
                : "bar that makes"
      return instruction(
        `Type the Markdown ${typed} the row above the `,
        "column headers",
      )
    }
    return instruction(
      `Type the Markdown ${barsTyped > 1 ? "bars that separate" : "bar that separates"} the cells of this `,
      "table row",
    )
  }
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
  // #157 fixes the checkbox contract to an unordered item, `[- ][[ ]]`, and the
  // curriculum has no ordered checkbox. An ordered one would fall through to
  // the numbered-step sentence; that is a shape to open when content asks for
  // it, not a case to guess at now.
  // A checkbox is a bracket blank right behind a bullet marker. Matching the
  // joined mark instead only ever saw one item, so a card gathering two of
  // them fell through to the bullet sentence.
  const taskBoxes = checkpoint.segments.filter(
    (segment, index) =>
      segment.kind === "input" &&
      /^\[[ xX]?\]$/.test(segment.value) &&
      checkpoint.segments[index - 1]?.kind === "input" &&
      /^ {0,3}[-+*][\t ]+$/.test(checkpoint.segments[index - 1]?.value ?? ""),
  )
  if (taskBoxes.length > 0) {
    const article = taskBoxes.length > 1 ? "each " : "a "
    // A card mixing done and not-done items is taught as the plain checkbox;
    // only an all-checked card is about the checked form.
    const allChecked = taskBoxes.every((segment) => /[xX]/.test(segment.value))
    return instruction(
      `Type the Markdown mark and brackets for ${article}`,
      allChecked ? "checked-off item" : "checkbox item",
    )
  }
  // One line can carry two syntaxes. The L3/L4/L5 content writes an exact name
  // as inline code inside a list item, so the blanks are a list marker and a
  // pair of backticks — and the marker branches below decide from the joined
  // value, where `- ` and two backticks read as "- ``". They matched the
  // bullet and said nothing about the other blanks; on the L5 readme cards
  // that left four of six unexplained. Which kinds are present has to be
  // counted from the segments, the same way the marker count already is.
  // Splitting the card into one per syntax would be the better answer, but the
  // two share a line, so either half would show the other half's answer in its
  // locked prose. That needs the locked-prose contract reopened (#177); until
  // then the sentence names both, and the emphasis goes on the backticks
  // because a learner who reached this card has already been taught the marker.
  const inlineCodeRuns = checkpoint.segments.filter(
    // One or two backticks, never a fence: three or more is a code block, and
    // its own branch below teaches it.
    (segment) => segment.kind === "input" && /^`{1,2}$/.test(segment.value),
  ).length
  const bulletMarkers = markerCount(/^ {0,3}[-+*][\t ]+$/)
  const stepMarkers = markerCount(/^ {0,3}\d+[.)][\t ]+$/)
  // Inline code wraps, so it takes two blanks. A single backtick blank is some
  // other shape and keeps the marker's own sentence.
  if (inlineCodeRuns >= 2 && bulletMarkers + stepMarkers > 0) {
    // The two syntaxes are counted separately. Sharing one count read the L5
    // cards — two steps and two code spans — as plural on the marker and
    // singular on the code, which is the same miss as the 158: a number the
    // sentence never took from the card.
    const markers = bulletMarkers + stepMarkers
    const codeSpans = inlineCodeRuns / 2
    // An ordered marker is a number, a delimiter and a space; the delimiter is
    // a blank of its own and `)` is as valid as `.`, so the sentence names it
    // rather than assuming the dot the content happens to use today.
    const lead =
      stepMarkers > 0
        ? markers > 1
          ? "Type each step number, delimiter, and space"
          : "Type the step number, delimiter, and space"
        : markers > 1
          ? "Type each bullet mark and space"
          : "Type the bullet mark and space"
    const wrap =
      codeSpans > 1 ? "then wrap each phrase in " : "then wrap the phrase in "
    return instruction(`${lead}, ${wrap}`, "inline code", " marks.")
  }
  if (/^[-+*]\s*$/.test(mark) || /^[-+*]\s+\S?/.test(checkpoint.canonicalInput)) {
    const bullets = markerCount(/^ {0,3}[-+*][\t ]+$/)
    return instruction(
      `Type the Markdown mark and space for ${bullets > 1 ? "each " : "a "}`,
      "bullet item",
    )
  }
  if (/^\d+[.)]/.test(mark)) {
    const steps = markerCount(/^ {0,3}\d+[.)][\t ]+$/)
    return instruction(
      `Type the Markdown number, delimiter, and space for ${steps > 1 ? "each " : "a "}`,
      "numbered step",
    )
  }
  if (mark.startsWith(">")) {
    const markers = markerCount(/^ {0,3}>[\t ]*$/)
    // A quote inside a quote puts its two markers side by side. Two quoted
    // lines gathered onto one card join to the same `> > ` but have the first
    // line's prose between them, and they are one block quote, not two levels.
    const nested =
      markers > 1 &&
      checkpoint.segments.some(
        (segment, index) =>
          segment.kind === "input" &&
          checkpoint.segments[index + 1]?.kind === "input" &&
          /^ {0,3}>[\t ]*$/.test(segment.value) &&
          /^ {0,3}>[\t ]*$/.test(
            checkpoint.segments[index + 1]?.value ?? "",
          ),
      )
    if (nested) {
      // `> > ` and the compact `>>` are both valid, and they ask for a
      // different number of spaces. The sentence counts what the blank holds.
      const spaces = (checkpoint.canonicalInput.match(/ /g) ?? []).length
      return instruction(
        spaces === 0
          ? "Type the Markdown marks for a "
          : spaces === 1
            ? "Type the Markdown marks and space for a "
            : "Type the Markdown marks and spaces for a ",
        "quote inside a quote",
      )
    }
    return instruction(
      `Type the Markdown mark and space for ${markers > 1 ? "each line of this " : "a "}`,
      "block quote",
    )
  }
  // Strikethrough is an even run of two-tilde delimiters wrapping a phrase.
  // Deciding it from the joined value instead called an unclosed four-tilde
  // code fence ("~~~~\ncode") strikethrough: both join to `~~~~`. A fence's
  // delimiter is never exactly two tildes, so the shape separates them and an
  // unexpected shape falls through to the fence sentence rather than this one.
  const inputValues = checkpoint.segments
    .filter((segment) => segment.kind === "input")
    .map((segment) => segment.value)
  if (
    inputValues.length >= 2 &&
    inputValues.length % 2 === 0 &&
    inputValues.every((value) => value === "~~")
  ) {
    return instruction(
      "Wrap the phrase in Markdown marks for ",
      "strikethrough text",
    )
  }
  if (mark.startsWith("```") || mark.startsWith("~~~")) {
    // A fence that also asks for the language name is teaching the language,
    // not the fence, so it gets its own sentence.
    const asksForLanguage = checkpoint.segments.some(
      (segment) =>
        segment.kind === "input" && /^[A-Za-z][\w+#-]*$/.test(segment.value),
    )
    if (asksForLanguage) {
      return instruction(
        "Type the Markdown marks and the language name for a ",
        "syntax-highlighted code block",
      )
    }
    return instruction(
      "Type the opening and closing Markdown marks for a ",
      "fenced code block",
    )
  }
  if (mark === "**" || mark === "__") {
    return instruction("Wrap the phrase in Markdown marks for ", "italic text")
  }
  // Bold italic is a strong wrapper nested inside an emphasis one. Deciding it
  // from the joined six delimiters instead claimed `**bold** *italic*` and
  // `*one* *two* *three*` were bold italic: separate spans on one line
  // concatenate to the same value. The nesting has to be read from the order
  // of the groups — the contract shape blanks the three marks together, and
  // today's engine splits them into an emphasis mark wrapping a strong pair.
  // In the split shape the two opening marks touch, and so do the two closing
  // ones. Counting the four values alone also accepted `*This is **very**
  // good*` — bold inside part of an italic span, which has the same four
  // values with prose between them — and told the learner the whole phrase
  // was bold italic.
  const boldItalicNesting =
    (inputValues.length === 2 &&
      inputValues.every((value) => value === "***" || value === "___")) ||
    (inputValues.length === 4 &&
      (inputValues[0] === "*" || inputValues[0] === "_") &&
      inputValues[0] === inputValues[3] &&
      (inputValues[1] === "**" || inputValues[1] === "__") &&
      inputValues[1] === inputValues[2] &&
      touchingInputs(inputValues[0], inputValues[1]) &&
      touchingInputs(inputValues[2], inputValues[3]))
  if (boldItalicNesting) {
    return instruction(
      "Wrap the phrase in Markdown marks for ",
      "bold italic text",
    )
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
          {/* `Step x of 5` in the top bar is the only progress label: the
              marks inside one card never get a second counter. */}
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
