import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { GFM_OPTIONS } from "../markdown/parser"

/** The words a rendered document needs, in the caller's language. */
export type RenderLabels = {
  /** An image renders as this placeholder text. */
  image: (alt: string) => string
  /** The accessible name of a task-list checkbox. */
  task: (checked: boolean) => string
}

type RenderedDocumentBodyProps = {
  source: string
  emptyMessage?: string
  labels: RenderLabels
}

/**
 * Renders a learner's or a goal's Markdown. Links are inert text and images
 * are placeholders, so a document never loads anything remote.
 */
export function RenderedDocumentBody({
  source,
  emptyMessage,
  labels,
}: RenderedDocumentBodyProps) {
  return (
    <div className="rendered-document__body">
      {source ? (
        <Markdown
          remarkPlugins={[[remarkGfm, GFM_OPTIONS]]}
          components={{
            a: ({ children }) => (
              <span className="rendered-document__link">{children}</span>
            ),
            blockquote: ({ children }) => (
              <blockquote className="rendered-document__quote">
                {children}
              </blockquote>
            ),
            img: ({ alt }) => (
              <span className="rendered-document__media-placeholder">
                {labels.image(alt ?? "")}
              </span>
            ),
            // GFM task items render a read-only checkbox; it needs a name.
            input: ({ type, checked }) =>
              type === "checkbox" ? (
                <input
                  aria-label={labels.task(checked === true)}
                  checked={checked === true}
                  disabled
                  readOnly
                  type="checkbox"
                />
              ) : null,
          }}
        >
          {source}
        </Markdown>
      ) : emptyMessage ? (
        <span className="rendered-document__empty">{emptyMessage}</span>
      ) : null}
    </div>
  )
}
