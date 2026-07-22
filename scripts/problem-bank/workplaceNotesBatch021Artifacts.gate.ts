import { describe, expect, it } from "vitest"
import { workplaceNotesBatch021Fixtures } from "../../src/content/batches/workplaceNotesBatch021Fixtures"
import { workplaceNotesBatch021Problems } from "../../src/content/batches/workplaceNotesBatch021Problems"
import {
  buildWorkplaceNotesBatch021Artifacts,
  buildWorkplaceNotesBatch021Publication,
  checkWorkplaceNotesBatch021State,
  publishWorkplaceNotesBatch021Artifacts,
  readCommittedWorkplaceNotesBatch021,
  writeWorkplaceNotesBatch021Artifacts,
} from "./workplaceNotesBatch021Support"

const repositoryRoot = process.cwd()
const computed = await buildWorkplaceNotesBatch021Artifacts({ repositoryRoot })

describe("schema-v2 Level 4 workplace-notes batch 021", () => {
  it("runs every candidate fixture through the real learner engine", () => {
    expect(computed.normalized.candidateCount).toBe(12)
    expect(computed.fixtureArtifact.fixtures).toHaveLength(
      workplaceNotesBatch021Fixtures.length,
    )
    expect(computed.regressionVerification.errors).toEqual([])
    expect(computed.regressionVerification.candidates).toHaveLength(12)
    expect(
      computed.regressionVerification.candidates.every(
        (candidate: { passed: boolean }) => candidate.passed,
      ),
    ).toBe(true)
  })

  it("binds the exact prompt, candidates, fixtures, and engine contract", () => {
    expect(computed.engineContract.dependencies).toEqual([
      { name: "mdast-util-from-markdown", version: "2.0.3" },
    ])
    expect(computed.manifest.entries).toHaveLength(12)
    expect(
      computed.normalized.candidates.map(({ id, revision }) => ({
        id,
        revision,
      })),
    ).toEqual(
      workplaceNotesBatch021Problems
        .map(({ id, revision }) => ({ id, revision }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    )
    expect(
      computed.manifest.entries.every(
        (entry: { engineContractDigest: string }) =>
          entry.engineContractDigest ===
          computed.engineContract.engineContractDigest,
      ),
    ).toBe(true)
  })

  it("starts from the published 360-problem checkpoint", () => {
    expect(computed.priorTracker.acceptedTotal).toBe(360)
    expect(computed.priorTracker.counts.byLevel).toEqual({
      1: 140,
      2: 148,
      3: 30,
      4: 20,
      5: 22,
    })
  })

  it("keeps committed mechanical evidence deterministic", async () => {
    const committed = await readCommittedWorkplaceNotesBatch021({
      repositoryRoot,
    })
    const state = checkWorkplaceNotesBatch021State({ computed, committed })
    expect(
      state.errors.filter((error) => error.includes("deterministic drift")),
    ).toEqual([])
    expect(committed.preparedSummary).toEqual(computed.preparedSummary)
  })

  it("refuses to rewrite evidence after review begins", async () => {
    const committed = await readCommittedWorkplaceNotesBatch021({
      repositoryRoot,
    })
    if (committed.reviews.length === 0 && committed.editorial === null) {
      expect(checkWorkplaceNotesBatch021State({ computed, committed })).toEqual({
        status: "awaiting-independent-review",
        errors: [],
        committedIndependentReviews: 0,
      })
      return
    }
    await expect(
      writeWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("immutable after review or editorial evidence exists")
  })

  it("publishes all twelve only after two reviews and editorial acceptance", async () => {
    const committed = await readCommittedWorkplaceNotesBatch021({
      repositoryRoot,
    })
    const state = checkWorkplaceNotesBatch021State({ computed, committed })
    if (committed.editorial === null) {
      expect([
        "awaiting-independent-review",
        "awaiting-second-independent-review",
        "awaiting-editorial",
      ]).toContain(state.status)
      expect(state.errors).toEqual([])
      expect(committed.tracker.acceptedTotal).toBe(360)
      expect(committed.summary).toBeNull()
      return
    }

    const publication = buildWorkplaceNotesBatch021Publication({
      computed,
      committed,
    })
    expect(publication.errors).toEqual([])
    expect(publication.tracker.acceptedTotal).toBe(372)
    expect(publication.tracker.counts.byLevel).toEqual({
      1: 140,
      2: 148,
      3: 30,
      4: 32,
      5: 22,
    })
    expect(publication.tracker.counts.byFamily).toMatchObject({
      "workplace-notes": 12,
    })
    expect(["ready-to-publish", "published"]).toContain(state.status)
  })

  it("keeps publication fail-closed while editorial evidence is absent", async () => {
    const committed = await readCommittedWorkplaceNotesBatch021({
      repositoryRoot,
    })
    if (committed.editorial !== null) return
    await expect(
      publishWorkplaceNotesBatch021Artifacts({ repositoryRoot, computed }),
    ).rejects.toThrow("requires separate editorial evidence")
  })
})
