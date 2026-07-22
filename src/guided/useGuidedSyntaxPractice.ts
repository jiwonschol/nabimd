import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { buildGuidedDraft, deriveSyntaxCheckpoints } from "./guidedSyntax"

const GUIDED_HISTORY_MARKER = "nabimd-guided-syntax-v1"

type GuidedProblem = {
  id: string
  starterText: string
  target: string
}

type GuidedHistoryState = {
  marker: typeof GUIDED_HISTORY_MARKER
  problemId: string
  index: number
}

type UseGuidedSyntaxPracticeOptions = {
  draft: string
  onChange: (value: string) => void
  onCheck: (value: string) => void
  problem: GuidedProblem
}

function completedCountFromDraft(
  target: string,
  checkpoints: ReturnType<typeof deriveSyntaxCheckpoints>,
  draft: string,
): number {
  if (draft === target) return checkpoints.length
  for (let count = checkpoints.length - 1; count > 0; count -= 1) {
    if (buildGuidedDraft(target, checkpoints, count) === draft) return count
  }
  return 0
}

function historyStateFor(problemId: string, index: number): GuidedHistoryState {
  return { marker: GUIDED_HISTORY_MARKER, problemId, index }
}

function restoreGuidedDraft(
  problem: GuidedProblem,
  checkpoints: ReturnType<typeof deriveSyntaxCheckpoints>,
  draft: string,
  completedCount: number,
): string {
  if (completedCount > 0 || draft === "") {
    return buildGuidedDraft(problem.target, checkpoints, completedCount)
  }
  // A fresh legacy session still carries the old prose-only starter. Guided
  // practice intentionally begins on an empty source page, while a learner's
  // own saved draft must survive a reload and remain manually editable.
  return draft === problem.starterText ? "" : draft
}

function readGuidedHistoryState(value: unknown): GuidedHistoryState | null {
  if (typeof value !== "object" || value === null) return null
  const state = value as { guidedSyntax?: Partial<GuidedHistoryState> }
  const guided = state.guidedSyntax
  if (
    guided?.marker !== GUIDED_HISTORY_MARKER ||
    typeof guided.problemId !== "string" ||
    typeof guided.index !== "number"
  ) {
    return null
  }
  return guided as GuidedHistoryState
}

function mergeHistoryState(guidedSyntax: GuidedHistoryState) {
  const current = window.history.state
  const base =
    typeof current === "object" && current !== null
      ? (current as Record<string, unknown>)
      : {}
  return { ...base, guidedSyntax }
}

