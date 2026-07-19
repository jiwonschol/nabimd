import { linkBatch008Fixtures } from "../../src/content/batches/linkBatch008Fixtures"
import { linkBatch008Problems } from "../../src/content/batches/linkBatch008Problems"
import {
  buildAuthoredBatchArtifacts,
  buildAuthoredBatchPublication,
  checkAuthoredBatchState,
  publishAuthoredBatchArtifacts,
  readCommittedAuthoredBatch,
  writeAuthoredBatchArtifacts,
  type AuthoredBatchConfig,
} from "./batchArtifactSupport"

export const LINK_BATCH_008_ID = "2026-07-19-l1-l2-links-008"

export const linkBatch008Config = {
  batchId: LINK_BATCH_008_ID,
  sequence: 8,
  curriculumVersion: "2026-07-19",
  generatedBy: "gpt-5.6-codex-build-time-authoring",
  generatedOn: "2026-07-19",
  requiredIndependentReviews: 2,
} as const satisfies AuthoredBatchConfig

export function buildLinkBatch008Artifacts({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return buildAuthoredBatchArtifacts({
    repositoryRoot,
    config: linkBatch008Config,
    problems: linkBatch008Problems,
    fixtures: linkBatch008Fixtures,
  })
}

export function writeLinkBatch008Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildLinkBatch008Artifacts>>
}) {
  return writeAuthoredBatchArtifacts({ repositoryRoot, computed })
}

export function readCommittedLinkBatch008({ repositoryRoot }: {
  repositoryRoot: string
}) {
  return readCommittedAuthoredBatch({
    repositoryRoot,
    config: linkBatch008Config,
  })
}

export function checkLinkBatch008State({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildLinkBatch008Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedLinkBatch008>>
}) {
  return checkAuthoredBatchState({ computed, committed })
}

export function buildLinkBatch008Publication({ computed, committed }: {
  computed: Awaited<ReturnType<typeof buildLinkBatch008Artifacts>>
  committed: Awaited<ReturnType<typeof readCommittedLinkBatch008>>
}) {
  return buildAuthoredBatchPublication({ computed, committed })
}

export function publishLinkBatch008Artifacts({ repositoryRoot, computed }: {
  repositoryRoot: string
  computed: Awaited<ReturnType<typeof buildLinkBatch008Artifacts>>
}) {
  return publishAuthoredBatchArtifacts({ repositoryRoot, computed })
}
