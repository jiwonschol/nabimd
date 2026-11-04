import { useCallback, useMemo, useRef, useState } from "react"
import type { GradableProblem } from "../content/types"
import { deriveMarkdownBlankGuides } from "../content/plaintextStarter"
import type { FlaggedLineRange } from "../editor/flaggedLine"
import type { MarkdownBlankGuideSource } from "../editor/markdownBlankGuides"
import { evaluateProblem } from "../engine/evaluateProblem"
import { createEvaluationContext } from "../engine/evaluationContext"
import { diagnoseMatchFailure } from "../engine/matchDiagnostics"
import type { EngineMessageKey, MatchFailure } from "../engine/types"
import type { PracticeItem } from "./practiceItem"

/** Failed checks on one document before "정답 보기" appears (plan §4.1). */
export const ANSWER_AFTER_RETRIES = 2

/**
 * How many editorial reviews a pass shows. A screen decision, so it lives
 * here and not in the engine (plan §3.2, the fix list's second item).
 */
export const REVIEWS_SHOWN = 3

export type HintStep = 0 | 1 | 2

export type SheetVerdict =
  | {
      kind: "retry"
      /** Grows with every check so the editor can re-flag the same line. */
      id: number
      /** The authored feedback, used when the engine gives no key. */
      message: string
      messageKey?: EngineMessageKey
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

export type SheetResult = {
  problemId: string
  passed: boolean
  /** The draft that was checked. */
  source: string
  /** Failed checks on this document before this one. */
  retriesBefore: number
}

export type PracticeSheet = {
  item: PracticeItem
  draft: string
  verdict: SheetVerdict | null
  retries: number
  hintStep: HintStep
  answerShown: boolean
  canShowAnswer: boolean
  blankPage: boolean
  showInvisibles: boolean
  /** Present only on the second hint step in fill mode. */
  blankGuides: MarkdownBlankGuideSource | null
  changeDraft: (value: string) => void
  check: () => void
  advanceHint: () => void
  showAnswer: () => void
  setBlankPage: (blank: boolean) => void
  toggleInvisibles: () => void
}

function startingDraft(problem: GradableProblem, blankPage: boolean): string {
  return blankPage ? "" : problem.starterText
}

/**
 * One document: the learner's draft and the real engine's verdict on it.
 * Nothing advances by itself; the learner reads the verdict and moves on
 * (plan §4.1, no auto-advance).
 */
export function usePracticeSheet(
  item: PracticeItem,
  options: {
    blankPage: boolean
    onBlankPageChange: (blank: boolean) => void
    onChecked: (result: SheetResult) => void
  },
): PracticeSheet {
  const { problem } = item
  const [draft, setDraft] = useState(() =>
    startingDraft(problem, options.blankPage),
  )
  const [verdict, setVerdict] = useState<SheetVerdict | null>(null)
  const [retries, setRetries] = useState(0)
  const [hintStep, setHintStep] = useState<HintStep>(0)
  const [answerShown, setAnswerShown] = useState(false)
  const [showInvisibles, setShowInvisibles] = useState(false)
  // The mode this document started in; switching modes only resets a draft
  // nobody has touched, so typed work is never thrown away.
  const [startedBlank, setStartedBlank] = useState(options.blankPage)
  const verdictCount = useRef(0)
  // The editor can report a change and run the check shortcut inside the
  // same key event, before React re-renders; the check reads this ref so it
  // always grades what is on screen.
  const draftRef = useRef(draft)
  const onCheckedRef = useRef(options.onChecked)
  onCheckedRef.current = options.onChecked

  const check = useCallback(() => {
    const draft = draftRef.current
    const evaluation = evaluateProblem(problem, draft)
    verdictCount.current += 1
    const id = verdictCount.current
    setHintStep(0)
    const passed = evaluation.status === "matched"
    onCheckedRef.current({
      problemId: problem.id,
      passed,
      source: draft,
      retriesBefore: retries,
    })
    if (evaluation.status === "matched") {
      setVerdict({
        kind: "pass",
        id,
        source: draft,
        reviews: evaluation.reviewItems
          .slice(0, REVIEWS_SHOWN)
          .map((review) => review.message),
      })
      return
    }
    setRetries((count) => count + 1)
    setVerdict({
      kind: "retry",
      id,
      message: evaluation.message,
      messageKey: evaluation.messageKey,
      lines: failureLines(problem, evaluation, draft),
    })
  }, [problem, retries])

  const changeDraft = useCallback((value: string) => {
    draftRef.current = value
    setDraft(value)
    // A failed verdict stays while the learner fixes the draft in place; a
    // passed one is about the exact text that passed, so editing withdraws it.
    setVerdict((current) => (current?.kind === "pass" ? null : current))
  }, [])

  const setBlankPage = useCallback(
    (blank: boolean) => {
      options.onBlankPageChange(blank)
      if (draftRef.current !== startingDraft(problem, startedBlank)) return
      setStartedBlank(blank)
      draftRef.current = startingDraft(problem, blank)
      setDraft(draftRef.current)
    },
    [options, problem, startedBlank],
  )

  const guides = useMemo<MarkdownBlankGuideSource>(
    () => ({
      guides: deriveMarkdownBlankGuides(problem.target),
      starterText: problem.starterText,
    }),
    [problem],
  )

  return {
    item,
    draft,
    verdict,
    retries,
    hintStep,
    answerShown,
    canShowAnswer: retries >= ANSWER_AFTER_RETRIES && !answerShown,
    blankPage: options.blankPage,
    showInvisibles,
    blankGuides: hintStep === 2 && !startedBlank ? guides : null,
    changeDraft,
    check,
    advanceHint: useCallback(
      () => setHintStep((step) => ((step + 1) % 3) as HintStep),
      [],
    ),
    showAnswer: useCallback(() => setAnswerShown(true), []),
    setBlankPage,
    toggleInvisibles: useCallback(() => setShowInvisibles((shown) => !shown), []),
  }
}
