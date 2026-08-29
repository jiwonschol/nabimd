import { readFileSync, readdirSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  getCurriculumElement,
  getCurriculumElements,
} from "../content/curriculumElements"
import { isEligibleMixedExercise } from "../content/mixedExercisePolicy"
import { parseMarkdownSource } from "../markdown/parser"
import { problemBank } from "../content/problemBank"
import { evaluateProblem } from "../engine/evaluateProblem"
import {
  acceptedGuidedSyntaxGroupInputs,
  acceptedGuidedSyntaxInputs,
  acceptsGuidedSyntaxInput,
  buildGuidedDraft,
  checkpointHintRows,
  deriveSyntaxCheckpoints,
  missedGuidedSyntaxGroups,
  projectCheckpointContext,
  syntaxGroupTerm,
  syntaxGroupTermAt,
  syntaxCheckpointTerms,
  type SyntaxCheckpoint,
} from "./guidedSyntax"

describe("deriveSyntaxCheckpoints", () => {
  it("keeps heading whitespace inside the syntax answer", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "## Next steps",
      "Next steps",
    )

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]).toMatchObject({
      canonicalInput: "## ",
      line: 1,
    })
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "## " },
      { kind: "locked", value: "Next steps" },
    ])
  })

  it("names a syntax group by the space its grammar requires", () => {
    // `* ` and `*` are the same character. Only the grammar-required space
    // tells a bullet marker apart from an italic delimiter.
    expect(syntaxGroupTerm("* ")).toBe("bullet item")
    expect(syntaxGroupTerm("*")).toBe("italic text")
    expect(syntaxGroupTerm("**")).toBe("bold text")
    expect(syntaxGroupTerm("1. ")).toBe("numbered step")
    expect(syntaxGroupTerm("> ")).toBe("block quote")
    expect(syntaxGroupTerm("## ")).toBe("level 2 heading")
    expect(syntaxGroupTerm("`")).toBe("inline code")
    expect(syntaxGroupTerm("](")).toBe("link")
    // `---` alone is a section break; after a heading line it is a Setext
    // underline, which the note must not confuse with one.
    expect(syntaxGroupTerm("---")).toBe("section break")
    expect(syntaxGroupTerm("---", true)).toBe("level 2 Setext heading")
  })

  it("names the blanks the deriver learned to make in #189", () => {
    // Through `syntaxCheckpointTerms` and from source, because that is the
    // path the Now learning panel takes. Calling `syntaxGroupTerm` with a
    // literal would pass even when no card ever carries the blank, which is
    // exactly the state #189 found these families in.
    const terms = (source: string) =>
      syntaxCheckpointTerms(deriveSyntaxCheckpoints(source, "")[0]!)

    // A task box is bracket punctuation and used to be named a link.
    expect(terms("- [ ] Buy milk")).toEqual(["bullet item", "checkbox item"])
    expect(terms("- [x] Buy milk")).toEqual(["bullet item", "checked-off item"])
    expect(terms("~~gone~~ here")).toEqual(["strikethrough text"])
  })

  it("accepts either spelling of a checked task box", () => {
    const checkpointFor = (source: string) =>
      deriveSyntaxCheckpoints(source, "")[0]!

    // GFM parses `[x]` and `[X]` as the same checked item, so a learner who
    // types the other one is not wrong. The case is folded where answers are
    // compared rather than doubling the accepted forms — a checked list merges
    // onto one card, and one alternative per box is a Cartesian product.
    const one = checkpointFor("- [x] Buy milk")
    expect(acceptsGuidedSyntaxInput(one, "- [X]")).toBe(true)
    expect(acceptsGuidedSyntaxInput(one, "* [X]")).toBe(true)
    expect(acceptsGuidedSyntaxInput(one, "- [ ]")).toBe(false)

    // Two boxes choose independently — `[x]` beside `[X]` is valid GFM.
    const two = checkpointFor("- [x] one\n- [x] two")
    expect(acceptsGuidedSyntaxInput(two, "- [X]- [x]")).toBe(true)
    expect(acceptsGuidedSyntaxInput(two, "- [x]- [X]")).toBe(true)

    // …and the form count does not move. Fourteen items on one card used to
    // build 49,152 complete forms and about 12 MB of hint rows, which
    // `checkpointHintRows` materialises on every render.
    const long = checkpointFor(
      Array.from({ length: 14 }, (_, index) => `- [x] item ${index}`).join("\n"),
    )
    expect(acceptedGuidedSyntaxInputs(long)).toHaveLength(3)
    expect(checkpointHintRows(long)).toHaveLength(3)

    // The note still shows the learner both spellings, one row per group.
    expect(acceptedGuidedSyntaxGroupInputs(two, 1)).toEqual(["[x]", "[X]"])

    // And the note is not raised at all for a box typed in the other case.
    // `missedGuidedSyntaxGroups` compares group by group, so it needs the same
    // fold the whole-answer check does — without it a correct `[X]` is marked
    // as the group that could not be explained.
    expect(missedGuidedSyntaxGroups(two, ["- ", "[X]", "- ", "[x]"])).toEqual([])
    expect(missedGuidedSyntaxGroups(two, ["- ", "[ ]", "- ", "[x]"])).toEqual([1])

    // Only the case varies. A tab between the brackets is a task marker in
    // some columns and not others, and the accepted set is built from a
    // checkpoint that cannot see the line's indentation — see the tab test
    // below for what that costs.
    expect(acceptedGuidedSyntaxInputs(checkpointFor("- [ ] Buy milk"))).toEqual([
      "- [ ]",
      "* [ ]",
      "+ [ ]",
    ])
  })

  it("leaves a task box written with a tab as locked prose", () => {
    // The parser does read `- [\t] Buy` as a task item, so blanking the box
    // looks correct. The card it makes cannot be answered: its Hint prints
    // the tab as a row indistinguishable from `- [ ]`, so a learner reading
    // the screen types a space and is refused. Accepting the space instead
    // opens something worse — the tab is a task marker only in some columns:
    const parsed = (source: string) => {
      const [item] = (
        parseMarkdownSource(source).children[0] as { children: unknown[] }
      ).children as { checked?: boolean | null }[]
      return item?.checked ?? null
    }
    expect(parsed("- [\t] Buy")).toBe(false)
    expect(parsed("-  [\t] Buy")).toBe(null)
    // …and `buildAcceptedForms` works from a checkpoint, which cannot see the
    // line's indentation, so it cannot tell those two apart. The box stays
    // locked and the item teaches its marker.
    const checkpoint = deriveSyntaxCheckpoints("- [\t] Buy", "")[0]!
    expect(
      checkpoint.segments.flatMap((segment) =>
        segment.kind === "input" ? [segment.value] : [],
      ),
    ).toEqual(["- "])
    expect(syntaxCheckpointTerms(checkpoint)).toEqual(["bullet item"])
    expect(acceptedGuidedSyntaxInputs(checkpoint)).not.toContain("- [\t]")
  })

  it("keeps a deletion that wraps a line break on one card", () => {
    // The merger compares line indentation, because a nested list is a
    // different list. A deletion is inline and crosses the break anyway, so
    // an indented second line split the pair into two cards that each held
    // one `~~` and each said it wraps a phrase.
    for (const source of ["~~old\nprice~~", "~~old\n price~~"]) {
      const [card, ...rest] = deriveSyntaxCheckpoints(source, "")
      expect(rest, source).toEqual([])
      expect(
        card!.segments.flatMap((segment) =>
          segment.kind === "input" ? [segment.value] : [],
        ),
        source,
      ).toEqual(["~~", "~~"])
    }
  })

  it("takes the tab out of nesting markers only, line by line", () => {
    // One quote can hold a plain line and a nested one. Applying the rule to
    // the whole node took the tab out of a marker that is part of no nesting,
    // leaving a card that asks for "a mark and space" and then refuses `> `.
    const blanks = (checkpoint: SyntaxCheckpoint) =>
      checkpoint.segments.flatMap((segment) =>
        segment.kind === "input" ? [segment.value] : [],
      )
    const cards = deriveSyntaxCheckpoints(">\tplain\n> > nested", "")
    expect(cards).toHaveLength(2)
    // The plain line keeps the tab it always had — that is #204's axis.
    expect(blanks(cards[0]!)).toEqual([">\t"])
    // The nested line does not.
    expect(blanks(cards[1]!)).toEqual(["> ", "> "])
  })

  it("never leaves an odd run of strikethrough delimiters on a card", () => {
    // The damage of a split pair was not the wording. Three `~~` on one card
    // makes the answer six tildes, and `instructionFor` reads an odd run as a
    // fence — so the card told the learner to type `~~~~~~` where the source
    // has two separate deletions. Delimiters come in pairs; a card holding a
    // pair and a half is asking for something no source produced.
    //
    // Swept rather than listed, because this arrived twice as two spellings:
    // one deletion across a soft break, then two whose lines overlap.
    const gaps = [" ", "\n", "\n ", "\n\n"]
    let carrying = 0
    for (const first of gaps) {
      for (const between of gaps) {
        for (const second of gaps) {
          const source = `~~a${first}b~~${between}~~c${second}d~~`
          for (const checkpoint of deriveSyntaxCheckpoints(source, "")) {
            const delimiters = checkpoint.segments.filter(
              (segment) => segment.kind === "input" && segment.value === "~~",
            ).length
            if (delimiters === 0) continue
            carrying += 1
            expect(delimiters % 2, JSON.stringify(source)).toBe(0)
          }
        }
      }
    }
    // The sweep has to reach cards that actually hold delimiters.
    expect(carrying).toBeGreaterThanOrEqual(64)
  })

  it("keeps two deletions that share a line on one card", () => {
    // Grouped ranges are looked up by the line they start on, and the loop
    // skips past a whole group once it takes one. Two multiline deletions can
    // share a line, so the second range's start was consumed by the first
    // group and never visited — splitting a delimiter pair across two cards
    // and leaving an odd run of three, which reads as a fence.
    const cards = deriveSyntaxCheckpoints("~~a\nb~~ ~~c\n d~~", "")
    expect(cards).toHaveLength(1)
    expect(
      cards[0]!.segments.flatMap((segment) =>
        segment.kind === "input" ? [segment.value] : [],
      ),
    ).toEqual(["~~", "~~", "~~", "~~"])
  })

  it("never puts a tab in a nested quote's blanks", () => {
    // Three review rounds arrived as three spellings of one trade: `- [\t]
    // Buy`, `> \t> deep`, `>>\tdeep`. On screen a tab and a space are the same
    // picture, so a blank whose answer needs a tab cannot be solved from what
    // the learner sees — and no wording fixes it, because "spaces" would be
    // false. Asserting the shape instead of the sentence catches the next
    // spelling too; the sentence test above only knows the ones we have seen.
    const separators = ["", " ", "\t", "  ", " \t", "\t ", "\t\t"]
    let nested = 0
    for (const outer of separators) {
      for (const inner of separators) {
        const source = `>${outer}>${inner}deep`
        const checkpoint = deriveSyntaxCheckpoints(source, "")[0]
        if (!checkpoint) continue
        if (
          !syntaxCheckpointTerms(checkpoint).includes("quote inside a quote")
        ) {
          continue
        }
        nested += 1
        for (const accepted of acceptedGuidedSyntaxInputs(checkpoint)) {
          expect(accepted, JSON.stringify(source)).not.toMatch(/\t/)
        }
      }
    }
    // The sweep has to reach the shape it guards — a guard that walks past its
    // own case is not a guard. The number is not arbitrary: a tab in the
    // *outer* separator stops the nesting from being recognised at all, while
    // a tab in the inner one does not. Three of the seven separators hold no
    // tab, so 3 x 7 = 21 spellings nest and the other 28 stay plain (#204).
    // Read that way, this asserts "every spelling whose outer marker has no
    // tab", not "21 of 49" — if you are here to change the number, check which
    // of those two moved.
    expect(nested).toBe(21)
  })

  it("leaves a tab-indented nested quote as a plain quote", () => {
    // `> \t> deep` is a nested quote to the parser. Opening the inner marker
    // would put the tab between the two blanks as locked prose that looks
    // like a space, so they would no longer touch and the nesting could only
    // be recovered by loosening what "adjacent" means for every family. The
    // same reason keeps a tab task box locked.
    const checkpoint = deriveSyntaxCheckpoints("> \t> deep", "")[0]!
    expect(syntaxCheckpointTerms(checkpoint)).toEqual(["block quote"])
  })

  it("lets only one place assemble the naming context", () => {
    // The context arguments leaked twice — #188's line break, then this PR's
    // quote marker — because three sites each rebuilt them and the defaults
    // kept the compiler quiet. `syntaxGroupTermsInOrder` is the one caller;
    // everything else asks for a group by index. Two files are exempt: the
    // module that owns the function, and this file, which tests it directly.
    const roots = ["src"]
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`
        if (entry.isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry.name)) files.push(full)
      }
    }
    for (const root of roots) walk(root)

    const exempt = new Set([
      "src/guided/guidedSyntax.ts",
      "src/guided/guidedSyntax.test.ts",
    ])
    const callers = files.filter((file) => {
      if (exempt.has(file)) return false
      return /\bsyntaxGroupTerm\s*\(/.test(readFileSync(file, "utf8"))
    })

    expect(callers).toEqual([])
    // And the exemption is not vacuous: the owner really does call it, once,
    // beyond the definition itself.
    expect(
      readFileSync("src/guided/guidedSyntax.ts", "utf8").match(
        /(?<!function )\bsyntaxGroupTerm\s*\(/g,
      ),
    ).toHaveLength(1)
  })

  it("names one group with the context the checkpoint carries", () => {
    // Every caller used to assemble `syntaxGroupTerm`'s context arguments
    // itself, and when a third one was added the Missed-summary caller kept
    // passing two — recording a nested quote as a plain one. The context is
    // read from the checkpoint now, so a caller cannot leave one out.
    const nested = deriveSyntaxCheckpoints("> > deep", "")[0]!
    expect(syntaxGroupTermAt(nested, 0)).toBe("block quote")
    expect(syntaxGroupTermAt(nested, 1)).toBe("quote inside a quote")

    const setext = deriveSyntaxCheckpoints("Title\n---", "")[0]!
    expect(syntaxGroupTermAt(setext, 0)).toBe("level 2 Setext heading")
  })

  it("keeps every line of one quote on a single card", () => {
    // The merge key compares one line's markers, not the accumulated run.
    // Comparing the whole sequence kept differently spelled blocks apart —
    // which is right — but also broke a three-line quote in two, because the
    // card holding two lines no longer matched the third.
    expect(deriveSyntaxCheckpoints("> one\n> two\n> three", "")).toHaveLength(1)
    expect(
      deriveSyntaxCheckpoints("> > one\n> > two\n> > three", ""),
    ).toHaveLength(1)
  })

  it("keeps nested quotes of different spacing on separate cards", () => {
    // `>>` and `> > ` carry the same name but are not the same answer. Merged,
    // the card counted the spaces of its first pair and said nothing about the
    // second.
    const cards = deriveSyntaxCheckpoints(">> one\n\n> > two", "")
    expect(cards).toHaveLength(2)
    expect(acceptedGuidedSyntaxInputs(cards[0]!)).toEqual([">> "])
    expect(acceptedGuidedSyntaxInputs(cards[1]!)).toEqual(["> > "])
  })

  it("keeps a plain quote and a nested quote on separate cards", () => {
    // `mergeAdjacentSameSyntax` joins neighbours whose names match, and both
    // levels used to be called `block quote`. The joined card then claimed to
    // be a quote inside a quote while also asking for the unrelated plain
    // marker, so the depth has to live in the name the merger reads.
    const cards = deriveSyntaxCheckpoints("> plain\n\n> > deep", "")
    expect(cards).toHaveLength(2)
    expect(syntaxCheckpointTerms(cards[0]!)).toEqual(["block quote"])
    expect(syntaxCheckpointTerms(cards[1]!)).toEqual([
      "block quote",
      "quote inside a quote",
    ])
  })

  it("finds the groups an attempt cannot explain", () => {
    const checkpoint = deriveSyntaxCheckpoints("*Paper boat*", "Paper boat")[0]!

    // `*` and `_` are each accepted openers, so neither group looks wrong on
    // its own even though the mixed pair is rejected as a whole.
    expect(missedGuidedSyntaxGroups(checkpoint, ["*", "_"])).toEqual([])
    expect(missedGuidedSyntaxGroups(checkpoint, ["@", ""])).toEqual([0, 1])
    expect(missedGuidedSyntaxGroups(checkpoint, ["*", "*"])).toEqual([])
  })

  it("splits touching marks from two syntax families into separate cards", () => {
    // `> ` and `**` sit side by side in the source. The quote card stops
    // before the bold answer, so it cannot reveal the next lesson as locked
    // prose; the bold card owns the rest of the line.
    const checkpoints = deriveSyntaxCheckpoints(
      "> **Important deadline**",
      "Important deadline",
    )

    expect(checkpoints).toHaveLength(2)
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "> " },
    ])
    expect(checkpoints[1]?.segments).toEqual([
      { kind: "input", value: "**" },
      { kind: "locked", value: "Important deadline" },
      { kind: "input", value: "**" },
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual(["> "])
    expect(acceptedGuidedSyntaxInputs(checkpoints[1]!)).toEqual(["****", "____"])
    expect(buildGuidedDraft(
      "> **Important deadline**",
      checkpoints,
      1,
    )).toBe("> ")
  })

  it("keeps punctuation inside one syntax family in a single group", () => {
    // `]` and `(` touch, but both belong to the same link. A learner reads
    // `](` as one piece of link punctuation, so it stays one group.
    const checkpoints = deriveSyntaxCheckpoints(
      "See [the doc](https://x.dev) now",
      "See the doc now",
    )

    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "See " },
      { kind: "input", value: "[" },
      { kind: "locked", value: "the doc" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "https://x.dev" },
      { kind: "input", value: ")" },
      { kind: "locked", value: " now" },
    ])
  })

  it("keeps two adjacent links in separate groups", () => {
    // `)` of the first link touches `[` of the second. They are different
    // link instances, so they never merge.
    const checkpoints = deriveSyntaxCheckpoints(
      "[a](b)[c](d)",
      "ac",
    )

    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "[" },
      { kind: "locked", value: "a" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "b" },
      { kind: "input", value: ")" },
      { kind: "input", value: "[" },
      { kind: "locked", value: "c" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "d" },
      { kind: "input", value: ")" },
    ])
  })

  it("keeps bullet and bold alternatives on their own cards", () => {
    const checkpoints = deriveSyntaxCheckpoints("- **Ship it**", "Ship it")

    expect(checkpoints).toHaveLength(2)
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual(["- ", "* ", "+ "])
    expect(acceptedGuidedSyntaxInputs(checkpoints[1]!)).toEqual(["****", "____"])
    expect(buildGuidedDraft("- **Ship it**", checkpoints, 1)).toBe("- ")
  })

  it.each(["===", "---"])(
    "keeps a Setext %s underline with its heading text",
    (underline) => {
      const target = `Release notes\n${underline}`
      const checkpoints = deriveSyntaxCheckpoints(target, "Release notes\n")

      expect(checkpoints).toHaveLength(1)
      expect(checkpoints[0]).toMatchObject({
        canonicalInput: underline,
        line: 1,
        targetFrom: 0,
        targetTo: target.length,
      })
      expect(checkpoints[0]?.segments).toEqual([
        { kind: "locked", value: "Release notes\n" },
        { kind: "input", value: underline },
      ])
      expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([underline])
    },
  )

  it("keeps indented Setext underlines from accepting thematic-break alternatives", () => {
    const target = "Release notes\n  ---  "
    const checkpoints = deriveSyntaxCheckpoints(target, "Release notes\n")

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]).toMatchObject({
      canonicalInput: "---",
      line: 1,
      targetFrom: 0,
      targetTo: target.length,
    })
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Release notes\n  " },
      { kind: "input", value: "---" },
      { kind: "locked", value: "  " },
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual(["---"])
  })

  it("still offers thematic-break alternatives for an indented divider with no heading text", () => {
    const target = "  ---"
    const checkpoints = deriveSyntaxCheckpoints(target, "")

    expect(checkpoints).toHaveLength(1)
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "---",
      "***",
      "___",
    ])
  })

  it("groups both sides of paired emphasis into one checkpoint", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "Use **final draft** today.",
      "Use final draft today.",
    )

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]?.canonicalInput).toBe("****")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Use " },
      { kind: "input", value: "**" },
      { kind: "locked", value: "final draft" },
      { kind: "input", value: "**" },
      { kind: "locked", value: " today." },
    ])
  })

  it("offers the standard equivalent markers for paired emphasis", () => {
    const italic = deriveSyntaxCheckpoints("*Quiet music*", "Quiet music")[0]!
    const bold = deriveSyntaxCheckpoints("**Important**", "Important")[0]!

    expect(acceptedGuidedSyntaxInputs(italic)).toEqual(["**", "__"])
    expect(acceptedGuidedSyntaxInputs(bold)).toEqual(["****", "____"])
  })

  it.each([
    ["- Pens", "Pens", ["- ", "* ", "+ "]],
    ["  - Child", "Child", ["- ", "* ", "+ "]],
    ["1. First", "First", ["1. ", "1) "]],
    ["---", "", ["---", "***", "___"]],
    ["```\nhello\n```", "\nhello\n", ["``````", "~~~~~~"]],
  ] as const)("offers standard equivalents for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it.each([
    ["* Pens", "Pens", ["* ", "- ", "+ "]],
    ["1) First", "First", ["1) ", "1. "]],
    ["_Quiet music_", "Quiet music", ["__", "**"]],
    ["__Important__", "Important", ["____", "****"]],
    ["***", "", ["***", "---", "___"]],
    ["~~~\nhello\n~~~", "\nhello\n", ["~~~~~~", "``````"]],
  ] as const)("keeps equivalent answers symmetric for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it("keeps independent equivalents on separate syntax cards", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "- **Changed:** adapter boundary",
      "Changed: adapter boundary",
    )

    expect(checkpoints).toHaveLength(2)
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual(["- ", "* ", "+ "])
    expect(acceptedGuidedSyntaxInputs(checkpoints[1]!)).toEqual(["****", "____"])
  })

  it.each([
    ["## Next steps", "Next steps", ["## "]],
    ["> A useful note", "A useful note", ["> "]],
    ["Press `Enter`.", "Press Enter.", ["``"]],
    ["Read the [guide](/guide).", "Read the guide.", ["[]()"]],
    ["See ![Map](/map.png).", "See Map.", ["![]()"]],
    ["First line  \nSecond line", "First line\nSecond line", ["  "]],
  ] as const)("keeps non-equivalent syntax exact for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it("locks a link destination while asking only for Markdown punctuation", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "Read the [guide](/docs/guide).",
      "Read the guide.",
    )

    expect(checkpoints[0]?.canonicalInput).toBe("[]()")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Read the " },
      { kind: "input", value: "[" },
      { kind: "locked", value: "guide" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "/docs/guide" },
      { kind: "input", value: ")" },
      { kind: "locked", value: "." },
    ])
  })

  it("keeps a nested list on its own card and never asks for the indentation", () => {
    const target = ["- Parent", "  * Child"].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(
      target,
      ["Parent", "Child"].join("\n"),
    )

    // A nested list is a different list: Markdown lets its marker differ from
    // its parent's. Joining the two levels onto one card would make the
    // parent's marker constrain the child's and refuse `- Parent` above
    // `+ Child`, which the learner could type before.
    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "- ",
      "* ",
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "- ",
      "* ",
      "+ ",
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[1]!)).toEqual([
      "* ",
      "- ",
      "+ ",
    ])
    // The indentation is never a blank: the checkpoint starts at the marker
    // and the document regains the layout from the untouched slice before it.
    expect(checkpoints[1]?.segments).toEqual([
      { kind: "input", value: "* " },
      { kind: "locked", value: "Child" },
    ])
    expect(checkpoints[1]?.targetFrom).toBe("- Parent\n  ".length)
    expect(buildGuidedDraft(target, checkpoints, checkpoints.length)).toBe(target)
  })

  it("leaves no two locked runs side by side on a joined card", () => {
    // `mergeSegments` guarantees locked text never sits beside locked text;
    // joining two cards must not break that, or the card renders the same
    // prose as several fragments.
    const [card] = deriveSyntaxCheckpoints(
      "- Apples\n- Pears\n- Milk",
      "Apples\nPears\nMilk",
    )
    expect(card!.segments).toEqual([
      { kind: "input", value: "- " },
      { kind: "locked", value: "Apples\n" },
      { kind: "input", value: "- " },
      { kind: "locked", value: "Pears\n" },
      { kind: "input", value: "- " },
      { kind: "locked", value: "Milk" },
    ])
  })

  it("keeps one marker across cards at the same level and none across levels", () => {
    // Two lists at the same level are one list to Markdown once the blank line
    // between them is answered, so an answer typed on the second card is
    // normalised to agree with the first. A nested list is a separate list and
    // keeps whatever the learner typed.
    const sameLevel = "- Apples\n\nThen rest.\n\n- Pears"
    const cards = deriveSyntaxCheckpoints(sameLevel, "")
    expect(cards).toHaveLength(2)
    expect(
      buildGuidedDraft(sameLevel, cards, 2, {
        [cards[0]!.id]: "* ",
        [cards[1]!.id]: "- ",
      }),
    ).toBe("* Apples\n\nThen rest.\n\n* Pears")

    const nested = "- Parent\n  * Child"
    const nestedCards = deriveSyntaxCheckpoints(nested, "")
    expect(
      buildGuidedDraft(nested, nestedCards, 2, {
        [nestedCards[0]!.id]: "+ ",
        [nestedCards[1]!.id]: "* ",
      }),
    ).toBe("+ Parent\n  * Child")
  })

  it("lets every emphasis pair on a joined card choose its own delimiter", () => {
    // Two emphasis spans were two cards before they were joined, and each
    // accepted its own delimiter. Swapping only the first pair offered a mixed
    // answer while dropping the uniform one — the opposite of both.
    const joined = deriveSyntaxCheckpoints("*one*\n*two*", "one\ntwo")
    expect(joined).toHaveLength(1)
    expect(acceptedGuidedSyntaxInputs(joined[0]!)).toEqual([
      "****",
      "__**",
      "**__",
      "____",
    ])
    // The pass case: one pair still offers exactly its two forms, so the
    // product does not leak into cards that hold a single span.
    expect(
      acceptedGuidedSyntaxInputs(
        deriveSyntaxCheckpoints("*Quiet music*", "Quiet music")[0]!,
      ),
    ).toEqual(["**", "__"])
  })

  it("still joins the items of one list at one level", () => {
    expect(
      deriveSyntaxCheckpoints("- Apples\n- Pears\n- Milk", "").map(
        (checkpoint) => checkpoint.canonicalInput,
      ),
    ).toEqual(["- - - "])
  })

  it("never surfaces line-leading whitespace in any published problem", () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      for (const checkpoint of checkpoints) {
        expect(checkpoint.canonicalInput, `${problem.id} ${checkpoint.id}`).not.toMatch(
          /^[\t ]/,
        )
        expect(
          checkpoint.segments[0]?.value,
          `${problem.id} ${checkpoint.id}`,
        ).not.toMatch(/^[\t ]/)
      }
    }
  })

  it("treats both fenced-code delimiters as one semantic checkpoint", () => {
    const target = ["```bash", "npm test", "```"].join("\n")
    const starter = ["", "npm test", ""].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(target, starter)

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]?.canonicalInput).toBe("``````")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "```" },
      { kind: "locked", value: "bash\nnpm test\n" },
      { kind: "input", value: "```" },
    ])
  })
})

