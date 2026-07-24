import { describe, expect, it } from "vitest"
import { problemBank } from "../content/problemBank"
import { evaluateProblem } from "../engine/evaluateProblem"
import {
  acceptedGuidedSyntaxInputs,
  acceptsGuidedSyntaxInput,
  buildGuidedDraft,
  deriveSyntaxCheckpoints,
} from "./guidedSyntax"

describe("deriveSyntaxCheckpoints", () => {
  it("keeps heading whitespace inside the syntax answer", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "## Next steps",
      "Next steps",
    )

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]).toMatchObject({
      canonicalInput: "## ",
      line: 1,
    })
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "## " },
      { kind: "locked", value: "Next steps" },
    ])
  })

  it.each(["===", "---"])(
    "keeps a Setext %s underline with its heading text",
    (underline) => {
      const target = `Release notes\n${underline}`
      const checkpoints = deriveSyntaxCheckpoints(target, "Release notes\n")

      expect(checkpoints).toHaveLength(1)
      expect(checkpoints[0]).toMatchObject({
        canonicalInput: underline,
        line: 1,
        targetFrom: 0,
        targetTo: target.length,
      })
      expect(checkpoints[0]?.segments).toEqual([
        { kind: "locked", value: "Release notes\n" },
        { kind: "input", value: underline },
      ])
      expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([underline])
    },
  )

  it("keeps indented Setext underlines from accepting thematic-break alternatives", () => {
    const target = "Release notes\n  ---  "
    const checkpoints = deriveSyntaxCheckpoints(target, "Release notes\n")

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]).toMatchObject({
      canonicalInput: "---",
      line: 1,
      targetFrom: 0,
      targetTo: target.length,
    })
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Release notes\n  " },
      { kind: "input", value: "---" },
      { kind: "locked", value: "  " },
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual(["---"])
  })

  it("still offers thematic-break alternatives for an indented divider with no heading text", () => {
    const target = "  ---"
    const checkpoints = deriveSyntaxCheckpoints(target, "")

    expect(checkpoints).toHaveLength(1)
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "---",
      "***",
      "___",
    ])
  })

  it("groups both sides of paired emphasis into one checkpoint", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "Use **final draft** today.",
      "Use final draft today.",
    )

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]?.canonicalInput).toBe("****")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Use " },
      { kind: "input", value: "**" },
      { kind: "locked", value: "final draft" },
      { kind: "input", value: "**" },
      { kind: "locked", value: " today." },
    ])
  })

  it("offers the standard equivalent markers for paired emphasis", () => {
    const italic = deriveSyntaxCheckpoints("*Quiet music*", "Quiet music")[0]!
    const bold = deriveSyntaxCheckpoints("**Important**", "Important")[0]!

    expect(acceptedGuidedSyntaxInputs(italic)).toEqual(["**", "__"])
    expect(acceptedGuidedSyntaxInputs(bold)).toEqual(["****", "____"])
  })

  it.each([
    ["- Pens", "Pens", ["- ", "* ", "+ "]],
    ["  - Child", "Child", ["- ", "* ", "+ "]],
    ["1. First", "First", ["1. ", "1) "]],
    ["---", "", ["---", "***", "___"]],
    ["```\nhello\n```", "\nhello\n", ["``````", "~~~~~~"]],
  ] as const)("offers standard equivalents for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it.each([
    ["* Pens", "Pens", ["* ", "- ", "+ "]],
    ["1) First", "First", ["1) ", "1. "]],
    ["_Quiet music_", "Quiet music", ["__", "**"]],
    ["__Important__", "Important", ["____", "****"]],
    ["***", "", ["***", "---", "___"]],
    ["~~~\nhello\n~~~", "\nhello\n", ["~~~~~~", "``````"]],
  ] as const)("keeps equivalent answers symmetric for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it("combines independent equivalents inside one syntax checkpoint", () => {
    const checkpoint = deriveSyntaxCheckpoints(
      "- **Changed:** adapter boundary",
      "Changed: adapter boundary",
    )[0]!

    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual([
      "- ****",
      "* ****",
      "+ ****",
      "- ____",
      "* ____",
      "+ ____",
    ])
  })

  it.each([
    ["## Next steps", "Next steps", ["## "]],
    ["> A useful note", "A useful note", ["> "]],
    ["Press `Enter`.", "Press Enter.", ["``"]],
    ["Read the [guide](/guide).", "Read the guide.", ["[]()"]],
    ["See ![Map](/map.png).", "See Map.", ["![]()"]],
    ["First line  \nSecond line", "First line\nSecond line", ["  "]],
  ] as const)("keeps non-equivalent syntax exact for %s", (target, starter, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, starter)[0]!
    expect(acceptedGuidedSyntaxInputs(checkpoint)).toEqual(expected)
  })

  it("locks a link destination while asking only for Markdown punctuation", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "Read the [guide](/docs/guide).",
      "Read the guide.",
    )

    expect(checkpoints[0]?.canonicalInput).toBe("[]()")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "Read the " },
      { kind: "input", value: "[" },
      { kind: "locked", value: "guide" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "/docs/guide" },
      { kind: "input", value: ")" },
      { kind: "locked", value: "." },
    ])
  })

  it("keeps nested-list indentation out of the card and asks only the marker", () => {
    const target = ["- Parent", "  - Child"].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(
      target,
      ["Parent", "Child"].join("\n"),
    )

    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "- ",
      "- ",
    ])
    // The indentation is not part of the checkpoint at all: the card shows
    // only the marker boxes and the prose, and the document regains the
    // indentation from the untouched slice before the checkpoint.
    expect(checkpoints[1]?.segments).toEqual([
      { kind: "input", value: "- " },
      { kind: "locked", value: "Child" },
    ])
    expect(checkpoints[1]?.targetFrom).toBe("- Parent\n  ".length)
    expect(buildGuidedDraft(target, checkpoints, checkpoints.length)).toBe(target)
  })

  it("never surfaces line-leading whitespace in any published problem", () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      for (const checkpoint of checkpoints) {
        expect(checkpoint.canonicalInput, `${problem.id} ${checkpoint.id}`).not.toMatch(
          /^[\t ]/,
        )
        expect(
          checkpoint.segments[0]?.value,
          `${problem.id} ${checkpoint.id}`,
        ).not.toMatch(/^[\t ]/)
      }
    }
  })

  it("treats both fenced-code delimiters as one semantic checkpoint", () => {
    const target = ["```bash", "npm test", "```"].join("\n")
    const starter = ["", "npm test", ""].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(target, starter)

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]?.canonicalInput).toBe("``````")
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "```" },
      { kind: "locked", value: "bash\nnpm test\n" },
      { kind: "input", value: "```" },
    ])
  })
})

