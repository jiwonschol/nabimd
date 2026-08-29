import { readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, test } from "vitest"
import type { Nodes, Parents } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import runtimeProjections from "../../curriculum/problem-bank/runtime-projections.generated.json"
import { publishedProblemIds } from "../content/problemBank"
import { GFM_OPTIONS, parseMarkdownSource } from "./parser"
import { parseMarkdown } from "../engine/markdownAst"
import { deriveSyntaxCheckpoints } from "../guided/guidedSyntax"
import { derivePlaintextStarter } from "../content/plaintextStarter"

function nodeTypes(node: Nodes): string[] {
  const children = "children" in node ? (node as Parents).children : []
  return [node.type, ...children.flatMap((child) => nodeTypes(child as Nodes))]
}

describe("the product reads one Markdown dialect", () => {
  // The dialect is only worth declaring if the surfaces that answer the
  // learner actually speak it. Grading (`parseMarkdown`) and the card's blank
  // derivation (`deriveSyntaxCheckpoints`) are asserted here alongside the
  // parser itself: before this module existed those two parsed plain
  // CommonMark while the rendered document parsed GFM, so the app could show
  // a table it could neither grade nor teach.
  const gfmSamples = {
    table: "| Item | Qty |\n| --- | --- |\n| Apple | 2 |",
    taskList: "- [ ] Water the plants\n- [x] Take out the recycling",
    strikethrough: "The meeting is ~~Friday~~ Monday.",
    autolink: "Docs live at https://example.com for now.",
  } as const

  test("parses GFM constructs", () => {
    expect(nodeTypes(parseMarkdownSource(gfmSamples.table))).toContain("table")
    const taskItems = parseMarkdownSource(gfmSamples.taskList)
    expect(JSON.stringify(taskItems)).toContain('"checked":true')
    expect(JSON.stringify(taskItems)).toContain('"checked":false')
    expect(nodeTypes(parseMarkdownSource(gfmSamples.strikethrough))).toContain(
      "delete",
    )
    expect(nodeTypes(parseMarkdownSource(gfmSamples.autolink))).toContain("link")
  })

  test("grading reads the same dialect", () => {
    expect(nodeTypes(parseMarkdown(gfmSamples.table))).toContain("table")
    expect(nodeTypes(parseMarkdown(gfmSamples.strikethrough))).toContain("delete")
  })

  test("the card's blank derivation reads the same dialect", () => {
    // A table is one block to CommonMark (a paragraph of pipes) and a `table`
    // node to GFM. The derivation only sees the difference through the shared
    // parser, so this is the behavioural half of the source guard below.
    const paragraphOnly = deriveSyntaxCheckpoints(
      "Plain sentence with no marks.",
      "",
    )
    expect(paragraphOnly).toHaveLength(0)
    expect(
      nodeTypes(parseMarkdownSource(gfmSamples.taskList)).filter(
        (type) => type === "listItem",
      ),
    ).toHaveLength(2)
  })

  test("a table starter keeps its cells apart and its lines in place", () => {
    // Enabling GFM makes a table a tree of cells on one source line. Without
    // the row case in the starter projection they concatenate — `| Item | Qty |`
    // becomes `ItemQty` — and the blank guides, which zip the starter to the
    // target line by line, would be reading merged words.
    expect(
      derivePlaintextStarter("| Item | Qty |\n| --- | --- |\n| Apple | 2 |"),
    ).toBe("Item Qty\n\nApple 2")
    // The pass case: a paragraph that merely contains a bar is not a table and
    // must not gain a space.
    expect(derivePlaintextStarter("Compare A | B")).toBe("Compare A | B")
  })

  test("a bare address is not turned into a blank", () => {
    // Enabling GFM makes `https://example.com` a link node. Without the guard
    // in `markLinkPunctuation` the derivation masks its first character and
    // the card asks the learner to type `h`. The bracketed link beside it is
    // the pass case: the guard must not stop teaching real link punctuation.
    expect(
      deriveSyntaxCheckpoints("Docs live at https://example.com now.", ""),
    ).toEqual([])
    expect(
      deriveSyntaxCheckpoints("Docs live at <https://example.com> now.", ""),
    ).toEqual([])
    const bracketed = deriveSyntaxCheckpoints(
      "Docs live at [the guide](https://example.com) now.",
      "",
    )
    expect(bracketed).toHaveLength(1)
    expect(bracketed[0]?.canonicalInput).toBe("[]()")
  })

  test("a single tilde stays literal text", () => {
    // GitHub does not treat `~one~` as strikethrough. The constant and the
    // behaviour are asserted together so flipping one without the other fails.
    expect(GFM_OPTIONS.singleTilde).toBe(false)
    expect(nodeTypes(parseMarkdownSource("A ~single~ tilde."))).not.toContain(
      "delete",
    )
    expect(nodeTypes(parseMarkdown("A ~single~ tilde."))).not.toContain("delete")
  })
})