describe("card teaching projections", () => {
  it("projects only the active source row and its nearest meaningful neighbors", () => {
    const target = [
      "## Before",
      "",
      "> Keep rollback steps visible.",
      "",
      "- Verify the deploy",
    ].join("\n")
    const checkpoint = deriveSyntaxCheckpoints(target, "")[1]!

    expect(projectCheckpointContext(target, checkpoint)).toEqual({
      before: "## Before",
      current: "> Keep rollback steps visible.",
      after: "- Verify the deploy",
    })
  })

  it("keeps a nested list in one rendered context block", () => {
    const target = "- Lunch tray\n  - Sandwich\n  - Apple"
    const checkpoint = deriveSyntaxCheckpoints(
      target,
      "Lunch tray\nSandwich\nApple",
    )[0]!

    expect(projectCheckpointContext(target, checkpoint)).toEqual({
      before: null,
      current: target,
      after: null,
    })
  })

  it("shows every italic answer as a complete source example", () => {
    const checkpoint = deriveSyntaxCheckpoints(
      "*Quiet music*",
      "Quiet music",
    )[0]!

    expect(checkpointHintRows(checkpoint)).toEqual([
      { input: "**", source: "*Quiet music*" },
      { input: "__", source: "_Quiet music_" },
    ])
  })

  it.each([
    [
      "- Pens",
      [
        { input: "- ", source: "- Pens" },
        { input: "* ", source: "* Pens" },
        { input: "+ ", source: "+ Pens" },
      ],
    ],
    [
      "1. First",
      [
        { input: "1. ", source: "1. First" },
        { input: "1) ", source: "1) First" },
      ],
    ],
    [
      "Use `npm test`.",
      [{ input: "``", source: "Use `npm test`." }],
    ],
    [
      "Read [docs](/guide).",
      [{ input: "[]()", source: "Read [docs](/guide)." }],
    ],
    [
      "See ![Map](/map.png).",
      [{ input: "![]()", source: "See ![Map](/map.png)." }],
    ],
    [
      "---",
      [
        { input: "---", source: "---" },
        { input: "***", source: "***" },
        { input: "___", source: "___" },
      ],
    ],
    [
      "```\nhello\n```",
      [
        { input: "``````", source: "```\nhello\n```" },
        { input: "~~~~~~", source: "~~~\nhello\n~~~" },
      ],
    ],
  ] as const)("renders complete Hint rows for %s", (target, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, "")[0]!

    expect(checkpointHintRows(checkpoint)).toEqual(expected)
  })
})

