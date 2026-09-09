import { expect, test } from "vitest"
import { verifyCloudflareDeployment } from "./verifyCloudflareDeployment.mjs"

const expectedSha = "a".repeat(40)

test("accepts the exact deployed Worker revision", async () => {
  const revision = await verifyCloudflareDeployment({
    expectedSha,
    attempts: 1,
    fetchImpl: async () =>
      new Response(null, {
        headers: { "X-Nabi-Build-Sha": expectedSha },
      }),
  })

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
    fetchImpl: async () => {
      requests += 1
      return new Response(null, {
        headers:
          requests === 1 ? {} : { "X-Nabi-Build-Sha": expectedSha },
      })
    },
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
