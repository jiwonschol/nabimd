import { describe, expect, it } from "vitest"
import { buildGateInput } from "./gateSupport"

describe("published problem-bank gate", () => {
  it("publishes only candidates that clear every digest-bound stage", async () => {
    const { errors } = await buildGateInput()
    expect(errors).toEqual([])
  })
})
