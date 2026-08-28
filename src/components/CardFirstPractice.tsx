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
    const nextHeight = practice.scrollHeight
    const previousHeight = previousHeightRef.current

    previousProblemIdRef.current = problem.id
    previousHintOpenRef.current = card.hintOpen
    previousHeightRef.current = nextHeight

    if (!problemChanged && !hintChanged) return

    if (transitionTimerRef.current !== null) {
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
