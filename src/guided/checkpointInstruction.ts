import {
  countInputs,
  everyInput,
  firstTouchingMatch,
  inputsBehind,
  touchingPairAt,
  type CheckpointShape,
} from "./checkpointShape"

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

const BULLET_MARKER = /^ {0,3}[-+*][\t ]+$/
const STEP_MARKER = /^ {0,3}\d+[.)][\t ]+$/
const QUOTE_MARKER = /^ {0,3}>[\t ]*$/
const TASK_BOX = /^\[[ xX]?\]$/
// The deriver puts the line's ending inside the blank when the card carries
// something after it, so the run may end in a newline.
const SPACE_RUN = /^ {2,}\n?$/
const TABLE_PUNCTUATION = /^[|\s:-]*$/
const DIVIDER_CELL = /^\s*:?-+:?\s*$/
const FENCE = /^(?:`{3,}|~{3,})/
const LANGUAGE_NAME = /^[A-Za-z][\w+#-]*$/
const THEMATIC_BREAK = /^(?:-{3,}|\*{3,}|_{3,})$/

/**
 * The sentence above the boxes.
 *
 * It takes a shape and never a checkpoint, so it cannot reach the joined
 * `canonicalInput`. That is the whole point of the split: every defect this
 * function has had came from a value that had already thrown away the
 * boundaries between blanks, and a branch that cannot see the value cannot
 * make that mistake again.
 */
export function instructionFor(shape: CheckpointShape): CheckpointInstruction {
  const { inputs } = shape

  // A hard line break is spaces and nothing else, so there is no mark to name
  // and the sentence names an action instead. It has to be decided before any
  // branch that inspects mark characters, because a run of spaces has none.
  // Only the newline comes off: the spaces *are* trailing whitespace, so
  // `trimEnd` would leave nothing to count and every card would ask for zero.
  const spaceRuns = inputs
    .filter((value) => SPACE_RUN.test(value))
    .map((value) => value.replace(/\n$/, ""))
  if (spaceRuns.length > 0 && spaceRuns.length === inputs.length) {
    // #176 gathers several breaks onto one card. The count has to come from
    // one blank, not from all of them added up: three lines each ending in two
    // spaces is not one line ending in six.
    const widths = new Set(spaceRuns.map((value) => value.length))
    if (spaceRuns.length === 1) {
      return instruction(
        `End the line with ${spelledCount(spaceRuns[0]!.length)} spaces to force a `,
        "line break",
      )
    }
    return widths.size === 1
      ? instruction(
          `End each line with ${spelledCount(spaceRuns[0]!.length)} spaces to force a `,
          "line break",
        )
      : // Lines asking for different widths have no one number to name, and
        // the boxes already show how many each one wants.
        instruction("Fill the spaces at the end of each line to force a ", "line break")
  }

  // Table rows are the one family the marks cannot name on their own: a header
  // row and the divider under it can both be nothing but bars. A bar counts
  // when the learner types it, or when it sits in a locked run holding nothing
  // but table punctuation — which is what keeps a divider whose dashes are the
  // blank from reading as a Setext underline. A bar inside locked prose
  // ("- Compare A | B") is a character in a sentence, not grammar.
  const barIsTyped = inputs.some((value) => value.includes("|"))
  const barIsLockedPunctuation = shape.locked.some(
    (value) => value.includes("|") && /^[|\s:-]+$/.test(value),
  )
  // A bullet whose entire text is punctuation ("- |", "- :|:") also has a
  // locked bar and marks made of table characters; what it does not have is a
  // learner typing dash runs.
  // Trailing whitespace on a blank is not part of the mark. The old chain
  // trimmed the value it compared, and dropping that trim quietly narrowed
  // this test and the two below.
  const dashRunsAreTyped = shape.inputs.every((value) => /^:?-{3,}:?$/.test(value.trim()))
  // A Setext underline under a heading that happens to contain a bar is a dash
  // run with a locked newline; that shape stays a heading.
  // A Setext underline and a thematic break are the same dashes. What tells
  // them apart is what sits before them: an underline follows its heading text,
  // a break opens its own block. Counting the blanks instead — one underline,
  // several breaks — was wrong in both directions: `mergeAdjacentSameSyntax`
  // gathers two underlines onto one card, and gathers two breaks too.
  const looksSetext =
    shape.inputs.every((value) => /^(?:=+|-+)$/.test(value.trim())) &&
    inputs.length > 0 &&
    // One clause carries both halves of the question, and it has to: a second
    // `before !== null` alongside this one meant neither could be mutated on
    // its own without the other still refusing, so no destructive run could
    // turn either red. Ending the line says everything — nothing in front
    // fails it, and so does a divider cell, whose bars sit on the same line as
    // the dashes rather than the line above.
    shape.lockedBefore.every((before) => before?.endsWith("\n") === true)
  if (
    everyInput(shape, TABLE_PUNCTUATION) &&
    inputs.some((value) => value.length > 0) &&
    (barIsTyped || (barIsLockedPunctuation && dashRunsAreTyped)) &&
    !looksSetext
  ) {
    // A checkpoint never gathers two table rows — the deriver refuses to join
    // them — so counting bars across every blank counts the bars of one row.
    // Counted per blank and added up rather than joined and counted, which
    // would rebuild the value this whole module exists to do without.
    const barsTyped = inputs.reduce(
      (total, value) => total + (value.match(/\|/g)?.length ?? 0),
      0,
    )
    // Three dashes has to be found inside one blank. Reading it from the
    // joined value called `-` and `--` on two rows a divider, because they
    // concatenate to `---`.
    const dashesTyped = inputs.some((value) => /-{3,}/.test(value))
    // A divider row is dashes in *every* cell. Reading it from any one locked
    // cell called `| --- | value |` a divider and told the learner the row
    // above defines the headers, when it is an ordinary body row whose first
    // cell happens to be dashes. And a three-dash minimum missed `| - | - |`,
    // which GFM accepts as a divider, so the real divider read as a body row.
    const dividerRow =
      dashesTyped ||
      // `length > 0` is the definition, not a guard: a row with no cells is
      // not a rule, and `every` on an empty list would say it is.
      (shape.locked.length > 0 && shape.locked.every((value) => DIVIDER_CELL.test(value)))
    if (dividerRow) {
      // #157 designs Level 2 tables with no outer bars, so a two-column row
      // asks for a single bar. Noun and verb both have to follow that count.
      // The verb is `turns ... into` and not `makes ... the`, which reads
      // first as one noun phrase — "the row above the column headers", a row
      // sitting above them. The divider sits *below* the header row, so a
      // learner who reads it that way is told the opposite of what the screen
      // shows. `turns A into B` has no second reading.
      const typed =
        dashesTyped && barsTyped > 1
          ? "bars and dashes that turn"
          : dashesTyped && barsTyped === 1
            ? "bar and dashes that turn"
            : dashesTyped
              ? "dashes that turn"
              : barsTyped > 1
                ? "bars that turn"
                : "bar that turns"
      return instruction(
        `Type the Markdown ${typed} the row above into `,
        "column headers",
      )
    }
    return instruction(
      `Type the Markdown ${barsTyped > 1 ? "bars that separate" : "bar that separates"} the cells of this `,
      "table row",
    )
  }

  if (looksSetext) {
    const levels = new Set(
      inputs.map((value) => (value.trim().startsWith("=") ? "1" : "2")),
    )
    if (levels.size > 1) {
      // Two underlines of different levels have no one level to name.
      return instruction("Type the Markdown underline under each ", "Setext heading")
    }
    return instruction(
      `Type the Markdown underline for ${inputs.length > 1 ? "each " : "a "}`,
      `level ${[...levels][0]} Setext heading`,
    )
  }

  // Every blank is an ATX marker. Deciding the level from the joined value read
  // `# ` and `## ` gathered onto one card as a single level 1 heading: they
  // concatenate to `# ## ` and the leading run is one hash long.
  if (everyInput(shape, /^ {0,3}#{1,6}[\t ]*$/)) {
    const depths = new Set(inputs.map((value) => value.trim().length))
    if (depths.size === 1) {
      return instruction(
        `Type the Markdown marks and space for ${inputs.length > 1 ? "each " : "a "}`,
        `level ${[...depths][0]} heading`,
      )
    }
    // Headings of different depths have no one level to name, and the boxes
    // already show how many hashes each one wants.
    return instruction("Type the Markdown marks and space for each ", "heading")
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
  // values with prose between them.
  // The nesting is read as a *prefix*, not as the whole card. A line can carry
  // bold italic and then a link, and requiring these to be the only blanks
  // sent that card to the fallback, which named the first blank — "italic
  // text" — and said nothing about the three marks beside it. The file's rule
  // for a mixed card is to name its first family; the first family here is the
  // nesting, not one mark of it.
  const nestedAt = (offset: number): boolean =>
    (inputs[offset] === "*" || inputs[offset] === "_") &&
    inputs[offset] === inputs[offset + 3] &&
    (inputs[offset + 1] === "**" || inputs[offset + 1] === "__") &&
    inputs[offset + 1] === inputs[offset + 2] &&
    shape.precededByInput[offset + 1] === true &&
    shape.precededByInput[offset + 3] === true
  const boldItalicNesting =
    // Marks that wrap a phrase have the phrase between them. Two thematic
    // breaks gathered onto one card are the same two `***` blanks with only a
    // blank line between, and calling that a wrapped phrase told the learner
    // the wrong lesson for `***\n\n***`.
    (inputs.length === 2 &&
      inputs[0] === inputs[1] &&
      (inputs[0] === "***" || inputs[0] === "___") &&
      (shape.lockedBefore[1] ?? "").trim() !== "") ||
    // Counting the four values alone accepted `*This is **very** good*` —
    // bold inside part of an italic span, which has the same four values with
    // prose between them. Both ends have to touch.
    nestedAt(0)
  if (boldItalicNesting) {
    return instruction("Wrap the phrase in Markdown marks for ", "bold italic text")
  }

  // Thematic breaks read from the joined value only ever matched one: two of
  // them concatenate to `------`, which is not in the list, and the card fell
  // through to the generic sentence.
  // `***` and `___` are thematic breaks and also emphasis delimiters, so the
  // blanks have to agree with each other: one break repeated is a card of
  // section breaks, while `***` opening and `___` closing is a phrase being
  // wrapped and belongs to the emphasis branches below.
  if (
    inputs.length > 0 &&
    inputs.every((value) => THEMATIC_BREAK.test(value.trim())) &&
    // `***` and `___` are break markers and also emphasis delimiters. What
    // tells the two apart is the locked runs: a break opens its own block, so
    // nothing precedes the first blank and only blank lines lie between them,
    // while marks wrapping a phrase have the phrase locked in the middle.
    // Requiring one marker throughout instead dropped `***\n\n___`, which the
    // deriver does gather, onto the emphasis branch and called it bold.
    shape.lockedBefore.every(
      (before, index) => (index === 0 ? before === null : (before ?? "").trim() === ""),
    )
    // Dashes reach here only when the Setext test above has already declined
    // them, and that test is the one that reads what sits in front. Repeating
    // the check here would be a condition no input can falsify: the deriver
    // gives a break its own checkpoint with nothing locked before it, which
    // `sentencesFor("text\n\n---\n\nmore\n\n---")` pins.
  ) {
    return instruction(
      `Type the Markdown marks for ${inputs.length > 1 ? "each " : "a "}`,
      "section break",
    )
  }

  // #157 fixes the checkbox contract to an unordered item, `[- ][[ ]]`, and the
  // curriculum has no ordered checkbox. An ordered one would fall through to
  // the numbered-step sentence; that is a shape to open when content asks for
  // it, not a case to guess at now.
  const taskBoxes = inputsBehind(shape, TASK_BOX, BULLET_MARKER)
  if (taskBoxes.length > 0) {
    // A card mixing done and not-done items is taught as the plain checkbox;
    // only an all-checked card is about the checked form.
    const allChecked = taskBoxes.every((value) => /[xX]/.test(value))
    return instruction(
      `Type the Markdown mark and brackets for ${taskBoxes.length > 1 ? "each " : "a "}`,
      allChecked ? "checked-off item" : "checkbox item",
    )
  }

  // One line can carry two syntaxes. The L3/L4/L5 content writes an exact name
  // as inline code inside a list item, so the blanks are a list marker and a
  // pair of backticks. Splitting the card into one per syntax would be the
  // better answer, but the two share a line, so either half would show the
  // other half's answer in its locked prose. That needs the locked-prose
  // contract reopened (#177); until then the sentence names both, and the
  // emphasis goes on the backticks because a learner who reached this card has
  // already been taught the marker.
  // One or two backticks, never a fence: three or more is a code block.
  const inlineCodeRuns = countInputs(shape, /^`{1,2}$/)
  const bulletMarkers = countInputs(shape, BULLET_MARKER)
  const stepMarkers = countInputs(shape, STEP_MARKER)
  // Inline code wraps, so it takes two blanks. A single backtick blank is some
  // other shape and keeps the marker's own sentence.
  if (inlineCodeRuns >= 2 && bulletMarkers + stepMarkers > 0) {
    // The two syntaxes are counted separately. Sharing one count read the L5
    // cards — two steps and two code spans — as plural on the marker and
    // singular on the code.
    const markers = bulletMarkers + stepMarkers
    const codeSpans = inlineCodeRuns / 2
    // An ordered marker is a number, a delimiter and a space; the delimiter is
    // a blank of its own and `)` is as valid as `.`, so the sentence names it
    // rather than assuming the dot the content happens to use today.
    const lead =
      stepMarkers > 0
        ? markers > 1
          ? "Type each number, delimiter, and space"
          : "Type the number, delimiter, and space"
        : markers > 1
          ? "Type each bullet mark and space"
          : "Type the bullet mark and space"
    // The ordered sentences carry three more blanks than the bullet one, so
    // they join the two halves with a semicolon to stay inside the card.
    const join = stepMarkers > 0 ? "; " : ", then "
    const wrap = codeSpans > 1 ? "wrap each phrase in " : "wrap the phrase in "
    return instruction(`${lead}${join}${wrap}`, "inline code", " marks.")
  }

  if (everyInput(shape, BULLET_MARKER)) {
    return instruction(
      `Type the Markdown mark and space for ${inputs.length > 1 ? "each " : "a "}`,
      "bullet item",
    )
  }
  if (everyInput(shape, STEP_MARKER)) {
    return instruction(
      `Type the Markdown number, delimiter, and space for ${inputs.length > 1 ? "each " : "a "}`,
      "numbered step",
    )
  }

  if (everyInput(shape, QUOTE_MARKER)) {
    // A quote inside a quote puts its two markers side by side. Two quoted
    // lines gathered onto one card join to the same `> > ` but have the first
    // line's prose between them, and they are one block quote, not two levels.
    const nestedAt = firstTouchingMatch(shape, QUOTE_MARKER)
    if (nestedAt >= 0) {
      // `> > ` and the compact `>>` are both valid, and they ask for a
      // different number of spaces. The count comes from the nested pair
      // alone; taking it from every blank made a card holding two nested
      // quotes claim twice as many spaces as either one wants.
      const pair = touchingPairAt(shape, nestedAt)!
      const spaces = (pair.join("").match(/ /g) ?? []).length
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
      `Type the Markdown mark and space for ${inputs.length > 1 ? "each line of this " : "a "}`,
      "block quote",
    )
  }

  // Strikethrough is an even run of two-tilde delimiters wrapping a phrase.
  // Deciding it from the joined value instead called an unclosed four-tilde
  // code fence ("~~~~\ncode") strikethrough: both join to `~~~~`.
  if (inputs.length >= 2 && inputs.every((value) => value === "~~")) {
    // Delimiters come in pairs. An odd run is a shape nothing produces, and it
    // falls through to the fence rather than being guessed at — the direction
    // that does not invent a lesson. The joined value used to land there by
    // accident, six tildes starting with three; saying it here keeps the
    // answer and makes the reason something a reader can find.
    if (inputs.length % 2 === 1) {
      return instruction(
        "Type the opening and closing Markdown marks for a ",
        "fenced code block",
      )
    }
    return instruction(
      "Wrap the phrase in Markdown marks for ",
      "strikethrough text",
    )
  }

  // Every blank belongs to the fence — its two delimiters and, when the card
  // teaches it, the language name. Accepting any fence-width blank claimed a
  // list item holding a three-backtick span, and taught a block-level lesson
  // for a single line.
  if (
    inputs.some((value) => FENCE.test(value)) &&
    inputs.every((value) => FENCE.test(value) || LANGUAGE_NAME.test(value))
  ) {
    // A fence that also asks for the language name is teaching the language,
    // not the fence, so it gets its own sentence.
    const asksForLanguage = inputs.some((value) => LANGUAGE_NAME.test(value))
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

  // Emphasis delimiters wrap a phrase, so they come in pairs of equal width.
  // Which label a card gets is decided here rather than by the joined value —
  // but it is the same label. A line carrying several spans is named for one
  // family and stays silent about the rest; that imprecision is #177's axis,
  // and changing it here would move copy under cover of a structural change.
  if (everyInput(shape, /^[*_]$/)) {
    return instruction(
      "Wrap the phrase in Markdown marks for ",
      inputs.length === 2 ? "italic text" : "bold text",
    )
  }
  if (everyInput(shape, /^(?:\*\*|__)$/)) {
    return instruction("Wrap the phrase in Markdown marks for ", "bold text")
  }
  // Emphasis of mixed widths on one line is bold reaching into italic, or
  // italic reaching into bold, without the two ends nesting — the fully
  // nested shape returned above. The card names the strong pair, which is the
  // label these lines have today; the joined value reached it by putting a
  // single mark against a double one and reading three stars.
  if (
    everyInput(shape, /^(?:\*{1,3}|_{1,3})$/) &&
    new Set(inputs.map((value) => value.length)).size > 1
  ) {
    return instruction("Wrap the phrase in Markdown marks for ", "bold text")
  }

  // Everything above asks the whole card to be one shape. A card whose blanks
  // are not all the same family is a line carrying two syntaxes, and the
  // sentence names the first of them and stays silent about the rest. That is
  // imprecise and it is #177's axis; what belongs here is only where the
  // choice comes from. It used to come from the joined value, whose leading
  // characters are the first blank's — so the same answer, read from the
  // blank itself, with no concatenation in between.
  // A hard line break is the one family whose mark is invisible, so it has to
  // be recognised before the branches that read mark characters — a run of
  // spaces has none, and `leading` trims it away to nothing.
  if (SPACE_RUN.test(inputs[0] ?? "")) {
    return instruction(
      `End the line with ${spelledCount((inputs[0] ?? "").replace(/\n$/, "").length)} spaces to force a `,
      "line break",
    )
  }
  const leading = inputs[0]?.trim() ?? ""
  if (leading.startsWith("![")) {
    return instruction("Add the Markdown punctuation for an ", "image")
  }
  if (leading.startsWith("[")) {
    return instruction("Add the Markdown punctuation for a ", "link")
  }
  // The count still comes from the card. Two list items that also carry bold
  // marks are one checkpoint with two markers in it, and naming one of them
  // leaves the learner a blank the sentence never mentioned.
  if (BULLET_MARKER.test(inputs[0] ?? "")) {
    return instruction(
      `Type the Markdown mark and space for ${bulletMarkers > 1 ? "each " : "a "}`,
      "bullet item",
    )
  }
  if (STEP_MARKER.test(inputs[0] ?? "")) {
    return instruction(
      `Type the Markdown number, delimiter, and space for ${stepMarkers > 1 ? "each " : "a "}`,
      "numbered step",
    )
  }
  if (QUOTE_MARKER.test(inputs[0] ?? "")) {
    const markers = countInputs(shape, QUOTE_MARKER)
    return instruction(
      `Type the Markdown mark and space for ${markers > 1 ? "each line of this " : "a "}`,
      "block quote",
    )
  }
  if (leading.startsWith("#")) {
    const depth = leading.match(/^#+/)?.[0]?.length ?? 1
    return instruction(
      "Type the Markdown marks and space for a ",
      `level ${depth} heading`,
    )
  }
  if (FENCE.test(leading)) {
    return instruction(
      "Type the opening and closing Markdown marks for a ",
      "fenced code block",
    )
  }
  if (leading.startsWith("**") || leading.startsWith("__")) {
    return instruction("Wrap the phrase in Markdown marks for ", "bold text")
  }
  if (leading.startsWith("`")) {
    return instruction("Wrap the phrase in Markdown marks for ", "inline code")
  }
  if (leading.startsWith("*") || leading.startsWith("_")) {
    return instruction("Wrap the phrase in Markdown marks for ", "italic text")
  }

  return instruction("Type the Markdown marks for this ", "structure")
}
