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
    expect(describeCheckpoint(checkpointFor("# Apple"))).toEqual({
      prefix: "Type the Markdown marks and space for a ",
      term: "level 1 heading",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("### Phase"))).toEqual({
      prefix: "Type the Markdown marks and space for a ",
      term: "level 3 heading",
      suffix: ".",
    })
  })

  it("tells italic and bold pairs apart", () => {
    expect(describeCheckpoint(checkpointFor("*Paper boat*"))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "italic text",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("**Important**"))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "bold text",
      suffix: ".",
    })
  })

  it("labels the remaining families", () => {
    expect(describeCheckpoint(checkpointFor("- Hammers"))).toEqual({
      prefix: "Type the Markdown mark and space for a ",
      term: "bullet item",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("1. Step"))).toEqual({
      prefix: "Type the Markdown number, delimiter, and space for a ",
      term: "numbered step",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("> Quote"))).toEqual({
      prefix: "Type the Markdown mark and space for a ",
      term: "block quote",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("Use `npm test`."))).toEqual({
      prefix: "Wrap the phrase in Markdown marks for ",
      term: "inline code",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("```\ncode\n```"))).toEqual({
      prefix: "Type the opening and closing Markdown marks for a ",
      term: "fenced code block",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("a\n\n---\n\nb"))).toEqual({
      prefix: "Type the Markdown marks for a ",
      term: "section break",
      suffix: ".",
    })
    expect(describeCheckpoint(checkpointFor("Use [docs](/a)."))).toEqual({
      prefix: "Add the Markdown punctuation for a ",
      term: "link",
      suffix: ".",
    })
  })
})
