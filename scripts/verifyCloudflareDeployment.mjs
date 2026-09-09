import { pathToFileURL } from "node:url"

const defaultUrl = "https://onsoonlabs.com/nabimd/"

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function verifyCloudflareDeployment({
  expectedSha,
  url = defaultUrl,
  attempts = 6,
  retryDelayMs = 10_000,
  requestTimeoutMs = 10_000,
  fetchImpl = fetch,
}) {
  if (!/^[0-9a-f]{40}$/.test(expectedSha)) {
    throw new Error("EXPECTED_SHA must be a 40-character lowercase commit SHA")
  }

  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)

    try {
      const requestUrl = new URL(url)
      requestUrl.searchParams.set("deployment-sha", expectedSha)
      const response = await fetchImpl(requestUrl, {
        method: "HEAD",
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`production returned HTTP ${response.status}`)
      }

      const deployedSha = response.headers.get("X-Nabi-Build-Sha")
      if (!deployedSha) {
        throw new Error(
          "production did not publish X-Nabi-Build-Sha; the route may bypass the Worker",
        )
      }
      if (deployedSha !== expectedSha) {
        throw new Error(
          `production serves ${deployedSha}, but ${expectedSha} was deployed`,
        )
      }

      return deployedSha
    } catch (error) {
      lastError = controller.signal.aborted
        ? new Error(`deployment probe timed out after ${requestTimeoutMs}ms`, {
            cause: error,
          })
        : error
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < attempts) await sleep(retryDelayMs)
  }

  throw lastError
}

async function main() {
  const expectedSha = process.env.EXPECTED_SHA?.trim() ?? ""
  const deployedSha = await verifyCloudflareDeployment({
    expectedSha,
    url: process.env.E2E_BASE_URL?.trim() || defaultUrl,
  })
  console.log(`Verified Cloudflare production revision ${deployedSha}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
