import assert from "node:assert/strict"
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { resealBatchEvidence } from "./sealBatchEvidence.mjs"
import { sealEditorial, sealReview } from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

const run = promisify(execFile)
const cli = resolve(import.meta.dirname, "sealBatchEvidence.mjs")

// Calling the exported function proves the rule; it does not prove the command
// a person types passes `--check` through to it. Mutating `write: !check` to
// `write: true` left every direct-call test green.
async function runCli(args) {
  try {
    const { stdout } = await run(process.execPath, [cli, ...args])
    return { code: 0, stdout }
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? "" }
  }
}

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

test("the command's check mode refuses to write and fails", async () => {
  const before = sealReview(reviewBody("a", "ok"))
  const edited = { ...before, verdicts: [{ candidateId: "c1", verdict: "pass", note: "corrected" }] }
  const batchDir = await makeBatch({
    reviews: { "a.json": edited },
    editorial: sealEditorial(editorialBody(), [before]),
  })
  const original = await readFile(resolve(batchDir, "reviews", "a.json"), "utf8")

  const result = await runCli([batchDir, "--check"])
  assert.equal(result.code, 1)
  assert.match(result.stdout, /DRIFT/)
  assert.equal(await readFile(resolve(batchDir, "reviews", "a.json"), "utf8"), original)
})

test("the command without --check reseals and succeeds", async () => {
  const before = sealReview(reviewBody("a", "ok"))
  const edited = { ...before, verdicts: [{ candidateId: "c1", verdict: "pass", note: "corrected" }] }
  const batchDir = await makeBatch({
    reviews: { "a.json": edited },
    editorial: sealEditorial(editorialBody(), [before]),
  })

  const result = await runCli([batchDir])
  assert.equal(result.code, 0)
  const review = JSON.parse(await readFile(resolve(batchDir, "reviews", "a.json"), "utf8"))
  assert.equal(canonicalJson(review), canonicalJson(sealReview(review)))
  assert.equal((await runCli([batchDir, "--check"])).code, 0)
})

test("resealing published evidence rebuilds every affected generated artifact", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-published-chain-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  await mkdir(batchesRoot, { recursive: true })

  const batchIds = [
    "2026-07-19-milestone-1-foundation-001",
    "2026-07-19-l1-l2-headings-002",
  ]
  for (const batchId of batchIds) {
    await cp(
      resolve(sourceBank, "batches", batchId),
      resolve(batchesRoot, batchId),
      { recursive: true },
    )
  }
  await cp(
    resolve(sourceBank, "runtime-projections.generated.json"),
    resolve(bankRoot, "runtime-projections.generated.json"),
  )
  await cp(
    resolve(sourceBank, "tracker.generated.json"),
    resolve(bankRoot, "tracker.generated.json"),
  )

  const firstBatch = resolve(batchesRoot, batchIds[0])
  const reviewName = (await readdir(resolve(firstBatch, "reviews")))
    .filter((name) => name.endsWith(".json"))
    .sort()[0]
  const reviewPath = resolve(firstBatch, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "clarified without changing the verdict"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)

  const report = await resealBatchEvidence({ batchDir: firstBatch, write: true })
  assert.ok(report.changed.includes(`${batchIds[0]}/summary.generated.json`))
  assert.ok(report.changed.includes(`${batchIds[1]}/summary.generated.json`))
  assert.ok(report.changed.includes("runtime-projections.generated.json"))
  assert.ok(report.changed.includes("tracker.generated.json"))
  assert.deepEqual(
    (await resealBatchEvidence({ batchDir: firstBatch, write: false })).changed,
    [],
  )
})

test("a batch with no reviews and no editorial is not an error", async () => {
  const batchDir = await makeBatch()
  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual(report.changed, [])
  assert.equal(report.reviewCount, 0)
  assert.equal(report.hasEditorial, false)
  assert.deepEqual(await readdir(batchDir), [])
})

test("the check is wired into the command that runs before merge", async () => {
  // A gate nobody runs is a file. `npm run check` is what CI and the release
  // steps invoke, so the drift check has to be reachable from there.
  const manifest = JSON.parse(
    await readFile(resolve(import.meta.dirname, "../../package.json"), "utf8"),
  )
  assert.match(manifest.scripts["bank:evidence:check"], /--check/)
  assert.ok(
    manifest.scripts.check.includes("bank:evidence:check"),
    "npm run check must run bank:evidence:check",
  )
  assert.ok(
    manifest.scripts.check.includes("bank:evidence:test"),
    "npm run check must run bank:evidence:test",
  )
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