describe("buildGuidedDraft", () => {
  it("reveals completed syntax blocks and intervening prose, but not future blocks", () => {
    const target = [
      "# Packing note",
      "",
      "Bring only what you need.",
      "",
      "## Checklist",
      "",
      "- Passport",
      "- Charger",
    ].join("\n")
    const starter = [
      "Packing note",
      "",
      "Bring only what you need.",
      "",
      "Checklist",
      "",
      "Passport",
      "Charger",
    ].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(target, starter)

    expect(buildGuidedDraft(target, checkpoints, 0)).toBe("")
    expect(buildGuidedDraft(target, checkpoints, 1)).toBe(
      "# Packing note\n\nBring only what you need.\n\n",
    )
    expect(buildGuidedDraft(target, checkpoints, checkpoints.length)).toBe(
      target,
    )
  })
})

/**
 * Blank policy: a blank asks for a Markdown grammar token and nothing else.
 * The token includes whitespace the grammar itself requires (`# `, `- `,
 * `1. ` are not headings or list items without the space), and it never
 * includes layout whitespace or Goal prose — the learner is answering
 * "what is the Markdown syntax here", not retyping the Goal document.
 */
describe("published blank policy", () => {
  const bankCheckpoints = problemBank.flatMap((problem) =>
    deriveSyntaxCheckpoints(problem.target, problem.starterText).map(
      (checkpoint) => ({
        label: `${problem.id} ${checkpoint.id}`,
        checkpoint,
      }),
    ),
  )

  it("asks only Markdown grammar characters, never Goal prose", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      expect(checkpoint.canonicalInput, label).not.toMatch(/[A-Za-z]/)
    }
  })

  it("includes the grammar-required space in every marker blank", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      const canonical = checkpoint.canonicalInput
      if (/^#{1,6}/.test(canonical)) {
        // `#Title` is plain text — the space completes the heading grammar.
        expect(canonical, label).toMatch(/^#{1,6} /)
      }
      const marker = canonical.match(/^([*+-])(?!\1)/)?.[1]
      if (marker && !new RegExp(`^\\${marker}+$`).test(canonical)) {
        // `-Item` is plain text — the space completes the list grammar.
        expect(canonical, label).toMatch(/^[*+-] /)
      }
      if (/^\d+[.)]/.test(canonical)) {
        expect(canonical, label).toMatch(/^\d+[.)] /)
      }
      if (canonical.startsWith(">")) {
        expect(canonical, label).toMatch(/^> /)
      }
    }
  })

  it("rejects marker answers typed without their grammar space", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      const canonical = checkpoint.canonicalInput
      const withoutSpace = canonical.replace(
        /^(#{1,6}|\d+[.)]|[*+-]|>) /,
        "$1",
      )
      if (withoutSpace === canonical) continue
      expect(
        acceptsGuidedSyntaxInput(checkpoint, withoutSpace),
        label,
      ).toBe(false)
    }
  })
})

