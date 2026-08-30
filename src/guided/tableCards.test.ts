import { describe, expect, it } from "vitest"
import { describeCheckpoint } from "../components/CenterCard"
import { createEvaluationContext } from "../engine/evaluationContext"
import { countBlockNodes } from "../engine/predicates/structural"
import { BLOCK_KINDS } from "../content/types"
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

  it("teaches an escaped bar inside a cell without treating it as a separator", () => {
    // `\\|` is a literal bar in the cell text, not a separator — GFM reads it
    // as text. The backslash is still Markdown escape syntax, while the bar
    // itself stays locked and does not become a second table separator.
    const [, , body] = deriveSyntaxCheckpoints(
      "Operator | Meaning\n--- | ---\nA \\| B | either one",
      "",
    )
    expect(blanks(body!)).toHaveLength(2)
    expect(body!.segments).toEqual([
      { kind: "locked", value: "A " },
      { kind: "input", value: "\\" },
      { kind: "locked", value: "| B " },
      { kind: "input", value: "|" },
      { kind: "locked", value: " either one" },
    ])
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

describe("the bank gate lets a table check through", () => {
  it("accepts a table block kind and a table scope", () => {
    // The engine knowing `table` is not enough: `validateProblemBank` keeps
    // its own runtime list, and a table problem is rejected at the bank gate
    // before any of the grading above runs. The list is now derived from
    // `BLOCK_KINDS`, so the compiler keeps the two in step.
    expect(BLOCK_KINDS).toContain("table")
    expect(new Set<string>(BLOCK_KINDS).has("table")).toBe(true)
    // The pass case's counterpart: a kind the product has no check for is
    // still rejected, so this is not a whitelist that lets anything through.
    expect(BLOCK_KINDS).not.toContain("footnote")
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
    expect(rule.prefix).toContain("bar that turns")
    expect(rule.prefix).not.toContain("bars")
  })
})

describe("which table row the sentence calls the rule", () => {
  // The rule row was decided from any one locked cell that was a dash run of
  // three or more, and both halves of that were wrong. `| --- | value |` is a
  // body row whose first cell happens to be dashes and was announced as the
  // rule; `| - | - |` is a rule GFM accepts and was announced as a body row,
  // so the one card that teaches what a rule is did not say it.
  const ruleOf = (target: string, index: number) =>
    describeCheckpoint(deriveSyntaxCheckpoints(target, "")[index]!)

  it("reads a rule of any dash width as the rule", () => {
    for (const rule of ["---", "--", "-"]) {
      expect(
        ruleOf(`| A | B |\n| ${rule} | ${rule} |\n| 1 | 2 |`, 1).term,
        `rule written as ${rule}`,
      ).toBe("column headers")
    }
  })

  it("keeps a body row holding one dash cell a body row", () => {
    const table = "| A | B |\n| --- | --- |\n| --- | value |"
    expect(ruleOf(table, 2).term).toBe("table row")
    // The header and the rule above it are untouched.
    expect(ruleOf(table, 0).term).toBe("table row")
    expect(ruleOf(table, 1).term).toBe("column headers")
  })

  it("keeps alignment colons reading as the rule", () => {
    expect(ruleOf("| A | B |\n| :--- | ---: |\n| 1 | 2 |", 1).term).toBe(
      "column headers",
    )
    expect(ruleOf("| A | B |\n| :---: | :---: |\n| 1 | 2 |", 1).term).toBe(
      "column headers",
    )
  })

  it("cannot tell any all-dash row from the rule, wherever it sits", () => {
    // Recorded, not fixed, and this change is what opened the header half of
    // it. Reading every cell means an all-dash row reads as the rule no matter
    // which row it is, so both a body row and a header row of dashes are
    // announced as the rule — and a table can end up saying it twice.
    //
    // The old predicate got the header right only by accident: `| - | - |`
    // has one dash per cell and the three-dash minimum missed it, which is
    // the same miss that made a real one-dash rule read as a body row. The
    // two cannot be separated by the values at all; both rows are the same
    // characters. Only the row's position can, which is #178 item 12.
    //
    // Taken deliberately. A one-dash rule row is ordinary GFM; a header whose
    // every cell is literally a dash is not something the curriculum writes.
    // The batch keeps one non-dash cell in every row, header included.
    const bodyAllDashes = "| A | B |\n| --- | --- |\n| --- | --- |"
    expect(ruleOf(bodyAllDashes, 2).term).toBe("column headers")

    const headerAllDashes = "| - | - |\n| --- | --- |\n| x | y |"
    expect(ruleOf(headerAllDashes, 0).term).toBe("column headers")
    // The real rule row underneath still reads correctly, so the table says
    // it twice rather than losing it.
    expect(ruleOf(headerAllDashes, 1).term).toBe("column headers")
    expect(ruleOf(headerAllDashes, 2).term).toBe("table row")
  })
})

describe("the sentence a table card still gets wrong", () => {
  // Opening the blanks makes these reachable. They are recorded rather than
  // fixed here because the sentences live in `CenterCard.tsx`, which #181 is
  // rewriting; each becomes red when that follow-up lands, which is the
  // handoff. No learner meets them before the first table batch (#157).
  const rowOf = (target: string, index: number) =>
    describeCheckpoint(deriveSyntaxCheckpoints(target, "")[index]!)

  it("names only the first syntax when a row carries two", () => {
    // A bold cell or a quoted table puts two syntaxes on one card, and the
    // sentence names one of them. That is #177/#178, not the table engine:
    // the row is correctly kept apart, and the bar is correctly a blank.
    // The term alone cannot separate "not fixed" from "half fixed": a sentence
    // that began naming the bar would keep the same term and stay green, so
    // the prefix is checked too.
    expect(rowOf("**x** | one\n--- | ---\n**y** | two", 0).term).toBe("bold text")
    expect(
      rowOf("**x** | one\n--- | ---\n**y** | two", 0).prefix,
    ).not.toMatch(/\bbars?\b/)
    expect(rowOf("> a | b\n> --- | ---\n> 1 | 2", 0).term).toBe("block quote")
    expect(rowOf("> a | b\n> --- | ---\n> 1 | 2", 0).prefix).not.toMatch(
      /\bbars?\b/,
    )
    // The rule row of a quoted table is the worse case and needs its own
    // assertion: the others only fail to mention the bar, while this one also
    // loses that the row sets the column headers — outside a blockquote it
    // would say so. Checking only the first row leaves that free to change
    // either way unnoticed.
    expect(rowOf("> a | b\n> --- | ---\n> 1 | 2", 1).term).toBe("block quote")
    expect(rowOf("> a | b\n> --- | ---\n> 1 | 2", 1).prefix).not.toMatch(
      /\bbars?\b|column/,
    )
  })
})
