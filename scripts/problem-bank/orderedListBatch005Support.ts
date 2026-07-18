import { orderedListBatch005Fixtures } from "../../src/content/batches/orderedListBatch005Fixtures"
import { orderedListBatch005Problems } from "../../src/content/batches/orderedListBatch005Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const ORDERED_LIST_BATCH_005_ID =
  "2026-07-19-l1-l2-ordered-lists-005"

export const orderedListBatch005Config = {
  batchId: ORDERED_LIST_BATCH_005_ID,
  sequence: 5,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildOrderedListBatch005Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: orderedListBatch005Config,
    problems: orderedListBatch005Problems,
    fixtures: orderedListBatch005Fixtures,
  })
}

export function writeOrderedListBatch005Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildOrderedListBatch005Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedOrderedListBatch005({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: orderedListBatch005Config,
  })
}

export function checkOrderedListBatch005State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildOrderedListBatch005Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedOrderedListBatch005>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildOrderedListBatch005Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildOrderedListBatch005Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedOrderedListBatch005>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishOrderedListBatch005Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildOrderedListBatch005Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
