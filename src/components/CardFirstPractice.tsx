import type { GradableProblem } from "../content/types"
import { useLayoutEffect, useRef } from "react"
import {
  projectCheckpointContext,
  type SyntaxMistake,
} from "../guided/guidedSyntax"
import { useCenterCard } from "../guided/useCenterCard"
import {
  getMotionDuration,
  PROBLEM_TRANSITION_DURATION_MS,
} from "../motionTiming"
import { CenterCard } from "./CenterCard"

type CardFirstPracticeProps = {
  draft: string
  interactive?: boolean
  problem: GradableProblem
  problemCompleted: boolean
  retryPending?: boolean
  onGrow: (nextDraft: string) => void
  onComplete: (finishedDraft: string) => void
  onMiss?: (mistakes: readonly SyntaxMistake[]) => void
}

export function CardFirstPractice({
  draft,
  interactive = true,
  problem,
  problemCompleted,
  retryPending = false,
  onGrow,
  onComplete,
  onMiss,
}: CardFirstPracticeProps) {
  const card = useCenterCard({
    problem,
    draft,
    completed: problemCompleted,
    retryPending,
    onGrow,
    onComplete,
    onMiss,
  })
  const practiceRef = useRef<HTMLElement>(null)
  const previousProblemIdRef = useRef(problem.id)
  const previousHintOpenRef = useRef(card.hintOpen)
  const previousHeightRef = useRef<number | null>(null)
  const transitionTimerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const practice = practiceRef.current
    if (!practice) return

    const problemChanged = previousProblemIdRef.current !== problem.id
    const hintChanged = previousHintOpenRef.current !== card.hintOpen
    const transitionInterrupted = transitionTimerRef.current !== null
    const previousHeight = transitionInterrupted
      ? practice.getBoundingClientRect().height
      : previousHeightRef.current

    // An in-flight transition leaves the previous destination as an inline
    // height. Remove that constraint before measuring the newly rendered
    // content, otherwise a fast Hint close reads the old expanded height and
    // snaps only when the timer finally clears it.
    practice.style.removeProperty("height")
    const nextHeight = practice.scrollHeight

    previousProblemIdRef.current = problem.id
    previousHintOpenRef.current = card.hintOpen
    previousHeightRef.current = nextHeight

    if (!problemChanged && !hintChanged) return

    if (transitionInterrupted && transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
    }
    practice.dataset.transition = problemChanged ? "problem" : "height"

    if (previousHeight && nextHeight && previousHeight !== nextHeight) {
      practice.style.height = `${previousHeight}px`
      void practice.offsetHeight
      practice.style.height = `${nextHeight}px`
    }

    transitionTimerRef.current = window.setTimeout(() => {
      delete practice.dataset.transition
      practice.style.removeProperty("height")
      previousHeightRef.current = practice.getBoundingClientRect().height
      transitionTimerRef.current = null
    }, getMotionDuration(PROBLEM_TRANSITION_DURATION_MS))
  }, [card.hintOpen, problem.id])

  useLayoutEffect(
    () => () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    },
    [],
  )

  useLayoutEffect(() => {
    const practice = practiceRef.current
    if (!practice || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      if (transitionTimerRef.current !== null) return
      const entry = entries[0]
      const borderBox = Array.isArray(entry?.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry?.borderBoxSize
      const height = borderBox?.blockSize ?? practice.getBoundingClientRect().height
      if (height) previousHeightRef.current = height
    })
    observer.observe(practice)
    return () => observer.disconnect()
  }, [])

  if (!card.checkpoint) return null

  return (
    <article
      aria-disabled={!interactive}
      className="card-practice"
      data-draft={draft}
      data-problem-id={problem.id}
      inert={!interactive}
      ref={practiceRef}
    >
      <CenterCard
        key={problem.id}
        canGoToNextSlot={card.canGoToNextSlot}
        canGoToPreviousSlot={card.canGoToPreviousSlot}
        checkpoint={card.checkpoint}
        context={projectCheckpointContext(problem.target, card.checkpoint)}
        focusRequest={card.focusRequest}
        hintOpen={card.hintOpen}
        hintRows={card.hintRows}
        interactive={interactive}
        onCloseHint={card.closeHint}
        onEditSegment={card.editSegment}
        onNextSlot={card.goToNextSlot}
        onPreviousSlot={card.goToPreviousSlot}
        onSubmit={card.submit}
        onToggleHint={card.toggleHint}
        segmentValues={card.segmentValues}
        slotIndex={card.slotIndex}
        slotTotal={card.slotTotal}
        verdict={card.verdict}
      />
    </article>
  )
}