describe("turning GFM on did not move the published bank", () => {
  // Every surface reads the parse tree and nothing else, so identical trees
  // are a sufficient proof that no published problem is graded, taught, or
  // rendered differently than before this module existed. Comparing the two
  // dialects here — rather than comparing digests across two commits — keeps
  // the proof inside one checkout, where anyone can re-run it.
  const published = Object.values(runtimeProjections.levels).flat() as {
    id: string
    target: string
  }[]

  test("the published set is the size the bank reports", () => {
    // Guards the assertion below against silently iterating nothing.
    expect(published.length).toBe(publishedProblemIds.length)
    expect(published.length).toBeGreaterThan(300)
  })

  test("every published target parses the same either way", () => {
    const differing = published
      .filter(
        (problem) =>
          JSON.stringify(parseMarkdownSource(problem.target)) !==
          JSON.stringify(fromMarkdown(problem.target)),
      )
      .map((problem) => problem.id)

    // When this fails, the question is not "which digest do I update" but
    // "does this problem deliberately teach a GFM syntax?" A batch that adds
    // tables, task lists, or strikethrough is expected to land here and the
    // ids belong in an explicit allowance with the batch that introduced
    // them. Anything else is a problem whose grading just changed under it —
    // take it to the curriculum owner (동준) before allowing it.
    expect(differing, "targets that parse differently under GFM").toEqual([])
  })
})

const sourceRoot = `${resolve(process.cwd(), "src")}/`

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}${entry.name}`
    if (entry.isDirectory()) return sourceFiles(`${path}/`)
    if (!/\.tsx?$/.test(entry.name)) return []
    if (/\.test\.tsx?$/.test(entry.name)) return []
    return [path]
  })
}

describe("no surface declares its own Markdown dialect", () => {
  // What this guard covers: application sources under `src/`, excluding test
  // files (a differential test legitimately needs a second parser to compare
  // against). What it does NOT cover: `scripts/`, `tests/e2e/`, and anything
  // that reaches a Markdown parser through a dependency rather than an
  // import. Those are named here so a later leak is a known gap and not a
  // surprise.
  const parserModule = `${sourceRoot}markdown/parser.ts`
  const files = sourceFiles(sourceRoot).filter((path) => path !== parserModule)

  test("scans a plausible number of files", () => {
    // A path mistake would make every assertion below vacuously pass.
    expect(files.length).toBeGreaterThan(40)
    expect(files).toContain(`${sourceRoot}engine/markdownAst.ts`)
    expect(files).toContain(`${sourceRoot}guided/guidedSyntax.ts`)
  })

  test.each([
    "mdast-util-from-markdown",
    "micromark-extension-gfm",
    "mdast-util-gfm",
  ])("only the parser module imports %s", (packageName) => {
    const offenders = files.filter((path) =>
      new RegExp(`from "${packageName}"`).test(readFileSync(path, "utf8")),
    )
    expect(offenders.map((path) => path.slice(sourceRoot.length))).toEqual([])
  })

  test("a remark-gfm consumer spends the shared options", () => {
    const consumers = files.filter((path) =>
      /from "remark-gfm"/.test(readFileSync(path, "utf8")),
    )
    // react-markdown takes a remark plugin rather than micromark extensions,
    // so it cannot call the shared parser — it must still spend the shared
    // option value instead of restating one.
    expect(consumers.length).toBeGreaterThan(0)
    for (const path of consumers) {
      const contents = readFileSync(path, "utf8")
      expect(contents, path).toContain("GFM_OPTIONS")
      expect(contents, path).not.toMatch(/singleTilde/)
    }
  })
})
