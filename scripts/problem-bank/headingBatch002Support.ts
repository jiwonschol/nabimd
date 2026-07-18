import { headingBatch002Fixtures } from "../../src/content/batches/headingBatch002Fixtures"
import { headingBatch002Problems } from "../../src/content/batches/headingBatch002Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const HEADING_BATCH_002_ID = "2026-07-19-l1-l2-headings-002"

export const headingBatch002Config = {
  batchId: HEADING_BATCH_002_ID,
  sequence: 2,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildHeadingBatch002Artifacts({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: headingBatch002Config,
    problems: headingBatch002Problems,
    fixtures: headingBatch002Fixtures,
  })
}

export function writeHeadingBatch002Artifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildHeadingBatch002Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedHeadingBatch002({
  repositoryRoot,
}: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: headingBatch002Config,
  })
}

export function checkHeadingBatch002State({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildHeadingBatch002Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedHeadingBatch002>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildHeadingBatch002Publication({
  computed,
  committed,
}: {
  computed: Awaited<ReturnType<typeof buildHeadingBatch002Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedHeadingBatch002>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishHeadingBatch002Artifacts({
  repositoryRoot,
  computed,
}: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildHeadingBatch002Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
