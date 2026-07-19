import type { FixtureRole, ProblemFixture } from "../types"
import {
  headingDepthBatch015Problems,
  headingDepthLevel1Inputs,
  headingDepthLevel2Inputs,
} from "./headingDepthBatch015Problems"
import type { HeadingDepthLevel2Input } from "./headingDepthBatch015Problems"

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
  problem: (typeof headingDepthBatch015Problems)[number],
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

function l1Fixtures(
  problem: (typeof headingDepthBatch015Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = headingDepthLevel1Inputs[index]!
  const hashes = "#".repeat(input.depth)
  const words = input.goal.slice(input.depth + 1)
  const spacingId = `${problem.id}-spacing`
  const styleId = `${problem.id}-hash-style`
  const shapeId = `${problem.id}-shape`
  const wrongDepth = input.depth === 6 ? 5 : input.depth + 1
  const fixtures: FixtureInput[] = [
    {
      suffix: "canonical",
      role: "canonical",
      source: problem.target,
      expectedStatus: "matched",
      exercisesCheckId: styleId,
      expectedReviewIds: [],
    },
    {
      suffix: "different-prose",
      role: "different-prose",
      source: `${hashes} ${words.toLowerCase()} plan ${index + 1}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "case-spelling",
      role: "case-spelling-variation",
      source: `${hashes} ${words.toUpperCase()}Z`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "tab-separator",
      role: "edge-case",
      source: `${hashes}\t${words} tab`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "one-leading-space",
      role: "edge-case",
      source: ` ${hashes} ${words}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "two-leading-spaces",
      role: "edge-case",
      source: `  ${hashes} ${words}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "three-leading-spaces",
      role: "edge-case",
      source: `   ${hashes} ${words}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "multiple-space-separator",
      role: "edge-case",
      source: `${hashes}   ${words}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "closing-hashes",
      role: "edge-case",
      source: `${hashes} ${words} ${hashes}`,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "empty-atx-heading",
      role: "edge-case",
      source: hashes,
      expectedStatus: "matched",
      expectedReviewIds: [],
    },
    {
      suffix: "missing-space",
      role: "malformed",
      source: `${hashes}${words}`,
      expectedStatus: "fail",
      expectedFeedbackId: spacingId,
      exercisesCheckId: spacingId,
    },
    {
      suffix: "plain-text-missing-heading",
      role: "missing",
      source: words,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "wrong-depth",
      role: "edge-case",
      source: `${"#".repeat(wrongDepth)} ${words}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "extra-block",
      role: "edge-case",
      source: `${problem.target}\n\nExtra note ${index + 1}.`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "escaped-hashes",
      role: "edge-case",
      source: `\\${hashes} ${words}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "fenced-code-lookalike",
      role: "edge-case",
      source: `\`\`\`\n${problem.target}\n\`\`\``,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "four-space-indented",
      role: "edge-case",
      source: `    ${problem.target}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "seven-hashes",
      role: "edge-case",
      source: `####### ${words}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "fullwidth-hashes",
      role: "edge-case",
      source: `${"＃".repeat(input.depth)} ${words}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "raw-html-heading",
      role: "edge-case",
      source: `<h${input.depth}>${words}</h${input.depth}>`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "nested-heading",
      role: "edge-case",
      source: `> ${problem.target}`,
      expectedStatus: "fail",
      expectedFeedbackId: shapeId,
      exercisesCheckId: shapeId,
    },
    {
      suffix: "matched-review",
      role: "matched-with-review",
      source: `${hashes} *${words}*`,
      expectedStatus: "matched",
      expectedReviewIds: ["keep-heading-plain"],
    },
  ]
  if (input.depth === 2) {
    fixtures.push({
      suffix: "setext-h2",
      role: "edge-case",
      source: `${words}\n---`,
      expectedStatus: "fail",
      expectedFeedbackId: styleId,
      exercisesCheckId: styleId,
    })
  }
  return materializeFixtures(problem, fixtures)
}

const alternateTargets: readonly string[] = [
  "# Wash the wagon\n\nWork where the pavement is cool.\n\n## Method\n\n1. Spray off dust\n2. Wipe the doors\n3. Polish the glass",
  "# Reading tent\n\nMake a quiet nook near the couch.\n\n## Method\n\n1. Place two stools\n2. Spread a quilt\n3. Bring a cushion",
  "# Seed station\n\nRestock the tray before sunrise.\n\n## Method\n\n1. Lift the top\n2. Add fresh grain\n3. Return it to the hook",
  "# Letter piles\n\nUse an empty counter for the envelopes.\n\n## Method\n\n1. Read the labels\n2. Stack each group\n3. Toss old ads",
  "# Lake swim\n\n## Bag\n\nLeave the gear beside the stairs.\n\n- Beach towel\n- Drink bottle\n- Sun hat",
  "# Paint afternoon\n\n## Materials\n\nProtect the desk before mixing colors.\n\n- Card stock\n- Paint cups\n- Spare cloth",
  "# Cookie stand\n\n## Counter kit\n\nKeep these supplies near the trays.\n\n- Menu signs\n- Wax bags\n- Coin roll",
  "# Tire check\n\n## Gear\n\nPlace the tools near the back wheel.\n\n- Floor pump\n- Repair patch\n- Shop cloth",
  "# Missing items\n\n## Red cap\n\nSomeone found it beside the side gate.\n\n### Collection note\n\n> Visit the office after lunch.",
  "# Story exchange\n\n## Sunday shelf\n\nChoose one clean book to trade.\n\n### Small reminder\n\n> Add your initials near the back.",
  "# Shuttle notice\n\n## Different curb\n\nThe early ride meets beside Cedar Avenue.\n\n### Passenger note\n\n> Come a few minutes ahead.",
  "# Stage show\n\n## Outfit return\n\nTake every outfit to the band room.\n\n### Performer note\n\n> Mark each tote with its owner.",
]

function varyCaseAndSpelling(source: string, index: number): string {
  const words = [...source.matchAll(/[A-Za-z]{4,}/g)]
  const selected = words[(index * 5 + 2) % words.length]
  if (!selected || selected.index === undefined) {
    throw new Error("Sectioned source has no word to vary")
  }
  const replacement = `${selected[0].toUpperCase().slice(0, -1)}Z`
  return `${source.slice(0, selected.index)}${replacement}${source.slice(selected.index + selected[0].length)}`
}

function withoutFirstHeading(source: string): string {
  return source.replace(/^# .+\n\n/, "")
}

function withSkippedHierarchy(source: string): string {
  return source.replace(/^## /m, "### ")
}

function withWrongOrder(
  source: string,
  family: HeadingDepthLevel2Input["family"],
): string {
  const blocks = source.split("\n\n")
  if (family === "sectioned-process") {
    return [blocks[0], blocks[2], blocks[1], blocks[3]].join("\n\n")
  }
  if (family === "sectioned-checklist") {
    return [blocks[0], blocks[2], blocks[1], blocks[3]].join("\n\n")
  }
  return [blocks[0], blocks[1], blocks[3], blocks[2], blocks[4]].join("\n\n")
}

function withoutParagraph(
  source: string,
  family: HeadingDepthLevel2Input["family"],
): string {
  const blocks = source.split("\n\n")
  const paragraphIndex = family === "sectioned-process" ? 1 : 2
  return blocks.filter((_, index) => index !== paragraphIndex).join("\n\n")
}

function swapListKind(source: string, ordered: boolean): string {
  let item = 0
  return ordered
    ? source.replace(/^\d+\. /gm, "- ")
    : source.replace(/^- /gm, () => `${(item += 1)}. `)
}

function shortenList(source: string): string {
  let kept = false
  return source
    .split("\n")
    .filter((line) => {
      if (!/^(?:- |\d+\. )/.test(line)) return true
      if (kept) return false
      kept = true
      return true
    })
    .join("\n")
}

function emptyFirstListItem(source: string): string {
  return source.replace(/^(?:- |\d+\. ).+$/m, (line) =>
    line.startsWith("-") ? "- " : `${line.match(/^\d+\./)![0]} `,
  )
}

function emphasizeParagraph(
  source: string,
  family: HeadingDepthLevel2Input["family"],
): string {
  const blocks = source.split("\n\n")
  const paragraphIndex = family === "sectioned-process" ? 1 : 2
  blocks[paragraphIndex] = `*${blocks[paragraphIndex]}*`
  return blocks.join("\n\n")
}

function level2Fixtures(
  problem: (typeof headingDepthBatch015Problems)[number],
  index: number,
): ProblemFixture[] {
  const input = headingDepthLevel2Inputs[index]!
  const hierarchyId = `${problem.id}-hierarchy`
  const shapeId = `${problem.id}-shape`
  const contentId = `${problem.id}-${input.family === "sectioned-message" ? "quote" : "list"}`
  const common: FixtureInput[] = [
    { suffix: "canonical", role: "canonical", source: problem.target, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "different-prose", role: "different-prose", source: alternateTargets[index]!, expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "case-spelling", role: "case-spelling-variation", source: varyCaseAndSpelling(problem.target, index), expectedStatus: "matched", expectedReviewIds: [] },
    { suffix: "missing-title", role: "missing", source: withoutFirstHeading(problem.target), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "wrong-depth", role: "malformed", source: withSkippedHierarchy(problem.target), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "skipped-hierarchy", role: "edge-case", source: withSkippedHierarchy(alternateTargets[index]!), expectedStatus: "fail", expectedFeedbackId: hierarchyId, exercisesCheckId: hierarchyId },
    { suffix: "wrong-order", role: "edge-case", source: withWrongOrder(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "missing-paragraph", role: "edge-case", source: withoutParagraph(problem.target, input.family), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "extra-block", role: "edge-case", source: `${problem.target}\n\nExtra note ${index + 1}.`, expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    { suffix: "matched-review", role: "matched-with-review", source: emphasizeParagraph(problem.target, input.family), expectedStatus: "matched", expectedReviewIds: ["keep-heading-plain"] },
  ]

  if (input.family === "sectioned-message") {
    common.push(
      { suffix: "empty-quote", role: "edge-case", source: problem.target.replace(/^> .+$/m, ">"), expectedStatus: "fail", expectedFeedbackId: contentId, exercisesCheckId: contentId },
      { suffix: "missing-quote", role: "edge-case", source: problem.target.replace(/\n\n> .+$/, ""), expectedStatus: "fail", expectedFeedbackId: shapeId, exercisesCheckId: shapeId },
    )
  } else {
    const ordered = input.family === "sectioned-process"
    common.push(
      { suffix: "wrong-list-kind", role: "edge-case", source: swapListKind(problem.target, ordered), expectedStatus: "fail", expectedFeedbackId: contentId, exercisesCheckId: contentId },
      { suffix: "too-few-items", role: "edge-case", source: shortenList(problem.target), expectedStatus: "fail", expectedFeedbackId: contentId, exercisesCheckId: contentId },
      { suffix: "empty-list-item", role: "edge-case", source: emptyFirstListItem(problem.target), expectedStatus: "fail", expectedFeedbackId: contentId, exercisesCheckId: contentId },
    )
  }
  return materializeFixtures(problem, common)
}

const levelOneProblems = headingDepthBatch015Problems.filter(
  (problem) => problem.level === 1,
)
const levelTwoProblems = headingDepthBatch015Problems.filter(
  (problem) => problem.level === 2,
)

export const headingDepthBatch015Fixtures: readonly ProblemFixture[] = [
  ...levelOneProblems.flatMap(l1Fixtures),
  ...levelTwoProblems.flatMap(level2Fixtures),
]
