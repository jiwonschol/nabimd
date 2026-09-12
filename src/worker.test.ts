import { afterEach, describe, expect, it, vi } from "vitest"
import worker from "../worker/index"
import type { WorkerEnv } from "../worker/index"

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function createEnv(options: { limited?: boolean; databaseError?: Error } = {}) {
  const run = options.databaseError
    ? vi.fn().mockRejectedValue(options.databaseError)
    : vi.fn().mockResolvedValue({ success: true })
  const bind = vi.fn()
  const statement = new TestD1PreparedStatement(bind, run)
  const database = new TestD1Database(statement)

  return {
    env: {
      ASSETS: {
        fetch: async () =>
          new Response("app", {
            headers: { "Content-Type": "text/html" },
          }),
        connect: () => {
          throw new Error("Not used in worker tests")
        },
      } satisfies Fetcher,
      NABI_BUILD_SHA: "a".repeat(40),
      NABIMD_ASSETS: {},
      NABIMD_DB: database,
      FEEDBACK_RATE_LIMITER: {
        limit: vi.fn().mockResolvedValue({ success: !options.limited }),
      } satisfies RateLimit,
    } satisfies WorkerEnv,
    bind,
    prepare: database.prepareSpy,
    run,
  }
}

function d1Result<T>(): D1Result<T> {
  return {
    success: true,
    results: [],
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: 0,
      last_row_id: 0,
      changed_db: false,
      changes: 0,
    },
  }
}

class TestD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly bindSpy: (...values: unknown[]) => unknown,
    private readonly runSpy: () => Promise<unknown>,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.bindSpy(...values)
    return this
  }

  async first<T = unknown>(_colName?: string): Promise<T | null> {
    return null
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    await this.runSpy()
    return d1Result<T>()
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return d1Result<T>()
  }

  async raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>
  async raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>
  async raw<T = unknown[]>(
    _options?: { columnNames?: boolean },
  ): Promise<T[] | [string[], ...T[]]> {
    return []
  }
}

class TestD1Database implements D1Database {
  readonly prepareSpy = vi.fn<(query: string) => D1PreparedStatement>()

  constructor(private readonly statement: D1PreparedStatement) {
    this.prepareSpy.mockReturnValue(statement)
  }

  prepare(query: string): D1PreparedStatement {
    return this.prepareSpy(query)
  }

  async batch<T = unknown>(
    _statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]> {
    return []
  }

  async exec(_query: string): Promise<D1ExecResult> {
    return { count: 0, duration: 0 }
  }

  withSession(
    _constraintOrBookmark?: D1SessionBookmark | D1SessionConstraint,
  ): D1DatabaseSession {
    throw new Error("Not used in worker tests")
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0)
  }
}

function feedbackRequest(payload: Record<string, unknown>) {
  return new Request("https://onsoonlabs.com/nabimd/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://onsoonlabs.com",
      "CF-Connecting-IP": "203.0.113.1",
    },
    body: JSON.stringify(payload),
  })
}

describe("Cloudflare worker", () => {
  it("publishes the deployed commit on application asset responses", async () => {
    const { env } = createEnv()
    const response = await worker.fetch(
      new Request("https://onsoonlabs.com/nabimd/"),
      env,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("X-Nabi-Build-Sha")).toBe(env.NABI_BUILD_SHA)
    await expect(response.text()).resolves.toBe("app")
  })

  it("expires feedback after 89 days so daily cleanup stays under 90 days", async () => {
    const { env, bind, prepare } = createEnv()
    const daySeconds = 24 * 60 * 60
    const createdAt = Date.UTC(2030, 0, 1, 3, 0, 1) / 1_000
    const expiresAt = createdAt + 89 * daySeconds
    const nextCleanupAt = Date.UTC(2030, 3, 1, 3, 0, 0) / 1_000
    vi.spyOn(Date, "now").mockReturnValue(createdAt * 1_000)
    vi.stubGlobal("crypto", { randomUUID: () => "feedback-id" })

    const response = await worker.fetch(
      feedbackRequest({
        message: "  The last card felt clear.  ",
        level: 3,
        score: 5,
        total: 6,
        appRevision: "b".repeat(40),
        website: "",
        answer: "private learner Markdown",
        account: "private-account",
      }),
      env,
    )

    expect(response.status).toBe(201)
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO learner_feedback"))
    expect(bind).toHaveBeenCalledWith(
      "feedback-id",
      "The last card felt clear.",
      3,
      5,
      6,
      "b".repeat(40),
      createdAt,
      expiresAt,
    )
    expect(expiresAt).toBeLessThan(nextCleanupAt)
    expect(nextCleanupAt - createdAt).toBeLessThan(90 * daySeconds)
  })

  it("returns 503 when the feedback table is unavailable", async () => {
    const { env } = createEnv({
      databaseError: new Error("no such table: learner_feedback"),
    })

    const response = await worker.fetch(
      feedbackRequest({
        message: "The last card felt clear.",
        level: 3,
        score: 5,
        total: 6,
        appRevision: "b".repeat(40),
        website: "",
      }),
      env,
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "feedback-unavailable",
    })
  })

  it("rejects cross-origin and rate-limited submissions before D1", async () => {
    const crossOrigin = createEnv()
    const request = feedbackRequest({ message: "Hello" })
    request.headers.set("Origin", "https://example.com")
    expect((await worker.fetch(request, crossOrigin.env)).status).toBe(403)
    expect(crossOrigin.prepare).not.toHaveBeenCalled()

    const limited = createEnv({ limited: true })
    expect(
      (
        await worker.fetch(
          feedbackRequest({
            message: "Hello",
            level: 1,
            score: 6,
            total: 6,
            appRevision: "dev",
            website: "",
          }),
          limited.env,
        )
      ).status,
    ).toBe(429)
    expect(limited.prepare).not.toHaveBeenCalled()
  })

  it("deletes feedback whose 90-day retention window ended", async () => {
    const { env, bind, prepare } = createEnv()
    vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_000)

    await worker.scheduled({} as ScheduledController, env)

    expect(prepare).toHaveBeenCalledWith(
      "DELETE FROM learner_feedback WHERE expires_at <= ?",
    )
    expect(bind).toHaveBeenCalledWith(1_800_000_000)
  })

  it("fails scheduled retention when the feedback table is unavailable", async () => {
    const { env } = createEnv({
      databaseError: new Error("no such table: learner_feedback"),
    })

    await expect(
      worker.scheduled({} as ScheduledController, env),
    ).rejects.toThrow("no such table: learner_feedback")
  })
})
