import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { checkpointShape } from "./checkpointShape"
import { instructionFor } from "./checkpointInstruction"
import {
  deriveSyntaxCheckpoints,
  type GuidedSyntaxSegment,
  type SyntaxCheckpoint,
} from "./guidedSyntax"

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

const sentenceOf = (checkpoint: SyntaxCheckpoint): string =>
  instructionFor(checkpointShape(checkpoint)).prefix +
  instructionFor(checkpointShape(checkpoint)).term

/**
 * Pairs of checkpoints whose blanks concatenate to the *same* string and whose
 * shapes are different. Every one of these was a defect: the sentence used to
 * be decided from `canonicalInput`, so both halves of each pair got the same
 * answer and one of them was wrong.
 *
 * The joined value is asserted equal on purpose. A pair that stops colliding
 * proves nothing about reading structure, and the deriver changing under this
 * file is exactly the way that would happen quietly.
 */
const COLLAPSING_PAIRS: ReadonlyArray<{
  readonly joined: string
  readonly a: { readonly checkpoint: SyntaxCheckpoint; readonly term: string }
  readonly b: { readonly checkpoint: SyntaxCheckpoint; readonly term: string }
}> = [
  {
    joined: "**",
    a: {
      checkpoint: checkpointOf(["*", "input"], ["word", "locked"], ["*", "input"]),
      term: "italic text",
    },
    b: {
      checkpoint: checkpointOf(["**", "input"], ["word", "locked"]),
      term: "bold text",
    },
  },
  {
    joined: "~~~~",
    a: {
      checkpoint: checkpointOf(["~~", "input"], ["old", "locked"], ["~~", "input"]),
      term: "strikethrough text",
    },
    b: {
      checkpoint: checkpointOf(["~~~~", "input"], ["\ncode", "locked"]),
      term: "fenced code block",
    },
  },
  {
    joined: "------",
    a: {
      // Two Setext underlines gathered onto one card. Same dashes as a break;
      // what makes them underlines is the heading text locked in front of each.
      checkpoint: checkpointOf(
        ["One\n", "locked"],
        ["---", "input"],
        ["\n\nTwo\n", "locked"],
        ["---", "input"],
      ),
      term: "level 2 Setext heading",
    },
    b: {
      // A break is a block of its own, with nothing locked in front of it.
      checkpoint: checkpointOf(["------", "input"]),
      term: "section break",
    },
  },
  {
    joined: "# ## ",
    a: {
      checkpoint: checkpointOf(
        ["# ", "input"],
        ["One\n", "locked"],
        ["## ", "input"],
        ["Two", "locked"],
      ),
      term: "heading",
    },
    b: {
      checkpoint: checkpointOf(["# ## ", "input"], ["One", "locked"]),
      term: "level 1 heading",
    },
  },
  {
    joined: "    ",
    a: {
      checkpoint: checkpointOf(
        ["  ", "input"],
        ["\nsecond", "locked"],
        ["  ", "input"],
        ["\nthird", "locked"],
      ),
      term: "line break",
    },
    b: {
      checkpoint: checkpointOf(["    ", "input"], ["\nsecond", "locked"]),
      term: "line break",
    },
  },
  {
    joined: "> > ",
    a: {
      checkpoint: checkpointOf(
        ["> ", "input"],
        ["> ", "input"],
        ["Nested", "locked"],
      ),
      term: "quote inside a quote",
    },
    b: {
      checkpoint: checkpointOf(
        ["> ", "input"],
        ["One\n", "locked"],
        ["> ", "input"],
        ["Two", "locked"],
      ),
      term: "block quote",
    },
  },
  {
    joined: "---",
    a: {
      // Dashes spread over two cells. Neither blank is a dash run; joined they
      // are one, and reading the run from that value called the row a rule and
      // told the learner the row above defines the headers.
      checkpoint: checkpointOf(
        ["|", "locked"],
        ["-", "input"],
        ["|", "locked"],
        ["--", "input"],
        ["|", "locked"],
      ),
      term: "structure",
    },
    b: {
      // One blank that really is a dash run still is a rule.
      checkpoint: checkpointOf(["|", "locked"], ["---", "input"], ["|", "locked"]),
      term: "column headers",
    },
  },
  {
    joined: "******",
    a: {
      // One phrase wrapped in three marks at each end.
      checkpoint: checkpointOf(["***", "input"], ["Very", "locked"], ["***", "input"]),
      term: "bold italic text",
    },
    b: {
      // Three italic phrases on one line. The card names one family for all
      // of them, which is imprecise and #177's to fix — but it must not be
      // the nested one, which is a different lesson.
      checkpoint: checkpointOf(
        ["*", "input"],
        ["one", "locked"],
        ["*", "input"],
        [" ", "locked"],
        ["*", "input"],
        ["two", "locked"],
        ["*", "input"],
        [" ", "locked"],
        ["*", "input"],
        ["three", "locked"],
        ["*", "input"],
      ),
      term: "bold text",
    },
  },
]

