type RunScheduleState = {
  problemIds: string[]
  stepIndex: number
  currentIsTransfer: boolean
}

export function placeTransferAtNextStep(
  problemIds: readonly string[],
  currentIndex: number,
  transferProblemId: string,
): string[] {
  const nextIndex = currentIndex + 1
  const laterIndex = problemIds.indexOf(transferProblemId, nextIndex)

  if (laterIndex === nextIndex) return [...problemIds]
  if (laterIndex > nextIndex) {
    const reordered = [...problemIds]
    reordered.splice(laterIndex, 1)
    reordered.splice(nextIndex, 0, transferProblemId)
    return reordered
  }

  const extended = [...problemIds]
  extended.splice(nextIndex, 0, transferProblemId)
  return extended
}

function matchesPersistedState(
  state: RunScheduleState,
  persistedProblemIds: readonly string[],
  persistedStepIndex: number,
  persistedCurrentIsTransfer: boolean,
): boolean {
  return (
    state.stepIndex === persistedStepIndex &&
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
    state.currentIsTransfer,
  ])
}

export function isReachableRunSchedule({
  baselineProblemIds,
  persistedProblemIds,
  persistedStepIndex,
  persistedCurrentIsTransfer,
  replacementProblemIdsByProblemId,
  transferProblemIds,
}: {
  baselineProblemIds: readonly string[]
  persistedProblemIds: readonly string[]
  persistedStepIndex: number
  persistedCurrentIsTransfer: boolean
  replacementProblemIdsByProblemId: ReadonlyMap<
    string,
    ReadonlySet<string>
  >
  transferProblemIds: ReadonlySet<string>
}): boolean {
  const queue: RunScheduleState[] = [
    {
      problemIds: [...baselineProblemIds],
      stepIndex: 0,
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
      replacementProblemIdsByProblemId
        .get(currentProblemId)
        ?.has(persistedProblemId)
    ) {
      const replacedProblemIds = [...state.problemIds]
      replacedProblemIds[state.stepIndex] = persistedProblemId
      queue.push({
        problemIds: replacedProblemIds,
        stepIndex: state.stepIndex,
        currentIsTransfer: state.currentIsTransfer,
      })
    }

    queue.push({
      problemIds: state.problemIds,
      stepIndex: state.stepIndex + 1,
      currentIsTransfer: false,
    })

    if (state.currentIsTransfer) continue

    for (const transferProblemId of transferProblemIds) {
      if (transferProblemId === currentProblemId) continue

      const nextProblemIds = placeTransferAtNextStep(
        state.problemIds,
        state.stepIndex,
        transferProblemId,
      )
      if (nextProblemIds.length > persistedProblemIds.length) continue

      queue.push({
        problemIds: nextProblemIds,
        stepIndex: state.stepIndex + 1,
        currentIsTransfer: true,
      })
    }
  }

  return false
}
