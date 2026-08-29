import { describe, expect, it } from "vitest"
import type {
  GuidedSyntaxSegment,
  SyntaxCheckpoint,
} from "../guided/guidedSyntax"
import { deriveSyntaxCheckpoints } from "../guided/guidedSyntax"
import { problemBank } from "../content/problemBank"
import { describeCheckpoint } from "./CenterCard"

function checkpointFor(target: string) {
  const [checkpoint] = deriveSyntaxCheckpoints(target, "")
  if (!checkpoint) throw new Error(`Expected a checkpoint for: ${target}`)
  return checkpoint
}

// Five of the Level 2 families cannot be derived from source yet: the parser
// that feeds `deriveSyntaxCheckpoints` has GFM off, and two more families have
// their marks locked rather than blank (#157). Their sentences are written
// against the blank shapes the engine work is committed to producing, spelled
// out here as a checkpoint literal so the contract is readable. The
// "still unreachable" test below fails the moment the engine catches up, which
// is the signal to re-derive these from source instead.
function checkpointOf(
  ...segments: ReadonlyArray<[string, GuidedSyntaxSegment["kind"]]>
): SyntaxCheckpoint {
  const parts = segments.map(([value, kind]) =>
    kind === "input"
      ? ({ kind: "input", value } as const)
      : ({ kind: "locked", value } as const),
  )
  return {
    id: "contract",
    line: 0,
    targetFrom: 0,
    targetTo: 0,
    activeOffset: 0,
    canonicalInput: parts
      .filter((part) => part.kind === "input")
      .map((part) => part.value)
      .join(""),
    segments: parts,
  }
}

