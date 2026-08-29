import { describe, expect, it } from "vitest"
import { getCurriculumElements } from "../content/curriculumElements"
import { isEligibleMixedExercise } from "../content/mixedExercisePolicy"
import { problemBank } from "../content/problemBank"
import { evaluateProblem } from "../engine/evaluateProblem"
import {
  acceptedGuidedSyntaxInputs,
  acceptsGuidedSyntaxInput,
  buildGuidedDraft,
  checkpointHintRows,
  deriveSyntaxCheckpoints,
  missedGuidedSyntaxGroups,
  projectCheckpointContext,
  syntaxGroupTerm,
  syntaxCheckpointTerms,
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

  it("names a syntax group by the space its grammar requires", () => {
    // `* ` and `*` are the same character. Only the grammar-required space
    // tells a bullet marker apart from an italic delimiter.
    expect(syntaxGroupTerm("* ")).toBe("bullet item")
    expect(syntaxGroupTerm("*")).toBe("italic text")
    expect(syntaxGroupTerm("**")).toBe("bold text")
    expect(syntaxGroupTerm("1. ")).toBe("numbered step")
    expect(syntaxGroupTerm("> ")).toBe("block quote")
    expect(syntaxGroupTerm("## ")).toBe("level 2 heading")
    expect(syntaxGroupTerm("`")).toBe("inline code")
    expect(syntaxGroupTerm("](")).toBe("link")
    // `---` alone is a section break; after a heading line it is a Setext
    // underline, which the note must not confuse with one.
    expect(syntaxGroupTerm("---")).toBe("section break")
    expect(syntaxGroupTerm("---", true)).toBe("level 2 Setext heading")
  })

  it("finds the groups an attempt cannot explain", () => {
    const checkpoint = deriveSyntaxCheckpoints("*Paper boat*", "Paper boat")[0]!

    // `*` and `_` are each accepted openers, so neither group looks wrong on
    // its own even though the mixed pair is rejected as a whole.
    expect(missedGuidedSyntaxGroups(checkpoint, ["*", "_"])).toEqual([])
    expect(missedGuidedSyntaxGroups(checkpoint, ["@", ""])).toEqual([0, 1])
    expect(missedGuidedSyntaxGroups(checkpoint, ["*", "*"])).toEqual([])
  })

  it("splits touching marks from two syntax families into separate groups", () => {
    // `> ` and `**` sit side by side in the source. They are two different
    // answers the learner types, so the card must not collapse them into one
    // opaque `> **` run.
    const checkpoints = deriveSyntaxCheckpoints(
      "> **Important deadline**",
      "Important deadline",
    )

    expect(checkpoints).toHaveLength(1)
    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "> " },
      { kind: "input", value: "**" },
      { kind: "locked", value: "Important deadline" },
      { kind: "input", value: "**" },
    ])
    // Splitting must not change what grading accepts: the groups still join
    // into the same answer, and the bold alternative stays available.
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "> ****",
      "> ____",
    ])
  })

  it("keeps punctuation inside one syntax family in a single group", () => {
    // `]` and `(` touch, but both belong to the same link. A learner reads
    // `](` as one piece of link punctuation, so it stays one group.
    const checkpoints = deriveSyntaxCheckpoints(
      "See [the doc](https://x.dev) now",
      "See the doc now",
    )

    expect(checkpoints[0]?.segments).toEqual([
      { kind: "locked", value: "See " },
      { kind: "input", value: "[" },
      { kind: "locked", value: "the doc" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "https://x.dev" },
      { kind: "input", value: ")" },
      { kind: "locked", value: " now" },
    ])
  })

  it("keeps two adjacent links in separate groups", () => {
    // `)` of the first link touches `[` of the second. They are different
    // link instances, so they never merge.
    const checkpoints = deriveSyntaxCheckpoints(
      "[a](b)[c](d)",
      "ac",
    )

    expect(checkpoints[0]?.segments).toEqual([
      { kind: "input", value: "[" },
      { kind: "locked", value: "a" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "b" },
      { kind: "input", value: ")" },
      { kind: "input", value: "[" },
      { kind: "locked", value: "c" },
      { kind: "input", value: "](" },
      { kind: "locked", value: "d" },
      { kind: "input", value: ")" },
    ])
  })

  it("offers every bullet and bold alternative once the groups are split", () => {
    // The bullet marker and the bold delimiters are independent choices, so
    // all standard combinations are accepted equally.
    const checkpoints = deriveSyntaxCheckpoints("- **Ship it**", "Ship it")

    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "- ****",
      "* ****",
      "+ ****",
      "- ____",
      "* ____",
      "+ ____",
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

  it("keeps a nested list on its own card and never asks for the indentation", () => {
    const target = ["- Parent", "  * Child"].join("\n")
    const checkpoints = deriveSyntaxCheckpoints(
      target,
      ["Parent", "Child"].join("\n"),
    )

    // A nested list is a different list: Markdown lets its marker differ from
    // its parent's. Joining the two levels onto one card would make the
    // parent's marker constrain the child's and refuse `- Parent` above
    // `+ Child`, which the learner could type before.
    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "- ",
      "* ",
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[0]!)).toEqual([
      "- ",
      "* ",
      "+ ",
    ])
    expect(acceptedGuidedSyntaxInputs(checkpoints[1]!)).toEqual([
      "* ",
      "- ",
      "+ ",
    ])
    // The indentation is never a blank: the checkpoint starts at the marker
    // and the document regains the layout from the untouched slice before it.
    expect(checkpoints[1]?.segments).toEqual([
      { kind: "input", value: "* " },
      { kind: "locked", value: "Child" },
    ])
    expect(checkpoints[1]?.targetFrom).toBe("- Parent\n  ".length)
    expect(buildGuidedDraft(target, checkpoints, checkpoints.length)).toBe(target)
  })

  it("lets every emphasis pair on a joined card choose its own delimiter", () => {
    // Two emphasis spans were two cards before they were joined, and each
    // accepted its own delimiter. Swapping only the first pair offered a mixed
    // answer while dropping the uniform one — the opposite of both.
    const joined = deriveSyntaxCheckpoints("*one*\n*two*", "one\ntwo")
    expect(joined).toHaveLength(1)
    expect(acceptedGuidedSyntaxInputs(joined[0]!)).toEqual([
      "****",
      "__**",
      "**__",
      "____",
    ])
    // The pass case: one pair still offers exactly its two forms, so the
    // product does not leak into cards that hold a single span.
    expect(
      acceptedGuidedSyntaxInputs(
        deriveSyntaxCheckpoints("*Quiet music*", "Quiet music")[0]!,
      ),
    ).toEqual(["**", "__"])
  })

  it("still joins the items of one list at one level", () => {
    expect(
      deriveSyntaxCheckpoints("- Apples\n- Pears\n- Milk", "").map(
        (checkpoint) => checkpoint.canonicalInput,
      ),
    ).toEqual(["- - - "])
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

describe("card teaching projections", () => {
  it("projects only the active source row and its nearest meaningful neighbors", () => {
    const target = [
      "## Before",
      "",
      "> Keep rollback steps visible.",
      "",
      "- Verify the deploy",
    ].join("\n")
    const checkpoint = deriveSyntaxCheckpoints(target, "")[1]!

    expect(projectCheckpointContext(target, checkpoint)).toEqual({
      before: "## Before",
      current: "> Keep rollback steps visible.",
      after: "- Verify the deploy",
    })
  })

  it("keeps a nested list in one rendered context block", () => {
    const target = "- Lunch tray\n  - Sandwich\n  - Apple"
    const checkpoint = deriveSyntaxCheckpoints(
      target,
      "Lunch tray\nSandwich\nApple",
    )[0]!

    expect(projectCheckpointContext(target, checkpoint)).toEqual({
      before: null,
      current: target,
      after: null,
    })
  })

  it("shows every italic answer as a complete source example", () => {
    const checkpoint = deriveSyntaxCheckpoints(
      "*Quiet music*",
      "Quiet music",
    )[0]!

    expect(checkpointHintRows(checkpoint)).toEqual([
      { input: "**", source: "*Quiet music*" },
      { input: "__", source: "_Quiet music_" },
    ])
  })

  it.each([
    [
      "- Pens",
      [
        { input: "- ", source: "- Pens" },
        { input: "* ", source: "* Pens" },
        { input: "+ ", source: "+ Pens" },
      ],
    ],
    [
      "1. First",
      [
        { input: "1. ", source: "1. First" },
        { input: "1) ", source: "1) First" },
      ],
    ],
    [
      "Use `npm test`.",
      [{ input: "``", source: "Use `npm test`." }],
    ],
    [
      "Read [docs](/guide).",
      [{ input: "[]()", source: "Read [docs](/guide)." }],
    ],
    [
      "See ![Map](/map.png).",
      [{ input: "![]()", source: "See ![Map](/map.png)." }],
    ],
    [
      "---",
      [
        { input: "---", source: "---" },
        { input: "***", source: "***" },
        { input: "___", source: "___" },
      ],
    ],
    [
      "```\nhello\n```",
      [
        { input: "``````", source: "```\nhello\n```" },
        { input: "~~~~~~", source: "~~~\nhello\n~~~" },
      ],
    ],
  ] as const)("renders complete Hint rows for %s", (target, expected) => {
    const checkpoint = deriveSyntaxCheckpoints(target, "")[0]!

    expect(checkpointHintRows(checkpoint)).toEqual(expected)
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

describe("one card teaches one syntax", () => {
  // The turn scheduler already keeps one syntax from filling a turn, but it
  // counts problems while the learner counts cards: a three-item list was one
  // problem and three identical cards, so the practice felt like the same mark
  // three times in a row. Adjacent checkpoints naming the same syntax are one
  // card with one blank per item.
  it("puts every bullet of a list on one card", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "- Apples\n- Pears\n- Milk",
      "Apples\nPears\nMilk",
    )

    expect(checkpoints).toHaveLength(1)
    expect(
      checkpoints[0]!.segments.filter((segment) => segment.kind === "input"),
    ).toEqual([
      { kind: "input", value: "- " },
      { kind: "input", value: "- " },
      { kind: "input", value: "- " },
    ])
  })

  it("keeps different syntaxes on their own cards", () => {
    // The pass case: grouping must not collapse a problem into one card. A
    // heading above a list is two lessons and stays two.
    const checkpoints = deriveSyntaxCheckpoints(
      "# Packing\n\n- Socks\n- Towel",
      "Packing\nSocks\nTowel",
    )

    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "# ",
      "- - ",
    ])
  })

  it("does not swallow an unrelated block between two lists", () => {
    // Only whitespace may sit between two joined cards. A paragraph in
    // between means another block came first, and pulling it into a locked
    // segment would put unrelated prose inside the card.
    const checkpoints = deriveSyntaxCheckpoints(
      "- Apples\n\nThen rest.\n\n- Pears",
      "Apples\nThen rest.\nPears",
    )

    expect(checkpoints.map((checkpoint) => checkpoint.canonicalInput)).toEqual([
      "- ",
      "- ",
    ])
  })

  it("never repeats a syntax on consecutive cards of a served problem", () => {
    // Scoped to what practice can actually serve: a single-element problem, or
    // a mixed exercise that passed eligibility. Problems outside that set can
    // still repeat a syntax across cards — `l3-decision-quiet-room-booking`
    // has two level-2 headings with an unmarked paragraph between them — and
    // `isEligibleMixedExercise` is what keeps them off the schedule.
    const served = problemBank.filter(
      (problem) =>
        getCurriculumElements(problem).length === 1 ||
        isEligibleMixedExercise(problem),
    )
    expect(served.length).toBeGreaterThan(200)

    let compared = 0
    let nestedExceptions = 0
    for (const problem of served) {
      const source = problem.target.replace(/\r\n?/g, "\n")
      const checkpoints = deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )
      const indentOf = (checkpoint: (typeof checkpoints)[number]) =>
        source.slice(
          source.lastIndexOf("\n", Math.max(0, checkpoint.targetFrom - 1)) + 1,
          checkpoint.targetFrom,
        )
      const terms = checkpoints.map((checkpoint) =>
        syntaxCheckpointTerms(checkpoint).join("+"),
      )
      for (let index = 1; index < terms.length; index += 1) {
        compared += 1
        if (terms[index] !== terms[index - 1]) continue
        // The one allowed repeat: a nested list is a different list, so its
        // card stays separate and names the same syntax as its parent's.
        // Anything at the same level repeating is the defect this guards.
        expect(
          indentOf(checkpoints[index]!),
          `${problem.id} card ${index + 1} repeats card ${index} at the same level`,
        ).not.toBe(indentOf(checkpoints[index - 1]!))
        nestedExceptions += 1
      }
    }
    // Named so the exception cannot quietly become the rule.
    expect(nestedExceptions).toBeLessThan(compared / 4)
    // Guards the loop against passing by never comparing anything. Most served
    // problems are a single card now, so the floor is the number of card
    // boundaries that still exist rather than a share of the bank.
    const multiCard = served.filter(
      (problem) =>
        deriveSyntaxCheckpoints(problem.target, problem.starterText).length > 1,
    ).length
    expect(multiCard).toBeGreaterThan(20)
    expect(compared).toBeGreaterThanOrEqual(multiCard)
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

  it("keeps every accepted alternative valid through the real grading engine", { timeout: 30_000 }, () => {
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
