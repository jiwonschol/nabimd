import type { GradableProblem } from "../content/types"
import type { Evaluation } from "../engine/types"
import { createDefaultProgress } from "../progress/progressStore"
import type { ProgressV5 } from "../progress/types"
import {
  createRunProblemIds,
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
  scheduledStepIndex: number
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
  failedScheduledStepIndexes: number[]
  failedProblemIds: string[]
  runStartedAtMs: number | null
  runCompletedAtMs: number | null
  progress: ProgressV5
}

export type PracticeHistorySnapshot = Pick<
  LearningSession,
  | "entryId"
  | "runNumber"
  | "runProblemIds"
  | "runStepIndex"
  | "scheduledStepIndex"
  | "currentProblemId"
  | "currentIsTransfer"
  | "runStartedAtMs"
>

export type SessionEvent =
  | {
      type: "started"
      atMs: number
      entryId: EntryId
      runNumber: number
      runSeed?: number
      runProblemIds: string[]
      problem: GradableProblem
    }
  | {
      type: "returned-to-greeting"
      problem: GradableProblem
    }
  | {
      type: "history-navigated"
      snapshot: PracticeHistorySnapshot
      problem: GradableProblem
    }
  | { type: "edited"; value: string }
  | {
      type: "checked"
      evaluation: Evaluation
      retryFamily: GradableProblem["retryFamily"]
    }
  | { type: "hint-requested" }
  | { type: "slot-missed" }
  | { type: "coach-closed" }
  | { type: "problem-replaced"; problem: GradableProblem }
  | {
      type: "next"
      nextProblem: GradableProblem
      nextDraft: string
    }
  | { type: "completed"; atMs: number }

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
  progress: ProgressV5,
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
    scheduledStepIndex: progress.scheduledStepIndex,
    currentProblemId: problem.id,
    draft: progress.draftByProblemId[problem.id] ?? "",
    evaluation: null,
    teachingMode,
    retryFamily: problem.retryFamily,
    hadFailure: progress.pendingTransferFamily !== null,
    needsTransfer: progress.pendingTransferFamily !== null,
    currentIsTransfer: progress.currentIsTransfer,
    hintStartsOpen,
    hintLevel: hintStartsOpen ? 1 : 0,
    coach: hintStartsOpen ? "hint" : "closed",
    failedScheduledStepIndexes: [
      ...progress.failedScheduledStepIndexes,
    ],
    failedProblemIds: [...progress.failedProblemIds],
    runStartedAtMs: progress.runStartedAtMs,
    runCompletedAtMs: progress.runCompletedAtMs,
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

function appendUnique<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? [...values] : [...values, value]
}