describe("the sentence is decided from the shape, not the joined blanks", () => {
  it.each(COLLAPSING_PAIRS)(
    "tells the two shapes behind $joined apart",
    ({ joined, a, b }) => {
      // The collision is the premise. If the two stop joining to one string
      // there is nothing left for this case to prove.
      expect(a.checkpoint.canonicalInput, "left half").toBe(joined)
      expect(b.checkpoint.canonicalInput, "right half").toBe(joined)

      expect(instructionFor(checkpointShape(a.checkpoint)).term).toBe(a.term)
      expect(instructionFor(checkpointShape(b.checkpoint)).term).toBe(b.term)
    },
  )

  it("gives the two halves of every pair different sentences", () => {
    // Same term with a different count still counts as telling them apart —
    // "End the line with four spaces" and "End each line with two spaces" are
    // the same family and the number is the whole lesson.
    const same = COLLAPSING_PAIRS.filter(
      ({ a, b }) => sentenceOf(a.checkpoint) === sentenceOf(b.checkpoint),
    ).map(({ joined }) => joined)
    expect(same, "pairs still answered identically").toEqual([])
  })

  it("counts from the blank rather than from every blank added up", () => {
    // Three lines each ending in two spaces is not one line ending in six.
    expect(
      instructionFor(
        checkpointShape(
          checkpointOf(
            ["  ", "input"],
            ["\nb", "locked"],
            ["  ", "input"],
            ["\nc", "locked"],
            ["  ", "input"],
          ),
        ),
      ).prefix,
    ).toBe("End each line with two spaces to force a ")

    // And a card whose lines want different widths has no one number to name.
    expect(
      instructionFor(
        checkpointShape(
          checkpointOf(["  ", "input"], ["\nb", "locked"], ["   ", "input"]),
        ),
      ).prefix,
    ).toBe("Fill the spaces at the end of each line to force a ")
  })

  it("requires the two ends of a wrapped phrase to be the same mark", () => {
    // `***` opening and `___` closing is not one span, and the two are also
    // thematic-break marks — so this shape has to miss both the nested branch
    // and the section-break one. Joined it is `***___`, which is neither.
    const mixed = checkpointOf(["***", "input"], ["a", "locked"], ["___", "input"])
    expect(instructionFor(checkpointShape(mixed)).term).not.toBe(
      "bold italic text",
    )
    expect(instructionFor(checkpointShape(mixed)).term).not.toBe("section break")

    // The same mark at both ends still is one span.
    expect(
      instructionFor(
        checkpointShape(
          checkpointOf(["***", "input"], ["a", "locked"], ["***", "input"]),
        ),
      ).term,
    ).toBe("bold italic text")
    // Two `***` with prose between them are read as one wrapped phrase, not
    // as two section breaks. That is the answer these cards have today and it
    // is genuinely ambiguous in the source; naming a break here would invent a
    // lesson, so it stays with #177 along with the rest of the multi-span
    // imprecision.
    //
    // Dashes have no such ambiguity, because the deriver puts the heading text
    // in front of an underline and nothing in front of a break.
    expect(
      instructionFor(checkpointShape(checkpointOf(["---", "input"]))).term,
    ).toBe("section break")
    expect(
      instructionFor(
        checkpointShape(checkpointOf(["One\n", "locked"], ["---", "input"])),
      ).term,
    ).toBe("level 2 Setext heading")
  })

})

