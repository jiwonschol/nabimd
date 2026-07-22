import {
  defaultKeymap,
  history,
  historyKeymap,
  insertTab,
} from "@codemirror/commands"
import { Annotation, Compartment, EditorState } from "@codemirror/state"
import { search, searchKeymap } from "@codemirror/search"
import {
  Decoration,
  EditorView,
  keymap,
  placeholder,
} from "@codemirror/view"
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from "react"
import { invisibleCharacters } from "../editor/invisibleCharacters"
import {
  markdownBlankGuides,
  type MarkdownBlankGuideSource,
} from "../editor/markdownBlankGuides"
import { renderedMarkdown } from "../editor/renderedMarkdown"
import { resolveReadlineNavigationKeymap } from "./editorKeyboard"
import { createActionKeyBindings } from "./keyboardShortcut"
import { RenderedDocumentBody } from "./RenderedDocument"

const externalChange = Annotation.define<boolean>()
const e2eDocumentReaderKey = "__nabimdReadDocumentForE2E"
// Remote deployment E2E runs the production bundle. The webdriver gate keeps
// this same-page read-only bridge unavailable to ordinary browsing while
// avoiding CodeMirror private DOM fields in supported browser automation.
const exposeE2eDocument =
  typeof navigator !== "undefined" &&
  navigator.webdriver === true

type E2eDocumentMount = HTMLDivElement & {
  [e2eDocumentReaderKey]?: () => string
}

