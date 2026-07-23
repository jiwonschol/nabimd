import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react"
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
  autofocusActions?: boolean
  canCheck: boolean
  canGoToPreviousStep: boolean
  canGoToNextStep: boolean
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
  onPreviousStep: () => void
  onNextStep: () => void
  onTryAnother: () => void
}

export function ExerciseTopBar({
  autofocusActions = true,
  canCheck,
  canGoToPreviousStep,
  canGoToNextStep,
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
  onPreviousStep,
  onNextStep,
  onTryAnother,
}: ExerciseTopBarProps) {
  const nextRef = useRef<HTMLButtonElement>(null)
  const [soundMuted, setSoundMutedState] = useState(() => readSoundMuted())
  const [summaryTooltipReady, setSummaryTooltipReady] = useState(false)
  const matched = evaluation?.status === "matched"
  const entry = getEntryChoice(entryId)
  const levelLabel = `Level ${entry.level}`
  const visibleScheduledPosition =
    phase === "complete"
      ? scheduledRunLength
      : Math.min(scheduledStepIndex + 1, scheduledRunLength)
  const navigatorLike = typeof navigator === "undefined" ? {} : navigator
  const shortcut = resolveActionShortcut(navigatorLike)

  useEffect(() => {
    if (autofocusActions && matched) nextRef.current?.focus()
  }, [autofocusActions, matched])

  useEffect(() => subscribeSoundMuted(setSoundMutedState), [])

  useEffect(() => {
    if (phase !== "complete") {
      setSummaryTooltipReady(false)
      return
    }

    const armSummaryTooltip = () => setSummaryTooltipReady(true)
    window.addEventListener("pointermove", armSummaryTooltip, { once: true })
    return () => window.removeEventListener("pointermove", armSummaryTooltip)
  }, [phase])

  if (phase === "complete") {
    return (
      <header className="exercise-topbar exercise-topbar--summary">
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
        <h2 className="exercise-topbar__summary-title">Summary</h2>
        <div className="exercise-topbar__end">
          <button
            aria-label="Home"
            className="top-action top-action--home"
            data-tooltip={summaryTooltipReady ? "Home" : undefined}
            onClick={onExit}
            type="button"
          >
            <House aria-hidden="true" size={20} strokeWidth={1.6} />
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="exercise-topbar exercise-topbar--practice">
      <span
        aria-label={`Practice progress, ${visibleScheduledPosition} of ${scheduledRunLength}`}
        aria-valuemax={scheduledRunLength}
        aria-valuemin={1}
        aria-valuenow={visibleScheduledPosition}
        className="visually-hidden"
        role="progressbar"
      />

      <div className="exercise-topbar__page exercise-topbar__page--left">
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
      </div>

      <div className="exercise-topbar__page exercise-topbar__page--right">
        <div
          aria-label="Practice details"
          className="exercise-progress"
          role="group"
        >
          <div className="exercise-progress__meta">
            <span aria-label={levelLabel} className="exercise-progress__level">
              {levelLabel}
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
                const completed = index < scheduledStepIndex
                const current = index === scheduledStepIndex
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

        <div className="exercise-topbar__end">
          <button
            aria-label="Previous exercise"
            className="top-action top-action--icon"
            data-tooltip="Previous exercise"
            disabled={!canGoToPreviousStep}
            onClick={onPreviousStep}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={19} strokeWidth={1.7} />
          </button>
          <button
            aria-label="Next visited exercise"
            className="top-action top-action--icon"
            data-tooltip="Next visited exercise"
            disabled={!canGoToNextStep}
            onClick={onNextStep}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={19} strokeWidth={1.7} />
          </button>
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
              if (event.key === " ") {
                event.preventDefault()
                return
              }
              if (event.repeat) {
                event.preventDefault()
                return
              }
              if (
                isActionShortcut(event.nativeEvent, navigatorLike) ||
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
            <span className="top-action__shortcut">{shortcut.label}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
