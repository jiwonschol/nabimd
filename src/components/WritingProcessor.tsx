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
  contentVersion: string
  label: string
  mode: "read-only" | "edit"
}

export function WritingProcessor({
  children,
  contentVersion,
  label,
  mode,
}: WritingProcessorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef<HTMLOListElement>(null)
  const [rowCount, setRowCount] = useState(MIN_ROWS)
  const readOnly = mode === "read-only"

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
      const height = Math.max(
        editorScroll?.clientHeight ?? scroll.clientHeight,
        editorScroll?.scrollHeight ?? measuredContent.scrollHeight,
      )
      setRowCount(Math.max(MIN_ROWS, Math.ceil(height / ROW_HEIGHT)))
    }

    const syncRows = () => {
      rows.style.transform = editorScroll
        ? `translateY(${-editorScroll.scrollTop}px)`
        : ""
    }

    const attach = () => {
      const nextEditorScroll = readOnly
        ? null
        : content.querySelector<HTMLElement>(".cm-scroller")
      if (!readOnly && !nextEditorScroll) return false

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
  }, [contentVersion, readOnly])

  const moveWithinDocument = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!readOnly) return
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
    <div className="writing-processor" data-mode={mode}>
      <div
        aria-label={readOnly ? label : undefined}
        aria-multiline={readOnly ? "true" : undefined}
        aria-readonly={readOnly ? "true" : undefined}
        className="writing-processor__scroll"
        onKeyDown={moveWithinDocument}
        ref={scrollRef}
        role={readOnly ? "textbox" : undefined}
        tabIndex={readOnly ? 0 : undefined}
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