function removeOneIndent(view: EditorView): boolean {
  const changes: { from: number; to: number }[] = []
  const seenLines = new Set<number>()

  for (const range of view.state.selection.ranges) {
    const firstLine = view.state.doc.lineAt(range.from).number
    const rangeEndLine = view.state.doc.lineAt(range.to)
    const lastPosition =
      range.from !== range.to && rangeEndLine.from === range.to
        ? range.to - 1
        : range.to
    const lastLine = view.state.doc.lineAt(lastPosition).number
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
  blankGuides?: MarkdownBlankGuideSource
  showInvisibles?: boolean
  value: string
  onChange: (value: string) => void
  onCheck: () => void
}

type MarkdownWordProcessorBaseProps = {
  active?: boolean
  activeOffset?: number
  blankGuides?: MarkdownBlankGuideSource
  focusTreatment?: "answer" | "goal"
  label: string
  showInvisibles?: boolean
  value: string
}

type MarkdownWordProcessorProps = MarkdownWordProcessorBaseProps &
  (
    | {
        onChange?: never
        onCheck?: never
        presentation: "rendered" | "source"
        readOnly: true
      }
    | {
        onChange: (value: string) => void
        onCheck: () => void
        presentation: "source"
        readOnly: false
      }
  )

function guidedFocusLineDecoration(
  value: string,
  activeOffset: number | undefined,
  focusTreatment: MarkdownWordProcessorBaseProps["focusTreatment"],
) {
  if (activeOffset === undefined || focusTreatment === undefined) return null
  const offset = Math.max(0, Math.min(activeOffset, value.length))
  const lineFrom = guidedFocusLineFrom(value, offset)
  const lineTo = value.indexOf("\n", offset)
  const lineLength = (lineTo < 0 ? value.length : lineTo) - lineFrom
  const className =
    focusTreatment === "goal"
      ? `cm-guided-target-line${lineLength > 34 ? " cm-guided-target-line--long" : ""}`
      : "cm-guided-answer-line"
  return Decoration.line({ attributes: { class: className } }).range(lineFrom)
}

function guidedFocusLineFrom(value: string, activeOffset: number): number {
  const offset = Math.max(0, Math.min(activeOffset, value.length))
  return value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1
}

function guidedFocusRowHeight(view: EditorView): number {
  const configured = Number.parseFloat(
    getComputedStyle(view.scrollDOM).getPropertyValue("--sheet-row-height"),
  )
  return Number.isFinite(configured) ? configured : view.defaultLineHeight
}

function guidedFocusLineTop(
  view: EditorView,
  selector: string,
  fallbackOffset: number,
): number {
  const activeLine = view.dom.querySelector<HTMLElement>(selector)
  if (!activeLine) return view.lineBlockAt(fallbackOffset).top
  const lineBox = activeLine.getBoundingClientRect()
  const scrollBox = view.scrollDOM.getBoundingClientRect()
  return view.scrollDOM.scrollTop + lineBox.top - scrollBox.top
}

function setGuidedScrollTop(view: EditorView, scrollTop: number): void {
  if (view.scrollDOM.scrollTop === scrollTop) return
  view.scrollDOM.scrollTop = scrollTop
  view.scrollDOM.dispatchEvent(new Event("scroll"))
}

function guidedFocusDecoration(
  value: string,
  activeOffset: number | undefined,
  focusTreatment: MarkdownWordProcessorBaseProps["focusTreatment"],
) {
  const decoration = guidedFocusLineDecoration(
    value,
    activeOffset,
    focusTreatment,
  )
  return decoration
    ? EditorView.decorations.of(Decoration.set([decoration]))
    : []
}

export function MarkdownWordProcessor(_props: MarkdownWordProcessorProps) {
  const {
    active = true,
    activeOffset,
    blankGuides,
    focusTreatment,
    label,
    presentation,
    readOnly,
    showInvisibles = false,
    value,
    onChange = () => undefined,
    onCheck = () => undefined,
  } = _props
  const mountRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const tabEscapeHintId = useId()
  const onChangeRef = useRef(onChange)
  const onCheckRef = useRef(onCheck)
  const invisibleCompartmentRef = useRef(new Compartment())
  const presentationCompartmentRef = useRef(new Compartment())
  const guidedFocusCompartmentRef = useRef(new Compartment())

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
        ...(readOnly ? [] : [history()]),
        search({ top: true }),
        EditorView.lineWrapping,
        ...(readOnly ? [] : [placeholder("Type Markdown…")]),
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({
          ...(readOnly
            ? { "aria-hidden": "true" }
            : {
                "aria-describedby": tabEscapeHintId,
                "aria-label": label,
                "aria-multiline": "true",
                role: "textbox",
              }),
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
        keymap.of(
          readOnly
            ? [...searchKeymap, ...defaultKeymap]
            : [
                ...createActionKeyBindings(runCheck, navigatorLike),
                ...searchKeymap,
                ...resolveReadlineNavigationKeymap(navigatorLike),
                {
                  key: "Tab",
                  run: insertTab,
                  shift: removeOneIndent,
                  preventDefault: true,
                },
                ...defaultKeymap,
                ...historyKeymap,
              ],
        ),
        invisibleCompartmentRef.current.of([]),
        guidedFocusCompartmentRef.current.of(
          guidedFocusDecoration(value, activeOffset, focusTreatment),
        ),
        ...(blankGuides ? [markdownBlankGuides(blankGuides)] : []),
        presentationCompartmentRef.current.of(
          presentation === "rendered" ? renderedMarkdown() : [],
        ),
      ],
    })

    viewRef.current = view
    if (exposeE2eDocument) {
      Object.defineProperty(mount as E2eDocumentMount, e2eDocumentReaderKey, {
        configurable: true,
        enumerable: false,
        value: () => view.state.doc.toString(),
      })
    }
    if (active) view.focus()

    return () => {
      if (exposeE2eDocument) {
        delete (mount as E2eDocumentMount)[e2eDocumentReaderKey]
      }
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
    const view = viewRef.current
    if (!view) return

    view.dispatch({
      effects: presentationCompartmentRef.current.reconfigure(
        presentation === "rendered" ? renderedMarkdown() : [],
      ),
    })
  }, [presentation])

  useEffect(() => {
    if (active) viewRef.current?.focus()
  }, [active])

  useLayoutEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (activeOffset === undefined || focusTreatment === undefined) {
      view.contentDOM.style.removeProperty("padding-bottom")
      view.dispatch({
        effects: guidedFocusCompartmentRef.current.reconfigure([]),
      })
      return
    }

    const offset = Math.max(0, Math.min(activeOffset, view.state.doc.length))
    const focusLineFrom = guidedFocusLineFrom(
      view.state.doc.toString(),
      offset,
    )
    const decoration = guidedFocusLineDecoration(
      view.state.doc.toString(),
      offset,
      focusTreatment,
    )
    const focusLineSelector =
      focusTreatment === "goal"
        ? ".cm-guided-target-line"
        : ".cm-guided-answer-line"
    view.dispatch({
      effects: [
        guidedFocusCompartmentRef.current.reconfigure(
          decoration
            ? EditorView.decorations.of(Decoration.set([decoration]))
            : [],
        ),
      ],
    })

    const positionActiveLine = () => {
      view.requestMeasure({
        key: "guided-syntax-scroll-space",
        read: (measuredView) => ({
          clientHeight: measuredView.scrollDOM.clientHeight,
          currentPadding: Number.parseFloat(
            getComputedStyle(measuredView.contentDOM).paddingBottom,
          ),
          lineTop: guidedFocusLineTop(
            measuredView,
            focusLineSelector,
            focusLineFrom,
          ),
          rowHeight: guidedFocusRowHeight(measuredView),
          scrollHeight: measuredView.scrollDOM.scrollHeight,
        }),
        write: (
          { clientHeight, currentPadding, lineTop, rowHeight, scrollHeight },
          measuredView,
        ) => {
          const targetScrollTop = Math.max(0, lineTop - rowHeight * 3)
          const baseScrollHeight =
            scrollHeight - (Number.isFinite(currentPadding) ? currentPadding : 0)
          const requiredPadding = Math.max(
            0,
            targetScrollTop + clientHeight - baseScrollHeight + rowHeight * 2,
          )
          measuredView.contentDOM.style.paddingBottom = `${requiredPadding}px`
          measuredView.requestMeasure({
            key: "guided-syntax-scroll-position",
            read: (positionedView) =>
              Math.max(
                0,
                guidedFocusLineTop(
                  positionedView,
                  focusLineSelector,
                  focusLineFrom,
                ) - guidedFocusRowHeight(positionedView) * 3,
              ),
            write: (positionedTarget, positionedView) => {
              setGuidedScrollTop(positionedView, positionedTarget)
            },
          })
        },
      })
    }

    positionActiveLine()
    window.addEventListener("resize", positionActiveLine)
    return () => window.removeEventListener("resize", positionActiveLine)
  }, [activeOffset, focusTreatment, value])

  const navigateReadOnlyDocument = (
    event: ReactKeyboardEvent<HTMLElement>,
  ) => {
    if (!readOnly) return
    const scroller = mountRef.current?.querySelector<HTMLElement>(".cm-scroller")
    if (!scroller) return
    const configuredRowHeight = Number.parseFloat(
      getComputedStyle(scroller).getPropertyValue("--sheet-row-height"),
    )
    const rowHeight = Number.isFinite(configuredRowHeight)
      ? configuredRowHeight
      : 40
    const page = Math.max(rowHeight, scroller.clientHeight - rowHeight)

    if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault()
      scroller.scrollTop += event.key === "PageDown" ? page : -page
      return
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      scroller.scrollTop += event.key === "ArrowDown" ? rowHeight : -rowHeight
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      scroller.scrollTop = 0
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      scroller.scrollTop = scroller.scrollHeight
    }
  }

  return (
    <section
      aria-label={label}
      className="markdown-word-processor markdown-source-editor"
      data-guided-focus={focusTreatment}
      data-presentation={presentation}
      onKeyDown={navigateReadOnlyDocument}
      tabIndex={readOnly ? 0 : undefined}
    >
      {readOnly ? (
        <div
          aria-label={`${label} rendered structure`}
          className="visually-hidden markdown-word-processor__semantic-document"
          role="document"
        >
          <RenderedDocumentBody source={value} />
        </div>
      ) : (
        <p className="visually-hidden" id={tabEscapeHintId}>
          Press Escape, then Tab to leave the editor.
        </p>
      )}
      <div className="markdown-source-editor__mount" ref={mountRef} />
    </section>
  )
}

export function MarkdownSourceEditor(props: MarkdownSourceEditorProps) {
  return (
    <MarkdownWordProcessor
      active={props.active}
      blankGuides={props.blankGuides}
      label="Your Markdown"
      onChange={props.onChange}
      onCheck={props.onCheck}
      presentation="source"
      readOnly={false}
      showInvisibles={props.showInvisibles}
      value={props.value}
    />
  )
}
