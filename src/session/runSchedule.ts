type RunScheduleState = {
  problemIds: string[]
  stepIndex: number
  scheduledStepIndex: number
  currentIsTransfer: boolean
}

export function placeTransferAtNextStep(
  problemIds: readonly string[],
  currentIndex: number,
  transferProblemId: string,
): string[] {
  const nextIndex = currentIndex + 1
  // Transfer practice is outside the scheduled score slots. Even when the
  // selected content also appears later in the scheduled run, preserve that
  // scheduled occurrence and insert a distinct repair exercise here.
  const extended = [...problemIds]
  extended.splice(nextIndex, 0, transferProblemId)
  return extended
}

function matchesPersistedState(
  state: RunScheduleState,
  persistedProblemIds: readonly string[],
  persistedStepIndex: number,
  persistedScheduledStepIndex: number,
  persistedCurrentIsTransfer: boolean,
): boolean {
  return (
    state.stepIndex === persistedStepIndex &&
    state.scheduledStepIndex === persistedScheduledStepIndex &&
    state.currentIsTransfer === persistedCurrentIsTransfer &&
    state.problemIds.length === persistedProblemIds.length &&
    state.problemIds.every(
      (problemId, index) => problemId === persistedProblemIds[index],
    )
  )
}

function stateKey(state: RunScheduleState): string {
  return JSON.stringify([
    state.problemIds,
    state.stepIndex,
    state.scheduledStepIndex,
    state.currentIsTransfer,
  ])
}

export function isReachableRunSchedule({
  baselineProblemIds,
  persistedProblemIds,
  persistedStepIndex,
  persistedScheduledStepIndex,
  persistedCurrentIsTransfer,
  isEligibleTransferProblem,
}: {
  baselineProblemIds: readonly string[]
  persistedProblemIds: readonly string[]
  persistedStepIndex: number
  persistedScheduledStepIndex: number
  persistedCurrentIsTransfer: boolean
  isEligibleTransferProblem: (
    currentProblemId: string,
    candidateProblemId: string,
  ) => boolean
}): boolean {
  const queue: RunScheduleState[] = [
    {
      problemIds: [...baselineProblemIds],
      stepIndex: 0,
      scheduledStepIndex: 0,
      currentIsTransfer: false,
    },
  ]
  const visited = new Set<string>()

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor]!
    const key = stateKey(state)
    if (visited.has(key)) continue
    visited.add(key)

    if (
      matchesPersistedState(
        state,
        persistedProblemIds,
        persistedStepIndex,
        persistedScheduledStepIndex,
        persistedCurrentIsTransfer,
      )
    ) {
      return true
    }

    if (state.stepIndex >= state.problemIds.length) continue

    const currentProblemId = state.problemIds[state.stepIndex]!
    const persistedProblemId = persistedProblemIds[state.stepIndex]
    if (
      persistedProblemId !== undefined &&
      persistedProblemId !== currentProblemId &&
      isEligibleTransferProblem(currentProblemId, persistedProblemId)
    ) {
      const replacedProblemIds = [...state.problemIds]
      replacedProblemIds[state.stepIndex] = persistedProblemId
      queue.push({
        problemIds: replacedProblemIds,
        stepIndex: state.stepIndex,
        scheduledStepIndex: state.scheduledStepIndex,
        currentIsTransfer: state.currentIsTransfer,
      })
      if (!state.currentIsTransfer) {
        queue.push({
          problemIds: replacedProblemIds,
          stepIndex: state.stepIndex,
          scheduledStepIndex: state.scheduledStepIndex,
          currentIsTransfer: true,
        })
      }
    }

    queue.push({
      problemIds: state.problemIds,
      stepIndex: state.stepIndex + 1,
      scheduledStepIndex: state.scheduledStepIndex + 1,
      currentIsTransfer: false,
    })

    if (state.currentIsTransfer) continue

    const transferProblemId = persistedProblemIds[state.stepIndex + 1]
    if (
      transferProblemId !== undefined &&
      isEligibleTransferProblem(currentProblemId, transferProblemId)
    ) {
      const nextProblemIds = placeTransferAtNextStep(
        state.problemIds,
        state.stepIndex,
        transferProblemId,
      )
      if (nextProblemIds.length > persistedProblemIds.length) continue

      queue.push({
        problemIds: nextProblemIds,
        stepIndex: state.stepIndex + 1,
        scheduledStepIndex: state.scheduledStepIndex,
        currentIsTransfer: true,
      })
    }
  }

  return false
}
