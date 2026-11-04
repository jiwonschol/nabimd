let currentProblemId: string | undefined

/** The document on screen, so an error report can say which one broke. */
export function setCurrentProblemId(id: string | undefined) {
  currentProblemId = id
}

export function getCurrentProblemId(): string | undefined {
  return currentProblemId
}
