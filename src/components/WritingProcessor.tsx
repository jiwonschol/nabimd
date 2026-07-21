import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

const ROW_HEIGHT = 40
const MIN_ROWS = 24

type WritingProcessorProps = {
  children: ReactNode
  engine?: "codemirror" | "flow"
  label: string
  leadingBlankRows?: number
  mode: "read-only" | "edit"
  page?: "rendered" | "source"
}

export function WritingProcessor({
  children,
  engine,
  label,
  leadingBlankRows = 0,
  mode,
  page,
}: WritingProcessorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLOListElement>(null)
  const [rowCount, setRowCount] = useState(MIN_ROWS)
  const readOnly = mode === "read-only"
  const usesCodeMirror = engine === "codemirror" || mode === "edit"

  useLayoutEffect(() => {
    const scroll = scrollRef.current
    const content = contentRef.current
    const rows = rowsRef.current
    if (!scroll || !content || !rows) return

    let editorScroll: HTMLElement | null = null
    let measuredContent: HTMLElement = content
    let resizeObserver: ResizeObserver | null = null
    let mountObserver: MutationObserver | null = null

    const measure = () => {
      const configuredRowHeight = Number.parseFloat(
        getComputedStyle(scroll).getPropertyValue("--sheet-row-height"),
      )
      const rowHeight = Number.isFinite(configuredRowHeight)
        ? configuredRowHeight
        : ROW_HEIGHT
      const height = Math.max(
        editorScroll?.clientHeight ?? scroll.clientHeight,
        editorScroll?.scrollHeight ?? measuredContent.scrollHeight,
      )
      setRowCount(Math.max(MIN_ROWS, Math.ceil(height / rowHeight)))
    }

    const syncRows = () => {
      rows.style.transform = editorScroll
        ? `translateY(${-editorScroll.scrollTop}px)`
        : ""
    }

    const attach = () => {
      const nextEditorScroll = usesCodeMirror
        ? content.querySelector<HTMLElement>(".cm-scroller")
        : null
      if (usesCodeMirror && !nextEditorScroll) return false

      editorScroll = nextEditorScroll
      measuredContent =
        editorScroll?.querySelector<HTMLElement>(".cm-content") ?? content
      editorScroll?.addEventListener("scroll", syncRows, { passive: true })

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe(editorScroll ?? scroll)
        resizeObserver.observe(measuredContent)
      }

      measure()
      syncRows()
      return true
    }

    if (!attach() && typeof MutationObserver !== "undefined") {
      mountObserver = new MutationObserver(() => {
        if (attach()) {
          mountObserver?.disconnect()
          mountObserver = null
        }
      })
      mountObserver.observe(content, { childList: true, subtree: true })
    }

    return () => {
      editorScroll?.removeEventListener("scroll", syncRows)
      resizeObserver?.disconnect()
      mountObserver?.disconnect()
      rows.style.transform = ""
    }
  }, [usesCodeMirror])

  const moveWithinDocument = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!readOnly || usesCodeMirror) return
    const scroll = scrollRef.current
    if (!scroll) return

    if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault()
      const direction = event.key === "PageDown" ? 1 : -1
      scroll.scrollTop +=
        direction * Math.max(ROW_HEIGHT, scroll.clientHeight - ROW_HEIGHT)
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "Home") {
      event.preventDefault()
      scroll.scrollTop = 0
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === "End") {
      event.preventDefault()
      scroll.scrollTop = scroll.scrollHeight
    }
  }

  return (
    <div
      className={`writing-processor${page ? " word-processor-page" : ""}`}
      data-engine={usesCodeMirror ? "codemirror" : "flow"}
      data-leading-blank-rows={leadingBlankRows || undefined}
      data-mode={mode}
      data-page={page}
    >
      <div
        aria-label={readOnly && !usesCodeMirror ? label : undefined}
        aria-multiline={readOnly && !usesCodeMirror ? "true" : undefined}
        aria-readonly={readOnly && !usesCodeMirror ? "true" : undefined}
        className="writing-processor__scroll"
        onKeyDown={moveWithinDocument}
        ref={scrollRef}
        role={readOnly && !usesCodeMirror ? "textbox" : undefined}
        tabIndex={readOnly && !usesCodeMirror ? 0 : undefined}
      >
        <div className="writing-processor__canvas">
          <ol
            aria-hidden="true"
            className="writing-processor__rows"
            ref={rowsRef}
          >
            {Array.from({ length: rowCount }, (_, index) => (
              <li className="writing-processor__row" key={index + 1}>
                <span>{index + 1}</span>
              </li>
            ))}
          </ol>
          <div className="writing-processor__content" ref={contentRef}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
