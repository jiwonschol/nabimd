import { blockquoteBatch006Fixtures } from "../../src/content/batches/blockquoteBatch006Fixtures"
import { blockquoteBatch006Problems } from "../../src/content/batches/blockquoteBatch006Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const BLOCKQUOTE_BATCH_006_ID =
  "2026-07-19-l1-l2-blockquotes-006"

export const blockquoteBatch006Config = {
  batchId: BLOCKQUOTE_BATCH_006_ID,
  sequence: 6,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildBlockquoteBatch006Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: blockquoteBatch006Config,
    problems: blockquoteBatch006Problems,
    fixtures: blockquoteBatch006Fixtures,
  })
}

export function writeBlockquoteBatch006Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildBlockquoteBatch006Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedBlockquoteBatch006({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: blockquoteBatch006Config,
  })
}

export function checkBlockquoteBatch006State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildBlockquoteBatch006Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedBlockquoteBatch006>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildBlockquoteBatch006Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildBlockquoteBatch006Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedBlockquoteBatch006>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishBlockquoteBatch006Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildBlockquoteBatch006Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
