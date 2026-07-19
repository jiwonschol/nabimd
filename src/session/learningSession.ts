import type { GradableProblem } from "../content/types"
import type { Evaluation } from "../engine/types"
import { createDefaultProgress } from "../progress/progressStore"
import type { ProgressV4 } from "../progress/types"
import {
  getEntryChoice,
  type EntryId,
} from "../content/entryChoices"
import { placeTransferAtNextStep } from "./runSchedule"

export type LearningSession = {
  phase: "editing" | "evaluated" | "complete"
  entryId: EntryId | null
  runNumber: number
  runProblemIds: string[]
  runStepIndex: number
  currentProblemId: string
  draft: string
  evaluation: Evaluation | null
  teachingMode: GradableProblem["teachingMode"]
  retryFamily: GradableProblem["retryFamily"]
  hadFailure: boolean
  needsTransfer: boolean
  currentIsTransfer: boolean
  hintStartsOpen: boolean
  hintLevel: 0 | 1 | 2 | 3
  coach: "closed" | "hint"
  progress: ProgressV4
}

export type SessionEvent =
  | {
      type: "started"
      entryId: EntryId
      runNumber: number
      runProblemIds: string[]
      problem: GradableProblem
    }
  | { type: "returned-to-greeting"; problem: GradableProblem }
  | { type: "edited"; value: string }
  | {
      type: "checked"
      evaluation: Evaluation
      retryFamily: GradableProblem["retryFamily"]
    }
  | { type: "hint-requested" }
  | { type: "coach-closed" }
  | { type: "problem-replaced"; problem: GradableProblem }
  | {
      type: "next"
      nextProblemId?: string
      nextProblem?: GradableProblem
      nextDraft?: string
    }

function shouldStartHintOpen({
  entryId,
  currentIsTransfer,
  problem,
}: {
  entryId: EntryId | null
  currentIsTransfer: boolean
  problem: GradableProblem
}): boolean {
  if (currentIsTransfer) return false
  if (entryId === null) return problem.teachingMode === "introduce"

  const entryLevel = getEntryChoice(entryId).level
  // The run policy places chosen-level work before next-level challenges.
  // Comparing levels preserves that role if a remedial item shifts indices.
  return problem.level === entryLevel
}

export function createLearningSession(
  progress: ProgressV4,
  problem: GradableProblem,
): LearningSession {
  const isComplete = progress.runProblemIds.length
    ? progress.runStepIndex >= progress.runProblemIds.length
    : progress.completedProblemIds.includes(problem.id) &&
      progress.pendingTransferFamily === null &&
      !progress.currentIsTransfer
  const hintStartsOpen =
    !isComplete &&
    shouldStartHintOpen({
      entryId: progress.entryId,
      currentIsTransfer: progress.currentIsTransfer,
      problem,
    })
  const teachingMode = progress.currentIsTransfer
    ? "recall"
    : problem.teachingMode

  return {
    phase: isComplete ? "complete" : "editing",
    entryId: progress.entryId,
    runNumber: progress.runNumber,
    runProblemIds: [...progress.runProblemIds],
    runStepIndex: progress.runStepIndex,
    currentProblemId: problem.id,
    draft: progress.draftByProblemId[problem.id] ?? problem.starterText,
    evaluation: null,
    teachingMode,
    retryFamily: problem.retryFamily,
    hadFailure: progress.pendingTransferFamily !== null,
    needsTransfer: progress.pendingTransferFamily !== null,
    currentIsTransfer: progress.currentIsTransfer,
    hintStartsOpen,
    hintLevel: hintStartsOpen ? 1 : 0,
    coach: hintStartsOpen ? "hint" : "closed",
    progress,
  }
}

export function canAdvance(session: LearningSession): boolean {
  return (
    session.phase === "evaluated" &&
    session.evaluation !== null &&
    session.evaluation.status !== "fail"
  )
}

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value]
}

function completeSession(session: LearningSession): LearningSession {
  return {
    ...session,
    phase: "complete",
    runStepIndex: session.runProblemIds.length || session.runStepIndex,
    coach: "closed",
    needsTransfer: false,
    currentIsTransfer: false,
    progress: {
      ...session.progress,
      completedProblemIds: appendUnique(
        session.progress.completedProblemIds,
        session.currentProblemId,
      ),
      recentProblemIds: appendUnique(
        session.progress.recentProblemIds,
        session.currentProblemId,
      ),
      pendingTransferFamily: null,
      currentIsTransfer: false,
      runStepIndex: session.runProblemIds.length || session.runStepIndex,
    },
  }
}

