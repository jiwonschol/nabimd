import { fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import {
  deriveSyntaxCheckpoints,
  projectCheckpointContext,
} from "../guided/guidedSyntax"
import { problemBank } from "../content/problemBank"
import { RenderedDocumentBody } from "./RenderedDocument"
import * as centerCardModule from "./CenterCard"

const { CenterCard } = centerCardModule

function cardProps(
  overrides: Record<string, unknown> = {},
): ComponentProps<typeof CenterCard> {
  const target = "*Paper boat*"
  const checkpoint = deriveSyntaxCheckpoints(target, "Paper boat")[0]!
  return {
    checkpoint,
    slotIndex: 0,
    slotTotal: 2,
    segmentValues: ["", ""],
    verdict: "idle",
    canGoToPreviousSlot: false,
    canGoToNextSlot: false,
    onEditSegment: vi.fn(),
    onPreviousSlot: vi.fn(),
    onNextSlot: vi.fn(),
    onSubmit: vi.fn(),
    context: projectCheckpointContext(target, checkpoint),
    hintOpen: true,
    hintRows: [
      { input: "**", source: "*Paper boat*" },
      { input: "__", source: "_Paper boat_" },
    ],
    focusRequest: 0,
    onToggleHint: vi.fn(),
    onCloseHint: vi.fn(),
    ...overrides,
  } as ComponentProps<typeof CenterCard>
}

describe("Level 2 syntax reference examples", () => {
  // The single list of Level 2 checkpoint shapes. The panel renders `example`
  // as Markdown, so a string that parses to plain prose teaches nothing even
  // though it is not the "Example" placeholder — the DOM selector is what
  // rejects it. Name, notation and example are all asserted from what
  // `buildSyntaxReference` returns, not from a copy, and this list is the one
  // place the shapes are written down: when the engine opens these blanks for
  // real, there is a single table to move to `deriveSyntaxCheckpoints`.
  type Segment = { kind: "input" | "locked"; value: string }
  const checkpointOf = (...segments: ReadonlyArray<Segment>) => ({
    id: "reference",
    line: 0,
    targetFrom: 0,
    targetTo: 0,
    activeOffset: 0,
    canonicalInput: segments
      .filter((segment) => segment.kind === "input")
      .map((segment) => segment.value)
      .join(""),
    segments,
  })
  const input = (value: string): Segment => ({ kind: "input", value })
  const locked = (value: string): Segment => ({ kind: "locked", value })

  const FAMILIES: ReadonlyArray<
    [string, ReturnType<typeof checkpointOf>, string]
  > = [
    [
      "Strikethrough text",
      checkpointOf(input("~~"), locked("old"), input("~~")),
      "del",
    ],
    [
      "Bold italic text",
      checkpointOf(input("***"), locked("Very"), input("***")),
      "em > strong",
    ],
    [
      "Quote inside a quote",
      checkpointOf(input("> "), input("> "), locked("Deep")),
      "blockquote blockquote",
    ],
    [
      "Syntax-highlighted code block",
      checkpointOf(input("```"), input("js"), locked("\ncode\n"), input("```")),
      "pre > code.language-js",
    ],
    [
      "Line break",
      deriveSyntaxCheckpoints("first line  \nsecond line", "")[0]!,
      "p > br",
    ],
    [
      "Table row",
      checkpointOf(locked("Apples "), input("|"), locked(" 3")),
      "table > tbody > tr > td",
    ],
    [
      "Column headers",
      checkpointOf(locked("--- "), input("|"), locked(" ---")),
      "table > thead > tr > th",
    ],
    [
      "Checkbox item",
      checkpointOf(input("- "), input("[ ]"), locked(" Buy milk")),
      "li > input[type=checkbox]:not(:checked)",
    ],
    [
      "Checked-off item",
      checkpointOf(input("- "), input("[x]"), locked(" Buy milk")),
      "li > input[type=checkbox]:checked",
    ],
  ]

  for (const [name, checkpoint, selector] of FAMILIES) {
    it(`renders ${name} as its own family`, () => {
      const reference = centerCardModule.buildSyntaxReference(
        checkpoint as Parameters<
          typeof centerCardModule.buildSyntaxReference
        >[0],
      )
      expect(reference.name, name).toBe(name)
      expect(reference.notation, name).not.toBe("")
      const { container, unmount } = render(
        <RenderedDocumentBody source={reference.example} />,
      )
      expect(container.querySelector(selector), name).not.toBeNull()
      unmount()
    })
  }
})

describe("CenterCard", () => {
  it("keeps a syntax name, notation, and rendered example on the learning leaf", () => {
    render(<CenterCard {...cardProps()} />)

    const reference = screen.getByRole("region", {
      name: "Current Markdown syntax",
    })
    expect(reference).toHaveTextContent("Italic text")
    expect(reference).toHaveTextContent("* … *")
    expect(reference.querySelector("em")).toHaveTextContent("Example")
  })

  it("shows every required mark in a mixed checkpoint example", () => {
    const target = "- **Changed:** adapter boundary"
    const checkpoint = deriveSyntaxCheckpoints(
      target,
      "Changed: adapter boundary",
    )[0]!
    const reference = centerCardModule.buildSyntaxReference(checkpoint)

    expect(reference.name).toBe("Bullet item + Bold text")
    expect(reference.notation).toBe("-␠ … ** … **")
    expect(reference.example).toBe(target)
  })

  it("keeps Now learning scoped to the current step of a mixed document", () => {
    const problem = problemBank.find(
      (candidate) => candidate.id === "l2-code-block-alarm-routine",
    )!
    const references = deriveSyntaxCheckpoints(
      problem.target,
      problem.starterText,
    ).map(centerCardModule.buildSyntaxReference)

    // The three numbered steps are one card, not three: consecutive
    // checkpoints teaching the same syntax are grouped, so Now learning never
    // names the same thing on card after card. The opening title is given
    // rather than asked for (#198), so it is not a card at all.
    expect(references.map((reference) => reference.name)).toEqual([
      "Fenced code block",
      "Numbered step",
    ])
  })

  it("maps every served problem checkpoint to a concrete syntax reference", () => {
    const buildSyntaxReference = (
      centerCardModule as typeof centerCardModule & {
        buildSyntaxReference?: (
          checkpoint: ReturnType<typeof deriveSyntaxCheckpoints>[number],
        ) => { name: string; notation: string; example: string }
      }
    ).buildSyntaxReference

    expect(buildSyntaxReference).toBeTypeOf("function")
    if (!buildSyntaxReference) return

    for (const problem of problemBank) {
      for (const checkpoint of deriveSyntaxCheckpoints(
        problem.target,
        problem.starterText,
      )) {
        const reference = buildSyntaxReference(checkpoint)
        expect(reference.name, `${problem.id}:${checkpoint.id}`).not.toBe(
          "Markdown structure",
        )
        expect(reference.notation, `${problem.id}:${checkpoint.id}`).not.toBe("")
        expect(reference.example, `${problem.id}:${checkpoint.id}`).not.toBe("")
      }
    }
  })

  it("renders a direct instruction with only the syntax term emphasized", () => {
    render(<CenterCard {...cardProps()} />)

    const instruction = screen.getByRole("heading", { level: 2 })
    expect(instruction).toHaveTextContent(
      "Wrap the phrase in Markdown marks for italic text.",
    )
    expect(instruction.querySelectorAll("strong")).toHaveLength(1)
    expect(instruction.querySelector("strong")).toHaveTextContent("italic text")
  })

  it("shows the current part when a problem has multiple syntax cards", () => {
    render(<CenterCard {...cardProps({ slotIndex: 1, slotTotal: 3 })} />)

    const progress = screen.getByRole("progressbar", {
      name: "Current problem progress, part 2 of 3",
    })
    expect(progress).toBeVisible()
    expect(progress).toHaveTextContent("Part 2 of 3")
    expect(progress).toHaveAttribute("aria-valuenow", "2")
    expect(progress).toHaveAttribute("aria-valuemax", "3")
    expect(screen.getByRole("button", { name: "Previous part" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Next part" })).toBeVisible()
  })

  it("counts each row of a three-row table as one part", () => {
    const checkpoints = deriveSyntaxCheckpoints(
      "Fruit | Count\n--- | ---\nApples | 3",
      "",
    )
    expect(checkpoints).toHaveLength(3)

    render(
      <CenterCard
        {...cardProps({
          checkpoint: checkpoints[0],
          slotIndex: 0,
          slotTotal: checkpoints.length,
        })}
      />,
    )

    expect(
      screen.getByRole("progressbar", {
        name: "Current problem progress, part 1 of 3",
      }),
    ).toHaveTextContent("Part 1 of 3")
  })

  it("does not add local progress to a one-card problem", () => {
    render(<CenterCard {...cardProps({ slotIndex: 0, slotTotal: 1 })} />)

    expect(screen.queryByRole("progressbar")).toBeNull()
    expect(screen.queryByText(/Part \d+ of \d+/)).toBeNull()
  })

  it("keeps locked prose outside the two syntax textboxes", () => {
    render(<CenterCard {...cardProps()} />)

    expect(screen.getAllByRole("textbox")).toHaveLength(2)
    expect(screen.getByText("Paper boat", { selector: "span" })).toBeVisible()
  })

  it("keeps both sides of a paired mark editable", () => {
    render(<CenterCard {...cardProps({ segmentValues: ["*", ""] })} />)

    expect(screen.getAllByRole("textbox")).toHaveLength(2)
    expect(screen.queryByLabelText("Mirrored closing mark")).not.toBeInTheDocument()
  })

  it("shows all accepted alternatives as separate exact Hint rows", () => {
    render(<CenterCard {...cardProps()} />)

    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute(
      "aria-expanded",
      "true",
    )
    const hint = screen.getByRole("region", { name: "Exact Markdown hint" })
    expect(hint).toHaveTextContent("*Paper boat*")
    expect(hint).toHaveTextContent("_Paper boat_")
    expect(hint.querySelectorAll("li")).toHaveLength(2)
  })

  it("lets pointer users submit through the visible Enter control", () => {
    const onSubmit = vi.fn()
    render(<CenterCard {...cardProps({ onSubmit })} />)

    fireEvent.click(screen.getByRole("button", { name: "Check marks" }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("toggles Hint with ? while a syntax box owns focus", () => {
    const onToggleHint = vi.fn()
    render(<CenterCard {...cardProps({ onToggleHint })} />)
    const firstBox = screen.getAllByRole("textbox")[0]!
    firstBox.focus()

    fireEvent.keyDown(firstBox, { key: "?", code: "Slash", shiftKey: true })
    expect(onToggleHint).toHaveBeenCalledTimes(1)
  })

  it("returns focus to the first syntax box on a new focus request", () => {
    const props = cardProps({ hintOpen: false, focusRequest: 0 })
    const { rerender } = render(<CenterCard {...props} />)
    const boxes = screen.getAllByRole("textbox")
    boxes[1]!.focus()
    expect(boxes[1]).toHaveFocus()

    rerender(<CenterCard {...cardProps({ hintOpen: true, focusRequest: 1 })} />)
    expect(screen.getAllByRole("textbox")[0]).toHaveFocus()
  })

  it("separates touching syntax groups with a slash the learner never types", () => {
    const target = "> **Important deadline**"
    const checkpoint = deriveSyntaxCheckpoints(target, "Important deadline")[0]!
    render(
      <CenterCard
        {...cardProps({
          checkpoint,
          context: projectCheckpointContext(target, checkpoint),
          segmentValues: ["", "", ""],
        })}
      />,
    )

    const line = document.querySelector(".center-card__line")!
    // `> ` and `**` touch, so exactly one divider sits between them. The
    // closing `**` follows locked prose and gets none.
    const dividers = line.querySelectorAll(".center-card__group-divider")
    expect(dividers).toHaveLength(1)
    expect(dividers[0]).toHaveAttribute("aria-hidden", "true")

    // The slash is punctuation the card draws, never an input: the three
    // groups are still the only typing surfaces.
    expect(screen.getAllByRole("textbox")).toHaveLength(3)
    expect(line.textContent).toContain("/")
  })

  it("keeps one-family punctuation free of a divider", () => {
    const target = "See [the doc](https://x.dev) now"
    const checkpoint = deriveSyntaxCheckpoints(target, "See the doc now")[0]!
    render(
      <CenterCard
        {...cardProps({
          checkpoint,
          context: projectCheckpointContext(target, checkpoint),
          segmentValues: ["", "", ""],
        })}
      />,
    )

    expect(
      document.querySelectorAll(".center-card__group-divider"),
    ).toHaveLength(0)
  })

  it("keeps transition snapshots readonly without stealing focus", () => {
    render(
      <>
        <button autoFocus type="button">
          Before card
        </button>
        <CenterCard {...cardProps({ interactive: false })} />
      </>,
    )

    expect(screen.getByRole("button", { name: "Before card" })).toHaveFocus()
    for (const box of screen.getAllByRole("textbox")) {
      expect(box).toHaveAttribute("readonly")
    }
  })
})