describe("the judgment cannot reach the joined value", () => {
  it("does not name canonicalInput anywhere in the two modules", () => {
    // A type keeps the checkpoint out of `instructionFor` today. This is the
    // second lock: a shape field carrying the joined value, or a branch
    // reaching through the checkpoint, would both compile.
    for (const path of [
      "src/guided/checkpointInstruction.ts",
      "src/guided/checkpointShape.ts",
    ]) {
      const source = readFileSync(path, "utf8")
      const code = source
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("*"))
      expect(
        code.filter((line) => line.includes("canonicalInput")),
        `${path} reads the joined value`,
      ).toEqual([])
      // Naming the field is not the only way back to it. Joining every blank
      // rebuilds the same string under a different expression, and the type
      // boundary cannot see that. Joining a pair of neighbours is a different
      // thing and stays allowed.
      expect(
        code.filter((line) => /\binputs\.join\(/.test(line)),
        `${path} rebuilds the joined value`,
      ).toEqual([])
    }
  })

  it("keeps the joined value out of the shape", () => {
    const checkpoint = checkpointOf(
      ["*", "input"],
      ["word", "locked"],
      ["*", "input"],
    )
    const shape = checkpointShape(checkpoint)
    // Not "no field happens to equal it" — no field may be the joined blanks,
    // and a shape that carried them would hand the next branch the same value
    // under a new name.
    const carriers = Object.entries(shape).filter(
      ([, value]) =>
        typeof value === "string" && value === checkpoint.canonicalInput,
    )
    expect(carriers, "a shape field carries the joined blanks").toEqual([])
  })
})

/**
 * The cases above build checkpoints by hand, which is how a fixture ends up
 * describing a shape the engine cannot produce. Two of them did: a table blanks
 * the bars and locks the dashes, always, so a fixture that blanks the dashes
 * proves nothing about tables no matter what it asserts.
 *
 * These go through `deriveSyntaxCheckpoints` instead. Real Markdown in, the
 * sentence out.
 */