export function learningSessionReducer(
  session: LearningSession,
  event: SessionEvent,
): LearningSession {
  switch (event.type) {
    case "started":
      return createLearningSession(
        {
          ...createDefaultProgress(event.problem.id),
          entryId: event.entryId,
          runNumber: event.runNumber,
          runProblemIds: [...event.runProblemIds],
        },
        event.problem,
      )

    case "returned-to-greeting":
      return createLearningSession(
        createDefaultProgress(event.problem.id),
        event.problem,
      )

    case "edited":
      return {
        ...session,
        phase: "editing",
        draft: event.value,
        evaluation: null,
        coach: session.coach,
        progress: {
          ...session.progress,
          draftByProblemId: {
            ...session.progress.draftByProblemId,
            [session.currentProblemId]: event.value,
          },
        },
      }

    case "checked": {
      const failed = event.evaluation.status === "fail"
      return {
        ...session,
        phase: "evaluated",
        evaluation: event.evaluation,
        hadFailure: session.hadFailure || failed,
        needsTransfer: session.needsTransfer || failed,
        hintLevel: failed ? session.hintLevel : 0,
        coach: "closed",
        progress: {
          ...session.progress,
          pendingTransferFamily: failed
            ? event.retryFamily
            : session.progress.pendingTransferFamily,
        },
      }
    }

    case "hint-requested": {
      if (session.coach !== "hint") {
        return {
          ...session,
          coach: "hint",
          hintLevel: Math.max(1, session.hintLevel) as 1 | 2 | 3,
        }
      }

      if (session.evaluation?.status !== "fail") return session
      const nextHintLevel = Math.min(3, session.hintLevel + 1) as
        | 1
        | 2
        | 3
      return {
        ...session,
        coach: "hint",
        hintLevel: nextHintLevel,
      }
    }

    case "coach-closed":
      return session.coach === "closed"
        ? session
        : { ...session, coach: "closed" }

    case "problem-replaced": {
      const replacementIsTransfer =
        session.currentIsTransfer || session.needsTransfer
      const nextRunProblemIds = session.runProblemIds.map(
        (problemId, index) =>
          index === session.runStepIndex ? event.problem.id : problemId,
      )
      const keepsIntroduction =
        session.teachingMode === "introduce" && !replacementIsTransfer
      const hintStartsOpen =
        session.hintStartsOpen && !replacementIsTransfer

      return {
        ...session,
        phase: "editing",
        currentProblemId: event.problem.id,
        draft: event.problem.starterText,
        evaluation: null,
        teachingMode: keepsIntroduction ? "introduce" : "recall",
        retryFamily: event.problem.retryFamily,
        hadFailure: false,
        needsTransfer: false,
        currentIsTransfer: replacementIsTransfer,
        runProblemIds: nextRunProblemIds,
        hintStartsOpen,
        hintLevel: hintStartsOpen ? 1 : 0,
        coach: hintStartsOpen ? "hint" : "closed",
        progress: {
          ...session.progress,
          currentProblemId: event.problem.id,
          draftByProblemId: {
            ...session.progress.draftByProblemId,
            [event.problem.id]: event.problem.starterText,
          },
          recentProblemIds: appendUnique(
            session.progress.recentProblemIds,
            session.currentProblemId,
          ),
          pendingTransferFamily: null,
          currentIsTransfer: replacementIsTransfer,
          runProblemIds: nextRunProblemIds,
        },
      }
    }

    case "next": {
      if (!canAdvance(session)) return session
      const nextProblemId = event.nextProblem?.id ?? event.nextProblemId
      if (!nextProblemId || event.nextDraft === undefined) {
        return session.needsTransfer && !session.currentIsTransfer
          ? session
          : completeSession(session)
      }
      const nextIsTransfer =
        session.needsTransfer && !session.currentIsTransfer
      const nextRunProblemIds = nextIsTransfer
        ? placeTransferAtNextStep(
            session.runProblemIds,
            session.runStepIndex,
            nextProblemId,
          )
        : session.runProblemIds
      const nextRunStepIndex = session.runStepIndex + 1
      const hintStartsOpen = event.nextProblem
        ? shouldStartHintOpen({
            entryId: session.entryId,
            currentIsTransfer: nextIsTransfer,
            problem: event.nextProblem,
          })
        : false

      return {
        ...session,
        phase: "editing",
        currentProblemId: nextProblemId,
        draft: event.nextDraft,
        evaluation: null,
        teachingMode: nextIsTransfer
          ? "recall"
          : event.nextProblem?.teachingMode ?? "recall",
        retryFamily: event.nextProblem?.retryFamily ?? session.retryFamily,
        hadFailure: false,
        needsTransfer: false,
        currentIsTransfer: nextIsTransfer,
        runProblemIds: nextRunProblemIds,
        runStepIndex: nextRunStepIndex,
        hintStartsOpen,
        hintLevel: hintStartsOpen ? 1 : 0,
        coach: hintStartsOpen ? "hint" : "closed",
        progress: {
          ...session.progress,
          currentProblemId: nextProblemId,
          draftByProblemId: {
            ...session.progress.draftByProblemId,
            [nextProblemId]: event.nextDraft,
          },
          completedProblemIds: appendUnique(
            session.progress.completedProblemIds,
            session.currentProblemId,
          ),
          recentProblemIds: appendUnique(
            session.progress.recentProblemIds,
            session.currentProblemId,
          ),
          currentIsTransfer: nextIsTransfer,
          runProblemIds: nextRunProblemIds,
          runStepIndex: nextRunStepIndex,
          pendingTransferFamily: null,
        },
      }
    }
  }
}
