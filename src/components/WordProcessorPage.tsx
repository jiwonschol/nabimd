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
        readOnly?: true
      }
    | {
        active?: boolean
        blankGuides?: MarkdownBlankGuideSource
        onChange: (value: string) => void
        onCheck: () => void
        presentation: "source"
        readOnly?: false
      }
    | {
        active?: never
        blankGuides?: never
        onChange?: never
        onCheck?: never
        presentation: "source"
        readOnly: true
      }
  )

export function WordProcessorPage(props: WordProcessorPageProps) {
  const { label, leadingBlankRows = 0, presentation, value } = props
  const rendered = presentation === "rendered"
  const readOnly = rendered || props.readOnly === true

  const processor = readOnly ? (
    <MarkdownWordProcessor
      active={false}
      label={label}
      presentation={presentation}
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
      mode={readOnly ? "read-only" : "edit"}
      page={presentation}
    >
      {processor}
    </WritingProcessor>
  )
}
