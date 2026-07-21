import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

type RenderedDocumentProps = {
  label: string
  source: string
  emptyMessage?: string
}

type RenderedDocumentBodyProps = Pick<
  RenderedDocumentProps,
  "source" | "emptyMessage"
>

export function RenderedDocumentBody({
  source,
  emptyMessage,
}: RenderedDocumentBodyProps) {
  return (
    <div className="rendered-document__body">
      {source ? (
        <Markdown
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
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
                [Image: {alt || "image"}]
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

export function RenderedDocument({
  label,
  source,
  emptyMessage,
}: RenderedDocumentProps) {
  return (
    <section aria-label={label} className="rendered-document">
      <header className="document-toolbar">
        <span>{label}</span>
      </header>
      <RenderedDocumentBody emptyMessage={emptyMessage} source={source} />
    </section>
  )
}
