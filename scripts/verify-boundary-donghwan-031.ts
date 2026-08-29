// Independent AST oracle for PR #186 (nabimd) — batch 030 table problems.
// Deliberately does NOT import matchDiagnostics/structural.ts's countBlockNodes.
// Re-implements the same "top-level table node count" rule directly against
// the product's real GFM parser (mdast-util-gfm + micromark-extension-gfm),
// so this is a differential check against the real runtime, not a hand-typed
// expectation of what GFM should do.

import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { gfm } from "micromark-extension-gfm"
import type { Root, RootContent } from "mdast"

const GFM_OPTIONS = { singleTilde: false } as const
const PARSE_OPTIONS = {
  extensions: [gfm(GFM_OPTIONS)],
  mdastExtensions: [gfmFromMarkdown()],
}

function parse(source: string): Root {
  return fromMarkdown(source, PARSE_OPTIONS)
}

function topLevelTableCount(source: string): number {
  const root = parse(source)
  return root.children.filter((n: RootContent) => n.type === "table").length
}

function isAllDashRow(cells: string[]): boolean {
  return cells.every((c) => /^-+$/.test(c.trim()))
}

// Pull the real batch031 targets straight from the source module (revision 2
// content — P3 changed bus-time's header from "Bus | Time" to "Route | Time").
import { tableBatch031Problems } from "../src/content/batches/tableBatch031Problems"
const problems: { id: string; target: string }[] = tableBatch031Problems.map((p) => ({
  id: p.id,
  target: p.target,
}))

type Finding = {
  id: string
  category: string
  summary: string
  detail: string
}

const findings: Finding[] = []

// 1. Each of the 12 targets: confirm header/body rows are NOT all-dash, and
//    confirm the target itself parses to exactly one top-level table node.
for (const p of problems) {
  const lines = p.target.split("\n")
  const header = lines[0]!.split("|").map((s) => s.trim())
  const divider = lines[1]!.split("|").map((s) => s.trim())
  const body = lines[2]!.split("|").map((s) => s.trim())

  if (isAllDashRow(header)) {
    findings.push({
      id: p.id,
      category: "all-dash-header",
      summary: `${p.id} header row is all-dash`,
      detail: `header="${lines[0]}"`,
    })
  }
  if (isAllDashRow(body)) {
    findings.push({
      id: p.id,
      category: "all-dash-body",
      summary: `${p.id} body row is all-dash`,
      detail: `body="${lines[2]}"`,
    })
  }
  if (!/^:?-+:?$/.test(divider[0]!) && divider.some((c) => !/^:?-+:?$/.test(c))) {
    findings.push({
      id: p.id,
      category: "divider-shape",
      summary: `${p.id} divider row does not look like a GFM delimiter row`,
      detail: `divider="${lines[1]}"`,
    })
  }

  const count = topLevelTableCount(p.target)
  if (count !== 1) {
    findings.push({
      id: p.id,
      category: "target-not-single-table",
      summary: `${p.id} canonical target parses to ${count} top-level table node(s), expected 1`,
      detail: JSON.stringify(parse(p.target).children.map((c) => c.type)),
    })
  }
}

// 2. Counterexamples NOT present in tableBatch030Fixtures.ts — probing
//    boundaries the fixture list does not cover, per review brief.
const probes: { name: string; source: string; expectTableCount: number; note: string }[] = [
  {
    name: "all-dash-body-row",
    source: "Name | Color\n--- | ---\n--- | ---",
    expectTableCount: 1,
    note:
      "Body row where BOTH cells are literally '---' (not paired with text, unlike the shipped 'dash-cell-with-text' fixture which pairs one dash cell with 'Ready'). This is the literal case the review brief calls out: an all-dash row that is not the delimiter row.",
  },
  {
    name: "all-dash-header-row",
    source: "--- | ---\n--- | ---\nA | B",
    expectTableCount: 1,
    note:
      "Header row is itself all-dash text, distinct from the delimiter row beneath it. GFM allows arbitrary header cell content, including '---'. Not covered by any shipped fixture.",
  },
  {
    name: "escaped-bar-odd-count-in-cell",
    source: "Choice | Note\n--- | ---\nA \\\\| B | Saved",
    expectTableCount: 1,
    note:
      "Cell content 'A \\\\| B' — an escaped backslash followed by an unescaped bar (odd number of backslashes before the pipe cancels the escape). This should split into 3 cells on that row, not 2, distinct from the shipped 'escaped-cell-bar' fixture which uses a single backslash ('A \\| B') and stays at 2 cells.",
  },
  {
    name: "divider-plus-colon-only",
    source: "Name | Color\n: | :\nKite | Blue",
    expectTableCount: 0,
    note:
      "Delimiter cells with only an alignment colon and no dash ('|:|:|') are not valid GFM delimiter rows (each cell needs at least one '-'). Not covered by any shipped fixture; the shipped 'aligned-divider' fixture always keeps the dashes.",
  },
  {
    name: "divider-row-fewer-cells-than-header",
    source: "Name | Color | Place\n--- | ---\nKite | Blue | Home",
    expectTableCount: 0,
    note:
      "Divider has 2 cells against a 3-cell header — inverse direction of the shipped 'mismatched-divider' fixture (which uses a 3-cell divider against a 2-cell header). GFM requires the delimiter row cell count to match the header exactly in both directions.",
  },
  {
    name: "extra-body-cell-padding",
    source: "Name | Color\n--- | ---\nKite | Blue | Extra",
    expectTableCount: 1,
    note:
      "GFM tables: body rows with MORE cells than the header are still a valid table (the extra cells are simply ignored per spec), unlike header/divider mismatches. Confirms the mismatched-divider fixture's failure is really about the divider, not row cell counts in general.",
  },
  {
    name: "pipe-blockquote",
    source: "> Compare A | B when the sizes differ.",
    expectTableCount: 0,
    note:
      "A piped sentence inside a blockquote — sibling boundary case to the shipped 'pipe-paragraph' and 'pipe-list' fixtures, which cover plain paragraph and list container but not blockquote container.",
  },
  {
    name: "table-immediately-after-paragraph-no-blank-line",
    source: "Some text right above.\nName | Color\n--- | ---\nKite | Blue",
    expectTableCount: 1,
    note:
      "GFM tables are allowed to interrupt a paragraph — no blank line is required before the header row. Confirmed against the real parser (ast: paragraph, table) during the #186 review; re-checked here against revision 2 content for repeatability.",
  },
]

