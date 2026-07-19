import { describe, expect, it } from "vitest"
import { placeTransferAtNextStep } from "./runSchedule"

describe("placeTransferAtNextStep", () => {
  it("inserts repair practice without consuming a later scheduled problem", () => {
    expect(
      placeTransferAtNextStep(
        ["scheduled-a", "scheduled-b", "scheduled-c"],
        0,
        "scheduled-c",
      ),
    ).toEqual(["scheduled-a", "scheduled-c", "scheduled-b", "scheduled-c"])
  })
})