describe("describeCheckpoint", () => {
  it("names the heading depth outright", () => {
    expect(describeCheckpoint(checkpointFor("# Apple"))).toEqual({
      prefix: "Type the Markdown marks and space for a ",
      term: "level 1 heading",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("### Phase"))).toEqual({
      prefix: "Type the Markdown marks and space for a ",
      term: "level 3 heading",
      suffix: ".",
    })
  })

  it("tells italic and bold pairs apart", () => {
    expect(describeCheckpoint(checkpointFor("*Paper boat*"))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "italic text",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("**Important**"))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "bold text",
      suffix: ".",
    })
  })

  it("labels the remaining families", () => {
    expect(describeCheckpoint(checkpointFor("- Hammers"))).toEqual({
      prefix: "Type the Markdown mark and space for a ",
      term: "bullet item",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("1. Step"))).toEqual({
      prefix: "Type the Markdown number, delimiter, and space for a ",
      term: "numbered step",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("> Quote"))).toEqual({
      prefix: "Type the Markdown mark and space for a ",
      term: "block quote",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("Use `npm test`."))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "inline code",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("```\ncode\n```"))).toEqual({
      prefix: "Type the opening and closing Markdown marks for a ",
      term: "fenced code block",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("a\n\n---\n\nb"))).toEqual({
      prefix: "Type the Markdown marks for a ",
      term: "section break",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("Use [docs](/a)."))).toEqual({
      prefix: "Add the Markdown punctuation for a ",
      term: "link",
      suffix: ".",
    })
  })

  it("names a hard line break by what it does, not by its mark", () => {
    expect(describeCheckpoint(checkpointFor("first line  \nsecond line"))).toEqual(
      {
        prefix: "End the line with two spaces to force a ",
        term: "line break",
        suffix: ".",
      },
    )
  })

  it("counts the spaces the blank actually asks for", () => {
    // Two is the minimum a break needs, not the only width a source carries;
    // a three-space blank draws three boxes and the sentence has to agree.
    expect(
      describeCheckpoint(checkpointFor("first line   \nsecond line")).prefix,
    ).toBe("End the line with three spaces to force a ")
  })

  it("does not call bold italic bold", () => {
    expect(describeCheckpoint(checkpointFor("***Very*** important"))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "bold italic text",
      suffix: ".",
    })
  })

  it("keeps a section break a section break", () => {
    expect(describeCheckpoint(checkpointFor("a\n\n***\n\nb"))).toEqual({
      prefix: "Type the Markdown marks for a ",
      term: "section break",
      suffix: ".",
    })
  })

  it("does not call a bar in prose a table", () => {
    // A bullet item whose text happens to contain a bar is not a table row.
    expect(describeCheckpoint(checkpointFor("- Compare A | B"))).toEqual({
      prefix: "Type the Markdown mark and space for a ",
      term: "bullet item",
      suffix: ".",
    })
    // Nor is one whose text is nothing but table punctuation: the locked bar
    // looks like syntax, but the learner is typing a bullet marker.
    expect(describeCheckpoint(checkpointFor("- |")).term).toBe("bullet item")
    expect(describeCheckpoint(checkpointFor("- :|:")).term).toBe("bullet item")
  })

  it("does not call separate spans on one line bold italic", () => {
    // Four delimiter groups concatenate to the same six marks whether they
    // nest or sit side by side; only the order tells them apart.
    // Both keep the label they had before this branch existed. That label is
    // itself imprecise for a line carrying several spans — the card names one
    // family and stays silent about the rest — which is #177, not this axis.
    expect(describeCheckpoint(checkpointFor("**bold** *italic*")).term).toBe(
      "bold text",
    )
    expect(describeCheckpoint(checkpointFor("*one* *two* *three*")).term).toBe(
      "bold text",
    )
    // The contract shape — the three marks blanked as one group — still reads
    // as bold italic, alongside today's split shape asserted above.
    expect(
      describeCheckpoint(
        checkpointOf(["***", "input"], ["Very", "locked"], ["***", "input"]),
      ).term,
    ).toBe("bold italic text")

    // Bold inside only part of an italic span has the same four values, with
    // prose between them. Only the outer and inner marks touching makes it a
    // single bold italic phrase.
    expect(
      describeCheckpoint(checkpointFor("*This is **very** good*")).term,
    ).toBe("bold text")
    // Both ends have to touch. Italic that keeps going after the bold closes
    // ("***Very** good*") and italic that starts before it opens
    // ("*good **Very***") each leave one pair apart.
    expect(describeCheckpoint(checkpointFor("***Very** good*")).term).toBe(
      "bold text",
    )
    expect(describeCheckpoint(checkpointFor("*good **Very***")).term).toBe(
      "bold text",
    )

    // Nesting is symmetric. An outer pair that does not match itself is not a
    // wrapper, so it falls out of the branch rather than being named.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["*", "input"],
          ["**", "input"],
          ["Very", "locked"],
          ["**", "input"],
          ["_", "input"],
        ),
      ).term,
    ).not.toBe("bold italic text")
  })

  it("does not call a four-tilde code fence strikethrough", () => {
    // An unclosed `~~~~` fence joins to the same value a strikethrough pair
    // does; only the shape tells them apart.
    expect(describeCheckpoint(checkpointFor("~~~~\ncode")).term).toBe(
      "fenced code block",
    )
  })

  it("does not call strikethrough a code fence", () => {
    // `~~old~~` joins into `~~~~`, which the fence branch would swallow.
    expect(
      describeCheckpoint(
        checkpointOf(["~~", "input"], ["old price", "locked"], ["~~", "input"]),
      ),
    ).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "strikethrough text",
      suffix: ".",
    })

    // And it survives #157's grouping, where one card carries several phrases
    // of the same family separated by locked newlines.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["~~", "input"],
          ["old", "locked"],
          ["~~", "input"],
          ["\n", "locked"],
          ["~~", "input"],
          ["older", "locked"],
          ["~~", "input"],
        ),
      ).term,
    ).toBe("strikethrough text")

    // Delimiters come in pairs. An odd run is a shape nothing produces, and it
    // falls out of this branch rather than being guessed at — six tildes read
    // as a fence, which is the direction that does not invent a lesson.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["~~", "input"],
          ["old", "locked"],
          ["~~", "input"],
          ["x", "locked"],
          ["~~", "input"],
        ),
      ).term,
    ).toBe("fenced code block")
  })

  it("names the language when the fence asks for one", () => {
    expect(
      describeCheckpoint(
        checkpointOf(
          ["```", "input"],
          ["js", "input"],
          ["\nlet a = 1\n", "locked"],
          ["```", "input"],
        ),
      ),
    ).toEqual({
      prefix: "Type the Markdown marks and the language name for a ",
      term: "syntax-highlighted code block",
      suffix: ".",
    })
    // A fence with no language blank keeps the plainer sentence.
    expect(describeCheckpoint(checkpointFor("```\ncode\n```"))).toEqual({
      prefix: "Type the opening and closing Markdown marks for a ",
      term: "fenced code block",
      suffix: ".",
    })
  })

  it("counts the blanks a gathered card actually holds", () => {
    // #176 puts every blank of one family on one card, so a card can carry
    // three bullet markers while the sentence says "a bullet item".
    expect(describeCheckpoint(checkpointFor("- Apples\n- Pears\n- Milk"))).toEqual({
      prefix: "Type the Markdown mark and space for each ",
      term: "bullet item",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("- Apples")).prefix).toBe(
      "Type the Markdown mark and space for a ",
    )
    expect(
      describeCheckpoint(checkpointFor("1. First\n2. Second")).prefix,
    ).toBe("Type the Markdown number, delimiter, and space for each ")
    expect(describeCheckpoint(checkpointFor("1. First")).prefix).toBe(
      "Type the Markdown number, delimiter, and space for a ",
    )
    expect(
      describeCheckpoint(
        checkpointOf(
          ["- ", "input"],
          ["[ ]", "input"],
          [" Milk\n", "locked"],
          ["- ", "input"],
          ["[ ]", "input"],
          [" Eggs", "locked"],
        ),
      ).prefix,
    ).toBe("Type the Markdown mark and brackets for each ")
    // A card that mixes done and not-done items teaches the plain checkbox.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["- ", "input"],
          ["[x]", "input"],
          [" Milk\n", "locked"],
          ["- ", "input"],
          ["[ ]", "input"],
          [" Eggs", "locked"],
        ),
      ).term,
    ).toBe("checkbox item")
    // The brackets alone are not a checkbox — #157 fixes the contract to a
    // bracket blank sitting right behind a bullet marker.
    expect(
      describeCheckpoint(
        checkpointOf(["Pick ", "locked"], ["[ ]", "input"], [" one", "locked"]),
      ).term,
    ).not.toBe("checkbox item")
  })

  it("ends each gathered line with its own spaces", () => {
    // Three lines each ending in two spaces is not one line ending in six.
    expect(
      describeCheckpoint(checkpointFor("First  \nSecond  \nThird")).prefix,
    ).toBe("End each line with two spaces to force a ")
    expect(describeCheckpoint(checkpointFor("First  \nSecond")).prefix).toBe(
      "End the line with two spaces to force a ",
    )
    // Lines asking for different widths have no one number to name.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["First", "locked"],
          ["  ", "input"],
          ["\nSecond", "locked"],
          ["   ", "input"],
        ),
      ).prefix,
    ).toBe("Fill the spaces at the end of each line to force a ")
  })

  it("does not call two quoted lines a quote inside a quote", () => {
    // Gathered sibling quote markers join to the same `> > ` a nested quote
    // does. The nested pair sits side by side; siblings have a line between.
    expect(describeCheckpoint(checkpointFor("> One\n> Two"))).toEqual({
      prefix: "Type the Markdown mark and space for each line of this ",
      term: "block quote",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("> Solo")).prefix).toBe(
      "Type the Markdown mark and space for a ",
    )
  })

  it("tells a nested quote from a plain one", () => {
    expect(
      describeCheckpoint(
        checkpointOf(["> ", "input"], ["> ", "input"], ["Deep", "locked"]),
      ),
    ).toEqual({
      prefix: "Type the Markdown marks and spaces for a ",
      term: "quote inside a quote",
      suffix: ".",
    })
    // The compact form is equally valid and asks for one space, or none.
    expect(
      describeCheckpoint(
        checkpointOf([">", "input"], ["> ", "input"], ["Deep", "locked"]),
      ).prefix,
    ).toBe("Type the Markdown marks and space for a ")
    expect(
      describeCheckpoint(
        checkpointOf([">", "input"], [">", "input"], [" Deep", "locked"]),
      ).prefix,
    ).toBe("Type the Markdown marks for a ")
  })

  it("tells a checkbox from a bullet, and checked from unchecked", () => {
    expect(
      describeCheckpoint(
        checkpointOf(["- ", "input"], ["[ ]", "input"], [" Buy milk", "locked"]),
      ),
    ).toEqual({
      prefix: "Type the Markdown mark and brackets for a ",
      term: "checkbox item",
      suffix: ".",
    })
    expect(
      describeCheckpoint(
        checkpointOf(["- ", "input"], ["[x]", "input"], [" Buy milk", "locked"]),
      ),
    ).toEqual({
      prefix: "Type the Markdown mark and brackets for a ",
      term: "checked-off item",
      suffix: ".",
    })
  })

  it("tells a table divider from the rows around it", () => {
    const bodyRow = checkpointOf(
      ["|", "input"],
      [" Apples ", "locked"],
      ["|", "input"],
      [" 3 ", "locked"],
      ["|", "input"],
    )
    expect(describeCheckpoint(bodyRow)).toEqual({
      prefix: "Type the Markdown bars that separate the cells of this ",
      term: "table row",
      suffix: ".",
    })

    // Same bars, different row: the locked dash runs are what name it.
    const dividerLockedDashes = checkpointOf(
      ["|", "input"],
      [" --- ", "locked"],
      ["|", "input"],
      [" --- ", "locked"],
      ["|", "input"],
    )
    expect(describeCheckpoint(dividerLockedDashes)).toEqual({
      prefix: "Type the Markdown bars that make the row above the ",
      term: "column headers",
      suffix: ".",
    })

    // A two-column divider that exposes its single inner bar and its dashes
    // together: the bar is still one bar.
    expect(
      describeCheckpoint(
        checkpointOf(
          ["| ", "locked"],
          ["---", "input"],
          ["|", "input"],
          ["---", "input"],
          [" |", "locked"],
        ),
      ).prefix,
    ).toBe("Type the Markdown bar and dashes that make the row above the ")

    // The other side of the same split: a three-column divider exposes two
    // inner bars, so the same branch has to say "bars".
    expect(
      describeCheckpoint(
        checkpointOf(
          ["| ", "locked"],
          ["---", "input"],
          ["|", "input"],
          ["---", "input"],
          ["|", "input"],
          ["---", "input"],
          [" |", "locked"],
        ),
      ).prefix,
    ).toBe("Type the Markdown bars and dashes that make the row above the ")

    // And when the dashes are the blank instead of the bars.
    const dividerTypedDashes = checkpointOf(
      ["| ", "locked"],
      ["---", "input"],
      [" | ", "locked"],
      ["---", "input"],
      [" |", "locked"],
    )
    expect(describeCheckpoint(dividerTypedDashes)).toEqual({
      prefix: "Type the Markdown dashes that make the row above the ",
      term: "column headers",
      suffix: ".",
    })
  })

  it("drops the outer bars without changing the sentence's grammar", () => {
    // #157 designs Level 2 tables as two columns with no outer bars, so a row
    // asks for a single bar. Noun and verb both have to agree with that count.
    expect(
      describeCheckpoint(
        checkpointOf(["Apples ", "locked"], ["|", "input"], [" 3", "locked"]),
      ),
    ).toEqual({
      prefix: "Type the Markdown bar that separates the cells of this ",
      term: "table row",
      suffix: ".",
    })
    expect(
      describeCheckpoint(
        checkpointOf(["--- ", "locked"], ["|", "input"], [" ---", "locked"]),
      ),
    ).toEqual({
      prefix: "Type the Markdown bar that makes the row above the ",
      term: "column headers",
      suffix: ".",
    })
  })

  it("keeps a Setext underline a heading when the title contains a bar", () => {
    expect(describeCheckpoint(checkpointFor("Apples | Pears\n---\n"))).toEqual({
      prefix: "Type the Markdown underline for a ",
      term: "level 2 Setext heading",
      suffix: ".",
    })
  })

  it("keeps every served card's article matching the blanks it holds", () => {
    // The whole bank, both directions. 158 of 744 served cards shipped saying
    // "for a" in front of two or three markers because nothing counted the
    // sentence against the card. The marker patterns are written out here on
    // purpose: this is an independent recount, not a call back into the code
    // being checked.
    const COUNTED: ReadonlyArray<{ term: string; marker: RegExp }> = [
      { term: "bullet item", marker: /^ {0,3}[-+*][\t ]+$/ },
      { term: "numbered step", marker: /^ {0,3}\d+[.)][\t ]+$/ },
      { term: "block quote", marker: /^ {0,3}>[\t ]*$/ },
      { term: "checkbox item", marker: /^\[[ xX]?\]$/ },
      { term: "checked-off item", marker: /^\[[ xX]?\]$/ },
      { term: "line break", marker: /^ {2,}$/ },
    ]

    let single = 0
    let gathered = 0
    for (const problem of problemBank) {
      for (const checkpoint of deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )) {
        const { prefix, term } = describeCheckpoint(checkpoint)
        const family = COUNTED.find((counted) => counted.term === term)
        if (!family) continue
        const markers = checkpoint.segments.filter(
          (segment) =>
            segment.kind === "input" && family.marker.test(segment.value),
        ).length
        const saysEach = /\beach\b/.test(prefix)
        expect(
          saysEach,
          `${problem.id}:${checkpoint.id} "${prefix}${term}." holds ${markers}`,
        ).toBe(markers > 1)
        if (markers > 1) gathered += 1
        else single += 1
      }
    }

    // A guard that walked nothing is green for the wrong reason, and one that
    // only ever saw single cards would not have caught the 158.
    expect(single).toBeGreaterThan(50)
    expect(gathered).toBeGreaterThan(50)
  })

  it("names both syntaxes when one card holds a marker and inline code", () => {
    // L3/L4/L5 write an exact name as inline code inside a list item, so one
    // card can hold three blanks (or six). The marker sentence alone shipped
    // in front of them, silent about the backticks.
    expect(describeCheckpoint(checkpointFor("- Run `report daily` now"))).toEqual({
      prefix: "Type the Markdown mark and space, then wrap the exact text in ",
      term: "inline code",
      suffix: " marks.",
    })
    expect(
      describeCheckpoint(checkpointFor("1. Create a folder named `Current`")),
    ).toEqual({
      prefix: "Type the Markdown number and space, then wrap the exact text in ",
      term: "inline code",
      suffix: " marks.",
    })
    expect(
      describeCheckpoint(
        checkpointFor("1. Run `a b`\n2. Open `c.txt`"),
      ),
    ).toEqual({
      prefix: "Type each step number and space, then wrap the exact text in ",
      term: "inline code",
      suffix: " marks.",
    })
    // A marker with no code keeps its own sentence, and code with no marker
    // keeps the wrapping one. The branch has to read the kinds present, not
    // just notice that a backtick exists somewhere.
    expect(describeCheckpoint(checkpointFor("- Plain item")).term).toBe(
      "bullet item",
    )
    expect(describeCheckpoint(checkpointFor("Use `npm test` here.")).term).toBe(
      "inline code",
    )
    expect(
      describeCheckpoint(checkpointFor("Use `npm test` here.")).prefix,
    ).toBe("Wrap the phrase in Markdown marks for ")
    // Three backticks are a fence, not inline code, even inside a document
    // that also has list markers elsewhere.
    expect(
      describeCheckpoint(checkpointFor("```\ncode\n```")).term,
    ).toBe("fenced code block")
  })

  it("keeps every served card that mixes syntaxes to a known shape", () => {
    // The 158 shipped because nothing counted the sentence against the card's
    // blank count. These 15 shipped because nothing counted its blank *kinds*:
    // the L5 readme cards hold six blanks of two kinds, and "for each numbered
    // step" is true of the count while saying nothing about four of them. The
    // marker patterns are rewritten here on purpose — calling back into the
    // code under test would let both be wrong together.
    const LIST_MARKER = /^ {0,3}(?:[-+*]|\d+[.)])[\t ]+$/
    const INLINE_CODE = /^`{1,2}$/
    // Every mixed-kind shape the bank serves today. A new combination has to
    // land here deliberately: without this the next pairing ships silently,
    // which is exactly how these 15 got out.
    const KNOWN = new Set([
      '["[","](",")"]',
      '["![","](",")"]',
      '["- ","`","`"]',
      '["#. ","`","`"]',
      '["#. ","`","`","#. ","`","`"]',
    ])

    let mixed = 0
    let markerOnly = 0
    let codeOnly = 0
    for (const problem of problemBank) {
      for (const checkpoint of deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )) {
        const blanks = checkpoint.segments
          .filter((segment) => segment.kind === "input")
          .map((segment) => segment.value)
        const kinds = new Set(
          blanks.map((value) => value.trim().replace(/\d+/g, "#")),
        )
        const { prefix, term, suffix } = describeCheckpoint(checkpoint)
        const markers = blanks.filter((value) => LIST_MARKER.test(value)).length
        const codes = blanks.filter((value) => INLINE_CODE.test(value)).length
        const where = `${problem.id}:${checkpoint.id}`

        if (kinds.size > 1) {
          const shape = JSON.stringify(
            blanks.map((value) => value.replace(/^\d+/, "#")),
          )
          expect(KNOWN.has(shape), `${where} serves new mixed shape ${shape}`).toBe(
            true,
          )
        }

        if (markers > 0 && codes >= 2) {
          mixed += 1
          // Both syntaxes, or the learner is left with blanks nobody named.
          expect(term, `${where} "${prefix}${term}${suffix}"`).toBe("inline code")
          expect(
            /\b(?:mark|number)\b/.test(prefix),
            `${where} drops the marker: "${prefix}${term}${suffix}"`,
          ).toBe(true)
        } else if (markers > 0) {
          markerOnly += 1
          expect(term, `${where} claims code with no backtick blank`).not.toBe(
            "inline code",
          )
        } else if (codes >= 2) {
          codeOnly += 1
          expect(
            prefix,
            `${where} is inline code alone and keeps the wrapping sentence`,
          ).toBe("Wrap the phrase in Markdown marks for ")
        }
      }
    }

    // A guard that walked none of the three arms proves nothing. The mixed arm
    // is the one that was empty when the 15 shipped.
    expect(mixed).toBe(15)
    expect(markerOnly).toBeGreaterThan(100)
    expect(codeOnly).toBeGreaterThan(20)
  })

  it("records which families the engine still cannot reach", () => {
    // These fail when the parser work in #157 lands. That is the handoff: the
    // sentences above stop being a contract and become derivable from source.
    expect(deriveSyntaxCheckpoints("~~old price~~ new price", "")).toHaveLength(0)
    expect(deriveSyntaxCheckpoints("| a | b |\n| --- | --- |\n| 1 | 2 |", "")).toHaveLength(
      0,
    )
    expect(describeCheckpoint(checkpointFor("- [ ] Buy milk")).term).toBe(
      "bullet item",
    )
    expect(describeCheckpoint(checkpointFor("> > Deep")).term).toBe("block quote")
    // The fence itself is reachable; the sentence that names the language is
    // not, because the engine locks `js` instead of blanking it.
    expect(
      describeCheckpoint(checkpointFor("```js\nlet a = 1\n```")).term,
    ).toBe("fenced code block")
  })
})
