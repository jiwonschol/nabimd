import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { GFM_OPTIONS } from "../markdown/parser"

type RenderedDocumentBodyProps = {
  source: string
  emptyMessage?: string
  /** Words for an image, which renders as a placeholder; the caller's language. */
  imageLabel: (alt: string) => string
}

/**
 * Renders a learner's or a goal's Markdown. Links are inert text and images
 * are placeholders, so a document never loads anything remote.
 */
export function RenderedDocumentBody({
  source,
  emptyMessage,
  imageLabel,
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
                {imageLabel(alt ?? "")}
              </span>
            ),
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
