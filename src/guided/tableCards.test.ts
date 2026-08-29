import { describe, expect, it } from "vitest"
import { describeCheckpoint } from "../components/CenterCard"
import { createEvaluationContext } from "../engine/evaluationContext"
import { countBlockNodes } from "../engine/predicates/structural"
import { deriveSyntaxCheckpoints } from "./guidedSyntax"

const OUTER_BARS = "| Fruit | Count |\n| --- | --- |\n| Apples | 3 |"
// #157 designs Level 2 tables without the outer bars, so a two-column row asks
// for a single bar. Both shapes have to work.
const INNER_BARS = "Fruit | Count\n--- | ---\nApples | 3"

const blanks = (checkpoint: ReturnType<typeof deriveSyntaxCheckpoints>[number]) =>
  checkpoint.segments.filter((segment) => segment.kind === "input")

describe("a table row is a card", () => {
  it.each([
    ["outer bars", OUTER_BARS],
    ["inner bars", INNER_BARS],
  ])("gives %s one card per row", (_name, target) => {
    const cards = deriveSyntaxCheckpoints(target, "")
    // Three rows, three cards. Joining them would put nine blanks on one screen
    // and bring back the complaint #176 was closing.
    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect(blanks(card).every((segment) => segment.value === "|")).toBe(true)
    }
  })

  it("blanks the bars and locks the cell text and the dashes", () => {
    const [header, divider, body] = deriveSyntaxCheckpoints(INNER_BARS, "")
    expect(header!.segments).toEqual([
      { kind: "locked", value: "Fruit " },
      { kind: "input", value: "|" },
      { kind: "locked", value: " Count" },
    ])
    // The rule's dashes stay locked: the bar is the mark, the dashes are the
    // shape the row already shows.
    expect(divider!.segments).toEqual([
      { kind: "locked", value: "--- " },
      { kind: "input", value: "|" },
      { kind: "locked", value: " ---" },
    ])
    expect(blanks(body!)).toHaveLength(1)
  })

  it("locks an escaped bar inside a cell", () => {
    // `\\|` is a literal bar in the cell text, not a separator — GFM reads it
    // as text. Scanning raw characters asked the learner to type it, so the
    // card wanted two separators where the row has one.
    const [, , body] = deriveSyntaxCheckpoints(
      "Operator | Meaning\n--- | ---\nA \\| B | either one",
      "",
    )
    expect(blanks(body!)).toHaveLength(1)
    expect(body!.segments[0]).toEqual({ kind: "locked", value: "A \\| B " })
  })

  it("keeps rows apart when the bar is not the row's first blank", () => {
    // The never-join rule reads the row's family. Taking it from the first
    // blank lost the rows whose first mark is something else, and the rows
    // then collapsed onto one card: a quoted table came out as a single card
    // holding every `>` and every bar in the block.
    const quoted = deriveSyntaxCheckpoints("> a | b\n> --- | ---\n> 1 | 2", "")
    expect(quoted).toHaveLength(3)
    for (const card of quoted) {
      expect(
        card.segments.some(
          (segment) => segment.kind === "input" && segment.value === "|",
        ),
      ).toBe(true)
    }
  })

  it.each([
    ["a bullet whose text carries a bar", "- Compare A | B"],
    ["a bullet of nothing but punctuation", "- |"],
    ["a paragraph that carries a bar", "Use A | B when the sizes differ."],
  ])("does not blank %s as a table", (_name, target) => {
    // GFM only reads a table when a delimiter row matches the header, so these
    // stay what they are. The pass cases matter as much as the blockers: a
    // guard that only proves what it blocks hides what it over-reaches into.
    const cards = deriveSyntaxCheckpoints(target, "")
    for (const card of cards) {
      expect(blanks(card).some((segment) => segment.value.includes("|"))).toBe(
        false,
      )
    }
  })
})

describe("grading can tell a table from piped text", () => {
  const tables = (source: string) =>
    countBlockNodes(createEvaluationContext(source), { kind: "document" }, "table")

  it.each([
    ["outer bars", OUTER_BARS],
    ["inner bars", INNER_BARS],
  ])("counts %s as a table", (_name, source) => {
    expect(tables(source)).toBe(1)
  })

  it.each([
    ["a paragraph with a bar", "Compare A | B"],
    ["rows with no delimiter", "Fruit | Count\nApples | 3"],
    ["a delimiter that does not match the header", "Fruit | Count\n---\nApples | 3"],
  ])("does not count %s as a table", (_name, source) => {
    // Without this the engine could not grade a table exercise at all: any
    // paragraph carrying bars would have passed for one.
    expect(tables(source)).toBe(0)
  })
})

describe("sentences the table cards already get right", () => {
  it("says nothing about alignment colons, because nobody types them", () => {
    // Codex read the silence as a gap. The colons are locked prose here — the
    // only blank is the bar — and a sentence has no business naming a mark the
    // learner does not type. Same shape as the singular-bar case below: the
    // report assumed a card where the colons are blanks, and this engine does
    // not make one. Recorded as a pass case so a later change to what a rule
    // row blanks cannot flip it quietly.
    const rule = describeCheckpoint(
      deriveSyntaxCheckpoints("| A | B |\n| :--- | ---: |\n| 1 | 2 |", "")[1]!,
    )
    expect(rule.term).toBe("column headers")
    expect(rule.prefix).not.toMatch(/colon/i)
  })

  it("keeps a single bar singular on a rule row", () => {
    // Codex read this as plural-for-one-bar, which was true while the dashes
    // were typed. The engine locks them — the bar is the only blank — so the
    // count the sentence reads is one and it says "bar". Recorded as a pass
    // case so a later change to what a rule row blanks cannot flip it quietly.
    const rule = describeCheckpoint(
      deriveSyntaxCheckpoints("Fruit | Count\n--- | ---", "")[1]!,
    )
    expect(rule.prefix).toContain("bar that makes")
    expect(rule.prefix).not.toContain("bars")
  })
})

describe("sentences the table cards still get wrong", () => {
  // Opening the blanks makes these reachable. They are recorded rather than
  // fixed here because the sentences live in `CenterCard.tsx`, which #181 is
  // rewriting; each becomes red when that follow-up lands, which is the
  // handoff. No learner meets them before the first table batch (#157).
  const rowOf = (target: string, index: number) =>
    describeCheckpoint(deriveSyntaxCheckpoints(target, "")[index]!)

  it("reads a one-dash rule as an ordinary row", () => {
    expect(rowOf("| A | B |\n| - | - |\n| 1 | 2 |", 1).term).toBe("table row")
  })

  it("names only the first syntax when a row carries two", () => {
    // A bold cell or a quoted table puts two syntaxes on one card, and the
    // sentence names one of them. That is #177/#178, not the table engine:
    // the row is correctly kept apart, and the bar is correctly a blank.
    expect(rowOf("**x** | one\n--- | ---\n**y** | two", 0).term).toBe("bold text")
    expect(rowOf("> a | b\n> --- | ---\n> 1 | 2", 0).term).toBe("block quote")
  })

  it("reads a body row of dashes as a rule", () => {
    // `| --- | value |` is a legitimate body cell, not a second rule.
    expect(rowOf("| A | B |\n| --- | --- |\n| --- | value |", 2).term).toBe(
      "column headers",
    )
  })
})
