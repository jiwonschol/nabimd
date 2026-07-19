import { useEffect, useRef, useState } from "react"
import { getEntryChoice, type EntryId } from "../content/entryChoices"
import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import {
  readSoundMuted,
  setSoundMuted,
  subscribeSoundMuted,
} from "../sound/feedbackSound"
import { resolveCheckShortcut } from "./keyboardShortcut"
import { ElapsedTime } from "./ElapsedTime"
import { Wordmark } from "./Wordmark"

type ExerciseTopBarProps = {
  canCheck: boolean
  entryId: EntryId
  evaluation: Evaluation | null
  hadFailure: boolean
  hintOpen: boolean
  currentIsTransfer: boolean
  phase: LearningSession["phase"]
  problemPosition: number
  runCompletedAtMs: number | null
  runLength: number
  runStartedAtMs: number | null
  scheduledRunLength: number
  scheduledStepIndex: number
  onCheck: () => void
  onExit: () => void
  onNext: () => void
  onToggleHint: () => void
  onTryAnother: () => void
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
  currentIsTransfer,
  phase,
  problemPosition,
  runCompletedAtMs,
  runLength,
  runStartedAtMs,
  scheduledRunLength,
  scheduledStepIndex,
  onCheck,
  onExit,
  onNext,
  onToggleHint,
  onTryAnother,
}: ExerciseTopBarProps) {
  const nextRef = useRef<HTMLButtonElement>(null)
  const [soundMuted, setSoundMutedState] = useState(() => readSoundMuted())
  const matched = evaluation?.status === "matched"
  const entry = getEntryChoice(entryId)
  const [levelNumber, levelName] = entry.label.split(" — ", 2)
  const visibleScheduledPosition =
    phase === "complete"
      ? scheduledRunLength
      : Math.min(scheduledStepIndex + 1, scheduledRunLength)
  const shortcut = resolveCheckShortcut(
    typeof navigator === "undefined" ? {} : navigator,
  )

  useEffect(() => {
    if (matched) nextRef.current?.focus()
  }, [matched])

  useEffect(() => subscribeSoundMuted(setSoundMutedState), [])

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

      <div aria-label="Practice progress" className="exercise-progress">
        <div className="exercise-progress__meta">
          <span aria-label={entry.label} className="exercise-progress__level">
            <span>{levelNumber}</span>
            {levelName ? (
              <span className="exercise-progress__level-name">
                {` — ${levelName}`}
              </span>
            ) : null}
          </span>
          <span className="elapsed-control">
            <ElapsedTime
              completedAtMs={runCompletedAtMs}
              startedAtMs={runStartedAtMs}
            />
          </span>
          <button
            aria-label="Mute feedback sounds"
            aria-pressed={soundMuted}
            className="sound-control"
            onClick={() => setSoundMuted(!soundMuted)}
            type="button"
          >
            {soundMuted ? "Muted" : "Sound on"}
          </button>
        </div>

        <div className="exercise-progress__run">
          <ol aria-label="Turn steps" className="turn-progress">
            {Array.from({ length: scheduledRunLength }, (_, index) => {
              const completed =
                phase === "complete" || index < scheduledStepIndex
              const current =
                phase !== "complete" && index === scheduledStepIndex
              const state = completed
                ? "completed"
                : current
                  ? "current"
                  : "upcoming"
              return (
                <li
                  aria-current={current ? "step" : undefined}
                  aria-label={`Step ${index + 1}, ${state}`}
                  className={`turn-progress__step turn-progress__step--${state}`}
                  key={index}
                />
              )
            })}
          </ol>
          <span className="exercise-progress__count">
            {visibleScheduledPosition} of {scheduledRunLength}
          </span>
          {currentIsTransfer ? (
            <span className="repair-progress">
              <strong>Repair practice</strong>
              <span>
                Exercise {problemPosition} of {runLength}
              </span>
            </span>
          ) : null}
        </div>
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
