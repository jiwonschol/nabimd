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
  /** Fires once per wrong slot submission (Summary bookkeeping). */
  onMiss?: () => void
}

type SlotProgress = {
  /** The frontier: how many slots have been accepted at least once. */
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

function segmentValuesFor(
  checkpoint: SyntaxCheckpoint | null,
  stored: string | undefined,
): string[] {
  if (!checkpoint) return []
  const groups = inputSegments(checkpoint)
  if (stored === undefined) return groups.map(() => "")
  // Redistribute a stored (possibly alternate-mark) answer across the box
  // groups; the last group absorbs any length drift (Setext underlines).
  let offset = 0
  return groups.map((segment, index) => {
    if (index === groups.length - 1) return stored.slice(offset)
    const slice = stored.slice(offset, offset + segment.value.length)
    offset += segment.value.length
    return slice
  })
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

function progressMatchesDraft(
  problem: GradableProblem,
  checkpoints: readonly SyntaxCheckpoint[],
  draft: string,
  progress: SlotProgress,
): boolean {
  return (
    buildGuidedDraft(
      problem.target,
      checkpoints,
      progress.count,
      progress.values,
    ) === draft
  )
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
  if (
    remembered &&
    progressMatchesDraft(problem, checkpoints, draft, remembered)
  ) {
    return remembered
  }

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
  onMiss,
}: CenterCardOptions) {
  const checkpoints = useMemo(
    () => deriveSyntaxCheckpoints(problem.target, problem.starterText),
    [problem.starterText, problem.target],
  )

  const [progressByProblem, setProgressByProblem] = useState<
    Record<string, SlotProgress>
  >({})
  const cachedProgress = progressByProblem[problem.id]
  const progress =
    cachedProgress &&
    progressMatchesDraft(problem, checkpoints, draft, cachedProgress)
      ? cachedProgress
      : initialProgress(problem, checkpoints, draft, completed)

  const done = progress.count >= checkpoints.length

  // The card can look back at already-accepted slots without touching the
  // grown document; the frontier stays where it is.
  const [viewIndexByProblem, setViewIndexByProblem] = useState<
    Record<string, number>
  >({})
  const viewIndex = Math.min(
    viewIndexByProblem[problem.id] ?? progress.count,
    progress.count,
    Math.max(checkpoints.length - 1, 0),
  )
  const atFrontier = viewIndex === progress.count

  const checkpoint = done ? null : (checkpoints[viewIndex] ?? null)

  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    segmentValuesFor(
      checkpoint,
      checkpoint && !atFrontier
        ? progress.values[checkpoint.id]
        : undefined,
    ),
  )
  const [verdict, setVerdict] = useState<CenterCardSlotVerdict>("idle")
  const slotKey = `${problem.id}:${checkpoint?.id ?? "done"}:${viewIndex}`
  const slotKeyRef = useRef(slotKey)
  if (slotKeyRef.current !== slotKey) {
    // A different slot (or problem) arrived: the boxes show that slot's
    // stored answer when revisiting, or empty out at the frontier, and any
    // retry verdict from the previous slot is gone.
    slotKeyRef.current = slotKey
    setSegmentValues(
      segmentValuesFor(
        checkpoint,
        checkpoint && !atFrontier
          ? progress.values[checkpoint.id]
          : undefined,
      ),
    )
    setVerdict("idle")
  }

  const setViewIndex = useCallback(
    (index: number) => {
      setViewIndexByProblem((previous) => ({
        ...previous,
        [problem.id]: index,
      }))
    },
    [problem.id],
  )

  const goToPreviousSlot = useCallback(() => {
    if (viewIndex > 0) setViewIndex(viewIndex - 1)
  }, [setViewIndex, viewIndex])

  const goToNextSlot = useCallback(() => {
    if (viewIndex < progress.count) setViewIndex(viewIndex + 1)
  }, [progress.count, setViewIndex, viewIndex])

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
    if (joined === "") {
      // An empty Enter is not an attempt: hold the slot without counting a
      // miss toward the Summary.
      setVerdict("retry")
      playFeedbackSound("retry")
      return
    }
    if (!acceptsGuidedSyntaxInput(checkpoint, joined)) {
      // A wrong mark clears the boxes for a fresh attempt from the first
      // box, counts once toward the Summary, and holds the slot.
      onMiss?.()
      setSegmentValues(segmentValuesFor(checkpoint, undefined))
      setVerdict("retry")
      playFeedbackSound("retry")
      return
    }

    const values = { ...progress.values, [checkpoint.id]: joined }
    const count = atFrontier ? progress.count + 1 : progress.count
    const nextProgress: SlotProgress = { count, values }
    slotMemory.set(problem.id, nextProgress)
    setProgressByProblem((previous) => ({
      ...previous,
      [problem.id]: nextProgress,
    }))
    // Either way the card returns to the frontier: a revisited edit jumps
    // forward after regrowing the document with the corrected mark.
    setViewIndex(count)

    const grown = buildGuidedDraft(problem.target, checkpoints, count, values)
    onGrow(grown)
    if (atFrontier && count >= checkpoints.length) onComplete(grown)
  }, [
    atFrontier,
    checkpoint,
    checkpoints,
    onComplete,
    onGrow,
    onMiss,
    problem,
    progress,
    segmentValues,
    setViewIndex,
  ])

  return {
    checkpoints,
    checkpoint,
    slotIndex: viewIndex,
    slotTotal: checkpoints.length,
    frontierIndex: progress.count,
    atFrontier,
    canGoToPreviousSlot: !done && viewIndex > 0,
    canGoToNextSlot: !done && viewIndex < progress.count,
    done,
    segmentValues,
    verdict,
    editSegment,
    goToPreviousSlot,
    goToNextSlot,
    submit,
  }
}
