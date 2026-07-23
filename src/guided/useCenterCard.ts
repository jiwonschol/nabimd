import { useCallback, useMemo, useRef, useState } from "react"
import type { GradableProblem } from "../content/types"
import { playFeedbackSound } from "../sound/feedbackSound"
import {
  acceptsGuidedSyntaxInput,
  buildGuidedDraft,
  deriveSyntaxCheckpoints,
  type GuidedSyntaxSegment,
  type SyntaxCheckpoint,
} from "./guidedSyntax"

export type CenterCardSlotVerdict = "idle" | "retry"

type CenterCardOptions = {
  problem: GradableProblem
  /** The session draft — the document the card has grown so far. */
  draft: string
  /** True when the session already counts this problem as completed. */
  completed: boolean
  /** Writes the grown document into the session (persistence, history). */
  onGrow: (nextDraft: string) => void
  /** Fires with the finished document when the last slot is accepted. */
  onComplete: (finishedDraft: string) => void
}

type SlotProgress = {
  count: number
  values: Record<string, string>
}

export function inputSegments(
  checkpoint: SyntaxCheckpoint,
): Extract<GuidedSyntaxSegment, { kind: "input" }>[] {
  return checkpoint.segments.filter(
    (segment): segment is Extract<GuidedSyntaxSegment, { kind: "input" }> =>
      segment.kind === "input",
  )
}

function emptySegmentValues(checkpoint: SyntaxCheckpoint | null): string[] {
  return checkpoint ? inputSegments(checkpoint).map(() => "") : []
}

function canonicalCount(
  target: string,
  checkpoints: readonly SyntaxCheckpoint[],
  draft: string,
): number | null {
  if (draft === "") return 0
  for (let count = checkpoints.length; count >= 1; count -= 1) {
    if (buildGuidedDraft(target, checkpoints, count) === draft) return count
  }
  return null
}

// The card owns which slot each problem is on. Values live outside React so
// an in-session revisit (previous/next step, Try again elsewhere) resumes the
// exact slot even when the learner typed an accepted alternate mark.
const slotMemory = new Map<string, SlotProgress>()

export function resetCenterCardMemoryForTests() {
  slotMemory.clear()
}

function initialProgress(
  problem: GradableProblem,
  checkpoints: readonly SyntaxCheckpoint[],
  draft: string,
  completed: boolean,
): SlotProgress {
  const remembered = slotMemory.get(problem.id)
  if (remembered) return remembered

  const counted = canonicalCount(problem.target, checkpoints, draft)
  if (counted !== null) return { count: counted, values: {} }
  // A draft the card cannot reproduce (a pre-card free-typed draft, or a
  // completed alternate-mark document) resolves by completion state.
  if (completed) return { count: checkpoints.length, values: {} }
  return { count: 0, values: {} }
}

export function useCenterCard({
  problem,
  draft,
  completed,
  onGrow,
  onComplete,
}: CenterCardOptions) {
  const checkpoints = useMemo(
    () => deriveSyntaxCheckpoints(problem.target, problem.starterText),
    [problem.starterText, problem.target],
  )

  const [progressByProblem, setProgressByProblem] = useState<
    Record<string, SlotProgress>
  >({})
  const progress =
    progressByProblem[problem.id] ??
    initialProgress(problem, checkpoints, draft, completed)

  const checkpoint = checkpoints[progress.count] ?? null

  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    emptySegmentValues(checkpoint),
  )
  const [verdict, setVerdict] = useState<CenterCardSlotVerdict>("idle")
  const slotKeyRef = useRef(`${problem.id}:${checkpoint?.id ?? "done"}`)
  const slotKey = `${problem.id}:${checkpoint?.id ?? "done"}`
  if (slotKeyRef.current !== slotKey) {
    // A different slot (or problem) arrived: boxes empty out and any retry
    // verdict from the previous slot is gone.
    slotKeyRef.current = slotKey
    setSegmentValues(emptySegmentValues(checkpoint))
    setVerdict("idle")
  }

  const done = progress.count >= checkpoints.length

  const editSegment = useCallback((index: number, value: string) => {
    setSegmentValues((previous) => {
      const next = [...previous]
      next[index] = value
      return next
    })
    // The first keystroke of a retry puts the slot verdict away (the same
    // rhythm as the document-level Try again hold).
    setVerdict("idle")
  }, [])

  const submit = useCallback(() => {
    if (!checkpoint) return
    const joined = segmentValues.join("")
    if (!acceptsGuidedSyntaxInput(checkpoint, joined)) {
      setVerdict("retry")
      playFeedbackSound("retry")
      return
    }

    const values = { ...progress.values, [checkpoint.id]: joined }
    const count = progress.count + 1
    const nextProgress: SlotProgress = { count, values }
    slotMemory.set(problem.id, nextProgress)
    setProgressByProblem((previous) => ({
      ...previous,
      [problem.id]: nextProgress,
    }))

    const grown = buildGuidedDraft(problem.target, checkpoints, count, values)
    onGrow(grown)
    if (count >= checkpoints.length) onComplete(grown)
  }, [checkpoint, checkpoints, onComplete, onGrow, problem, progress, segmentValues])

  return {
    checkpoints,
    checkpoint,
    slotIndex: progress.count,
    slotTotal: checkpoints.length,
    done,
    segmentValues,
    verdict,
    editSegment,
    submit,
  }
}
