import { describe, expect, it } from "vitest"
import worker from "../worker/index"

describe("Cloudflare worker", () => {
  it("publishes the deployed commit on application asset responses", async () => {
    const buildSha = "a".repeat(40)
    const response = await worker.fetch(
      new Request("https://onsoonlabs.com/nabimd/"),
      {
        ASSETS: {
          fetch: async () =>
            new Response("app", {
              headers: { "Content-Type": "text/html" },
            }),
        },
        NABI_BUILD_SHA: buildSha,
        NABIMD_ASSETS: {},
        NABIMD_DB: {},
      },
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("X-Nabi-Build-Sha")).toBe(buildSha)
    await expect(response.text()).resolves.toBe("app")
  })
})
