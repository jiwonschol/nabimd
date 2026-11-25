import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { describe, expect, it } from "vitest"
import { koProblems } from "../content/ko"
import {
  deriveMarkdownBlankGuides,
  derivePlaintextStarter,
} from "../content/plaintextStarter"
import {
  alignMarkSlots,
  enterFirstMarkSlot,
  markSlots,
  markSlotsOf,
  nextMarkSlot,
  showFailedMarkSlots,
} from "./markSlots"

function sourceOf(target: string) {
  return {
    guides: deriveMarkdownBlankGuides(target),
    starterText: derivePlaintextStarter(target),
  }
}

const target = "# 장보기\n\n**우유**와 *빵*을 산다."
const source = sourceOf(target)

function editor(doc = source.starterText) {
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [markSlots(source, () => false)],
    }),
  })
  enterFirstMarkSlot(view)
  return view
}

const head = (view: EditorView) => view.state.selection.main.head
const type = (view: EditorView, text: string) =>
  view.dispatch(view.state.replaceSelection(text))

describe("mark slots", () => {
  it("opens one slot per missing mark and starts in the first", () => {
    const view = editor()
    expect(markSlotsOf(view).map((slot) => slot.markers)).toEqual([
      "#",
      "**",
      "**",
      "*",
      "*",
    ])
    expect(head(view)).toBe(0)
    view.destroy()
  })

  it("takes typing in a slot and refuses it anywhere else", () => {
    const view = editor()
    type(view, "# ")
    expect(view.state.doc.line(1).text).toBe("# 장보기")

    view.dispatch({ changes: { from: 4, insert: "x" } })
    view.dispatch({ changes: { from: 3, to: 4 } })
    view.dispatch(view.state.replaceSelection("\n"))
    expect(view.state.doc.line(1).text).toBe("# 장보기")
    expect(view.state.doc.lines).toBe(3)
    view.destroy()
  })

  it("keeps the cursor in the slots when it is moved or clicked elsewhere", () => {
    const view = editor()
    // An arrow key leaving the first slot lands in the next one.
    view.dispatch({ selection: { anchor: 1 }, userEvent: "select" })
    expect(view.state.doc.sliceString(0, head(view))).toBe("장보기\n\n")
    // A click in the prose lands in the nearest slot.
    view.dispatch({ selection: { anchor: 8 }, userEvent: "select.pointer" })
    expect(view.state.doc.sliceString(0, head(view))).toBe("장보기\n\n우유")
    view.destroy()
  })

  it("accepts a finished answer pasted over the selected draft", () => {
    const view = editor()
    view.dispatch({
      selection: { anchor: 0, head: view.state.doc.length },
      userEvent: "select",
    })
    expect(view.state.selection.main.to).toBe(view.state.doc.length)
    type(view, "x")
    expect(view.state.doc.toString()).toBe(source.starterText)
    type(view, target)
    expect(view.state.doc.toString()).toBe(target)
    view.destroy()
  })

  it("flags a mistyped slot on a failed line even when other slots are empty", () => {
    // The heading has its `#` but not the space; the bold marks are missing.
    const view = editor("#장보기\n\n우유와 *빵*을 산다.")
    showFailedMarkSlots(view, [{ from: 1, to: 1 }])
    expect(head(view)).toBe(1)
    // Only the heading slot is flagged, so Tab stays on it.
    nextMarkSlot(view)
    expect(head(view)).toBe(1)
    view.destroy()
  })

  it("walks the slots with Tab, and only the failed ones after a check", () => {
    const view = editor("# 장보기\n\n**우유**와 빵을 산다.")
    expect(showFailedMarkSlots(view, null)).toBe(true)
    expect(view.state.doc.sliceString(0, head(view))).toBe("# 장보기\n\n**우유**와 ")
    type(view, "*")
    nextMarkSlot(view)
    expect(view.state.doc.sliceString(0, head(view))).toBe(
      "# 장보기\n\n**우유**와 *빵",
    )
    type(view, "*")
    expect(view.state.doc.toString()).toBe(target)
    // Nothing is flagged any more, so Tab walks every slot again.
    nextMarkSlot(view)
    expect(head(view)).toBe(2)
    view.destroy()
  })

  it("can reach every Korean answer by typing in slots alone", () => {
    for (const problem of koProblems) {
      const problemSource = sourceOf(problem.target)
      expect(
        alignMarkSlots(problemSource.starterText, problemSource),
        problem.id,
      ).not.toBeNull()
      expect(alignMarkSlots(problem.target, problemSource), problem.id).not.toBeNull()
    }
  })
})