describe("one card teaches one syntax", () => {
  // The turn scheduler already keeps one syntax from filling a turn, but it
  // counts problems while the learner counts cards: a three-item list was one
  // problem and three identical cards, so the practice felt like the same mark
  // three times in a row. Adjacent checkpoints naming the same syntax are one
  // card with one blank per item.
  it("puts every bullet of a list on one card", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "- Apples\n- Pears\n- Milk",
      "Apples\nPears\nMilk",
    )

    expect(checkpoints).toHaveLength(1)
    expect(
      checkpoints[0]!.segments.filter((segment) => segment.kind === "input"),
    ).toEqual([
      { kind: "input", value: "- " },
      { kind: "input", value: "- " },
      { kind: "input", value: "- " },
    ])
  })

  it("keeps different syntaxes on their own cards", () => {
    // The pass case: grouping must not collapse a problem into one card. A
    // heading above a list is two lessons and stays two.
    const checkpoints = deriveSyntaxCheckpoints(
      "# Packing\n\n- Socks\n- Towel",
      "Packing\nSocks\nTowel",
    )

    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "# ",
      "- - ",
    ])
  })

  it("does not swallow an unrelated block between two lists", () => {
    // Only whitespace may sit between two joined cards. A paragraph in
    // between means another block came first, and pulling it into a locked
    // segment would put unrelated prose inside the card.
    const checkpoints = deriveSyntaxCheckpoints(
      "- Apples\n\nThen rest.\n\n- Pears",
      "Apples\nThen rest.\nPears",
    )

    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "- ",
      "- ",
    ])
  })

  it("never repeats a syntax on consecutive cards of a served problem", () => {
    // Scoped to what practice can actually serve: a single-element problem, or
    // a mixed exercise that passed eligibility. Problems outside that set can
    // still repeat a syntax across cards — `l3-decision-quiet-room-booking`
    // has two level-2 headings with an unmarked paragraph between them — and
    // `isEligibleMixedExercise` is what keeps them off the schedule.
    const served = problemBank.filter(
      (problem) =>
        getCurriculumElements(problem).length === 1 ||
        isEligibleMixedExercise(problem),
    )
    expect(served.length).toBeGreaterThan(200)

    let compared = 0
    let nestedExceptions = 0
    let tableRowBoundaries = 0
    for (const problem of served) {
      const source = problem.target.replace(/\r\n?/g, "\n")
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      const indentOf = (checkpoint: (typeof checkpoints)[number]) =>
        source.slice(
          source.lastIndexOf("\n", Math.max(0, checkpoint.targetFrom - 1)) + 1,
          checkpoint.targetFrom,
        )
      const terms = checkpoints.map((checkpoint) =>
        syntaxCheckpointTerms(checkpoint).join("+"),
      )
      if (getCurriculumElement(problem) === "table") {
        expect(checkpoints, problem.id).toHaveLength(3)
        expect(
          checkpoints.map((checkpoint) =>
            checkpoint.segments
              .filter((segment) => segment.kind === "input")
              .map((segment) => segment.value),
          ),
          problem.id,
        ).toEqual([["|"], ["|"], ["|"]])
        tableRowBoundaries += checkpoints.length - 1
        continue
      }
      for (let index = 1; index < terms.length; index += 1) {
        compared += 1
        if (terms[index] !== terms[index - 1]) continue
        // The one allowed repeat: a nested list is a different list, so its
        // card stays separate and names the same syntax as its parent's.
        // Anything at the same level repeating is the defect this guards.
        expect(
          indentOf(checkpoints[index]!),
          `${problem.id} card ${index + 1} repeats card ${index} at the same level`,
        ).not.toBe(indentOf(checkpoints[index - 1]!))
        nestedExceptions += 1
      }
    }
    // Named so the exception cannot quietly become the rule.
    expect(nestedExceptions).toBeLessThan(compared / 4)
    expect(tableRowBoundaries).toBe(24)
    // Guards the loop against passing by never comparing anything. Most served
    // problems are a single card now, so the floor is the number of card
    // boundaries that still exist rather than a share of the bank.
    const multiCard = served.filter(
      (problem) =>
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length > 1,
    ).length
    expect(multiCard).toBeGreaterThan(20)
    expect(compared).toBeGreaterThanOrEqual(multiCard)
  })
})

