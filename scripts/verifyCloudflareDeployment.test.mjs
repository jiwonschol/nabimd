import { expect, test } from "vitest"
import { verifyCloudflareDeployment } from "./verifyCloudflareDeployment.mjs"

const expectedSha = "a".repeat(40)

const scriptOk = () =>
  new Response("", { headers: { "Content-Type": "text/javascript" } })

// Production as the probe sees it: the revision header on HEAD, the page on
// GET, and the script the page names.
function production({ revision = () => expectedSha, script = scriptOk } = {}) {
  return async (url, init) => {
    if (new URL(url).pathname.includes("/assets/")) return script()
    if (init.method === "HEAD") {
      const sha = revision()
      return new Response(null, {
        headers: sha ? { "X-Nabi-Build-Sha": sha } : {},
      })
    }
    return new Response(
      '<script type="module" src="/nabimd/assets/index-abc.js"></script>',
      { headers: { "Content-Type": "text/html" } },
    )
  }
}

test("accepts the exact deployed Worker revision", async () => {
  const revision = await verifyCloudflareDeployment({
    expectedSha,
    attempts: 1,
    fetchImpl: production(),
  })

  expect(revision).toBe(expectedSha)
})

test("rejects a page whose script comes back as the page", async () => {
  await expect(
    verifyCloudflareDeployment({
      expectedSha,
      attempts: 1,
      fetchImpl: production({
        script: () =>
          new Response("<!doctype html>", {
            headers: { "Content-Type": "text/html" },
          }),
      }),
    }),
  ).rejects.toThrow(/script \/nabimd\/assets\/index-abc\.js returned HTTP 200/)
})

test("waits for the script to reach the new version", async () => {
  let requests = 0
  const revision = await verifyCloudflareDeployment({
    expectedSha,
    attempts: 2,
    retryDelayMs: 0,
    fetchImpl: production({
      script: () => {
        requests += 1
        return requests === 1 ? new Response(null, { status: 404 }) : scriptOk()
      },
    }),
  })

  expect(requests).toBe(2)
  expect(revision).toBe(expectedSha)
})

test("rejects a route that bypasses the Worker header", async () => {
  await expect(
    verifyCloudflareDeployment({
      expectedSha,
      attempts: 1,
      fetchImpl: async () => new Response(null),
    }),
  ).rejects.toThrow(/did not publish X-Nabi-Build-Sha/)
})

test("rejects a stale Worker revision", async () => {
  await expect(
    verifyCloudflareDeployment({
      expectedSha,
      attempts: 1,
      fetchImpl: async () =>
        new Response(null, {
          headers: { "X-Nabi-Build-Sha": "b".repeat(40) },
        }),
    }),
  ).rejects.toThrow(/production serves b{40}/)
})

test("waits for route propagation", async () => {
  let requests = 0
  const revision = await verifyCloudflareDeployment({
    expectedSha,
    attempts: 2,
    retryDelayMs: 0,
    fetchImpl: production({
      revision: () => {
        requests += 1
        return requests === 1 ? null : expectedSha
      },
    }),
  })

  expect(requests).toBe(2)
  expect(revision).toBe(expectedSha)
})

test(
  "abandons a stalled deployment probe",
  async () => {
    await expect(
      verifyCloudflareDeployment({
        expectedSha,
        attempts: 1,
        requestTimeoutMs: 1,
        fetchImpl: async (_url, { signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            )
          }),
      }),
    ).rejects.toThrow(/timed out after 1ms/)
  },
  100,
)
