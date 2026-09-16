import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createRequire } from "node:module"
import type { DatabaseSync as SqliteDatabase } from "node:sqlite"
import { afterEach, describe, expect, it, vi } from "vitest"
import worker, { type WorkerEnv } from "../worker/index"

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite")
const databases: SqliteDatabase[] = []
afterEach(() => {
  databases.splice(0).forEach((database) => database.close())
  vi.restoreAllMocks()
})

function fixture() {
  const database = new DatabaseSync(":memory:")
  databases.push(database)
  database.exec(readFileSync(resolve("migrations/0001_create_learner_feedback.sql"), "utf8"))
  // Adapt only the D1 boundary; execute the production SQL against real SQLite.
  const env = {
    NABIMD_DB: {
      prepare(query: string) {
        return {
          bind(...values: Array<string | number>) {
            return {
              async run() {
                const result = database.prepare(query).run(...values)
                return { success: true, meta: { changes: Number(result.changes) } }
              },
              async first() {
                return database.prepare(query).get(...values) ?? null
              },
            }
          },
        }
      },
    },
    FEEDBACK_RATE_LIMITER: { limit: async () => ({ success: true }) },
  } as unknown as WorkerEnv
  const payload = {
    submissionId: "60974476-aaf5-4ae0-9bc2-5d30cb17ceba",
    message: "My note survived the lost response.",
    level: 1,
    score: 5,
    total: 5,
    appRevision: "test-revision",
    website: "",
  }
  const send = (value: Record<string, unknown> = payload) => worker.fetch(
    new Request("https://onsoonlabs.com/nabimd/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://onsoonlabs.com" },
      body: JSON.stringify(value),
    }), env,
  )
  return { database, env, payload, send }
}

describe("feedback retry over the Worker API", () => {
  it("confirms a retry after a lost response without storing the note twice", async () => {
    const { database, send } = fixture()
    // The client loses this first response after the server commits the row.
    await send()
    const retry = await send()
    expect(retry.ok).toBe(true)
    await expect(retry.json()).resolves.toEqual({ accepted: true })
    expect(database.prepare("SELECT count(*) AS count FROM learner_feedback").get()?.count).toBe(1)
  })

  it("keeps concurrent retries in one row without extending its lifetime", async () => {
    const { database, send } = fixture()
    const now = vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000)
    const responses = await Promise.all([send(), send(), send()])
    expect(responses.map((response) => response.status)).toEqual([201, 201, 201])
    const original = database.prepare("SELECT * FROM learner_feedback").get()
    now.mockReturnValue(1_800_086_400_000)
    expect((await send()).ok).toBe(true)
    expect(database.prepare("SELECT * FROM learner_feedback").all()).toEqual([original])
  })

  it.each([
    { message: "A different note" }, { level: 2 }, { score: 4 },
    { total: 6 }, { appRevision: "another-revision" },
  ])("rejects reuse of an ID with a different payload: %j", async (change) => {
    const { database, payload, send } = fixture()
    await send()
    const original = database.prepare("SELECT * FROM learner_feedback").get()
    const conflict = await send({ ...payload, ...change })
    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toEqual({ error: "feedback-id-conflict" })
    expect(database.prepare("SELECT * FROM learner_feedback").all()).toEqual([original])
  })

  it.each(["", "invalid", null, 42])("rejects malformed submission IDs: %j", async (submissionId) => {
    const { database, payload, send } = fixture()
    expect((await send({ ...payload, submissionId })).status).toBe(400)
    expect(database.prepare("SELECT count(*) AS count FROM learner_feedback").get()?.count).toBe(0)
  })

  it("accepts legacy pages without IDs and treats a new ID as a new note", async () => {
    const { database, payload, send } = fixture()
    const { submissionId: _id, ...legacy } = payload
    expect((await send(legacy)).status).toBe(201)
    expect((await send()).status).toBe(201)
    expect((await send({ ...payload, submissionId: "19d9e90d-3ad4-4a5f-8172-ff9a30532627" })).status).toBe(201)
    expect(database.prepare("SELECT count(*) AS count FROM learner_feedback").get()?.count).toBe(3)
  })
})
