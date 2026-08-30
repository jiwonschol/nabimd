import assert from "node:assert/strict"
import { cp, mkdtemp, mkdir, readFile, writeFile, readdir, rm, unlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import {
  resealBatchEvidence,
  resealBatchEvidenceSet,
  repositoryRelativePath,
  resolveBaselineSha,
} from "./sealBatchEvidence.mjs"
import { sealEditorial, sealReview } from "./batchPipeline.mjs"
import { canonicalJson } from "./pipeline.mjs"

const run = promisify(execFile)
const cli = resolve(import.meta.dirname, "sealBatchEvidence.mjs")

// Calling the exported function proves the rule; it does not prove the command
// a person types passes `--check` through to it. Mutating `write: !check` to
// `write: true` left every direct-call test green.
async function runCli(args, cwd = process.cwd(), env = process.env) {
  try {
    const { stdout, stderr } = await run(process.execPath, [cli, ...args], { cwd, env })
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

async function removeBatchFromTracker(bankRoot, batchId) {
  const trackerPath = resolve(bankRoot, "tracker.generated.json")
  const tracker = JSON.parse(await readFile(trackerPath, "utf8"))
  tracker.batches = (tracker.batches ?? []).filter(
    (batch) => batch.batchId !== batchId,
  )
  await writeFile(trackerPath, `${JSON.stringify(tracker, null, 2)}\n`)
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

test("origin/main at HEAD uses its parent even when local main is older", async () => {
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-origin-head-stale-main-"))
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "first\n")
  await run("git", ["add", "evidence.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "first"], { cwd: repository })
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "evidence.txt"), "second\n")
  await run("git", ["commit", "-am", "second"], { cwd: repository })
  const parent = (await run("git", ["rev-parse", "HEAD"], { cwd: repository })).stdout.trim()
  await writeFile(resolve(repository, "evidence.txt"), "third\n")
  await run("git", ["commit", "-am", "third"], { cwd: repository })
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

test("a tracker-only published batch missing editorial blocks resealing", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-tracker-only-editorial-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-08-29-l1-tables-030"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(
    resolve(sourceBank, "runtime-projections.generated.json"),
    resolve(bankRoot, "runtime-projections.generated.json"),
  )
  await cp(
    resolve(sourceBank, "tracker.generated.json"),
    resolve(bankRoot, "tracker.generated.json"),
  )
  await unlink(resolve(batchDir, "editorial.json"))

  await assert.rejects(
    resealBatchEvidence({ batchDir, write: true }),
    /missing editorial artifacts/,
  )
})

test("the no-argument write command reports drift in immutable batches", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-immutable-drift-"))
  const bankRoot = resolve(repository, "curriculum/problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(batchesRoot, batchId)
  await mkdir(batchesRoot, { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await resealBatchEvidence({ batchDir, write: true })
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await run("git", ["add", "."], { cwd: repository })
  await run("git", ["commit", "-m", "published bank"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "feature.txt"), "feature\n")
  await run("git", ["add", "feature.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "feature"], { cwd: repository })
  const reviewName = (await readdir(resolve(batchDir, "reviews"))).find((name) => name.endsWith(".json"))
  const reviewPath = resolve(batchDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "immutable drift"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)

  const result = await runCli([], repository, { ...process.env, NABI_BASE_SHA: "" })
  assert.equal(result.code, 1)
  assert.match(result.stderr, /Immutable baseline evidence has drifted/)
  assert.match(result.stderr, /publish a new replacement batch instead/)
})

test("the default write repairs generated drift for immutable batches", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-immutable-chain-"))
  const bankRoot = resolve(repository, "curriculum/problem-bank")
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
  await resealBatchEvidence({ batchDir, write: true })
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await run("git", ["add", "."], { cwd: repository })
  await run("git", ["commit", "-m", "published baseline"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "feature.txt"), "feature\n")
  await run("git", ["add", "feature.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "feature"], { cwd: repository })
  const runtimePath = resolve(bankRoot, "runtime-projections.generated.json")
  await unlink(runtimePath)

  const result = await runCli([], repository, { ...process.env, NABI_BASE_SHA: "" })
  assert.equal(result.code, 0, result.stderr)
  await assert.doesNotReject(readFile(runtimePath, "utf8"))
})

test("the default command rejects a missing tracker-recorded batch directory", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-missing-batch-dir-"))
  const bankRoot = resolve(repository, "curriculum/problem-bank")
  await mkdir(resolve(repository, "curriculum"), { recursive: true })
  await cp(sourceBank, bankRoot, { recursive: true })
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await run("git", ["add", "."], { cwd: repository })
  await run("git", ["commit", "-m", "published baseline"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await writeFile(resolve(repository, "feature.txt"), "feature\n")
  await run("git", ["add", "feature.txt"], { cwd: repository })
  await run("git", ["commit", "-m", "feature"], { cwd: repository })

  const missingBatchId = "2026-07-19-l1-l2-headings-002"
  await rm(resolve(bankRoot, "batches", missingBatchId), { recursive: true })
  const trackerBefore = await readFile(resolve(bankRoot, "tracker.generated.json"), "utf8")

  const result = await runCli([], repository, { ...process.env, NABI_BASE_SHA: "" })
  assert.notEqual(result.code, 0)
  assert.match(result.stderr, /tracker-recorded batch directories are missing/i)
  assert.match(result.stderr, new RegExp(missingBatchId))
  assert.equal(
    await readFile(resolve(bankRoot, "tracker.generated.json"), "utf8"),
    trackerBefore,
  )
})

test("a review can be resealed before editorial evidence exists", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-pre-editorial-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await removeBatchFromTracker(bankRoot, batchId)
  await unlink(resolve(batchDir, "editorial.json"))
  await unlink(resolve(batchDir, "summary.generated.json"))
  const reviewName = (await readdir(resolve(batchDir, "reviews"))).find((name) => name.endsWith(".json"))
  const reviewPath = resolve(batchDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].note = "corrected before editorial"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)

  const report = await resealBatchEvidence({ batchDir, write: true })
  assert.ok(report.changed.includes(`reviews/${reviewName}`))
})

test("invalid review evidence cannot be sealed before editorial exists", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-invalid-pre-editorial-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await removeBatchFromTracker(bankRoot, batchId)
  await unlink(resolve(batchDir, "editorial.json"))
  await unlink(resolve(batchDir, "summary.generated.json"))
  const reviewName = (await readdir(resolve(batchDir, "reviews"))).find((name) => name.endsWith(".json"))
  const reviewPath = resolve(batchDir, "reviews", reviewName)
  const review = JSON.parse(await readFile(reviewPath, "utf8"))
  review.verdicts[0].candidateDigest = "invalid"
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  const before = await readFile(reviewPath, "utf8")

  await assert.rejects(
    resealBatchEvidence({ batchDir, write: true }),
    /Stale review evidence/,
  )
  assert.equal(await readFile(reviewPath, "utf8"), before)

  review.verdicts = []
  await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`)
  await assert.rejects(
    resealBatchEvidence({ batchDir, write: true }),
    /Missing review verdict/,
  )
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

test("resealing recreates a missing published summary", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-missing-summary-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  for (const publishedBatchId of [batchId, "2026-07-19-l1-l2-headings-002"]) {
    await cp(
      resolve(sourceBank, "batches", publishedBatchId),
      resolve(bankRoot, "batches", publishedBatchId),
      { recursive: true },
    )
  }
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await unlink(resolve(batchDir, "summary.generated.json"))

  const drift = await resealBatchEvidence({ batchDir, write: false })
  assert.ok(drift.changed.includes(`${batchId}/summary.generated.json`))
  await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual((await resealBatchEvidence({ batchDir, write: false })).changed, [])
})

test("resealing recreates the terminal published summary from the tracker", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-terminal-summary-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const firstBatchId = "2026-07-19-milestone-1-foundation-001"
  const terminalBatchId = "2026-07-19-l1-l2-headings-002"
  const terminalBatchDir = resolve(bankRoot, "batches", terminalBatchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  for (const batchId of [firstBatchId, terminalBatchId]) {
    await cp(resolve(sourceBank, "batches", batchId), resolve(bankRoot, "batches", batchId), { recursive: true })
  }
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await unlink(resolve(terminalBatchDir, "summary.generated.json"))

  const drift = await resealBatchEvidence({ batchDir: terminalBatchDir, write: false })
  assert.ok(drift.changed.includes(`${terminalBatchId}/summary.generated.json`))
  await resealBatchEvidence({ batchDir: terminalBatchDir, write: true })
  assert.deepEqual((await resealBatchEvidence({ batchDir: terminalBatchDir, write: false })).changed, [])
})

test("resealing recreates a missing runtime projection artifact", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-missing-runtime-projection-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(
    resolve(sourceBank, "tracker.generated.json"),
    resolve(bankRoot, "tracker.generated.json"),
  )

  const drift = await resealBatchEvidence({ batchDir, write: false })
  assert.ok(drift.changed.includes("runtime-projections.generated.json"))
  await resealBatchEvidence({ batchDir, write: true })
  assert.deepEqual((await resealBatchEvidence({ batchDir, write: false })).changed, [])
})

test("resealing recreates a missing tracker from published summaries", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const tempRoot = await mkdtemp(resolve(tmpdir(), "nabimd-missing-tracker-"))
  const bankRoot = resolve(tempRoot, "problem-bank")
  const batchId = "2026-07-19-milestone-1-foundation-001"
  const batchDir = resolve(bankRoot, "batches", batchId)
  await mkdir(resolve(bankRoot, "batches"), { recursive: true })
  await cp(resolve(sourceBank, "batches", batchId), batchDir, { recursive: true })
  await cp(
    resolve(sourceBank, "runtime-projections.generated.json"),
    resolve(bankRoot, "runtime-projections.generated.json"),
  )

  const drift = await resealBatchEvidence({ batchDir, write: false })
  assert.ok(drift.changed.includes("tracker.generated.json"))
  await resealBatchEvidence({ batchDir, write: true })
  const tracker = JSON.parse(
    await readFile(resolve(bankRoot, "tracker.generated.json"), "utf8"),
  )
  assert.ok(tracker.batches.some((batch) => batch.batchId === batchId))
  assert.deepEqual((await resealBatchEvidence({ batchDir, write: false })).changed, [])
})

test("the default write repairs mutable chain drift without blaming immutable seals", async () => {
  const sourceBank = resolve(import.meta.dirname, "../../curriculum/problem-bank")
  const repository = await mkdtemp(resolve(tmpdir(), "nabimd-mutable-chain-"))
  const bankRoot = resolve(repository, "curriculum/problem-bank")
  const batchesRoot = resolve(bankRoot, "batches")
  const firstBatchId = "2026-07-19-milestone-1-foundation-001"
  const mutableBatchId = "2026-07-19-l1-l2-headings-002"
  await mkdir(batchesRoot, { recursive: true })
  await cp(resolve(sourceBank, "batches", firstBatchId), resolve(batchesRoot, firstBatchId), { recursive: true })
  await cp(resolve(sourceBank, "runtime-projections.generated.json"), resolve(bankRoot, "runtime-projections.generated.json"))
  await cp(resolve(sourceBank, "tracker.generated.json"), resolve(bankRoot, "tracker.generated.json"))
  await resealBatchEvidence({ batchDir: resolve(batchesRoot, firstBatchId), write: true })
  await run("git", ["init"], { cwd: repository })
  await run("git", ["config", "user.name", "Nabi Test"], { cwd: repository })
  await run("git", ["config", "user.email", "nabi@example.com"], { cwd: repository })
  await run("git", ["add", "."], { cwd: repository })
  await run("git", ["commit", "-m", "published baseline"], { cwd: repository })
  await run("git", ["branch", "-M", "main"], { cwd: repository })
  await run("git", ["checkout", "-b", "feature"], { cwd: repository })
  await cp(resolve(sourceBank, "batches", mutableBatchId), resolve(batchesRoot, mutableBatchId), { recursive: true })
  await run("git", ["add", "."], { cwd: repository })
  await run("git", ["commit", "-m", "mutable batch"], { cwd: repository })

  const result = await runCli([], repository, { ...process.env, NABI_BASE_SHA: "" })
  assert.equal(result.code, 0, result.stderr)
  const tracker = JSON.parse(await readFile(resolve(bankRoot, "tracker.generated.json"), "utf8"))
  assert.ok(tracker.batches.some((batch) => batch.batchId === mutableBatchId))
})

test("repository-relative paths use Git tree separators", () => {
  assert.equal(
    repositoryRelativePath("target", "repository", () =>
      String.raw`curriculum\problem-bank\batches\batch-a`,
    ),
    "curriculum/problem-bank/batches/batch-a",
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
