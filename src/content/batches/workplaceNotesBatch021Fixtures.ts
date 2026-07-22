import type { FixtureRole, ProblemFixture } from "../types"
import {
  workplaceNotesBatch021Inputs,
  type WorkplaceNoteFamily,
  type WorkplaceNotesBatch021Input,
} from "./workplaceNotesBatch021Problems"

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

const matched = {
  expectedStatus: "matched" as const,
  expectedReviewIds: [] as const,
}

/** Strips every Markdown mark the learner is asked to restore. */
function stripMarks(target: string): string {
  return target
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6} /, "")
        .replace(/^> /, "")
        .replace(/^- /, "")
        .replace(/^\d+\. /, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, ""),
    )
    .join("\n")
}

function differentProse(
  family: WorkplaceNoteFamily,
  index: number,
): string {
  const word = ["Alpha", "Beta", "Gamma"][index % 3]!
  switch (family) {
    case "handoff":
      return `# ${word} desk swap notes\n\nShort ${word.toLowerCase()} notes from one crew to the next.\n\n## Today\n\n- ${word} chairs counted\n- ${word} boards wiped\n\n## Tomorrow\n\n- Refill the ${word.toLowerCase()} tray\n- Check the ${word.toLowerCase()} locks`
    case "decision":
      return `# ${word} routine change\n\nThe ${word.toLowerCase()} routine moves this week.\n\n## Decision\n\n> Follow the ${word.toLowerCase()} routine every morning.\n\n## Steps\n\n1. Read the ${word.toLowerCase()} note\n2. Follow each part\n3. Tell the next person`
    case "checklist":
      return `# ${word} closing list\n\nThree ${word.toLowerCase()} things before leaving.\n\n## Before you leave\n\n- Close the ${word.toLowerCase()} drawer\n- Run \`${word.toLowerCase()} stop\` on the machine\n- Cover the ${word.toLowerCase()} bench`
    case "status":
      return `# ${word} project status\n\nThe ${word.toLowerCase()} piece shipped. **Review closes soon.**\n\n## Done\n\n- ${word} draft finished\n- ${word} copy checked\n\n## Next\n\n1. Share the ${word.toLowerCase()} notes\n2. Update the ${word.toLowerCase()} page`
  }
}

/** Italicizes the first word of the context sentence without moving blocks. */
function italicizeContextWord(target: string): string {
  const lines = target.split("\n")
  lines[2] = lines[2]!.replace(/^(\S+)/, "*$1*")
  return lines.join("\n")
}

function overLimit(input: WorkplaceNotesBatch021Input): string {
  const extraItems = Array.from(
    { length: 8 },
    (_, index) => `- Extra reminder line ${index + 1}`,
  ).join("\n")
  return `${input.target}\n${extraItems}`
}

function removeSecondSection(target: string): string {
  const lines = target.split("\n")
  const headingIndexes = lines
    .map((line, index) => (line.startsWith("## ") ? index : -1))
    .filter((index) => index >= 0)
  const removeAt = headingIndexes.at(-1)!
  return lines.filter((_, index) => index !== removeAt).join("\n")
}

function skipFirstSectionDepth(target: string): string {
  let replaced = false
  return target
    .split("\n")
    .map((line) => {
      if (!replaced && line.startsWith("## ")) {
        replaced = true
        return `###${line.slice(2)}`
      }
      return line
    })
    .join("\n")
}

