import assert from "node:assert/strict"
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import {
  resealBatchEvidence,
  resealBatchEvidenceSet,
  resolveBaselineSha,
} from "./sealBatchEvidence.mjs"
import { sealEditorial, sealReview } from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

const run = promisify(execFile)
const cli = resolve(import.meta.dirname, "sealBatchEvidence.mjs")

// Calling the exported function proves the rule; it does not prove the command
// a person types passes `--check` through to it. Mutating `write: !check` to
// `write: true` left every direct-call test green.
async function runCli(args) {
  try {
    const { stdout, stderr } = await run(process.execPath, [cli, ...args])
    return { code: 0, stdout, stderr }
  } catch (error) {
    return {
      code: error.code ?? 1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    }
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

async function makeCliBatch() {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-cli-batch-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(batchesRoot, batchId)
  await mkdir(batchesRoot, { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(
    resolve(sourceBank, "runtime-projections.generated.json"),
    resolve(bankRoot, "runtime-projections.generated.json"),
  )
  await cp(
    resolve(sourceBank, "tracker.generated.json"),
    resolve(bankRoot, "tracker.generated.json"),
  )
  const reviewName = (await readdir(resolve(batchDir, "reviews")))
    .filter((name) => name.endsWith(".json"))
    .sort()[0]
  const reviewPath = resolve(batchDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].notes = `${review.verdicts[0].notes} Clarified.`
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  return { batchDir, reviewPath }
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
  const { batchDir, reviewPath } = await makeCliBatch()
  const original = await readFile(reviewPath, "utf8")

  const result = await runCli([batchDir, "--check"])
  assert.equal(result.code, 1)
  assert.match(result.stdout, /DRIFT/)
  assert.equal(await readFile(reviewPath, "utf8"), original)
})

test("the command without --check reseals and succeeds", async () => {
  const { batchDir, reviewPath } = await makeCliBatch()

  const result = await runCli([batchDir])
  assert.equal(result.code, 0)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  assert.equal(canonicalJson(review), canonicalJson(sealReview(review)))
  assert.equal((await runCli([batchDir, "--check"])).code, 0)
})

test("resealing multiple published edits rebuilds the chain only after every seal is current", async () => {
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

  const batchDirs = batchIds.map((batchId) => resolve(batchesRoot, batchId))
  for (const [index, batchDir] of batchDirs.entries()) {
    const reviewName = (await readdir(resolve(batchDir, "reviews")))
      .filter((name) => name.endsWith(".json"))
      .sort()[0]
    const reviewPath = resolve(batchDir, "reviews", reviewName)
    const review = JSON.parse(await readFile(reviewPath, "utf8"))
    review.verdicts[0].note = `clarified review ${index + 1}`
    await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  }

  const reports = await resealBatchEvidenceSet({ batchDirs, write: true })
  const changed = reports.flatMap((report) => report.changed)
  assert.ok(changed.includes(`${batchIds[0]}/summary.generated.json`))
  assert.ok(changed.includes(`${batchIds[1]}/summary.generated.json`))
  assert.ok(changed.includes("runtime-projections.generated.json"))
  assert.ok(changed.includes("tracker.generated.json"))
  assert.deepEqual(
    (await resealBatchEvidenceSet({ batchDirs, write: false })).flatMap(
      (report) => report.changed,
    ),
    [],
  )
})

test("the write command refuses batches protected by the immutable baseline", async () => {
  const baselineBatch = resolve(
    import.meta.dirname,
    "../../curriculum/problem-bank/batches/2026-07-19-milestone-1-foundation-001",
  )
  const result = await runCli([baselineBatch])

  assert.equal(result.code, 1)
  assert.match(result.stderr, /Refusing to reseal immutable baseline batches/)
  assert.match(result.stderr, /publish a new replacement batch instead/)
})

test("a checkout without origin/main uses local main before the parent commit", async () => {
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-baseline-"))
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "first\n")
  await run("git", ["add", "evidence.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "first"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  const parent = (await run("git", ["rev-parse", "HEAD"], { cwd: repository })).stdout.trim()
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "second\n")
  await run("git", ["commit", "-am", "second"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "third\n")
  await run("git", ["commit", "-am", "third"], { cwd: repository })

  assert.equal(await resolveBaselineSha(repository, ""), parent)
})

test("local main itself uses its parent instead of HEAD as the baseline", async () => {
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-main-baseline-"))
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "first\n")
  await run("git", ["add", "evidence.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "first"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  const parent = (await run("git", ["rev-parse", "HEAD"], { cwd: repository })).stdout.trim()
  await writeFile(resolve(repository, "evidence.txt"), "second\n")
  await run("git", ["commit", "-am", "second"], { cwd: repository })

  assert.equal(await resolveBaselineSha(repository, ""), parent)
})

test("origin/main itself uses its parent instead of HEAD as the baseline", async () => {
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-origin-main-baseline-"))
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "first\n")
  await run("git", ["add", "evidence.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "first"], { cwd: repository })
  const parent = (await run("git", ["rev-parse", "HEAD"], { cwd: repository })).stdout.trim()
  await writeFile(resolve(repository, "evidence.txt"), "second\n")
  await run("git", ["commit", "-am", "second"], { cwd: repository })
  await run("git", ["update-ref", "refs/remotes/origin/main", "HEAD"], { cwd: repository })

  assert.equal(await resolveBaselineSha(repository, ""), parent)
})

test("a newer local main wins over a stale origin/main baseline", async () => {
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-newest-main-baseline-"))
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "first\n")
  await run("git", ["add", "evidence.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "first"], { cwd: repository })
  await run("git", ["update-ref", "refs/remotes/origin/main", "HEAD"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "second\n")
  await run("git", ["commit", "-am", "second"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  const localMain = (await run("git", ["rev-parse", "HEAD"], { cwd: repository })).stdout.trim()
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "third\n")
  await run("git", ["commit", "-am", "third"], { cwd: repository })

  assert.equal(await resolveBaselineSha(repository, ""), localMain)
})

test("resealing rejects targets from different problem-bank roots", async () => {
  const firstRoot = resolve(tmpdir(), "first-bank", "batches", "batch-a")
  const secondRoot = resolve(tmpdir(), "second-bank", "batches", "batch-b")

  await assert.rejects(
    resealBatchEvidenceSet({ batchDirs: [firstRoot, secondRoot], write: false }),
    /different problem-bank roots/,
  )
})

test("the command rejects a nonexistent explicit batch target", async () => {
  const result = await runCli([
    "--check",
    resolve(import.meta.dirname, "../../curriculum/problem-bank/batches/misspelled-batch"),
  ])

  assert.equal(result.code, 1)
  assert.match(result.stderr, /not a loaded problem-bank batch/)
})

test("the write command rejects an explicit baseline that is not available locally", async () => {
  const baselineBatch = resolve(
    import.meta.dirname,
    "../../curriculum/problem-bank/batches/2026-07-19-milestone-1-foundation-001",
  )
  let result
  try {
    await run(process.execPath, [cli, baselineBatch], {
      env: { ...process.env, NABI_BASE_SHA: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef" },
    })
    result = { code: 0, stderr: "" }
  } catch (error) {
    result = { code: error.code ?? 1, stderr: error.stderr ?? "" }
  }

  assert.equal(result.code, 1)
  assert.match(result.stderr, /not a locally available commit/)
})

test("an unreadable sibling batch blocks every reseal before any file is written", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-unreadable-chain-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  await mkdir(batchesRoot, { recursive: true })
  const batchIds = [
    "2026-07-19-milestone-1-foundation-001",
    "2026-07-19-l1-l2-headings-002",
  ]
  for (const batchId of batchIds) {
    await cp(resolve(sourceBank, "batches", batchId), resolve(batchesRoot, batchId), {
      recursive: true,
    })
  }
  const targetDir = resolve(batchesRoot, batchIds[0])
  const reviewName = (await readdir(resolve(targetDir, "reviews")))
    .filter((name) => name.endsWith(".json"))
    .sort()[0]
  const reviewPath = resolve(targetDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "would require resealing"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  const before = await readFile(reviewPath, "utf8")
  await writeFile(resolve(batchesRoot, batchIds[1], "fixtures.json"), "{broken\n")

  await assert.rejects(
    resealBatchEvidenceSet({ batchDirs: [targetDir], write: true }),
    /problem bank is unreadable/,
  )
  assert.equal(await readFile(reviewPath, "utf8"), before)
})

test("semantic chain validation fails before any seal is written", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-invalid-chain-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  await mkdir(batchesRoot, { recursive: true })
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const targetDir = resolve(batchesRoot, batchId)
  await cp(resolve(sourceBank, "batches", batchId), targetDir, { recursive: true })
  await cp(
    resolve(sourceBank, "runtime-projections.generated.json"),
    resolve(bankRoot, "runtime-projections.generated.json"),
  )
  await cp(
    resolve(sourceBank, "tracker.generated.json"),
    resolve(bankRoot, "tracker.generated.json"),
  )
  const reviewName = (await readdir(resolve(targetDir, "reviews")))
    .filter((name) => name.endsWith(".json"))
    .sort()[0]
  const reviewPath = resolve(targetDir, "reviews", reviewName)
  const editorialPath = resolve(targetDir, "editorial.json")
  await unlink(resolve(targetDir, "summary.generated.json"))
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.manifestDigest = "invalid-manifest-digest"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  const beforeReview = await readFile(reviewPath, "utf8")
  const beforeEditorial = await readFile(editorialPath, "utf8")

  await assert.rejects(
    resealBatchEvidenceSet({ batchDirs: [targetDir], write: true }),
    /Stale review scope/,
  )
  assert.equal(await readFile(reviewPath, "utf8"), beforeReview)
  assert.equal(await readFile(editorialPath, "utf8"), beforeEditorial)
})

test("a published batch missing editorial blocks a later reseal", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-missing-editorial-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  await mkdir(batchesRoot, { recursive: true })
  const batchIds = [
    "2026-07-19-milestone-1-foundation-001",
    "2026-07-19-l1-l2-headings-002",
  ]
  for (const batchId of batchIds) {
    await cp(resolve(sourceBank, "batches", batchId), resolve(batchesRoot, batchId), {
      recursive: true,
    })
  }
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await unlink(resolve(batchesRoot, batchIds[0], "editorial.json"))
  const targetDir = resolve(batchesRoot, batchIds[1])
  const reviewName = (await readdir(resolve(targetDir, "reviews"))).find((name) => name.endsWith(".json"))
  const reviewPath = resolve(targetDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "would rewrite the later chain"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  const before = await readFile(reviewPath, "utf8")

  await assert.rejects(
    resealBatchEvidenceSet({ batchDirs: [targetDir], write: true }),
    /missing editorial artifacts/,
  )
  assert.equal(await readFile(reviewPath, "utf8"), before)
})

test("rerunning repairs a stale generated chain after seals already match", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-repair-chain-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const targetDir = resolve(batchesRoot, batchId)
  await mkdir(batchesRoot, { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), targetDir, { recursive: true })
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  const summaryPath = resolve(targetDir, "summary.generated.json")
  const staleSummary = await readFile(summaryPath, "utf8")
  const reviewName = (await readdir(resolve(targetDir, "reviews"))).find((name) => name.endsWith(".json"))
  const reviewPath = resolve(targetDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "resealed before an interrupted chain write"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  await resealBatchEvidence({ batchDir: targetDir, write: true })
  await writeFile(summaryPath, staleSummary)

  const drift = await resealBatchEvidence({ batchDir: targetDir, write: false })
  assert.ok(drift.changed.includes(`${batchId}/summary.generated.json`))
  await resealBatchEvidence({ batchDir: targetDir, write: true })
  assert.deepEqual((await resealBatchEvidence({ batchDir: targetDir, write: false })).changed, [])
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
  const reports = await resealBatchEvidenceSet({ batchDirs: batches, write: false })
  for (const report of reports) {
    const batchDir = report.batchDir
    assert.deepEqual(report.changed, [], batchDir)
    assert.equal(report.hasEditorial, true, batchDir)
    sealedReviews += report.reviewCount
  }
  // A sweep that found no reviews would also report no drift.
  assert.ok(sealedReviews >= 52, `expected sealed reviews, saw ${sealedReviews}`)
})
