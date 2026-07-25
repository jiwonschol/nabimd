import { useCallback, useMemo, useRef, useState } from "react"
import type { GradableProblem } from "../content/types"
import { playFeedbackSound } from "../sound/feedbackSound"
import {
  acceptedGuidedSyntaxGroupInputs,
  acceptsGuidedSyntaxInput,
  buildGuidedDraft,
  checkpointHintRows,
  deriveSyntaxCheckpoints,
  missedGuidedSyntaxGroups,
  syntaxGroupTerm,
  type GuidedSyntaxSegment,
  type SyntaxCheckpoint,
  type SyntaxMistake,
} from "./guidedSyntax"

export type CenterCardSlotVerdict = "idle" | "retry"

type CenterCardOptions = {
  problem: GradableProblem
  /** The session draft — the document the card has grown so far. */
  draft: string
  /** True when the session already counts this problem as completed. */
  completed: boolean
  /** True when persisted session history says this problem needs a retry. */
  retryPending?: boolean
  /** Writes the grown document into the session (persistence, history). */
  onGrow: (nextDraft: string) => void
  /** Fires with the finished document when the last slot is accepted. */
  onComplete: (finishedDraft: string) => void
  /**
   * Fires once per wrong slot submission (Summary bookkeeping), carrying one
   * ledger entry for every syntax group the attempt got wrong.
   */
  onMiss?: (mistakes: readonly SyntaxMistake[]) => void
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

function mirrorsLevelOnePair(
  problem: GradableProblem,
  checkpoint: SyntaxCheckpoint | null,
): boolean {
  if (problem.level !== 1 || !checkpoint) return false
  const groups = inputSegments(checkpoint)
  return groups.length === 2 && groups[0]!.value === groups[1]!.value
}

function levelOneHintRows(
  checkpoint: SyntaxCheckpoint,
  mirroredPair: boolean,
) {
  const rows = checkpointHintRows(checkpoint)
  if (!mirroredPair) return rows
  return rows.map((row) => ({
    ...row,
    input: row.input.slice(0, row.input.length / 2),
  }))
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
  retryPending = false,
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
  const progress =
    progressByProblem[problem.id] ??
    initialProgress(problem, checkpoints, draft, completed)

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

  // A completed problem keeps its last card on the page during the Matched
  // beat and when the learner revisits it. The surface never collapses to an
  // empty sheet merely because all marks are correct.
  const checkpoint = checkpoints[viewIndex] ?? null
  const mirroredPair = mirrorsLevelOnePair(problem, checkpoint)

  const [segmentValues, setSegmentValues] = useState<string[]>(() =>
    segmentValuesFor(
      checkpoint,
      checkpoint && !atFrontier
        ? progress.values[checkpoint.id]
        : undefined,
    ),
  )
  const resumesRetry = retryPending && !completed
  const [verdict, setVerdict] = useState<CenterCardSlotVerdict>(
    resumesRetry ? "retry" : "idle",
  )
  const [hintOpen, setHintOpen] = useState(resumesRetry)
  const [focusRequest, setFocusRequest] = useState(0)
  const slotKey = `${problem.id}:${checkpoint?.id ?? "done"}:${viewIndex}`
  const slotKeyRef = useRef(slotKey)
  const problemIdRef = useRef(problem.id)
  if (slotKeyRef.current !== slotKey) {
    // A different slot (or problem) arrived: the boxes show that slot's
    // stored answer when revisiting, or empty out at the frontier, and any
    // retry verdict from the previous slot is gone.
    const problemChanged = problemIdRef.current !== problem.id
    slotKeyRef.current = slotKey
    problemIdRef.current = problem.id
    setSegmentValues(
      segmentValuesFor(
        checkpoint,
        checkpoint && !atFrontier
          ? progress.values[checkpoint.id]
          : undefined,
      ),
    )
    setVerdict(problemChanged && resumesRetry ? "retry" : "idle")
    setHintOpen(problemChanged && resumesRetry)
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
    const lastVisited = Math.min(progress.count, checkpoints.length - 1)
    if (viewIndex < lastVisited) setViewIndex(viewIndex + 1)
  }, [checkpoints.length, progress.count, setViewIndex, viewIndex])

  const editSegment = useCallback(
    (index: number, value: string) => {
      setSegmentValues((previous) => {
        const next = [...previous]
        if (mirroredPair) {
          next[0] = value
          next[1] = value
        } else {
          next[index] = value
        }
        return next
      })
      // The first keystroke of a retry puts the slot verdict away (the same
      // rhythm as the document-level Try again hold).
      setVerdict("idle")
    },
    [mirroredPair],
  )

  const requestFirstBoxFocus = useCallback(() => {
    setFocusRequest((current) => current + 1)
  }, [])

  const openHint = useCallback(() => {
    if (!checkpoint) return
    setSegmentValues(segmentValuesFor(checkpoint, undefined))
    setVerdict("idle")
    setHintOpen(true)
    requestFirstBoxFocus()
  }, [checkpoint, requestFirstBoxFocus])

  const closeHint = useCallback(() => {
    setHintOpen(false)
    requestFirstBoxFocus()
  }, [requestFirstBoxFocus])

  const toggleHint = useCallback(() => {
    if (hintOpen) {
      closeHint()
      return
    }
    openHint()
  }, [closeHint, hintOpen, openHint])

  const submit = useCallback(() => {
    if (!checkpoint) return
    const joined = segmentValues.join("")
    if (joined === "") {
      // An empty Enter is not an attempt: hold the slot without counting a
      // miss toward the Summary.
      setVerdict("retry")
      setHintOpen(true)
      requestFirstBoxFocus()
      playFeedbackSound("retry")
      return
    }
    if (!acceptsGuidedSyntaxInput(checkpoint, joined)) {
      // A wrong mark clears the boxes for a fresh attempt from the first
      // box, counts once toward the Summary, and holds the slot.
      const groups = inputSegments(checkpoint)
      const missedIndexes = missedGuidedSyntaxGroups(checkpoint, segmentValues)
      // The attempt is rejected, so it always owes at least one ledger entry:
      // when every group is individually typable the groups came from
      // different accepted forms, and the first group carries the miss.
      const chargedIndexes = mirroredPair
        ? [missedIndexes[0] ?? 0]
        : missedIndexes.length > 0
          ? missedIndexes
          : [0]
      onMiss?.(
        chargedIndexes.map((groupIndex) => ({
          problemId: problem.id,
          checkpointId: checkpoint.id,
          groupIndex,
          term: syntaxGroupTerm(
            groups[groupIndex]?.value ?? "",
            checkpoint.segments.some(
              (segment) =>
                segment.kind === "locked" && /\n[\t ]*$/.test(segment.value),
            ),
          ),
          submitted: segmentValues[groupIndex] ?? "",
          expected: acceptedGuidedSyntaxGroupInputs(checkpoint, groupIndex),
        })),
      )
      setSegmentValues(segmentValuesFor(checkpoint, undefined))
      setVerdict("retry")
      setHintOpen(true)
      requestFirstBoxFocus()
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
    if (count >= checkpoints.length) onComplete(grown)
  }, [
    atFrontier,
    checkpoint,
    checkpoints,
    onComplete,
    onGrow,
    onMiss,
    problem,
    progress,
    requestFirstBoxFocus,
    segmentValues,
    mirroredPair,
    setViewIndex,
  ])

  return {
    checkpoints,
    checkpoint,
    slotIndex: viewIndex,
    slotTotal: checkpoints.length,
    frontierIndex: progress.count,
    atFrontier,
    canGoToPreviousSlot: viewIndex > 0,
    canGoToNextSlot:
      viewIndex < Math.min(progress.count, checkpoints.length - 1),
    done,
    segmentValues,
    mirroredSegmentIndexes: mirroredPair ? [1] : [],
    verdict,
    hintOpen,
    hintRows: checkpoint ? levelOneHintRows(checkpoint, mirroredPair) : [],
    focusRequest,
    editSegment,
    openHint,
    closeHint,
    toggleHint,
    goToPreviousSlot,
    goToNextSlot,
    submit,
  }
}
