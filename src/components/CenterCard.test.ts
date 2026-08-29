import { describe, expect, it } from "vitest"
import type {
  GuidedSyntaxSegment,
  SyntaxCheckpoint,
} from "../guided/guidedSyntax"
import { deriveSyntaxCheckpoints } from "../guided/guidedSyntax"
import { describeCheckpoint } from "./CenterCard"

function checkpointFor(target: string) {
  const [checkpoint] = deriveSyntaxCheckpoints(target, "")
  if (!checkpoint) throw new Error(`Expected a checkpoint for: ${target}`)
  return checkpoint
}

// Four of the Level 2 families cannot be derived from source yet: the parser
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
