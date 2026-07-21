import { describe, expect, it } from "vitest"
import { headingProblems } from "../content/headingProblems"
import { normalizeProblem } from "../content/normalizeProblem"
import type { CheckScope, GradableProblem, MatchCheck } from "../content/types"
import { evaluateProblem } from "./evaluateProblem"

function problem(matchChecks: readonly MatchCheck[]): GradableProblem {
  return {
    ...normalizeProblem(headingProblems[0]),
    id: "structural-test",
    familyId: "document-structure",
    skillIds: ["document-structure"],
    difficulty: "makeover",
    matchChecks,
    editorialChecks: [],
    retryFamily: "document-structure",
    reviewTags: [],
  }
}

function common(id: string, priority = 10) {
  return { id, priority, feedback: `Fix ${id}.` }
}

describe("structural match predicates", () => {
  it("scopes inline presence to one top-level block occurrence", () => {
    const middleParagraphItalic = problem([
      {
        ...common("italic-middle-paragraph"),
        kind: "inline-presence",
        scope: {
          kind: "block",
          block: "paragraph",
          occurrence: 0,
        } as unknown as CheckScope,
        inline: "emphasis",
        min: 1,
      },
    ])

    expect(
      evaluateProblem(
        middleParagraphItalic,
        "# Plain title\n\n*Middle note.*\n\n- One\n- Two",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        middleParagraphItalic,
        "# *Italic title*\n\nMiddle note.\n\n- One\n- Two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "italic-middle-paragraph" })
    expect(
      evaluateProblem(
        middleParagraphItalic,
        "# Plain title\n\nMiddle note.\n\n- *One*\n- Two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "italic-middle-paragraph" })
  })

  it.each([
    "# Plan\n\n## Steps\n\n- Prepare\n- Share",
    "# Completely different\n\n## Words changed\n\n- Alpha\n- Beta",
  ])("grades block counts without comparing prose: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("two-headings"),
          kind: "block-count",
          scope: { kind: "document" },
          block: "heading",
          min: 2,
        },
        {
          ...common("one-list", 20),
          kind: "block-count",
          scope: { kind: "document" },
          block: "list",
          min: 1,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it.each([
    "***",
    "---",
    "___",
    "* * *",
    "- - -",
    "_ _ _",
    "   ****   ",
    "> ---",
    "- Parent\n\n  ***",
  ])("matches CommonMark thematic-break marker forms: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("one-thematic-break"),
          kind: "block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          min: 1,
          recursive: true,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it("keeps block-count root-only unless recursive matching is requested", () => {
    const rootOnly = problem([
      {
        ...common("root-thematic-break"),
        kind: "block-count",
        scope: { kind: "document" },
        block: "thematic-break",
        min: 1,
      },
    ])

    expect(evaluateProblem(rootOnly, "> ---")).toMatchObject({
      status: "fail",
      feedbackId: "root-thematic-break",
    })
  })

  it.each([
    "Plain text",
    "--",
    "**",
    "__",
    "Title\n---",
    "- list item",
    "*emphasis*",
    "___word___",
    "\\-\\-\\-",
    "`---`",
    "```md\n---\n```",
    "    ---",
    "\t***",
    "<!-- --- -->",
    "<hr>",
    "－－－",
  ])("rejects thematic-break lookalikes parsed as other constructs: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("one-thematic-break"),
          kind: "block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          min: 1,
          recursive: true,
        },
      ]),
      source,
    )

    expect(result).toMatchObject({
      status: "fail",
      feedbackId: "one-thematic-break",
    })
  })

  it("keeps extra valid thematic breaks Matched with optional Review", () => {
    const withThematicBreakReview: GradableProblem = {
      ...problem([
        {
          ...common("one-thematic-break"),
          kind: "block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          min: 1,
          recursive: true,
        },
      ]),
      editorialChecks: [
        {
          id: "keep-one-separator",
          kind: "max-block-count",
          scope: { kind: "document" },
          block: "thematic-break",
          recursive: true,
          max: 1,
          review: "Keep one separator as the focus.",
        },
      ],
    }

    expect(evaluateProblem(withThematicBreakReview, "---")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(
      evaluateProblem(withThematicBreakReview, "---\n\n> Changed words.\n>\n> ***"),
    ).toEqual({
      status: "matched",
      reviewItems: [
        {
          id: "keep-one-separator",
          message: "Keep one separator as the focus.",
        },
      ],
    })
  })

  it.each([
    "> Different words",
    ">Different spelling",
    "   > Three-space indent",
    "> First line\nlazy continuation",
    "> ![Useful alt](photo.png)",
    "> # Different heading",
    "> - Different item",
    ">     visible code",
    "- Parent\n  > Nested quote",
    "> [Visible link](/url)",
    "> <span>Visible text</span>",
    "> Outer\n>> Inner",
  ])("matches a nonempty parsed blockquote without grading its prose: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("nonempty-blockquote"),
          kind: "blockquote-shape",
          scope: { kind: "document" },
          recursive: true,
          requireNonemptyContent: true,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it.each([
    "Plain text",
    ">",
    "> ![](photo.png)",
    "> ---",
    "> &nbsp;",
    "> &#x200B;",
    "> &#x2060;",
    "> [label]: /url",
    "> [](/url)",
    "> <!-- hidden -->",
    "> <div></div>",
    ">\n>>",
    "\\> escaped",
    "`> inline code`",
    "```md\n> fenced code\n```",
    "    > indented code",
    "<blockquote>HTML only</blockquote>",
    "＞ Fullwidth marker",
  ])("rejects a missing, empty, or lookalike blockquote: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("nonempty-blockquote"),
          kind: "blockquote-shape",
          scope: { kind: "document" },
          recursive: true,
          requireNonemptyContent: true,
        },
      ]),
      source,
    )

    expect(result).toMatchObject({
      status: "fail",
      feedbackId: "nonempty-blockquote",
    })
  })

  it.each([
    "`Different words`",
    "`` code with ` inside ``",
    "` spaced words `",
    "`line\nbreak`",
    "# Heading with `value`",
    "- Set `mode`",
    "> Use `note`",
    "[Open `file`](/path)",
    "**`value`**",
    "`&nbsp;`",
    "`&#x200B;`",
    "`\u0000visible`",
    "`\ufffd`",
    "`\u0000\ufffd`",
  ])("matches meaningful parsed inline code without grading its prose: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("nonempty-inline-code"),
          kind: "inline-code-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyContent: true,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it.each([
    "Plain text",
    "``",
    "` `",
    "`\u00a0`",
    "`\u3000`",
    "`\u200b`",
    "`\u2060`",
    "`\ufeff`",
    "`\u200e\u200f`",
    "`\u0001`",
    "`\u0000`",
    "`\u001b`",
    "`\u007f`",
    "`\u2800`",
    "`\n`",
    "`\t`",
    "`\r\n`",
    "`code",
    "\\`code\\`",
    "```md\ncode\n```",
    "    code",
    "    `code`",
    "<code>code</code>",
    "![`code`](/image.png)",
    "[`code`]: /url",
    "<https://example.com/`code`>",
    "<!-- `code` -->",
    "｀code｀",
    "'code'",
  ])("rejects missing, empty, hidden, or lookalike inline code: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("nonempty-inline-code"),
          kind: "inline-code-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyContent: true,
        },
      ]),
      source,
    )

    expect(result).toMatchObject({
      status: "fail",
      feedbackId: "nonempty-inline-code",
    })
  })

  it("keeps inline-code section scope structural and independent of heading prose", () => {
    const scopedInlineCode = problem([
      {
        ...common("code-in-second-section"),
        kind: "inline-code-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        min: 1,
        requireNonemptyContent: true,
      },
    ])

    expect(
      evaluateProblem(
        scopedInlineCode,
        "# Title\n\n## First name\n\nPlain text.\n\n## Changed name\n\nUse `value`.",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        scopedInlineCode,
        "# Title\n\n## First name\n\nUse `value`.\n\n## Changed name\n\nPlain text.",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "code-in-second-section" })
  })

  it.each([
    "[Different label](/anywhere)",
    "[COMPLETELY DIFFRENT](https://changed.example \"Changed title\")",
    "[Unsafe but parsed](javascript:alert(1))",
    "[NUL plus visible](<\u0000path>)",
    "[Literal replacement](<\ufffd>)",
    "[**Strong label**](/path)",
    "[`code label`](/path)",
    "[<span>Visible label</span>](/path)",
    "# [Heading link](/path)",
    "- [List link](/path)",
    "> [Quote link](/path)",
    "[Reference label][guide]\n\n[guide]: /path",
    "[Collapsed label][]\n\n[collapsed label]: /path",
    "[Shortcut label]\n\n[shortcut label]: /path",
    "[Reference NUL plus visible][guide]\n\n[guide]: <\u0000path>",
    "[Reference literal replacement][guide]\n\n[guide]: <\ufffd>",
    "[Outer [Parsed inner](/inner)](/outer)",
    "[First](/one) and [Second](/two)",
  ])("matches a parsed link with a meaningful label without grading its prose or destination: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("meaningful-link"),
          kind: "link-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          allowReferences: true,
          allowAutolinks: false,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it.each([
    "[Escaped parentheses](/path\\(one\\))",
    "[Escaped brackets](/path\\[one\\])",
    "[Escaped angle close](<https://example.com/a\\>b>)",
    "[Multiline reference][guide]\n\n[guide]:\n  /path",
    "[Escaped reference][guide]\n\n[guide]: </path\\>next>",
  ])("qualifies escaped and multiline CommonMark link destinations: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("commonmark-destination"),
          kind: "link-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          allowReferences: true,
          allowAutolinks: false,
        },
      ]),
      source,
    )

    expect(result).toEqual({ status: "matched", reviewItems: [] })
  })

  it.each([
    "Plain text",
    "[](/path)",
    "[   ](/path)",
    "[\u00a0](/path)",
    "[&nbsp;](/path)",
    "[&#x200B;](/path)",
    "[\u200b\u2060](/path)",
    "[\ufeff\u200e\u200f](/path)",
    "[\u0001\u001b\u007f](/path)",
    "[\u2800](/path)",
    "[   \n  ](/path)",
    "[<span></span>](/path)",
    "[<!-- hidden -->](/path)",
    "[Label]()",
    "[Label](<>)",
    "[NBSP destination](<\u00a0>)",
    "[Hidden destination](<\u200b\u2060>)",
    "[Control destination](<\u0001\u001b\u007f>)",
    "[Braille blank destination](<\u2800>)",
    "[NUL destination](<\u0000>)",
    "[Encoded hidden destination](<%E2%80%8B>)",
    "[Encoded control destination](<%00>)",
    "[![Useful alt](/image.png)](/path)",
    "[![](/image.png)](/path)",
    "![Image only](/image.png)",
    "<https://example.com>",
    "<person@example.com>",
    "[Empty reference][guide]\n\n[guide]: <>",
    "[First definition wins][guide]\n\n[guide]: <>\n[guide]: /later",
    "[Reference NBSP][guide]\n\n[guide]: <\u00a0>",
    "[Reference hidden][guide]\n\n[guide]: <\u200b\u2060>",
    "[Reference control][guide]\n\n[guide]: <\u0001\u001b\u007f>",
    "[Reference braille blank][guide]\n\n[guide]: <\u2800>",
    "[Reference NUL][guide]\n\n[guide]: <\u0000>",
    "[Reference encoded hidden][guide]\n\n[guide]: <%E2%80%8B>",
    "[Reference encoded control][guide]\n\n[guide]: <%00>",
    "[guide]: /definition-only",
    "[Unresolved][missing]",
    "[Malformed](/path with spaces)",
    "[Malformed](/path",
    "\\[Escaped\\](/path)",
    "`[Code lookalike](/path)`",
    "```md\n[Code-block lookalike](/path)\n```",
    "    [Indented lookalike](/path)",
    '<a href="/path">HTML lookalike</a>',
    "［Fullwidth］（/path）",
  ])("rejects missing, malformed, hidden-label, or lookalike links: %s", (source) => {
    const result = evaluateProblem(
      problem([
        {
          ...common("meaningful-link"),
          kind: "link-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          allowReferences: true,
          allowAutolinks: false,
        },
      ]),
      source,
    )

    expect(result).toMatchObject({
      status: "fail",
      feedbackId: "meaningful-link",
    })
  })

  it("keeps link section scope structural and independent of heading prose", () => {
    const scopedLink = problem([
      {
        ...common("link-in-second-section"),
        kind: "link-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        min: 1,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: true,
        allowAutolinks: false,
      },
    ])

    expect(
      evaluateProblem(
        scopedLink,
        "# Title\n\n## First name\n\nPlain text.\n\n## [Changed name](/path)\n\nMore text.",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        scopedLink,
        "# Title\n\n## First name\n\nUse [a link](/path).\n\n## Changed name\n\nPlain text.",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "link-in-second-section" })
  })

  it("makes reference links and autolinks explicit grammar options", () => {
    const referencesDisabled = problem([
      {
        ...common("direct-links-only"),
        kind: "link-shape",
        scope: { kind: "document" },
        min: 1,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: false,
        allowAutolinks: false,
      },
    ])
    const autolinksEnabled = problem([
      {
        ...common("autolinks-allowed"),
        kind: "link-shape",
        scope: { kind: "document" },
        min: 1,
        requireNonemptyLabel: true,
        requireNonemptyDestination: true,
        allowReferences: false,
        allowAutolinks: true,
      },
    ])

    expect(
      evaluateProblem(
        referencesDisabled,
        "[Reference][guide]\n\n[guide]: /path",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "direct-links-only" })
    expect(evaluateProblem(autolinksEnabled, "<https://example.com>")).toEqual({
      status: "matched",
      reviewItems: [],
    })
  })

  it("uses qualifying links for the optional multiple-link review", () => {
    const withLinkReview: GradableProblem = {
      ...problem([
        {
          ...common("one-link"),
          kind: "link-shape",
          scope: { kind: "document" },
          min: 1,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          allowReferences: true,
          allowAutolinks: false,
        },
      ]),
      editorialChecks: [
        {
          id: "keep-one-link",
          kind: "max-link-count",
          scope: { kind: "document" },
          max: 1,
          requireNonemptyLabel: true,
          requireNonemptyDestination: true,
          allowReferences: true,
          allowAutolinks: false,
          review: "Keep one link as the focus.",
        },
      ],
    }

    expect(
      evaluateProblem(
        withLinkReview,
        "[Direct](/one) and [Reference][two]\n\n[two]: /two",
      ),
    ).toEqual({
      status: "matched",
      reviewItems: [
        { id: "keep-one-link", message: "Keep one link as the focus." },
      ],
    })
    expect(
      evaluateProblem(withLinkReview, "[Direct](/one) and [](/ignored)"),
    ).toEqual({ status: "matched", reviewItems: [] })
  })

  it("targets a section by heading depth and occurrence, never heading prose", () => {
    const sectionList = problem([
      {
        ...common("ordered-second-section"),
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 1 },
        ordered: true,
        minItems: 2,
      },
    ])

    expect(
      evaluateProblem(
        sectionList,
        "# Title\n\n## Any first name\n\nContext.\n\n## Any second name\n\n1. One\n2. Two",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        sectionList,
        "# Title\n\n## First\n\nContext.\n\n## Second\n\n- One\n- Two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "ordered-second-section" })
  })

  it("does not let a nested list satisfy a direct section list requirement", () => {
    const directOrderedList = problem([
      {
        ...common("direct-ordered-list"),
        kind: "list-shape",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        ordered: true,
        minItems: 2,
      },
    ])

    expect(
      evaluateProblem(
        directOrderedList,
        "# Plan\n\n## Steps\n\n- Parent item\n  1. Nested one\n  2. Nested two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "direct-ordered-list" })
    expect(
      evaluateProblem(
        directOrderedList,
        "# Plan\n\n## Steps\n\n1. Direct one\n2. Direct two\n   - Nested detail",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
  })

  it("preserves the legacy nonempty-list interpretation unless visibility is requested", () => {
    const legacyList = problem([
      {
        ...common("legacy-list"),
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: false,
        minItems: 1,
        requireNonemptyItems: true,
      },
    ])

    expect(evaluateProblem(legacyList, "- <!-- hidden -->")).toEqual({
      status: "matched",
      reviewItems: [],
    })
  })

  it.each([
    ["an HTML comment", "- <!-- hidden -->"],
    ["a link definition", "- [hidden]: /path"],
    ["a divider", "-\n  ---"],
    ["a line break", "- <br>"],
    ["default-ignorable characters", "- \u200B"],
    ["control characters", "- \u0007"],
    ["a raw NUL", "- \u0000"],
    ["whitespace", "-   "],
  ])("rejects list items containing only %s when visibility is required", (_label, source) => {
    const visibleList = problem([
      {
        ...common("visible-list"),
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: false,
        minItems: 1,
        requireVisibleItems: true,
      },
    ])

    expect(evaluateProblem(visibleList, source)).toMatchObject({
      status: "fail",
      feedbackId: "visible-list",
    })
  })

  it.each([
    "- Visible words",
    "- **Visible words**",
    "- `visible-code`",
    "- [Visible label](/path)",
    "- ![Visible alt](photo.png)",
    "- \uFFFD",
    "- \u0000Visible words",
  ])("accepts visibly meaningful list-item content: %s", (source) => {
    const visibleList = problem([
      {
        ...common("visible-list"),
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: false,
        minItems: 1,
        requireVisibleItems: true,
      },
    ])

    expect(evaluateProblem(visibleList, source)).toEqual({
      status: "matched",
      reviewItems: [],
    })
  })

  it("can target descendant list shapes without letting the root list satisfy them", () => {
    const visibleChildList = problem([
      {
        ...common("visible-child-list"),
        kind: "list-shape",
        scope: { kind: "document" },
        ordered: "either",
        minItems: 2,
        recursive: true,
        descendantsOnly: true,
        requireVisibleItems: true,
      },
    ])

    expect(
      evaluateProblem(
        visibleChildList,
        "- Visible root one\n  - Visible child one\n  - Visible child two\n- Visible root two",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(visibleChildList, "- Visible root one\n- Visible root two"),
    ).toMatchObject({ status: "fail", feedbackId: "visible-child-list" })
    expect(
      evaluateProblem(
        visibleChildList,
        "- Visible root one\n  - <!-- hidden -->\n  - Visible child two\n- Visible root two",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "visible-child-list" })
  })

  it("rejects skipped heading depths but accepts a logical hierarchy", () => {
    const hierarchy = problem([
      {
        ...common("logical-headings"),
        kind: "heading-depth-order",
        allowSkippedDepths: false,
      },
    ])

    expect(evaluateProblem(hierarchy, "# Title\n\n### Skipped")).toMatchObject({
      status: "fail",
      feedbackId: "logical-headings",
    })
    expect(
      evaluateProblem(hierarchy, "# Title\n\n## Section\n\n### Detail"),
    ).toEqual({ status: "matched", reviewItems: [] })
  })

  it("requires a language-tagged code block inside the selected section", () => {
    const verification = problem([
      {
        ...common("verification-code"),
        kind: "code-block",
        scope: { kind: "section", headingDepth: 2, occurrence: 0 },
        min: 1,
        max: 1,
        requireLanguageTag: true,
      },
    ])

    expect(
      evaluateProblem(
        verification,
        "# Spec\n\n## Verification\n\n```sh\nnpm test\n```",
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        verification,
        "# Spec\n\n## Verification\n\n```\nnpm test\n```",
      ),
    ).toMatchObject({ status: "fail", feedbackId: "verification-code" })
  })

  it("distinguishes a fenced code lesson from indented code", () => {
    const fenced = problem([
      {
        ...common("fenced-code"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
        requireFenced: true,
      },
    ])

    expect(evaluateProblem(fenced, "```\nnpm test\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(fenced, "    npm test")).toMatchObject({
      status: "fail",
      feedbackId: "fenced-code",
    })
  })

  it("can require visible code-block content without changing the default", () => {
    const legacy = problem([
      {
        ...common("legacy-code-block"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
      },
    ])
    const visible = problem([
      {
        ...common("visible-code-block"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
        requireNonemptyContent: true,
      },
    ])

    for (const source of [
      "```\n\n```",
      "```\n   \n```",
      "```\n\u200B\n```",
      "```\n\u0000\n```",
    ]) {
      expect(evaluateProblem(legacy, source)).toEqual({
        status: "matched",
        reviewItems: [],
      })
      expect(evaluateProblem(visible, source)).toMatchObject({
        status: "fail",
        feedbackId: "visible-code-block",
      })
    }

    expect(evaluateProblem(visible, "```\nPack lunch\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "```\n<!-- shown as code -->\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "```\n\u0000visible\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "```\n\uFFFD\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "```\u0000\n\uFFFD\n```")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "    Pack lunch")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(visible, "`Pack lunch`")).toMatchObject({
      status: "fail",
      feedbackId: "visible-code-block",
    })
    expect(
      evaluateProblem(visible, "<pre><code>Pack lunch</code></pre>"),
    ).toMatchObject({ status: "fail", feedbackId: "visible-code-block" })
    expect(evaluateProblem(visible, "<!-- hidden outside code -->")).toMatchObject({
      status: "fail",
      feedbackId: "visible-code-block",
    })
  })

  it("can require a matching closing fence without changing legacy code blocks", () => {
    const legacy = problem([
      {
        ...common("legacy-open-fence"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
        requireFenced: true,
      },
    ])
    const closed = problem([
      {
        ...common("closed-fence"),
        kind: "code-block",
        scope: { kind: "document" },
        min: 1,
        requireFenced: true,
        requireClosedFence: true,
      },
    ])

    expect(evaluateProblem(legacy, "```\nBring water")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    for (const source of [
      "```\nBring water\n```",
      "~~~\nBring water\n~~~",
      "```\nBring water\n````",
      "```\rBring water\r```",
      "> ```\n> Bring water\n> ```",
      "1.   ```\n     Bring water\n     ```",
      "- ```\n  Bring water\n  ```",
    ]) {
      expect(evaluateProblem(closed, source)).toEqual({
        status: "matched",
        reviewItems: [],
      })
    }
    for (const source of [
      "```\nBring water",
      "````\nBring water\n```",
      "```\nBring water\n~~~",
      "```\nBring water\n> ```",
      "1.   ```\n     Bring water\n     > ```",
    ]) {
      expect(evaluateProblem(closed, source)).toMatchObject({
        status: "fail",
        feedbackId: "closed-fence",
      })
    }
  })

  it("finds inline Markdown recursively without treating plain markers as syntax", () => {
    const inline = problem([
      {
        ...common("emphasis"),
        kind: "inline-presence",
        scope: { kind: "document" },
        inline: "emphasis",
        min: 1,
      },
    ])

    expect(
      evaluateProblem(inline, "# Note\n\n[A *careful* link](https://example.com)"),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(evaluateProblem(inline, "# Note\n\nA plain * marker")).toMatchObject({
      status: "fail",
      feedbackId: "emphasis",
    })
  })

  it("matches an ordered block subsequence and can require an exact shape", () => {
    const sequence = [
      { block: "heading", depth: 1 },
      { block: "heading", depth: 2 },
      { block: "list" },
    ] as const
    const source = "# Title\n\nIntro.\n\n## Steps\n\n1. One\n2. Two"

    expect(
      evaluateProblem(
        problem([
          {
            ...common("sequence"),
            kind: "block-sequence",
            scope: { kind: "document" },
            sequence,
          },
        ]),
        source,
      ),
    ).toEqual({ status: "matched", reviewItems: [] })
    expect(
      evaluateProblem(
        problem([
          {
            ...common("exact-sequence"),
            kind: "block-sequence",
            scope: { kind: "document" },
            sequence,
            exact: true,
          },
        ]),
        source,
      ),
    ).toMatchObject({ status: "fail", feedbackId: "exact-sequence" })
  })

  it("applies inclusive document-size boundaries", () => {
    const limits = problem([
      {
        ...common("concise"),
        kind: "document-limits",
        minBlocks: 2,
        maxBlocks: 2,
        minLines: 3,
        maxLines: 3,
      },
    ])

    expect(evaluateProblem(limits, "# Note\n\nShort context.")).toEqual({
      status: "matched",
      reviewItems: [],
    })
    expect(evaluateProblem(limits, "# Note\n\nToo\nlong")).toMatchObject({
      status: "fail",
      feedbackId: "concise",
    })
  })

  it("uses declaration order to break equal-priority failures", () => {
    const result = evaluateProblem(
      problem([
        {
          ...common("first", 10),
          kind: "block-count",
          scope: { kind: "document" },
          block: "list",
          min: 1,
        },
        {
          ...common("second", 10),
          kind: "block-count",
          scope: { kind: "document" },
          block: "code",
          min: 1,
        },
      ]),
      "# Only a title",
    )

    expect(result).toMatchObject({
      status: "fail",
      feedbackId: "first",
      message: "Fix first.",
    })
  })
})
