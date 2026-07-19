import type { FixtureRole, ProblemFixture } from "../types"
import {
  nestedListBatch016Inputs,
  nestedListBatch016Problems,
  type NestedListFamily,
} from "./nestedListBatch016Problems"

type FixtureInput = {
  suffix: string
  role: FixtureRole
  source: string
  expectedStatus: ProblemFixture["expectedStatus"]
  expectedFeedbackId?: string
  exercisesCheckId?: string
  expectedReviewIds?: readonly string[]
}

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

const alternateTargets: readonly string[] = [
  "# Park lunch\n\nPrepare a light meal for the afternoon.\n\n- Chilled food\n  - Orange slices\n  - Yogurt cups\n- Crackers\n- Paper towels",
  "# Class bag\n\nLook through the bag before walking to school.\n\n- Desk tools\n  - Green marker\n  - Eraser\n- Folder\n- Bus pass",
  "# Linen cupboard\n\nGroup the folded items by shelf.\n\n- Upper shelf\n  - Hand towels\n  - Pillowcases\n- Lower shelf\n- Laundry basket",
  "# Market cart\n\nGet a handful of ingredients for supper.\n\n- Vegetables\n  - Bell peppers\n  - Green beans\n- Rice\n- Sesame oil",
  "# Patio pots\n\n## Growing notes\n\nChoose the bright side of the porch.\n\n- Salad pot\n  - Lettuce\n  - Radishes\n- Pepper plant\n- Small trowel",
  "# Listening plan\n\n## This weekend\n\nSpend a little time with music each day.\n\n- Jazz albums\n  - Friday\n  - Sunday\n- Radio play\n- Concert film",
  "# Afternoon errands\n\n## First stops\n\nComplete the short trip before sunset.\n\n- Main street\n  - Pharmacy\n  - Hardware store\n- Produce stand\n- Train station",
  "# Rabbit care\n\n## Morning routine\n\nMake the hutch comfortable before breakfast.\n\n- Food\n  - Add fresh hay\n  - Refill water\n- Quick check\n- Brush fur",
  "# Morning cleanup\n\nClean up the kitchen before leaving home.\n\n1. Gather the dishes\n   1. Stack the bowls\n   2. Collect the mugs\n2. Load the machine\n3. Wipe the counter",
  "# Easy snack\n\nPut together toast with fruit.\n\n1. Prepare the topping\n   1. Slice the banana\n   2. Stir the yogurt\n2. Toast the bread\n3. Add the topping",
  "# Sewing tray\n\nArrange a small place for mending a button.\n\n1. Collect the tools\n   1. Choose a needle\n   2. Find matching thread\n2. Clear the chair\n3. Mend the shirt",
  "# Entryway reset\n\nStraighten the hall before bedtime.\n\n1. Clear the mat\n   1. Store the boots\n   2. Hang the coats\n2. Sweep the floor\n3. Turn off the lamp",
]

function listStart(lines: readonly string[]): number {
  const index = lines.findIndex((line) => /^(?:- |\d+\. )/.test(line))
  if (index < 0) throw new Error("Nested-list target has no top-level list")
  return index
}

function varyCaseAndSpelling(source: string, index: number): string {
  const words = [...source.matchAll(/[A-Za-z]{4,}/g)]
  const selected = words[(index * 3 + 1) % words.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Nested-list source has no word to vary")
  }
  const replacement = `${selected[0].toUpperCase()}${selected[0].slice(1).toLowerCase()}z`
  return `${source.slice(0, selected.index)}${replacement}${source.slice(selected.index + selected[0].length)}`
}

function withAlternativeIndentation(source: string, family: NestedListFamily) {
  return family === "steps"
    ? source.replace(/^   (\d+\. )/gm, "    $1")
    : source.replace(/^  (- )/gm, "    $1")
}

function withAlternativeMarkers(source: string, family: NestedListFamily) {
  if (family === "steps") {
    return source.replace(/^(\d+)\. /gm, "$1) ")
  }
  return source
    .replace(/^- /gm, "* ")
    .replace(/^  - /gm, "  + ")
}

function withMixedChildMarker(source: string, family: NestedListFamily) {
  return family === "steps"
    ? source.replace(/^   \d+\. /gm, "   - ")
    : source.replace(/^  - /gm, "  1. ")
}

function flattenNestedList(source: string, family: NestedListFamily) {
  return family === "steps"
    ? source.replace(/^   (?=\d+\. )/gm, "")
    : source.replace(/^  (?=- )/gm, "")
}

