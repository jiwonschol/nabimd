import { ArrowRight, Check, Shuffle, Volume2, VolumeX } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getEntryChoice, type EntryId } from "../content/entryChoices"
import type { Evaluation } from "../engine/types"
import type { LearningSession } from "../session/learningSession"
import {
  readSoundMuted,
  setSoundMuted,
  subscribeSoundMuted,
} from "../sound/feedbackSound"
import {
  isActionShortcut,
  resolveActionShortcut,
} from "./keyboardShortcut"
import { ElapsedTime } from "./ElapsedTime"
import { Wordmark } from "./Wordmark"

type ExerciseTopBarProps = {
  canCheck: boolean
  entryId: EntryId
  evaluation: Evaluation | null
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
  onTryAnother: () => void
}

export function ExerciseTopBar({
  canCheck,
  entryId,
  evaluation,
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
  const navigatorLike = typeof navigator === "undefined" ? {} : navigator
  const shortcut = resolveActionShortcut(
    navigatorLike,
  )

  useEffect(() => {
    if (matched) nextRef.current?.focus()
  }, [matched])

  useEffect(() => subscribeSoundMuted(setSoundMutedState), [])

  return (
    <header className="exercise-topbar">
      <div className="exercise-topbar__start">
        <Wordmark onHome={onExit} />
        <button
          className="top-action top-action--exit"
          onClick={onExit}
          type="button"
        >
          Exit
        </button>
      </div>

      <div
        aria-label={`Practice progress, ${visibleScheduledPosition} of ${scheduledRunLength}`}
        className="exercise-progress"
      >
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
            aria-label={soundMuted ? "Turn sound on" : "Mute sound"}
            aria-pressed={soundMuted}
            className="sound-control"
            data-tooltip={soundMuted ? "Turn sound on" : "Mute sound"}
            onClick={() => setSoundMuted(!soundMuted)}
            type="button"
          >
            {soundMuted ? (
              <VolumeX aria-hidden="true" size={17} strokeWidth={1.7} />
            ) : (
              <Volume2 aria-hidden="true" size={17} strokeWidth={1.7} />
            )}
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
            aria-label="Try another"
            className="top-action top-action--icon"
            data-tooltip="Try another"
            onClick={onTryAnother}
            type="button"
          >
            <Shuffle aria-hidden="true" size={19} strokeWidth={1.7} />
          </button>
          <button
            aria-label={matched ? "Next exercise" : "Check answer"}
            aria-keyshortcuts={shortcut.ariaKeyShortcuts}
            className="top-action top-action--primary"
            data-tooltip={matched ? "Next exercise" : "Check answer"}
            disabled={!matched && !canCheck}
            onClick={matched ? onNext : onCheck}
            onKeyDown={(event) => {
              if (!matched) return
              if (
                isActionShortcut(event.nativeEvent, navigatorLike) ||
                event.key === " " ||
                event.key === "Enter"
              ) {
                event.preventDefault()
                onNext()
              }
            }}
            ref={nextRef}
            type="button"
          >
            {matched ? (
              <ArrowRight aria-hidden="true" size={24} strokeWidth={1.8} />
            ) : (
              <Check aria-hidden="true" size={24} strokeWidth={1.8} />
            )}
          </button>
        </div>
      )}
    </header>
  )
}