describe("published problem-bank coverage", () => {
  it("derives at least one lossless checkpoint for every published problem", () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )

      expect(checkpoints.length, problem.id).toBeGreaterThan(0)
      for (const checkpoint of checkpoints) {
        expect(checkpoint.canonicalInput, checkpoint.id).not.toBe("")
        expect(
          checkpoint.segments.map((segment) => segment.value).join(""),
          checkpoint.id,
        ).toBe(problem.target.slice(checkpoint.targetFrom, checkpoint.targetTo))
      }
      expect(
        buildGuidedDraft(problem.target, checkpoints, checkpoints.length),
        problem.id,
      ).toBe(problem.target)
    }
  })

  it("keeps every accepted alternative valid through the real grading engine", { timeout: 30_000 }, () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )

      for (const checkpoint of checkpoints) {
        const alternatives = acceptedGuidedSyntaxInputs(checkpoint)
        expect(alternatives[0], checkpoint.id).toBe(checkpoint.canonicalInput)
        expect(new Set(alternatives).size, checkpoint.id).toBe(alternatives.length)
        expect(
          alternatives.every(
            (alternative) => alternative.length === checkpoint.canonicalInput.length,
          ),
          checkpoint.id,
        ).toBe(true)

        for (const alternative of alternatives) {
          const completedValues = Object.fromEntries(
            checkpoints.map((candidate) => [
              candidate.id,
              candidate.id === checkpoint.id
                ? alternative
                : candidate.canonicalInput,
            ]),
          )
          const draft = buildGuidedDraft(
            problem.target,
            checkpoints,
            checkpoints.length,
            completedValues,
          )
          expect(evaluateProblem(problem, draft).status, `${problem.id}: ${alternative}`)
            .not.toBe("fail")
        }
      }
    }
  })
})
