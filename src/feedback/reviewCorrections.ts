import type { GradableProblem } from "../content/types"
import { createEvaluationContext } from "../engine/evaluationContext"
import { diagnoseMatchFailure } from "../engine/matchDiagnostics"
import type {
  MatchFailure,
  MatchFailureItem,
  SourceRange,
} from "../engine/types"
import { correctionCue } from "./correctionCues"

export type ReviewCorrection = {
  id: string
  kind: "structure" | "syntax"
  label: string
  location: string
  learnerExcerpt: string | null
  requiredSource: string | null
  repairInstruction: string
  attachedFailureIds: readonly string[]
  order: number
}

function sameRange(
  left: SourceRange | null,
  right: SourceRange | null,
): boolean {
  return Boolean(
    left && right && left.start === right.start && left.end === right.end,
  )
}

function excerpt(source: string, range: SourceRange | null): string | null {
  if (!range) return null
  const value = source.slice(range.start, range.end).trim()
  return value.length > 0 ? value : null
}

function diagnosticFor(
  problem: GradableProblem,
  failure: MatchFailureItem,
  source: string,
  index: number,
) {
  return failure.diagnostic ?? diagnoseMatchFailure(
    problem,
    failure.check,
    createEvaluationContext(source),
    index,
  )
}

export function buildReviewCorrections(
  problem: GradableProblem,
  evaluation: MatchFailure,
  source: string,
): readonly ReviewCorrection[] {
  const checkedSource = evaluation.checkedSource ?? source
  const rawOrder = new Map(
    evaluation.failures.map((failure, index) => [failure.feedbackId, index]),
  )
  const entries = evaluation.failures.map((failure, index) => ({
    failure,
    diagnostic: diagnosticFor(problem, failure, checkedSource, index),
  }))
  const specificEntries = entries.filter(
    ({ diagnostic }) => diagnostic.classification === "specific",
  )
  const corrections: ReviewCorrection[] = specificEntries.map(({
    failure,
    diagnostic,
  }) => {
    const cue = correctionCue(failure)
    return {
      id: failure.feedbackId,
      kind: "syntax" as const,
      label: cue.label,
      location: diagnostic.location,
      learnerExcerpt: excerpt(checkedSource, diagnostic.observedRange),
      requiredSource: diagnostic.expectedSource ?? cue.example,
      repairInstruction: failure.message,
      attachedFailureIds: [failure.feedbackId],
      order: diagnostic.slotOrder,
    }
  })

  for (const { failure, diagnostic } of entries) {
    if (diagnostic.classification !== "aggregate") continue
    const causalMatches = specificEntries.filter(({ diagnostic: candidate }) =>
      sameRange(diagnostic.observedRange, candidate.observedRange),
    )
    if (causalMatches.length === 1) {
      const relatedId = causalMatches[0]!.failure.feedbackId
      const correction = corrections.find((item) => item.id === relatedId)!
      correction.attachedFailureIds = [
        ...correction.attachedFailureIds,
        failure.feedbackId,
      ].sort(
        (left, right) =>
          (rawOrder.get(left) ?? 0) - (rawOrder.get(right) ?? 0),
      )
      continue
    }

    const cue = correctionCue(failure)
    corrections.push({
      id: failure.feedbackId,
      kind: "structure",
      label: cue.label,
      location: diagnostic.location,
      learnerExcerpt: excerpt(checkedSource, diagnostic.observedRange),
      requiredSource: null,
      repairInstruction: failure.message,
      attachedFailureIds: [failure.feedbackId],
      order: diagnostic.slotOrder,
    })
  }

  return corrections.sort(
    (left, right) =>
      left.order - right.order ||
      (rawOrder.get(left.id) ?? 0) - (rawOrder.get(right.id) ?? 0),
  )
}
