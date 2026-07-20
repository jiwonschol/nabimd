import {
  defaultKeymap,
  history,
  historyKeymap,
  insertTab,
} from "@codemirror/commands"
import { Annotation, Compartment } from "@codemirror/state"
import { search, searchKeymap } from "@codemirror/search"
import {
  EditorView,
  keymap,
  placeholder,
} from "@codemirror/view"
import { useEffect, useLayoutEffect, useRef } from "react"
import { invisibleCharacters } from "../editor/invisibleCharacters"
import { resolveReadlineNavigationKeymap } from "./editorKeyboard"
import { createActionKeyBindings } from "./keyboardShortcut"

const externalChange = Annotation.define<boolean>()

function removeOneIndent(view: EditorView): boolean {
  const changes: { from: number; to: number }[] = []
  const seenLines = new Set<number>()

  for (const range of view.state.selection.ranges) {
    const firstLine = view.state.doc.lineAt(range.from).number
    const lastLine = view.state.doc.lineAt(range.to).number
    for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber += 1) {
      if (seenLines.has(lineNumber)) continue
      seenLines.add(lineNumber)
      const line = view.state.doc.line(lineNumber)
      const prefix = view.state.doc.sliceString(line.from, Math.min(line.to, line.from + 2))
      if (prefix.startsWith("\t")) {
        changes.push({ from: line.from, to: line.from + 1 })
      } else {
        const spaces = prefix.match(/^ {1,2}/)?.[0].length ?? 0
        if (spaces > 0) changes.push({ from: line.from, to: line.from + spaces })
      }
    }
  }

  if (changes.length > 0) view.dispatch({ changes })
  return true
}

type MarkdownSourceEditorProps = {
  active?: boolean
  showInvisibles?: boolean
  value: string
  onChange: (value: string) => void
  onCheck: () => void
}

export function MarkdownSourceEditor(_props: MarkdownSourceEditorProps) {
  const {
    active = true,
    showInvisibles = false,
    value,
    onChange,
    onCheck,
  } = _props
  const mountRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onCheckRef = useRef(onCheck)
  const invisibleCompartmentRef = useRef(new Compartment())

  onChangeRef.current = onChange
  onCheckRef.current = onCheck

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const runCheck = () => {
      onCheckRef.current()
      return true
    }
    const navigatorLike = typeof navigator === "undefined" ? {} : navigator
    const view = new EditorView({
      parent: mount,
      doc: value,
      extensions: [
        history(),
        search({ top: true }),
        EditorView.lineWrapping,
        placeholder("Type Markdown…"),
        EditorView.contentAttributes.of({
          role: "textbox",
          "aria-label": "Your Markdown",
          "aria-multiline": "true",
          spellcheck: "false",
        }),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          const isExternal = update.transactions.some(
            (transaction) => transaction.annotation(externalChange) === true,
          )
          if (!isExternal) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        keymap.of([
          ...createActionKeyBindings(runCheck, navigatorLike),
          ...resolveReadlineNavigationKeymap(navigatorLike),
          {
            key: "Tab",
            run: insertTab,
            shift: removeOneIndent,
            preventDefault: true,
          },
          ...searchKeymap,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        invisibleCompartmentRef.current.of([]),
      ],
    })

    viewRef.current = view
    if (active) view.focus()

    return () => {
      viewRef.current = null
      view.destroy()
    }
  }, [])

  useLayoutEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === value) return

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: externalChange.of(true),
    })
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    view.dispatch({
      effects: invisibleCompartmentRef.current.reconfigure(
        showInvisibles ? invisibleCharacters() : [],
      ),
    })
  }, [showInvisibles])

  useEffect(() => {
    if (active) viewRef.current?.focus()
  }, [active])

  return (
    <section aria-label="Your Markdown" className="markdown-source-editor">
      <div className="markdown-source-editor__mount" ref={mountRef} />
    </section>
  )
}
