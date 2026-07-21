import { describe, expect, it } from "vitest"
import { collectProductionLocations } from "./generate-third-party-notices.mjs"

const rootWith = (dependencies) => ({
  packages: {
    "": { dependencies },
  },
})

describe("collectProductionLocations", () => {
  it("skips optional dependencies that are not installed on this platform", async () => {
    const lockfile = rootWith({ parent: "1.0.0" })
    lockfile.packages["node_modules/parent"] = {
      optionalDependencies: {
        "platform-addon": "1.0.0",
        "pruned-addon": "1.0.0",
      },
    }
    lockfile.packages["node_modules/platform-addon"] = {
      optional: true,
    }

    await expect(
      collectProductionLocations(lockfile, {
        isInstalled: async (location) => location === "node_modules/parent",
      }),
    ).resolves.toEqual(["node_modules/parent"])
  })

  it("traverses optional dependencies that are installed", async () => {
    const lockfile = rootWith({ parent: "1.0.0" })
    lockfile.packages["node_modules/parent"] = {
      optionalDependencies: { "platform-addon": "1.0.0" },
    }
    lockfile.packages["node_modules/platform-addon"] = {
      dependencies: { support: "1.0.0" },
      optional: true,
    }
    lockfile.packages["node_modules/support"] = {}

    await expect(
      collectProductionLocations(lockfile, {
        isInstalled: async () => true,
      }),
    ).resolves.toEqual([
      "node_modules/parent",
      "node_modules/platform-addon",
      "node_modules/support",
    ])
  })

  it("throws when a required dependency is missing", async () => {
    const lockfile = rootWith({ parent: "1.0.0" })
    lockfile.packages["node_modules/parent"] = {
      dependencies: { required: "1.0.0" },
    }

    await expect(
      collectProductionLocations(lockfile, {
        isInstalled: async () => true,
      }),
    ).rejects.toThrow(
      "Cannot resolve production dependency required from node_modules/parent",
    )
  })

  it("throws when a required lockfile entry is not installed", async () => {
    const lockfile = rootWith({ required: "1.0.0" })
    lockfile.packages["node_modules/required"] = {}

    await expect(
      collectProductionLocations(lockfile, {
        isInstalled: async () => false,
      }),
    ).rejects.toThrow(
      "Required production dependency required from the project root is not installed",
    )
  })
})