function withInsufficientIndentation(source: string, family: NestedListFamily) {
  return family === "steps"
    ? source.replace(/^   (?=\d+\. )/gm, " ")
    : source.replace(/^  (?=- )/gm, " ")
}

function withExtraRootList(source: string, family: NestedListFamily) {
  return family === "steps"
    ? `${source}\n\n1) Separate task`
    : `${source}\n\n* Separate group`
}

function withThirdListDepth(source: string, family: NestedListFamily) {
  const lines = source.split("\n")
  const nestedIndex = lines.findIndex((line) =>
    family === "steps" ? /^   \d+\. /.test(line) : /^  - /.test(line),
  )
  if (nestedIndex < 0) throw new Error("Nested-list target has no child list")
  lines.splice(
    nestedIndex + 1,
    0,
    family === "steps" ? "      1. Extra detail" : "    - Extra detail",
  )
  return lines.join("\n")
}

function withoutList(source: string) {
  const lines = source.split("\n")
  return lines.slice(0, listStart(lines)).join("\n").trimEnd()
}

function withWrongRootOrder(source: string) {
  const lines = source.split("\n")
  const start = listStart(lines)
  const prefix = lines.slice(0, start)
  const list = lines.slice(start)
  let paragraphIndex = prefix.length - 1
  while (paragraphIndex >= 0 && !prefix[paragraphIndex]!.trim()) {
    paragraphIndex -= 1
  }
  if (paragraphIndex < 0) throw new Error("Nested-list target has no paragraph")
  const paragraph = prefix[paragraphIndex]!
  const headings = prefix.slice(0, paragraphIndex).join("\n").trimEnd()
  return `${headings}\n\n${list.join("\n")}\n\n${paragraph}`
}

function withTooFewRootItems(source: string, family: NestedListFamily) {
  const lines = source.split("\n")
  const start = listStart(lines)
  const rootMarker = family === "steps" ? /^\d+\. / : /^- /
  const kept = [...lines.slice(0, start)]
  let sawRoot = false
  for (const line of lines.slice(start)) {
    if (rootMarker.test(line)) {
      if (sawRoot) break
      sawRoot = true
    }
    kept.push(line)
  }
  return kept.join("\n")
}

function withInvisibleRootItem(source: string, family: NestedListFamily) {
  const rootMarker = family === "steps" ? /^(\d+\. ).+$/m : /^(- ).+$/m
  return source.replace(rootMarker, "$1<!-- hidden -->")
}

function withInvisibleChildItem(
  source: string,
  family: NestedListFamily,
  content: string,
) {
  const childMarker = family === "steps" ? /^(   \d+\. ).+$/m : /^(  - ).+$/m
  return source.replace(childMarker, `$1${content}`)
}

function codeLookalike(source: string, family: NestedListFamily, fenced: boolean) {
  const lines = source.split("\n")
  const start = listStart(lines)
  const prefix = lines.slice(0, start).join("\n").trimEnd()
  const list = lines.slice(start).join("\n")
  if (fenced) return `${prefix}\n\n\`\`\`text\n${list}\n\`\`\``
  return `${prefix}\n\n${list
    .split("\n")
    .map((line) => `    ${line.trimStart()}`)
    .join("\n")}`
}

function blockquoteOnlyNestedList(source: string) {
  const lines = source.split("\n")
  const start = listStart(lines)
  const prefix = lines.slice(0, start).join("\n").trimEnd()
  return `${prefix}\n\n${lines
    .slice(start)
    .map((line) => `> ${line}`)
    .join("\n")}`
}

function withExtraNestedBlock(
  source: string,
  family: NestedListFamily,
  block: "blockquote" | "heading" | "divider" | "code",
) {
  const lines = source.split("\n")
  const start = listStart(lines)
  const rootMarker = family === "steps" ? /^\d+\. / : /^- /
  const nextRootIndex = lines.findIndex(
    (line, index) => index > start && rootMarker.test(line),
  )
  if (nextRootIndex < 0) {
    throw new Error("Nested-list target has no second root item")
  }
  const indent = family === "steps" ? "   " : "  "
  const nestedBlock =
    block === "blockquote"
      ? [`${indent}> Extra note`]
      : block === "heading"
        ? [`${indent}### Extra note`]
        : block === "divider"
          ? [`${indent}***`]
          : [
              `${indent}\`\`\`text`,
              `${indent}sample`,
              `${indent}\`\`\``,
            ]
  lines.splice(nextRootIndex, 0, "", ...nestedBlock, "")
  return lines.join("\n")
}

