import type { FixtureRole, ProblemFixture } from "../types"
import {
  codeBlockBatch014Problems,
  codeBlockRebuildInputs,
} from "./codeBlockBatch014Problems"
import type { CodeBlockRebuildInput } from "./codeBlockBatch014Problems"

function fixtureKind(role: FixtureRole): ProblemFixture["kind"] {
  switch (role) {
    case "canonical":
      return "canonical"
    case "different-prose":
      return "alternate"
    case "case-spelling-variation":
      return "case-variation"
    case "missing":
      return "missing"
    case "malformed":
      return "malformed"
    case "matched-with-review":
      return "matched-with-refinement"
    case "edge-case":
      return "normalized-whitespace"
  }
}

type FixtureInput = {
  suffix: string
  role: FixtureRole
  source: string
  expectedStatus: ProblemFixture["expectedStatus"]
  expectedFeedbackId?: string
  exercisesCheckId?: string
  expectedReviewIds?: readonly string[]
}

function materializeFixtures(
  problem: (typeof codeBlockBatch014Problems)[number],
  fixtures: readonly FixtureInput[],
): ProblemFixture[] {
  return fixtures.map((fixture) => ({
    id: `${problem.id}-${fixture.suffix}`,
    problemId: problem.id,
    problemRevision: problem.revision,
    role: fixture.role,
    kind: fixtureKind(fixture.role),
    source: fixture.source,
    expectedStatus: fixture.expectedStatus,
    ...(fixture.expectedFeedbackId
      ? { expectedFeedbackId: fixture.expectedFeedbackId }
      : {}),
    ...(fixture.exercisesCheckId
      ? { exercisesCheckId: fixture.exercisesCheckId }
      : {}),
    ...(fixture.expectedReviewIds
      ? { expectedReviewIds: fixture.expectedReviewIds }
      : {}),
  }))
}

function fenced(value: string, marker = "```") {
  return `${marker}\n${value}\n${marker}`
}

function withLanguageTag(source: string) {
  return source.replace("```\n", "```txt\n")
}

function withLongClosingFence(source: string) {
  const closingIndex = source.lastIndexOf("```")
  return `${source.slice(0, closingIndex)}\`\`\`\`${source.slice(closingIndex + 3)}`
}

function withoutClosingFence(source: string) {
  const closingIndex = source.lastIndexOf("```")
  return source.slice(0, closingIndex).trimEnd()
}

function replaceCodeBlock(source: string, replacement: string) {
  return source.replace(/```[^\n]*\n[\s\S]*?\n```/, replacement)
}

