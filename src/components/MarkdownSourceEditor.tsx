import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { Annotation, Compartment } from "@codemirror/state"
import {
  EditorView,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { invisibleCharacters } from "../editor/invisibleCharacters"
import { resolveReadlineNavigationKeymap } from "./editorKeyboard"
import { createActionKeyBindings } from "./keyboardShortcut"

const externalChange = Annotation.define<boolean>()

type MarkdownSourceEditorProps = {
  active?: boolean
  value: string
  onChange: (value: string) => void
  onCheck: () => void
}

export function MarkdownSourceEditor(_props: MarkdownSourceEditorProps) {
  const { active = true, value, onChange, onCheck } = _props
  const mountRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onCheckRef = useRef(onCheck)
  const invisibleCompartmentRef = useRef(new Compartment())
  const [showInvisibles, setShowInvisibles] = useState(false)

  onChangeRef.current = onChange
  onCheckRef.current = onCheck

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const runCheck = () => {
      onCheckRef.current()
      return true
    }
    const view = new EditorView({
      parent: mount,
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
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
          ...createActionKeyBindings(runCheck),
          ...resolveReadlineNavigationKeymap(
            typeof navigator === "undefined" ? {} : navigator,
          ),
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
      <header className="document-toolbar">
        <span>Your Markdown</span>
        <span className="markdown-source-editor__file">answer.md</span>
        <button
          aria-label={showInvisibles ? "Hide invisibles" : "Show invisibles"}
          aria-pressed={showInvisibles}
          className="invisibles-toggle"
          onClick={() => setShowInvisibles((visible) => !visible)}
          type="button"
        >
          <span aria-hidden="true">¶</span> Invisibles
        </button>
      </header>
      <div className="markdown-source-editor__mount" ref={mountRef} />
    </section>
  )
}
