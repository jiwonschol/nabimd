import { useCallback, useRef, useState } from "react"
import { getKoSample, type KoSample } from "../content/ko/_samples"
import { derivePlaintextStarter } from "../content/plaintextStarter"
import type { GradableProblem } from "../content/types"
import type { FlaggedLineRange } from "../editor/flaggedLine"
import { evaluateProblem } from "../engine/evaluateProblem"
import { createEvaluationContext } from "../engine/evaluationContext"
import { diagnoseMatchFailure } from "../engine/matchDiagnostics"
import type { MatchFailure } from "../engine/types"

export type SheetVerdict =
  | {
      kind: "retry"
      /** Grows with every check so the editor can re-flag the same line. */
      id: number
      message: string
      /** 1-based source lines the first failed check points at, when known. */
      lines: FlaggedLineRange | null
    }
  | {
      kind: "pass"
      id: number
      /** The draft that passed, kept for the side-by-side render. */
      source: string
      reviews: readonly string[]
    }

/** How many failed checks unlock "정답 보기" (plan §4.1: after the second). */
export const ANSWER_AFTER_RETRIES = 2

function lineNumberAt(source: string, offset: number): number {
  let line = 1
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source.charCodeAt(index) === 10) line += 1
  }
  return line
}

/**
 * The lines the verdict names: the block the engine matched against the
 * failed check, as a line range. The engine diagnoses against the target's
 * block order, so a freely written document often yields no range (plan
 * §3.2); the verdict then shows the sentence alone.
 */
export function failureLines(
  problem: GradableProblem,
  evaluation: MatchFailure,
  source: string,
): FlaggedLineRange | null {
  const first = evaluation.failures[0]
  if (!first) return null
  const checkedSource = evaluation.checkedSource ?? source
  const diagnostic =
    first.diagnostic ??
    diagnoseMatchFailure(
      problem,
      first.check,
      createEvaluationContext(checkedSource),
      0,
    )
  const range = diagnostic.observedRange
  if (!range) return null
  // The range end sits just past the block; back up one so a block that ends
  // in a newline is not counted into the following line.
  const lastOffset = Math.max(range.start, range.end - 1)
  return {
    from: lineNumberAt(checkedSource, range.start),
    to: lineNumberAt(checkedSource, lastOffset),
  }
}

export function retryMessage(
  message: string,
  lines: FlaggedLineRange | null,
): string {
  if (lines === null) return message
  const where =
    lines.from === lines.to
      ? `${lines.from}번째 줄`
      : `${lines.from}~${lines.to}번째 줄`
  return `${where}: ${message}`
}

export type PracticeSheet = {
  sample: KoSample
  draft: string
  verdict: SheetVerdict | null
  retries: number
  hintShown: boolean
  answerShown: boolean
  canShowAnswer: boolean
  changeDraft: (value: string) => void
  check: () => void
  toggleHint: () => void
  showAnswer: () => void
  next: () => void
}

/**
 * One practice sheet: the sample document, the learner's draft and the real
 * engine's verdict on it. Every state the design candidates show comes from
 * typing into the editor and pressing 확인; nothing is staged.
 */
export function usePracticeSheet(initialIndex = 0): PracticeSheet {
  const [index, setIndex] = useState(initialIndex)
  const sample = getKoSample(index)
  const [draft, setDraft] = useState(() =>
    derivePlaintextStarter(sample.problem.target),
  )
  const [verdict, setVerdict] = useState<SheetVerdict | null>(null)
  const [retries, setRetries] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [answerShown, setAnswerShown] = useState(false)
  const verdictCount = useRef(0)

  const check = useCallback(() => {
    const evaluation = evaluateProblem(sample.problem, draft)
    verdictCount.current += 1
    const id = verdictCount.current
    setHintShown(false)
    if (evaluation.status === "matched") {
      setVerdict({
        kind: "pass",
        id,
        source: draft,
        reviews: evaluation.reviewItems.map((item) => item.message),
      })
      return
    }
    setRetries((count) => count + 1)
    setVerdict({
      kind: "retry",
      id,
      message: evaluation.message,
      lines: failureLines(sample.problem, evaluation, draft),
    })
  }, [draft, sample.problem])

  const changeDraft = useCallback((value: string) => {
    setDraft(value)
    // A failed verdict stays while the learner fixes the draft in place; a
    // passed one is about the exact text that passed, so editing withdraws it.
    setVerdict((current) => (current?.kind === "pass" ? null : current))
  }, [])

  const toggleHint = useCallback(() => setHintShown((shown) => !shown), [])
  const showAnswer = useCallback(() => setAnswerShown(true), [])

  const next = useCallback(() => {
    const nextIndex = index + 1
    setIndex(nextIndex)
    setDraft(derivePlaintextStarter(getKoSample(nextIndex).problem.target))
    setVerdict(null)
    setRetries(0)
    setHintShown(false)
    setAnswerShown(false)
  }, [index])

  return {
    sample,
    draft,
    verdict,
    retries,
    hintShown,
    answerShown,
    canShowAnswer: retries >= ANSWER_AFTER_RETRIES && !answerShown,
    changeDraft,
    check,
    toggleHint,
    showAnswer,
    next,
  }
}