function l1Fixtures(
  problem: (typeof codeBlockBatch014Problems)[number],
  index: number,
): ProblemFixture[] {
  const checkId = "use-closed-code-block"
  const alternate = `Different everyday words ${index + 1}`
  const fail = {
    expectedStatus: "fail" as const,
    expectedFeedbackId: checkId,
    exercisesCheckId: checkId,
  }
  return materializeFixtures(problem, [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: fenced(alternate), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: fenced(`MISPELED WORDS ${index + 1}`), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "tilde-fence", role: "edge-case", source: fenced(alternate, "~~~"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "long-closing-fence", role: "edge-case", source: withLongClosingFence(fenced(alternate)), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "language-tag", role: "edge-case", source: withLanguageTag(fenced(alternate)), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "cr-only-lines", role: "edge-case", source: fenced(alternate).replace(/\n/g, "\r"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "comment-literal", role: "edge-case", source: fenced("<!-- shown as code -->"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "null-plus-visible", role: "edge-case", source: fenced(`\u0000${alternate}`), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "opener-null-literal-replacement", role: "edge-case", source: "```\u0000\n\uFFFD\n```", expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "blockquote-container", role: "edge-case", source: `> \`\`\`\n> ${alternate}\n> \`\`\``, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "ordered-list-container", role: "edge-case", source: `1.   \`\`\`\n     ${alternate}\n     \`\`\``, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing", role: "missing", source: alternate, ...fail },
    { suffix: "unclosed-fence", role: "malformed", source: `\`\`\`\n${alternate}`, ...fail },
    { suffix: "short-closing-fence", role: "edge-case", source: `\`\`\`\`\n${alternate}\n\`\`\``, ...fail },
    { suffix: "wrong-closing-marker", role: "edge-case", source: `\`\`\`\n${alternate}\n~~~`, ...fail },
    { suffix: "blockquote-prefixed-content-lookalike", role: "edge-case", source: `\`\`\`\n${alternate}\n> \`\`\``, ...fail },
    { suffix: "empty-fence", role: "edge-case", source: "```\n\n```", ...fail },
    { suffix: "whitespace-fence", role: "edge-case", source: "```\n  \t \n```", ...fail },
    { suffix: "zero-width-fence", role: "edge-case", source: "```\n\u200B\n```", ...fail },
    { suffix: "default-ignorable-fence", role: "edge-case", source: "```\n\uFEFF\u2060\n```", ...fail },
    { suffix: "null-only-fence", role: "edge-case", source: "```\n\u0000\n```", ...fail },
    { suffix: "inline-lookalike", role: "edge-case", source: `\`${alternate}\``, ...fail },
    { suffix: "outside-comment", role: "edge-case", source: "<!-- hidden outside code -->", ...fail },
    { suffix: "raw-html-lookalike", role: "edge-case", source: `<pre><code>${alternate}</code></pre>`, ...fail },
    { suffix: "indented-code", role: "edge-case", source: `    ${alternate}`, ...fail },
    { suffix: "matched-review", role: "matched-with-review", source: `${problem.target}\n\n\`\`\`\nOne extra block\n\`\`\``, expectedStatus: "matched", expectedReviewIds: ["keep-one-code-block"] },
  ])
}

function varyCaseAndSpelling(source: string, index: number): string {
  const words = [...source.matchAll(/[A-Za-z]{4,}/g)]
  const selected = words[(index * 3 + 1) % words.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Rebuild source has no word to vary")
  }
  const changed = selected[0].toUpperCase().slice(0, -1)
  return `${source.slice(0, selected.index)}${changed}${source.slice(selected.index + selected[0].length)}`
}

function withoutH1(source: string) {
  return source.replace(/^# /, "")
}

function withWrongOrder(source: string, family: CodeBlockRebuildInput["family"]) {
  if (family === "sample-note") {
    const match = source.match(/^(# .+)\n\n(.+)\n\n(```[\s\S]+```)*$/)
    if (!match) throw new Error("Unexpected sample-note target")
    return `${match[1]}\n\n${match[3]}\n\n${match[2]}`
  }
  const match = source.match(/^(# .+)\n\n(```[\s\S]+?```)\n\n([\s\S]+)$/)
  if (!match) throw new Error("Unexpected reference target")
  return `${match[2]}\n\n${match[1]}\n\n${match[3]}`
}

function withNestedExtraCode(
  source: string,
  family: CodeBlockRebuildInput["family"],
) {
  if (family === "sample-note") {
    return source.replace(
      /^(> .+)$/m,
      "$1\n>\n> ```\n> One extra block\n> ```",
    )
  }
  return source.replace(/^(- |1\. )(.+)$/m, (_, marker: string, text: string) => {
    const indent = " ".repeat(marker.length)
    return `${marker}${text}\n\n${indent}\`\`\`\n${indent}One extra block\n${indent}\`\`\``
  })
}

function swapListKind(source: string, ordered: boolean) {
  let item = 0
  return ordered
    ? source.replace(/^\d+\. /gm, "- ")
    : source.replace(/^- /gm, () => `${(item += 1)}. `)
}

function shortenList(source: string) {
  const lines = source.split("\n")
  let retained = false
  return lines
    .filter((line) => {
      if (!/^(?:- |\d+\. )/.test(line)) return true
      if (!retained) {
        retained = true
        return true
      }
      return false
    })
    .join("\n")
}

function rebuildFixtures(
  problem: (typeof codeBlockBatch014Problems)[number],
  inputIndex: number,
): ProblemFixture[] {
  const input = codeBlockRebuildInputs[inputIndex]!
  const siblings = codeBlockRebuildInputs.filter(
    (candidate) => candidate.family === input.family,
  )
  const siblingIndex = siblings.findIndex((candidate) => candidate.id === input.id)
  const alternate = siblings[(siblingIndex + 1) % siblings.length]!.target
  const shapeId = `${problem.id}-shape`
  const codeId = `${problem.id}-code`
  const quoteId = `${problem.id}-quote`
  const listId = `${problem.id}-list`
  const common: FixtureInput[] = [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternate, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(problem.target, inputIndex), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "tilde-fence", role: "edge-case", source: problem.target.split("```").join("~~~"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "long-closing-fence", role: "edge-case", source: withLongClosingFence(problem.target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "language-tag", role: "edge-case", source: withLanguageTag(problem.target), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "cr-only-lines", role: "edge-case", source: problem.target.replace(/\n/g, "\r"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "comment-literal", role: "edge-case", source: replaceCodeBlock(problem.target, fenced("<!-- shown as code -->")), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "opener-null-literal-replacement", role: "edge-case", source: replaceCodeBlock(problem.target, "```\u0000\n\uFFFD\n```"), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutH1(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "wrong-order", role: "edge-case", source: withWrongOrder(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "extra-block", role: "edge-case", source: `${problem.target}\n\nExtra paragraph.`, expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "unclosed-fence", role: "malformed", source: withoutClosingFence(problem.target), expectedStatus: "fail", expectedFeedbackId: input.family === "sample-note" ? codeId : shapeId, exercisesCheckId: input.family === "sample-note" ? codeId : shapeId },
    { suffix: "empty-fence", role: "edge-case", source: replaceCodeBlock(problem.target, "```\n\n```"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "whitespace-fence", role: "edge-case", source: replaceCodeBlock(problem.target, "```\n \t \n```"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "zero-width-fence", role: "edge-case", source: replaceCodeBlock(problem.target, "```\n\u200B\n```"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "default-ignorable-fence", role: "edge-case", source: replaceCodeBlock(problem.target, "```\n\uFEFF\u2060\n```"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "null-only-fence", role: "edge-case", source: replaceCodeBlock(problem.target, "```\n\u0000\n```"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "outside-comment-lookalike", role: "edge-case", source: replaceCodeBlock(problem.target, "<!-- hidden outside code -->"), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "inline-lookalike", role: "edge-case", source: replaceCodeBlock(problem.target, "`copy-ready text`"), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "raw-html-lookalike", role: "edge-case", source: replaceCodeBlock(problem.target, "<pre><code>copy-ready text</code></pre>"), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "indented-code", role: "edge-case", source: replaceCodeBlock(problem.target, "    copy-ready text"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
    { suffix: "matched-review", role: "matched-with-review", source: withNestedExtraCode(problem.target, input.family), expectedStatus: "matched", expectedReviewIds: ["keep-one-code-block"] },
  ]

  if (input.family === "sample-note") {
    return materializeFixtures(problem, [
      ...common,
      {
        suffix: "empty-quote",
        role: "edge-case",
        source: problem.target.replace(/^> .+$/m, ">"),
        expectedStatus: "fail",
        expectedFeedbackId: quoteId,
        exercisesCheckId: quoteId,
      },
    ])
  }

  return materializeFixtures(problem, [
    ...common,
    { suffix: "wrong-list-kind", role: "edge-case", source: swapListKind(problem.target, input.family === "numbered-routine"), expectedStatus: "fail", expectedFeedbackId: listId, exercisesCheckId: listId },
    { suffix: "short-list", role: "edge-case", source: shortenList(problem.target), expectedStatus: "fail", expectedFeedbackId: listId, exercisesCheckId: listId },
  ])
}

export const codeBlockBatch014Fixtures: readonly ProblemFixture[] =
  codeBlockBatch014Problems.flatMap((problem, index) =>
    problem.level === 1
      ? l1Fixtures(problem, index)
      : rebuildFixtures(problem, index - 12),
  )
