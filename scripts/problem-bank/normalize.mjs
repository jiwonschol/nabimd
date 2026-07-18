import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  canonicalJson,
  createInitialEditorialQueue,
  normalizeArtifact,
} from "./pipeline.mjs"

const root = resolve(import.meta.dirname, "../..")
const bankDir = resolve(root, "curriculum/problem-bank")
const rawPath = resolve(bankDir, "candidates.raw.json")
const promptPath = resolve(bankDir, "generation-prompt.md")
const normalizedPath = resolve(bankDir, "candidates.normalized.json")
const queuePath = resolve(bankDir, "editorial-queue.json")
const check = process.argv.includes("--check")
const initializeQueue = process.argv.includes("--initialize-queue")

const raw = JSON.parse(await readFile(rawPath, "utf8"))
const prompt = await readFile(promptPath, "utf8")
const normalized = normalizeArtifact(raw, prompt)
const output = `${JSON.stringify(normalized, null, 2)}\n`

if (check) {
  const committed = await readFile(normalizedPath, "utf8")
  if (canonicalJson(JSON.parse(committed)) !== canonicalJson(normalized)) {
    throw new Error("candidates.normalized.json is stale; run npm run bank:generate")
  }
} else {
  await writeFile(normalizedPath, output)
}

if (initializeQueue) {
  const queue = createInitialEditorialQueue(normalized)
  await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`)
}
