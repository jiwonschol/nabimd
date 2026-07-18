import Markdown from "react-markdown"

type MarkdownPreviewProps = {
  source: string
  label: string
  variant: "target" | "learner"
}

export function MarkdownPreview({
  source,
  label,
  variant,
}: MarkdownPreviewProps) {
  const components =
    variant === "learner"
      ? {
          img: ({ alt }: { alt?: string }) => (
            <span className="markdown-preview__media-placeholder">
              [Image: {alt || "image"}]
            </span>
          ),
        }
      : undefined

  return (
    <section
      aria-label={label}
      className={`markdown-preview markdown-preview--${variant}`}
    >
      <Markdown components={components}>{source}</Markdown>
    </section>
  )
}