function familyFixtures(
  input: WorkplaceNotesBatch021Input,
  index: number,
): readonly FixtureInput[] {
  const id = input.id
  const outline = `${id}-outline`
  const shared: FixtureInput[] = [
    { suffix: "canonical", role: "canonical", source: input.target, ...matched },
    {
      suffix: "different-prose",
      role: "different-prose",
      source: differentProse(input.family, index),
      ...matched,
    },
    {
      suffix: "case-spelling",
      role: "case-spelling-variation",
      source: input.target.toUpperCase(),
      ...matched,
    },
    {
      suffix: "missing",
      role: "missing",
      source: stripMarks(input.target),
      expectedStatus: "fail",
      expectedFeedbackId: outline,
      exercisesCheckId: outline,
    },
    {
      suffix: "italic-aside",
      role: "matched-with-review",
      source: italicizeContextWord(input.target),
      expectedStatus: "matched",
      expectedReviewIds: [`${id}-no-italics`],
    },
    {
      suffix: "over-limit",
      role: "edge-case",
      source: overLimit(input),
      expectedStatus: "fail",
      expectedFeedbackId: `${id}-limits`,
      exercisesCheckId: `${id}-limits`,
    },
    {
      suffix: "missing-section",
      role: "edge-case",
      source: removeSecondSection(input.target),
      expectedStatus: "fail",
      expectedFeedbackId: outline,
      exercisesCheckId: `${id}-sections`,
    },
    {
      suffix: "skipped-depth",
      role: "edge-case",
      source: skipFirstSectionDepth(input.target),
      expectedStatus: "fail",
      expectedFeedbackId: outline,
      exercisesCheckId: `${id}-hierarchy`,
    },
    {
      suffix: "crlf",
      role: "edge-case",
      source: input.target.replace(/\n/g, "\r\n"),
      ...matched,
    },
  ]

  switch (input.family) {
    case "handoff":
      return [
        ...shared,
        {
          suffix: "flat-bullets",
          role: "malformed",
          source: input.target.replace(/^- /gm, "-"),
          expectedStatus: "fail",
          expectedFeedbackId: outline,
          exercisesCheckId: outline,
        },
        {
          suffix: "short-today",
          role: "edge-case",
          source: input.target.replace(/(## Today\n\n- [^\n]+\n)- [^\n]+/, "$1"),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-today-list`,
          exercisesCheckId: `${id}-today-list`,
        },
        {
          suffix: "short-tomorrow",
          role: "edge-case",
          source: input.target.replace(/(## Tomorrow\n\n- [^\n]+\n)- [^\n]+/, "$1"),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-tomorrow-list`,
          exercisesCheckId: `${id}-tomorrow-list`,
        },
      ]
    case "decision":
      return [
        ...shared,
        {
          suffix: "tight-numbers",
          role: "malformed",
          source: input.target.replace(/^(\d+)\. /gm, "$1."),
          expectedStatus: "fail",
          expectedFeedbackId: outline,
          exercisesCheckId: outline,
        },
        {
          suffix: "plain-decision",
          role: "edge-case",
          source: input.target.replace(/^> /m, ""),
          expectedStatus: "fail",
          expectedFeedbackId: outline,
          exercisesCheckId: `${id}-decision-quote`,
        },
        {
          suffix: "short-steps",
          role: "edge-case",
          source: input.target.replace(/\n3\. [^\n]+$/, ""),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-steps-list`,
          exercisesCheckId: `${id}-steps-list`,
        },
      ]
    case "checklist":
      return [
        ...shared,
        {
          suffix: "plain-command",
          role: "malformed",
          source: input.target.replace(/`/g, ""),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-command-code`,
          exercisesCheckId: `${id}-command-code`,
        },
        {
          suffix: "short-tasks",
          role: "edge-case",
          source: input.target.replace(/\n- [^\n]+$/, ""),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-task-list`,
          exercisesCheckId: `${id}-task-list`,
        },
      ]
    case "status":
      return [
        ...shared,
        {
          suffix: "plain-deadline",
          role: "malformed",
          source: input.target.replace(/\*\*/g, ""),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-bold-note`,
          exercisesCheckId: `${id}-bold-note`,
        },
        {
          suffix: "short-done",
          role: "edge-case",
          source: input.target.replace(/(## Done\n\n- [^\n]+\n)- [^\n]+/, "$1"),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-done-list`,
          exercisesCheckId: `${id}-done-list`,
        },
        {
          suffix: "short-next",
          role: "edge-case",
          source: input.target.replace(/\n2\. [^\n]+$/, ""),
          expectedStatus: "fail",
          expectedFeedbackId: `${id}-next-list`,
          exercisesCheckId: `${id}-next-list`,
        },
      ]
  }
}

export const workplaceNotesBatch021Fixtures: readonly ProblemFixture[] =
  workplaceNotesBatch021Inputs.flatMap((input, index) =>
    familyFixtures(input, index).map((fixture) => ({
      id: `${input.id}-${fixture.suffix}`,
      problemId: input.id,
      problemRevision: 1,
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
    })),
  )
