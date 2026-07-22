import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import type {
  GuidedSyntaxSegment,
  SyntaxCheckpoint,
} from "../guided/guidedSyntax"

export type GuidedSyntaxCardProps = {
  attempts: number
  canGoBack: boolean
  canGoForward: boolean
  checkpoint: SyntaxCheckpoint
  current: number
  hintOpen: boolean
  onBack: () => void
  onForward: () => void
  onSubmit: (value: string) => void
  onToggleHint: () => void
  onValueChange: (value: string) => void
  total: number
  value: string
}

function visibleSyntax(value: string): string {
  return value.replaceAll(" ", "␠").replaceAll("\t", "⇥")
}

function SegmentView({
  inputOffset,
  segment,
  typedValue,
}: {
  inputOffset: number
  segment: GuidedSyntaxSegment
  typedValue: string
}) {
  if (segment.kind === "locked") {
    return <span className="guided-syntax-card__locked">{segment.value}</span>
  }

  return (
    <span aria-hidden="true" className="guided-syntax-card__slots">
      {Array.from(segment.value).map((expected, index) => {
        const typed = typedValue[inputOffset + index] ?? ""
        const display = typed === " " ? "·" : typed
        return (
          <span
            className="guided-syntax-card__slot"
            data-filled={typed !== "" || undefined}
            data-space={expected === " " || undefined}
            key={`${inputOffset + index}-${expected}`}
          >
            {display}
          </span>
        )
      })}
    </span>
  )
}

export function GuidedSyntaxCard({
  attempts,
  canGoBack,
  canGoForward,
  checkpoint,
  current,
  hintOpen,
  onBack,
  onForward,
  onSubmit,
  onToggleHint,
  onValueChange,
  total,
  value,
}: GuidedSyntaxCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const segments = useMemo(() => {
    let inputOffset = 0
    return checkpoint.segments.map((segment, index) => {
      const offset = inputOffset
      if (segment.kind === "input") inputOffset += segment.value.length
      return { id: `${checkpoint.id}-${index}`, inputOffset: offset, segment }
    })
  }, [checkpoint])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [checkpoint.id])

  return (
    <aside
      aria-label="Guided Markdown syntax"
      className="guided-syntax-card"
      data-attempts={attempts}
    >
      <header className="guided-syntax-card__history">
        <button
          aria-label="Previous syntax"
          className="guided-syntax-card__history-button"
          disabled={!canGoBack}
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={22} strokeWidth={1.5} />
        </button>
        <span aria-label={`Syntax ${current} of ${total}`}>
          {current} / {total}
        </span>
        <button
          aria-label="Next visited syntax"
          className="guided-syntax-card__history-button"
          disabled={!canGoForward}
          onClick={onForward}
          type="button"
        >
          <ChevronRight aria-hidden="true" size={22} strokeWidth={1.5} />
        </button>
      </header>

      <label className="guided-syntax-card__exercise">
        <span className="visually-hidden">
          Enter the Markdown syntax missing from line {checkpoint.line}.
        </span>
        <input
          aria-label={`Markdown syntax for line ${checkpoint.line}`}
          autoComplete="off"
          className="guided-syntax-card__input"
          maxLength={checkpoint.canonicalInput.length}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.repeat) return
            event.preventDefault()
            onSubmit(event.currentTarget.value)
          }}
          ref={inputRef}
          spellCheck={false}
          value={value}
        />
        <span className="guided-syntax-card__sentence">
          {segments.map(({ id, inputOffset, segment }) => (
            <SegmentView
              inputOffset={inputOffset}
              key={id}
              segment={segment}
              typedValue={value}
            />
          ))}
        </span>
      </label>

      <div className="guided-syntax-card__footer">
        <div className="guided-syntax-card__hint">
          <button
            aria-expanded={hintOpen}
            aria-label={hintOpen ? "Hide syntax hint" : "Show syntax hint"}
            className="guided-syntax-card__hint-button"
            data-attention={attempts >= 2 || undefined}
            onClick={onToggleHint}
            type="button"
          >
            <Lightbulb aria-hidden="true" size={18} strokeWidth={1.5} />
            <span>Hint</span>
          </button>
          {hintOpen ? (
            <code className="guided-syntax-card__hint-answer">
              {visibleSyntax(checkpoint.canonicalInput)}
            </code>
          ) : null}
        </div>
        <kbd>Enter ↵</kbd>
      </div>
    </aside>
  )
}
