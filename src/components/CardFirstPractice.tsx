import type { GradableProblem } from "../content/types"
import {
  projectCheckpointContext,
  type SyntaxMistake,
} from "../guided/guidedSyntax"
import { useCenterCard } from "../guided/useCenterCard"
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

  if (!card.checkpoint) return null

  return (
    <article
      aria-disabled={!interactive}
      className="card-practice"
      data-draft={draft}
      data-problem-id={problem.id}
      inert={!interactive}
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
        mirroredSegmentIndexes={card.mirroredSegmentIndexes}
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
