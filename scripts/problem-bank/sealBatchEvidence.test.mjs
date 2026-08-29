import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, writeFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test from "node:test"
import { resealBatchEvidence } from "./sealBatchEvidence.mjs"
import { sealEditorial, sealReview } from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

// Every case builds its own batch under a temp directory. The tool writes to
// the paths it is given, and the repository's own batches are the thing it
// exists to protect.
async function makeBatch({ reviews = {}, editorial = undefined } = {}) {
  const batchDir = await mkdtemp(resolve(tmpdir(), "nabimd-seal-"))
  if (Object.keys(reviews).length > 0) {
    await mkdir(resolve(batchDir, "reviews"))
    for (const [name, value] of Object.entries(reviews)) {
      await writeFile(
        resolve(batchDir, "reviews", name),
        `${JSON.stringify(value, null, 2)}\n`,
      )
    }
  }
  if (editorial !== undefined) {
    await writeFile(
      resolve(batchDir, "editorial.json"),
      `${JSON.stringify(editorial, null, 2)}\n`,
    )
  }
  return batchDir
}

const reviewBody = (reviewerId, note) => ({
  schemaVersion: 2,
  batchId: "test-batch",
  reviewerId,
  declaredIndependent: true,
  verdicts: [{ candidateId: "c1", verdict: "pass", note }],
})

const editorialBody = () => ({
  schemaVersion: 2,
  batchId: "test-batch",
  editorialActor: "editor",
  decisions: [{ candidateId: "c1", status: "accepted" }],
})

test("a batch whose seals already match its content is left alone", async () => {
  const one = sealReview(reviewBody("a", "ok"))
  const batchDir = await makeBatch({
    reviews: { "a.json": one },
    editorial: sealEditorial(editorialBody(), [one]),
  })
  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual(report.changed, [])
  assert.equal(report.reviewCount, 1)
  assert.equal(report.hasEditorial, true)
})

test("a reviewer's edit to their own file is resealed", async () => {
  const before = sealReview(reviewBody("a", "ok"))
  // What a reviewer actually does: change a field, leave the stale digest.
  const edited = { ...before, verdicts: [{ candidateId: "c1", verdict: "pass", note: "corrected" }] }
  const batchDir = await makeBatch({
    reviews: { "a.json": edited },
    editorial: sealEditorial(editorialBody(), [before]),
  })

  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual(report.changed, ["reviews/a.json", "editorial.json"])

  const review = JSON.parse(await readFile(resolve(batchDir, "reviews", "a.json"), "utf8"))
  assert.equal(canonicalJson(review), canonicalJson(sealReview(review)))
  assert.notEqual(review.reviewDigest, before.reviewDigest)

  // The editorial seal has to follow, or the chain still points at a digest
  // no file carries — the state that forced hand-editing someone else's seal.
  const editorial = JSON.parse(await readFile(resolve(batchDir, "editorial.json"), "utf8"))
  assert.deepEqual(editorial.reviewDigests, [review.reviewDigest])
  assert.equal(canonicalJson(editorial), canonicalJson(sealEditorial(editorial, [review])))
})

test("the editorial seal follows every review it cites, in a stable order", async () => {
  const a = sealReview(reviewBody("a", "ok"))
  const b = sealReview(reviewBody("b", "ok"))
  const batchDir = await makeBatch({
    reviews: { "b.json": b, "a.json": a },
    editorial: editorialBody(),
  })
  await resealBatchEvidence({ batchDir, write: true })
  const editorial = JSON.parse(await readFile(resolve(batchDir, "editorial.json"), "utf8"))
  assert.deepEqual(
    editorial.reviewDigests,
    [a.reviewDigest, b.reviewDigest].sort(),
  )
})

test("key order alone does not count as drift", async () => {
  // `sealEditorial` puts the digest fields last, which is not the order four
  // committed batches use. Rewriting them would touch sealed files nobody
  // asked to change.
  const one = sealReview(reviewBody("a", "ok"))
  const sealed = sealEditorial(editorialBody(), [one])
  const reordered = Object.fromEntries(
    Object.entries(sealed).sort(([left], [right]) => left.localeCompare(right)),
  )
  assert.notEqual(JSON.stringify(reordered), JSON.stringify(sealed))
  const batchDir = await makeBatch({
    reviews: { "a.json": one },
    editorial: reordered,
  })

  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual(report.changed, [])
  const onDisk = await readFile(resolve(batchDir, "editorial.json"), "utf8")
  assert.equal(onDisk, `${JSON.stringify(reordered, null, 2)}\n`)
})

test("check mode reports drift without writing", async () => {
  const before = sealReview(reviewBody("a", "ok"))
  const edited = { ...before, verdicts: [{ candidateId: "c1", verdict: "pass", note: "corrected" }] }
  const batchDir = await makeBatch({
    reviews: { "a.json": edited },
    editorial: sealEditorial(editorialBody(), [before]),
  })
  const original = await readFile(resolve(batchDir, "reviews", "a.json"), "utf8")

  const report = await resealBatchEvidence({ batchDir, write: false })
  assert.deepEqual(report.changed, ["reviews/a.json", "editorial.json"])
  assert.equal(await readFile(resolve(batchDir, "reviews", "a.json"), "utf8"), original)
})

test("a batch with no reviews and no editorial is not an error", async () => {
  const batchDir = await makeBatch()
  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual(report.changed, [])
  assert.equal(report.reviewCount, 0)
  assert.equal(report.hasEditorial, false)
  assert.deepEqual(await readdir(batchDir), [])
})

test("every committed batch reproduces its own seals", async () => {
  // The point of the tool is that this stays true. If it ever fails, a seal
  // was closed by hand and the digest no longer covers the content.
  const bankRoot = resolve(import.meta.dirname, "../../curriculum/problem-bank/batches")
  const batches = (await readdir(bankRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(bankRoot, entry.name))
  assert.ok(batches.length >= 26, `expected the committed bank, saw ${batches.length}`)

  let sealedReviews = 0
  for (const batchDir of batches) {
    const report = await resealBatchEvidence({ batchDir, write: false })
    assert.deepEqual(report.changed, [], batchDir)
    assert.equal(report.hasEditorial, true, batchDir)
    sealedReviews += report.reviewCount
  }
  // A sweep that found no reviews would also report no drift.
  assert.ok(sealedReviews >= 52, `expected sealed reviews, saw ${sealedReviews}`)
})
