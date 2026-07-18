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
  return (
    <section
      aria-label={label}
      className={`markdown-preview markdown-preview--${variant}`}
    >
      <Markdown>{source}</Markdown>
    </section>
  )
}