export function useGuidedSyntaxPractice({
  draft,
  onChange,
  onCheck,
  problem,
}: UseGuidedSyntaxPracticeOptions) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const checkpoints = useMemo(
    () => deriveSyntaxCheckpoints(problem.target, problem.starterText),
    [problem.starterText, problem.target],
  )
  const initialCompleted = useMemo(
    () => completedCountFromDraft(problem.target, checkpoints, draft),
    [checkpoints, draft, problem.target],
  )
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialCompleted, Math.max(0, checkpoints.length - 1)),
  )
  const [historyFloorIndex, setHistoryFloorIndex] = useState(
    Math.min(initialCompleted, Math.max(0, checkpoints.length - 1)),
  )
  const [completedCount, setCompletedCount] = useState(initialCompleted)
  const [guidedDraft, setGuidedDraft] = useState(() =>
    restoreGuidedDraft(problem, checkpoints, draft, initialCompleted),
  )
  const guidedDraftRef = useRef(guidedDraft)
  guidedDraftRef.current = guidedDraft
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      checkpoints
        .slice(0, initialCompleted)
        .map((checkpoint) => [checkpoint.id, checkpoint.canonicalInput]),
    ),
  )
  const [attemptsById, setAttemptsById] = useState<Record<string, number>>({})
  const [hintOpen, setHintOpen] = useState(false)

  useEffect(() => {
    const restoredCompleted = completedCountFromDraft(
      problem.target,
      checkpoints,
      draft,
    )
    const restoredIndex = Math.min(
      restoredCompleted,
      Math.max(0, checkpoints.length - 1),
    )
    const restoredDraft = restoreGuidedDraft(
      problem,
      checkpoints,
      draft,
      restoredCompleted,
    )
    setCurrentIndex(restoredIndex)
    setHistoryFloorIndex(restoredIndex)
    setCompletedCount(restoredCompleted)
    guidedDraftRef.current = restoredDraft
    setGuidedDraft(restoredDraft)
    if (draft !== restoredDraft) onChangeRef.current(restoredDraft)
    setValues(
      Object.fromEntries(
        checkpoints
          .slice(0, restoredCompleted)
          .map((checkpoint) => [checkpoint.id, checkpoint.canonicalInput]),
      ),
    )
    setAttemptsById({})
    setHintOpen(false)

    if (checkpoints.length > 0) {
      window.history.replaceState(
        mergeHistoryState(historyStateFor(problem.id, restoredIndex)),
        "",
      )
    }
  }, [checkpoints, problem.id, problem.target])

  useEffect(() => {
    const navigateCheckpointHistory = (event: PopStateEvent) => {
      const state = readGuidedHistoryState(event.state)
      if (!state || state.problemId !== problem.id) return
      const nextIndex = Math.max(
        0,
        Math.min(state.index, completedCount, checkpoints.length - 1),
      )
      setCurrentIndex(nextIndex)
      setHintOpen(false)
    }

    window.addEventListener("popstate", navigateCheckpointHistory)
    return () => window.removeEventListener("popstate", navigateCheckpointHistory)
  }, [checkpoints.length, completedCount, problem.id])

  const checkpoint = checkpoints[currentIndex] ?? checkpoints[0]
  const value = checkpoint
    ? (values[checkpoint.id] ??
      (currentIndex < completedCount ? checkpoint.canonicalInput : ""))
    : ""

  const setValue = useCallback(
    (nextValue: string) => {
      if (!checkpoint) return
      setValues((current) => ({
        ...current,
        [checkpoint.id]: nextValue.slice(0, checkpoint.canonicalInput.length),
      }))
    },
    [checkpoint],
  )

  const submit = useCallback(
    (submittedValue: string) => {
      if (!checkpoint) return
      const boundedValue = submittedValue.slice(
        0,
        checkpoint.canonicalInput.length,
      )
      setValues((current) => ({ ...current, [checkpoint.id]: boundedValue }))

      if (boundedValue !== checkpoint.canonicalInput) {
        setAttemptsById((current) => ({
          ...current,
          [checkpoint.id]: (current[checkpoint.id] ?? 0) + 1,
        }))
        return
      }

      const nextCompletedCount = Math.max(completedCount, currentIndex + 1)
      const nextDraft = buildGuidedDraft(
        problem.target,
        checkpoints,
        nextCompletedCount,
      )
      setCompletedCount(nextCompletedCount)
      guidedDraftRef.current = nextDraft
      setGuidedDraft(nextDraft)
      setHintOpen(false)
      onChange(nextDraft)

      if (nextCompletedCount >= checkpoints.length) {
        onCheck(nextDraft)
        return
      }

      const nextIndex = currentIndex + 1
      if (currentIndex < completedCount) {
        window.history.forward()
      } else {
        const currentHistory = readGuidedHistoryState(window.history.state)
        if (
          currentHistory?.problemId !== problem.id ||
          currentHistory.index !== currentIndex
        ) {
          window.history.replaceState(
            mergeHistoryState(historyStateFor(problem.id, currentIndex)),
            "",
          )
        }
        window.history.pushState(
          mergeHistoryState(historyStateFor(problem.id, nextIndex)),
          "",
        )
        setCurrentIndex(nextIndex)
      }
    },
    [
      checkpoint,
      checkpoints,
      completedCount,
      currentIndex,
      onChange,
      onCheck,
      problem.id,
      problem.target,
    ],
  )

  const editDraft = useCallback(
    (nextDraft: string) => {
      const nextCompletedCount = completedCountFromDraft(
        problem.target,
        checkpoints,
        nextDraft,
      )
      guidedDraftRef.current = nextDraft
      setGuidedDraft(nextDraft)
      onChange(nextDraft)

      if (nextCompletedCount === 0 && nextDraft !== "") return

      setCompletedCount(nextCompletedCount)
      setCurrentIndex(
        Math.min(nextCompletedCount, Math.max(0, checkpoints.length - 1)),
      )
      setValues(
        Object.fromEntries(
          checkpoints
            .slice(0, nextCompletedCount)
            .map((item) => [item.id, item.canonicalInput]),
        ),
      )
    },
    [checkpoints, onChange, problem.target],
  )

  const lastVisitedIndex = Math.min(
    completedCount,
    Math.max(0, checkpoints.length - 1),
  )
  const canGoBack = currentIndex > historyFloorIndex
  const canGoForward = currentIndex < lastVisitedIndex

  return {
    attempts: checkpoint ? (attemptsById[checkpoint.id] ?? 0) : 0,
    canGoBack,
    canGoForward,
    checkpoint,
    checkpoints,
    completed: checkpoints.length > 0 && completedCount >= checkpoints.length,
    completedCount,
    currentIndex,
    draft: guidedDraft,
    checkDraft: () => onCheck(guidedDraftRef.current),
    editDraft,
    goBack: () => {
      if (canGoBack) window.history.back()
    },
    goForward: () => {
      if (canGoForward) window.history.forward()
    },
    hintOpen,
    setValue,
    submit,
    toggleHint: () => setHintOpen((open) => !open),
    value,
  }
}

export type GuidedSyntaxController = ReturnType<
  typeof useGuidedSyntaxPractice
>
