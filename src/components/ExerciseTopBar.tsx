import { useEffect, useRef } from "react"
import type { EntryId } from "../content/entryChoices"
import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import { resolveCheckShortcut } from "./keyboardShortcut"
import { Wordmark } from "./Wordmark"

type ExerciseTopBarProps = {
  canCheck: boolean
  entryId: EntryId
  evaluation: Evaluation | null
  hadFailure: boolean
  hintOpen: boolean
  phase: LearningSession["phase"]
  problemPosition: number
  runLength: number
  onCheck: () => void
  onExit: () => void
  onNext: () => void
  onToggleHint: () => void
  onTryAnother: () => void
}

const levelByEntry: Record<EntryId, string> = {
  "level-1": "Level 1",
  basics: "Level 2",
  challenge: "Level 3",
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA")
  )
}

export function ExerciseTopBar({
  canCheck,
  entryId,
  evaluation,
  hadFailure,
  hintOpen,
  phase,
  problemPosition,
  runLength,
  onCheck,
  onExit,
  onNext,
  onToggleHint,
  onTryAnother,
}: ExerciseTopBarProps) {
  const nextRef = useRef<HTMLButtonElement>(null)
  const matched = evaluation?.status === "matched"
  const shortcut = resolveCheckShortcut(
    typeof navigator === "undefined" ? {} : navigator,
  )

  useEffect(() => {
    if (matched) nextRef.current?.focus()
  }, [matched])

  useEffect(() => {
    if (phase === "complete") return
    const toggleFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "?" || isTextEntryTarget(event.target)) return
      event.preventDefault()
      onToggleHint()
    }
    document.addEventListener("keydown", toggleFromKeyboard)
    return () => document.removeEventListener("keydown", toggleFromKeyboard)
  }, [onToggleHint, phase])

  return (
    <header className="exercise-topbar">
      <div className="exercise-topbar__start">
        <Wordmark onHome={onExit} />
        <button className="top-action" onClick={onExit} type="button">
          Exit
        </button>
        {phase === "complete" ? null : (
          <button
            className="top-action"
            onClick={onTryAnother}
            type="button"
          >
            Try another
          </button>
        )}
      </div>

      <div aria-label="Heading progress" className="exercise-progress">
        <span>{levelByEntry[entryId]}</span>
        <span aria-hidden="true">•</span>
        <span>
          {problemPosition} of {runLength}
        </span>
      </div>

      {phase === "complete" ? null : (
        <div className="exercise-topbar__end">
          <button
            aria-expanded={hintOpen}
            aria-keyshortcuts="?"
            className="top-action"
            onClick={onToggleHint}
            type="button"
          >
            <span>Hint</span>
            <span aria-hidden="true">?</span>
          </button>
          <button
            aria-keyshortcuts={matched ? undefined : shortcut.ariaKeyShortcuts}
            className="top-action top-action--primary"
            disabled={!matched && !canCheck}
            onClick={matched ? onNext : onCheck}
            ref={nextRef}
            type="button"
          >
            <span>{matched ? "Next" : hadFailure ? "Check again" : "Check"}</span>
            <small aria-hidden="true">
              {matched ? "Space / Enter" : shortcut.label}
            </small>
          </button>
        </div>
      )}
    </header>
  )
}
