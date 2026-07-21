import type { MarkdownBlankGuideSource } from "../editor/markdownBlankGuides"
import { MarkdownWordProcessor } from "./MarkdownSourceEditor"
import { WritingProcessor } from "./WritingProcessor"

type WordProcessorPageBaseProps = {
  label: string
  leadingBlankRows?: number
  value: string
}

type WordProcessorPageProps = WordProcessorPageBaseProps &
  (
    | {
        active?: never
        onChange?: never
        onCheck?: never
        presentation: "rendered"
      }
    | {
        active?: boolean
        blankGuides?: MarkdownBlankGuideSource
        onChange: (value: string) => void
        onCheck: () => void
        presentation: "source"
      }
  )

export function WordProcessorPage(props: WordProcessorPageProps) {
  const { label, leadingBlankRows = 0, presentation, value } = props
  const rendered = presentation === "rendered"

  const processor = rendered ? (
    <MarkdownWordProcessor
      active={false}
      label={label}
      presentation="rendered"
      readOnly
      showInvisibles
      value={value}
    />
  ) : (
    <MarkdownWordProcessor
      active={props.active}
      blankGuides={props.blankGuides}
      label={label}
      onChange={props.onChange}
      onCheck={props.onCheck}
      presentation="source"
      readOnly={false}
      showInvisibles
      value={value}
    />
  )

  return (
    <WritingProcessor
      engine="codemirror"
      label={label}
      leadingBlankRows={leadingBlankRows}
      mode={rendered ? "read-only" : "edit"}
      page={presentation}
    >
      {processor}
    </WritingProcessor>
  )
}
