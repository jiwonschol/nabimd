import { describe, expect, it } from "vitest"
import { deriveSyntaxCheckpoints } from "../guided/guidedSyntax"
import { describeCheckpoint } from "./CenterCard"

function checkpointFor(target: string) {
  const [checkpoint] = deriveSyntaxCheckpoints(target, "")
  if (!checkpoint) throw new Error(`Expected a checkpoint for: ${target}`)
  return checkpoint
}

describe("describeCheckpoint", () => {
  it("names the heading depth outright", () => {
    expect(describeCheckpoint(checkpointFor("# Apple"))).toBe(
      "Give this line its H1 heading marks",
    )
    expect(describeCheckpoint(checkpointFor("### Phase"))).toBe(
      "Give this line its H3 heading marks",
    )
  })

  it("tells italic and bold pairs apart", () => {
    expect(describeCheckpoint(checkpointFor("*Paper boat*"))).toBe(
      "Italicize the phrase",
    )
    expect(describeCheckpoint(checkpointFor("**Important**"))).toBe(
      "Bold the phrase",
    )
  })

  it("labels the remaining families", () => {
    expect(describeCheckpoint(checkpointFor("- Hammers"))).toBe(
      "Mark this line as a bullet item",
    )
    expect(describeCheckpoint(checkpointFor("1. Step"))).toBe(
      "Number this step",
    )
    expect(describeCheckpoint(checkpointFor("> Quote"))).toBe(
      "Quote this line",
    )
    expect(describeCheckpoint(checkpointFor("Use `npm test`."))).toBe(
      "Wrap the code in backticks",
    )
    expect(describeCheckpoint(checkpointFor("```\ncode\n```"))).toBe(
      "Fence the code block",
    )
    expect(describeCheckpoint(checkpointFor("a\n\n---\n\nb"))).toBe(
      "Add the section divider",
    )
    expect(describeCheckpoint(checkpointFor("Use [docs](/a)."))).toBe(
      "Build the link marks",
    )
  })
})
