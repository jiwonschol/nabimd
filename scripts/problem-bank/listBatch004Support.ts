import { listBatch004Fixtures } from "../../src/content/batches/listBatch004Fixtures"
import { listBatch004Problems } from "../../src/content/batches/listBatch004Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const LIST_BATCH_004_ID = "2026-07-19-l1-l2-lists-004"

export const listBatch004Config = {
  batchId: LIST_BATCH_004_ID,
  sequence: 4,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildListBatch004Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: listBatch004Config,
    problems: listBatch004Problems,
    fixtures: listBatch004Fixtures,
  })
}

export function writeListBatch004Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildListBatch004Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedListBatch004({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: listBatch004Config,
  })
}

export function checkListBatch004State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildListBatch004Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedListBatch004>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildListBatch004Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildListBatch004Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedListBatch004>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishListBatch004Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildListBatch004Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
