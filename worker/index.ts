const basePath = "/nabimd"

export type WorkerEnv = Pick<
  Env,
  "ASSETS" | "NABIMD_DB" | "FEEDBACK_RATE_LIMITER"
> & {
  NABI_BUILD_SHA: string
  NABIMD_ASSETS: unknown
}

const feedbackPath = `${basePath}/api/feedback`
const maxFeedbackBytes = 4_096
const maxFeedbackLength = 500
const feedbackExpirySeconds = 89 * 24 * 60 * 60

type FeedbackPayload = {
  message: string
  level: number
  score: number
  total: number
  appRevision: string
  website: string
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseFeedbackPayload(value: unknown): FeedbackPayload | null {
  if (!isRecord(value)) return null
  const { message, level, score, total, appRevision, website } = value
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.trim().length > maxFeedbackLength ||
    !Number.isInteger(level) ||
    Number(level) < 1 ||
    Number(level) > 5 ||
    !Number.isInteger(score) ||
    Number(score) < 0 ||
    !Number.isInteger(total) ||
    Number(total) < 1 ||
    Number(total) > 100 ||
    Number(score) > Number(total) ||
    typeof appRevision !== "string" ||
    !/^[\w.-]{1,64}$/.test(appRevision) ||
    website !== ""
  ) {
    return null
  }

  return {
    message: message.trim(),
    level: Number(level),
    score: Number(score),
    total: Number(total),
    appRevision,
    website,
  }
}

async function readJsonWithinLimit(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length"))
  if (Number.isFinite(declaredLength) && declaredLength > maxFeedbackBytes) {
    throw new Error("payload-too-large")
  }
  if (!request.body) return null

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxFeedbackBytes) {
      await reader.cancel()
      throw new Error("payload-too-large")
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

async function handleFeedback(
  request: Request,
  env: WorkerEnv,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" },
    })
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return jsonResponse({ error: "invalid-content-type" }, 415)
  }

  const url = new URL(request.url)
  if (request.headers.get("Origin") !== url.origin) {
    return jsonResponse({ error: "invalid-origin" }, 403)
  }

  const clientAddress = request.headers.get("CF-Connecting-IP") ?? "unknown"
  let rateLimit: RateLimitOutcome
  try {
    rateLimit = await env.FEEDBACK_RATE_LIMITER.limit({
      key: `summary-feedback:${clientAddress}`,
    })
  } catch {
    console.error(JSON.stringify({ event: "feedback_rate_limit_failed" }))
    return jsonResponse({ error: "feedback-unavailable" }, 503)
  }
  if (!rateLimit.success) {
    return jsonResponse({ error: "rate-limited" }, 429)
  }

  let rawPayload: unknown
  try {
    rawPayload = await readJsonWithinLimit(request)
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error && error.message === "payload-too-large"
            ? "payload-too-large"
            : "invalid-json",
      },
      error instanceof Error && error.message === "payload-too-large"
        ? 413
        : 400,
    )
  }

  const payload = parseFeedbackPayload(rawPayload)
  if (!payload) return jsonResponse({ error: "invalid-feedback" }, 400)

  const createdAt = Math.floor(Date.now() / 1_000)
  try {
    await env.NABIMD_DB.prepare(
      `INSERT INTO learner_feedback
        (id, message, level, score, total, app_revision, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        payload.message,
        payload.level,
        payload.score,
        payload.total,
        payload.appRevision,
        createdAt,
        createdAt + feedbackExpirySeconds,
      )
      .run()
  } catch {
    console.error(
      JSON.stringify({ event: "feedback_insert_failed", createdAt }),
    )
    return jsonResponse({ error: "feedback-unavailable" }, 503)
  }

  return jsonResponse({ accepted: true }, 201)
}

function applicationAssetRequest(request: Request): Request | Response {
  const url = new URL(request.url)

  if (url.pathname === basePath) {
    url.pathname = `${basePath}/`
    return Response.redirect(url.toString(), 308)
  }

  if (!url.pathname.startsWith(`${basePath}/`)) {
    return new Response("Not Found", { status: 404 })
  }

  // Static Assets are stored with paths rooted at /, while the public app is
  // mounted below /nabimd. Preserve the request method and headers, but ask
  // the asset service for the prefix-free asset path.
  url.pathname = url.pathname.slice(basePath.length) || "/"
  return new Request(url, request)
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (new URL(request.url).pathname === feedbackPath) {
      return handleFeedback(request, env)
    }

    const assetRequest = applicationAssetRequest(request)
    if (assetRequest instanceof Response) return assetRequest

    const response = await env.ASSETS.fetch(assetRequest)
    const location = response.headers.get("Location")

    // Static Assets can canonicalize an .html request to its extensionless
    // form. Its Location is root-relative, so reapply our mount path before
    // the browser follows it.
    if (
      location?.startsWith("/") &&
      !location.startsWith(`${basePath}/`) &&
      response.status >= 300 &&
      response.status < 400
    ) {
      const headers = new Headers(response.headers)
      headers.set("Location", `${basePath}${location}`)
      return new Response(response.body, { headers, status: response.status })
    }

    const headers = new Headers(response.headers)
    headers.set("X-Nabi-Build-Sha", env.NABI_BUILD_SHA)
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  },

  async scheduled(
    _controller: ScheduledController,
    env: WorkerEnv,
  ): Promise<void> {
    const now = Math.floor(Date.now() / 1_000)
    await env.NABIMD_DB.prepare(
      "DELETE FROM learner_feedback WHERE expires_at <= ?",
    )
      .bind(now)
      .run()
  },
} satisfies ExportedHandler<WorkerEnv>