function completeSession(
  session: LearningSession,
  atMs: number,
): LearningSession {
  const completedAtMs = Math.max(session.runStartedAtMs ?? atMs, atMs)
  const scheduledRunLength = session.entryId
    ? createRunProblemIds(
        session.entryId,
        session.runNumber,
        session.progress.runSeed,
      ).length
    : session.scheduledStepIndex
  return {
    ...session,
    phase: "complete",
    runStepIndex: session.runProblemIds.length || session.runStepIndex,
    scheduledStepIndex: scheduledRunLength,
    runCompletedAtMs: completedAtMs,
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
      scheduledStepIndex: scheduledRunLength,
      runCompletedAtMs: completedAtMs,
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
          runSeed: event.runSeed ?? session.progress.runSeed,
          runProblemIds: [...event.runProblemIds],
          runStartedAtMs: event.atMs,
        },
        event.problem,
      )

    case "returned-to-greeting":
      return createLearningSession(
        {
          ...createDefaultProgress(
            event.problem.id,
            undefined,
            session.progress.runSeed,
          ),
          runNumber: session.runNumber + 1,
        },
        event.problem,
      )

    case "history-navigated":
      return createLearningSession(
        {
          ...session.progress,
          entryId: event.snapshot.entryId,
          runNumber: event.snapshot.runNumber,
          runProblemIds: [...event.snapshot.runProblemIds],
          runStepIndex: event.snapshot.runStepIndex,
          scheduledStepIndex: event.snapshot.scheduledStepIndex,
          currentProblemId: event.snapshot.currentProblemId,
          currentIsTransfer: event.snapshot.currentIsTransfer,
          pendingTransferFamily: null,
          runStartedAtMs: event.snapshot.runStartedAtMs,
          runCompletedAtMs: null,
        },
        event.problem,
      )

    case "edited":
      return {
        ...session,
        phase: "editing",
        draft: event.value,
        evaluation:
          session.evaluation?.status === "fail" ? session.evaluation : null,
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
      const failedScheduledStepIndexes = failed
        ? appendUnique(
            session.failedScheduledStepIndexes,
            session.scheduledStepIndex,
          )
        : session.failedScheduledStepIndexes
      const failedProblemIds = failed
        ? appendUnique(session.failedProblemIds, session.currentProblemId)
        : session.failedProblemIds
      return {
        ...session,
        phase: "evaluated",
        evaluation: event.evaluation,
        hadFailure: session.hadFailure || failed,
        needsTransfer: session.needsTransfer || failed,
        hintLevel: failed ? session.hintLevel : 0,
        coach: "closed",
        failedScheduledStepIndexes,
        failedProblemIds,
        progress: {
          ...session.progress,
          pendingTransferFamily: failed
            ? event.retryFamily
            : session.progress.pendingTransferFamily,
          failedScheduledStepIndexes,
          failedProblemIds,
        },
      }
    }

    case "slot-missed": {
      // A wrong mark in the center card counts as a miss for the Summary
      // (score and syntax reminders) without judging the document or owing a
      // repair — the card itself already blocks the slot until it is right.
      const failedScheduledStepIndexes = appendUnique(
        session.failedScheduledStepIndexes,
        session.scheduledStepIndex,
      )
      const failedProblemIds = appendUnique(
        session.failedProblemIds,
        session.currentProblemId,
      )
      if (
        failedScheduledStepIndexes.length ===
          session.failedScheduledStepIndexes.length &&
        failedProblemIds.length === session.failedProblemIds.length
      ) {
        return session
      }
      return {
        ...session,
        hadFailure: true,
        failedScheduledStepIndexes,
        failedProblemIds,
        progress: {
          ...session.progress,
          failedScheduledStepIndexes,
          failedProblemIds,
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
      const hintStartsOpen = shouldStartHintOpen({
        entryId: session.entryId,
        currentIsTransfer: replacementIsTransfer,
        problem: event.problem,
      })

      return {
        ...session,
        phase: "editing",
        currentProblemId: event.problem.id,
        draft: "",
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
            [event.problem.id]: "",
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
      const nextProblemId = event.nextProblem.id
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
      const nextScheduledStepIndex = nextIsTransfer
        ? session.scheduledStepIndex
        : session.scheduledStepIndex + 1
      const hintStartsOpen = shouldStartHintOpen({
        entryId: session.entryId,
        currentIsTransfer: nextIsTransfer,
        problem: event.nextProblem,
      })

      return {
        ...session,
        phase: "editing",
        currentProblemId: nextProblemId,
        draft: event.nextDraft,
        evaluation: null,
        teachingMode: nextIsTransfer
          ? "recall"
          : event.nextProblem.teachingMode,
        retryFamily: event.nextProblem.retryFamily,
        hadFailure: false,
        needsTransfer: false,
        currentIsTransfer: nextIsTransfer,
        runProblemIds: nextRunProblemIds,
        runStepIndex: nextRunStepIndex,
        scheduledStepIndex: nextScheduledStepIndex,
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
          scheduledStepIndex: nextScheduledStepIndex,
          pendingTransferFamily: null,
        },
      }
    }

    case "completed":
      if (!canAdvance(session)) return session
      return session.needsTransfer && !session.currentIsTransfer
        ? session
        : completeSession(session, event.atMs)
  }
}