function materializeFixtures(
  problem: (typeof nestedListBatch016Problems)[number],
  input: (typeof nestedListBatch016Inputs)[number],
  index: number,
): ProblemFixture[] {
  const shapeId = `nested-${input.family}-root-shape`
  const rootListId = `nested-${input.family}-root-list`
  const countId = `nested-${input.family}-list-count`
  const visibleChildId = `nested-${input.family}-visible-child-items`
  const blockquoteId = `nested-${input.family}-no-extra-blockquote`
  const headingId = `nested-${input.family}-no-extra-heading`
  const dividerId = `nested-${input.family}-no-extra-divider`
  const codeId = `nested-${input.family}-no-extra-code`
  const fixtures: readonly FixtureInput[] = [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternateTargets[index]!, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(problem.target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternative-indentation", role: "matched-with-review", source: withAlternativeIndentation(problem.target, input.family), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "alternative-markers", role: "edge-case", source: withAlternativeMarkers(problem.target, input.family), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "mixed-child-marker", role: "edge-case", source: withMixedChildMarker(problem.target, input.family), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "flat-list", role: "missing", source: flattenNestedList(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: countId, exercisesCheckId: countId },
    { suffix: "insufficient-indentation", role: "malformed", source: withInsufficientIndentation(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: countId, exercisesCheckId: countId },
    { suffix: "extra-root-list", role: "edge-case", source: withExtraRootList(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "third-list-depth", role: "edge-case", source: withThirdListDepth(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: countId, exercisesCheckId: countId },
    { suffix: "missing-list", role: "edge-case", source: withoutList(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "wrong-root-order", role: "edge-case", source: withWrongRootOrder(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "too-few-root-items", role: "edge-case", source: withTooFewRootItems(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: rootListId, exercisesCheckId: rootListId },
    { suffix: "invisible-root-item", role: "edge-case", source: withInvisibleRootItem(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: rootListId, exercisesCheckId: rootListId },
    { suffix: "invisible-child-comment", role: "edge-case", source: withInvisibleChildItem(problem.target, input.family, "<!-- hidden -->"), expectedStatus: "fail", expectedFeedbackId: visibleChildId, exercisesCheckId: visibleChildId },
    { suffix: "invisible-child-default-ignorable", role: "edge-case", source: withInvisibleChildItem(problem.target, input.family, "\u200B"), expectedStatus: "fail", expectedFeedbackId: visibleChildId, exercisesCheckId: visibleChildId },
    { suffix: "invisible-child-null", role: "edge-case", source: withInvisibleChildItem(problem.target, input.family, "\u0000"), expectedStatus: "fail", expectedFeedbackId: visibleChildId, exercisesCheckId: visibleChildId },
    { suffix: "extra-root-block", role: "edge-case", source: `${problem.target}\n\nExtra note.`, expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "fenced-code-lookalike", role: "edge-case", source: codeLookalike(problem.target, input.family, true), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "indented-code-lookalike", role: "edge-case", source: codeLookalike(problem.target, input.family, false), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "blockquote-only-nested-list", role: "edge-case", source: blockquoteOnlyNestedList(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "extra-nested-blockquote", role: "edge-case", source: withExtraNestedBlock(problem.target, input.family, "blockquote"), expectedStatus: "fail", expectedFeedbackId: blockquoteId, exercisesCheckId: blockquoteId },
    { suffix: "extra-nested-heading", role: "edge-case", source: withExtraNestedBlock(problem.target, input.family, "heading"), expectedStatus: "fail", expectedFeedbackId: headingId, exercisesCheckId: headingId },
    { suffix: "extra-nested-divider", role: "edge-case", source: withExtraNestedBlock(problem.target, input.family, "divider"), expectedStatus: "fail", expectedFeedbackId: dividerId, exercisesCheckId: dividerId },
    { suffix: "extra-nested-code", role: "edge-case", source: withExtraNestedBlock(problem.target, input.family, "code"), expectedStatus: "fail", expectedFeedbackId: codeId, exercisesCheckId: codeId },
  ]

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

export const nestedListBatch016Fixtures: readonly ProblemFixture[] =
  nestedListBatch016Problems.flatMap((problem, index) =>
    materializeFixtures(problem, nestedListBatch016Inputs[index]!, index),
  )