describe("buildGuidedDraft", () => {
  it("reveals completed syntax blocks and intervening prose, but not future blocks", () => {
    const target = [
      "# Packing note",
      "",
      "Bring only what you need.",
      "",
      "## Checklist",
      "",
      "- Passport",
      "- Charger",
    ].join("\n")
    const starter = [
      "Packing note",
      "",
      "Bring only what you need.",
      "",
      "Checklist",
      "",
      "Passport",
      "Charger",
    ].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(target, starter)

    expect(buildGuidedDraft(target, checkpoints, 0)).toBe("")
    expect(buildGuidedDraft(target, checkpoints, 1)).toBe(
      "# Packing note\n\nBring only what you need.\n\n",
    )
    expect(buildGuidedDraft(target, checkpoints, checkpoints.length)).toBe(
      target,
    )
  })
})

/**
 * Blank policy: a blank asks for a Markdown grammar token and nothing else.
 * The token includes whitespace the grammar itself requires (`# `, `- `,
 * `1. ` are not headings or list items without the space), and it never
 * includes layout whitespace or Goal prose — the learner is answering
 * "what is the Markdown syntax here", not retyping the Goal document.
 */
describe("published blank policy", () => {
  const bankCheckpoints = problemBank.flatMap((problem) =>
    deriveSyntaxCheckpoints(problem.target, problem.starterText).map(
      (checkpoint) => ({
        label: `${problem.id} ${checkpoint.id}`,
        checkpoint,
      }),
    ),
  )

  it("asks only Markdown grammar characters, never Goal prose", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      expect(checkpoint.canonicalInput, label).not.toMatch(/[A-Za-z]/)
    }
  })

  it("includes the grammar-required space in every marker blank", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      const canonical = checkpoint.canonicalInput
      if (/^#{1,6}/.test(canonical)) {
        // `#Title` is plain text — the space completes the heading grammar.
        expect(canonical, label).toMatch(/^#{1,6} /)
      }
      const marker = canonical.match(/^([*+-])(?!\1)/)?.[1]
      if (marker && !new RegExp(`^\\${marker}+$`).test(canonical)) {
        // `-Item` is plain text — the space completes the list grammar.
        expect(canonical, label).toMatch(/^[*+-] /)
      }
      if (/^\d+[.)]/.test(canonical)) {
        expect(canonical, label).toMatch(/^\d+[.)] /)
      }
      if (canonical.startsWith(">")) {
        expect(canonical, label).toMatch(/^> /)
      }
    }
  })

  it("rejects marker answers typed without their grammar space", () => {
    for (const { label, checkpoint } of bankCheckpoints) {
      const canonical = checkpoint.canonicalInput
      const withoutSpace = canonical.replace(
        /^(#{1,6}|\d+[.)]|[*+-]|>) /,
        "$1",
      )
      if (withoutSpace === canonical) continue
      expect(
        acceptsGuidedSyntaxInput(checkpoint, withoutSpace),
        label,
      ).toBe(false)
    }
  })
})

describe("published problem-bank coverage", () => {
  it("derives at least one lossless checkpoint for every published problem", () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )

      expect(checkpoints.length, problem.id).toBeGreaterThan(0)
      for (const checkpoint of checkpoints) {
        expect(checkpoint.canonicalInput, checkpoint.id).not.toBe("")
        expect(
          checkpoint.segments.map((segment) => segment.value).join(""),
          checkpoint.id,
        ).toBe(problem.target.slice(checkpoint.targetFrom, checkpoint.targetTo))
      }
      expect(
        buildGuidedDraft(problem.target, checkpoints, checkpoints.length),
        problem.id,
      ).toBe(problem.target)
    }
  })

  it("keeps every accepted alternative valid through the real grading engine", () => {
    for (const problem of problemBank) {
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )

      for (const checkpoint of checkpoints) {
        const alternatives = acceptedGuidedSyntaxInputs(checkpoint)
        expect(alternatives[0], checkpoint.id).toBe(checkpoint.canonicalInput)
        expect(new Set(alternatives).size, checkpoint.id).toBe(alternatives.length)
        expect(
          alternatives.every(
            (alternative) => alternative.length === checkpoint.canonicalInput.length,
          ),
          checkpoint.id,
        ).toBe(true)

        for (const alternative of alternatives) {
          const completedValues = Object.fromEntries(
            checkpoints.map((candidate) => [
              candidate.id,
              candidate.id === checkpoint.id
                ? alternative
                : candidate.canonicalInput,
            ]),
          )
          const draft = buildGuidedDraft(
            problem.target,
            checkpoints,
            checkpoints.length,
            completedValues,
          )
          expect(evaluateProblem(problem, draft).status, `${problem.id}: ${alternative}`)
            .not.toBe("fail")
        }
      }
    }
  })
})
