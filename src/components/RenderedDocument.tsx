import Markdown from "react-markdown"

type RenderedDocumentProps = {
  label: string
  source: string
  emptyMessage?: string
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
      <div className="rendered-document__body">
        {source ? (
          <Markdown
            components={{
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
    </section>
  )
}
