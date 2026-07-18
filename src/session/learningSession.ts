import type { Problem } from "../content/types"
import type { Evaluation } from "../engine/types"
import type { ProgressV1 } from "../progress/types"

export type LearningSession = {
  phase: "editing" | "evaluated" | "complete"
  currentProblemId: string
  draft: string
  evaluation: Evaluation | null
  teachingMode: Problem["teachingMode"]
  retryFamily: Problem["retryFamily"]
  hadFailure: boolean
  needsTransfer: boolean
  currentIsTransfer: boolean
  hintLevel: 0 | 1 | 2 | 3
  coach: "closed" | "hint" | "review"
  progress: ProgressV1
}

export type SessionEvent =
  | { type: "edited"; value: string }
  | {
      type: "checked"
      evaluation: Evaluation
      retryFamily: Problem["retryFamily"]
    }
  | { type: "hint-requested" }
  | { type: "review-requested" }
  | { type: "coach-closed" }
  | {
      type: "next"
      transferProblemId?: string
      transferDraft?: string
    }

export function createLearningSession(
  progress: ProgressV1,
  problem: Problem,
): LearningSession {
  const isComplete =
    progress.completedProblemIds.includes(problem.id) &&
    progress.pendingTransferFamily === null &&
    !progress.currentIsTransfer
  const showIntroducedRule =
    !isComplete && problem.teachingMode === "introduce"

  return {
    phase: isComplete ? "complete" : "editing",
    currentProblemId: problem.id,
    draft: progress.draftByProblemId[problem.id] ?? problem.starterText,
    evaluation: null,
    teachingMode: problem.teachingMode,
    retryFamily: problem.retryFamily,
    hadFailure: progress.pendingTransferFamily !== null,
    needsTransfer: progress.pendingTransferFamily !== null,
    currentIsTransfer: progress.currentIsTransfer,
    hintLevel: showIntroducedRule ? 1 : 0,
    coach: showIntroducedRule ? "hint" : "closed",
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
    },
  }
}

export function learningSessionReducer(
  session: LearningSession,
  event: SessionEvent,
): LearningSession {
  switch (event.type) {
    case "edited":
      return {
        ...session,
        phase: "editing",
        draft: event.value,
        evaluation: null,
        coach: session.coach === "review" ? "closed" : session.coach,
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
      if (
        session.phase === "evaluated" &&
        session.evaluation?.status !== "fail"
      ) {
        return session
      }

      if (session.coach !== "hint") {
        const createsTransferDebt =
          session.teachingMode === "recall" &&
          !session.currentIsTransfer

        return {
          ...session,
          coach: "hint",
          hintLevel: Math.max(1, session.hintLevel) as 1 | 2 | 3,
          needsTransfer:
            session.needsTransfer || createsTransferDebt,
          progress: createsTransferDebt
            ? {
                ...session.progress,
                pendingTransferFamily: session.retryFamily,
              }
            : session.progress,
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

    case "review-requested":
      return session.evaluation?.status === "matched"
        ? { ...session, coach: "review" }
        : session

    case "coach-closed":
      return session.coach === "closed"
        ? session
        : { ...session, coach: "closed" }

    case "next": {
      if (!canAdvance(session)) return session
      if (session.currentIsTransfer) return completeSession(session)
      if (!session.needsTransfer) return completeSession(session)
      if (!event.transferProblemId || event.transferDraft === undefined) {
        return session
      }

      return {
        ...session,
        phase: "editing",
        currentProblemId: event.transferProblemId,
        draft: event.transferDraft,
        evaluation: null,
        teachingMode: "recall",
        hadFailure: false,
        needsTransfer: false,
        currentIsTransfer: true,
        hintLevel: 0,
        coach: "closed",
        progress: {
          ...session.progress,
          currentProblemId: event.transferProblemId,
          draftByProblemId: {
            ...session.progress.draftByProblemId,
            [event.transferProblemId]: event.transferDraft,
          },
          completedProblemIds: appendUnique(
            session.progress.completedProblemIds,
            session.currentProblemId,
          ),
          recentProblemIds: appendUnique(
            session.progress.recentProblemIds,
            session.currentProblemId,
          ),
          currentIsTransfer: true,
        },
      }
    }
  }
}