describe("the sentence, derived from real Markdown", () => {
  const sentencesFor = (target: string): readonly string[] =>
    deriveSyntaxCheckpoints(target, "").map((checkpoint) => {
      const { prefix, term } = instructionFor(checkpointShape(checkpoint))
      return prefix + term
    })

  it("calls a one-dash divider the row above the column headers", () => {
    // GFM accepts one dash per cell. The deriver locks those dashes and blanks
    // the bars, so the divider has to be recognised from the locked cells —
    // and a three-dash minimum leaves it reading as an ordinary body row.
    expect(sentencesFor("| Name | Age |\n| - | - |\n| Ann | 9 |")).toEqual([
      "Type the Markdown bars that separate the cells of this table row",
      "Type the Markdown bars that make the row above the column headers",
      "Type the Markdown bars that separate the cells of this table row",
    ])
  })

  it("still calls a three-dash divider the same thing", () => {
    expect(sentencesFor("| Name | Age |\n| --- | --- |\n| Ann | 9 |")[1]).toBe(
      "Type the Markdown bars that make the row above the column headers",
    )
  })

  it("says each when a mixed card carries two list markers", () => {
    // The bold marks make this card fail the all-bullets test and fall to the
    // sentence that names the first family. The count still comes from the card.
    expect(sentencesFor("- **One**\n- **Two**")).toEqual([
      "Type the Markdown mark and space for each bullet item",
    ])
  })

  it("tells a gathered Setext underline from a section break", () => {
    // `mergeAdjacentSameSyntax` puts two underlines of the same level on one
    // card, and never puts two breaks together — they are separate blocks. So
    // a card with two dash blanks is underlines, and a card with one is a
    // break, and counting the blanks is the wrong axis for both.
    expect(sentencesFor("One\n---\n\nTwo\n---")).toEqual([
      "Type the Markdown underline for each level 2 Setext heading",
    ])
    expect(sentencesFor("One\n===\n\nTwo\n===")).toEqual([
      "Type the Markdown underline for each level 1 Setext heading",
    ])
    expect(sentencesFor("One\n---")).toEqual([
      "Type the Markdown underline for a level 2 Setext heading",
    ])
    // Two breaks are two cards, each naming one break.
    expect(sentencesFor("text\n\n---\n\nmore\n\n---")).toEqual([
      "Type the Markdown marks for a section break",
      "Type the Markdown marks for a section break",
    ])
  })

  it("keeps two breaks with nothing between them out of the heading branch", () => {
    // `---\n\n---` really is one checkpoint: `mergeAdjacentSameSyntax` gathers
    // the two blanks with only the blank line locked between them. So the card
    // this branch has to get right does exist — an earlier version of this PR
    // claimed it did not, on a probe whose input had a paragraph in the middle
    // and therefore never merged.
    expect(sentencesFor("---\n\n---")).toEqual([
      "Type the Markdown marks for each section break",
    ])
    // The same shape written with asterisks was read as one wrapped phrase,
    // because two `***` blanks are also how bold italic is blanked. What
    // separates them is that a wrapped phrase has the phrase between the marks
    // and this has only the blank line.
    expect(sentencesFor("***\n\n***")).toEqual([
      "Type the Markdown marks for each section break",
    ])
    // And a real wrapped phrase stays one.
    expect(sentencesFor("***Very***")).toEqual([
      "Wrap the phrase in Markdown marks for bold italic text",
    ])
  })

  it("keeps a card that mixes families out of the block-level lessons", () => {
    // Every one of these was a card naming the wrong lesson because one blank
    // looked like a whole shape on its own.
    //
    // A backtick run wide enough to open a fence is still a span when it sits
    // inside a list item, and the card is a list item.
    expect(sentencesFor("- ```x```")).toEqual([
      "Type the Markdown mark and space for a bullet item",
    ])
    // The nesting is the card's first family even when other syntax follows
    // it. Reading only the first blank named one mark of that family — "italic
    // text" — and said nothing about the three beside it.
    expect(sentencesFor("***both*** [link](/u)")).toEqual([
      "Wrap the phrase in Markdown marks for bold italic text",
    ])
    expect(sentencesFor("***both*** `code`")).toEqual([
      "Wrap the phrase in Markdown marks for bold italic text",
    ])
    // But a prefix is not any four marks that happen to be there. Bold inside
    // part of an italic span has the same four values with prose between them,
    // and both ends have to touch for the phrase to be one nesting.
    expect(sentencesFor("*This is **very** good*")).toEqual([
      "Wrap the phrase in Markdown marks for bold text",
    ])
    expect(sentencesFor("***Very** good*")).toEqual([
      "Wrap the phrase in Markdown marks for bold text",
    ])
    expect(sentencesFor("*good **Very***")).toEqual([
      "Wrap the phrase in Markdown marks for bold text",
    ])
    // A title made only of table punctuation is still a title, and the dashes
    // under it are still its underline.
    expect(sentencesFor("|\n---")).toEqual([
      "Type the Markdown underline for a level 2 Setext heading",
    ])
    // Breaks gathered onto one card may be written with different markers.
    expect(sentencesFor("***\n\n___")).toEqual([
      "Type the Markdown marks for each section break",
    ])
    expect(sentencesFor("---\n\n***")).toEqual([
      "Type the Markdown marks for each section break",
    ])
    // And the block-level lessons still reach the cards that are about them.
    expect(sentencesFor("```\ncode\n```")).toEqual([
      "Type the opening and closing Markdown marks for a fenced code block",
    ])
  })

  it("reads a thematic break that trails whitespace", () => {
    // The deriver keeps the trailing spaces inside the blank.
    expect(sentencesFor("***   ")).toEqual([
      "Type the Markdown marks for a section break",
    ])
  })
})