for (const probe of probes) {
  const count = topLevelTableCount(probe.source)
  if (count !== probe.expectTableCount) {
    findings.push({
      id: probe.name,
      category: "probe-mismatch",
      summary: `Probe '${probe.name}' expected ${probe.expectTableCount} table node(s), got ${count}`,
      detail: `source=${JSON.stringify(probe.source)} note=${probe.note} ast=${JSON.stringify(parse(probe.source).children.map((c) => c.type))}`,
    })
  }
}

// 3. Differential check of every shipped fixture in the committed batch 031
//    artifact (192 = 12 problems x 16 fixtures, revision 2) against the same
//    independent top-level-table-count rule.
import fixturesArtifact from "../curriculum/problem-bank/batches/2026-08-29-l1-tables-031/fixtures.json" with { type: "json" }
import { tableBatch031Fixtures } from "../src/content/batches/tableBatch031Fixtures"

type ShippedFixture = {
  id: string
  problemId: string
  source: string
  expectedStatus: "matched" | "fail"
}

for (const f of fixturesArtifact.fixtures as ShippedFixture[]) {
  const count = topLevelTableCount(f.source)
  const shouldMatch = f.expectedStatus === "matched"
  const ok = shouldMatch ? count >= 1 : count === 0
  if (!ok) {
    findings.push({
      id: f.id,
      category: "fixture-status-mismatch",
      summary: `Fixture ${f.id} expects ${f.expectedStatus} but real parser gives ${count} top-level table node(s)`,
      detail: `source=${JSON.stringify(f.source)}`,
    })
  }
}

// 4. Drift check: committed JSON artifact vs TS source module, 192/192.
const tsById = new Map(tableBatch031Fixtures.map((f) => [f.id, f]))
const jsonById = new Map(
  (fixturesArtifact.fixtures as ShippedFixture[]).map((f) => [f.id, f]),
)
if (tsById.size !== jsonById.size) {
  findings.push({
    id: "artifact-drift-count",
    category: "artifact-drift",
    summary: `TS module has ${tsById.size} fixtures, JSON artifact has ${jsonById.size}`,
    detail: "",
  })
}
for (const [id, tsFixture] of tsById) {
  const jsonFixture = jsonById.get(id)
  if (!jsonFixture) {
    findings.push({
      id,
      category: "artifact-drift-missing",
      summary: `Fixture ${id} exists in TS module but not in committed JSON artifact`,
      detail: "",
    })
    continue
  }
  if (
    jsonFixture.source !== tsFixture.source ||
    jsonFixture.expectedStatus !== tsFixture.expectedStatus ||
    jsonFixture.problemId !== tsFixture.problemId
  ) {
    findings.push({
      id,
      category: "artifact-drift-value",
      summary: `Fixture ${id} differs between TS module and committed JSON artifact`,
      detail: `ts=${JSON.stringify(tsFixture)} json=${JSON.stringify(jsonFixture)}`,
    })
  }
}

// 5. P3 vocabulary sanity: bus-time's target header changed Bus->Route, and
//    "route" is now the term that ties Green (a bus route name) to a header
//    that says what it is, instead of colliding with the "Bus" header noun.
const busTime = problems.find((p) => p.id === "l1-table-bus-time")!
if (!/^Route \| Time/.test(busTime.target)) {
  findings.push({
    id: "l1-table-bus-time",
    category: "p3-vocabulary-not-applied",
    summary: "bus-time target header was not changed to 'Route | Time' as claimed",
    detail: JSON.stringify(busTime.target),
  })
}

console.log(
  JSON.stringify(
    {
      findings,
      probeCount: probes.length,
      problemCount: problems.length,
      shippedFixtureCount: (fixturesArtifact.fixtures as ShippedFixture[]).length,
    },
    null,
    2,
  ),
)
