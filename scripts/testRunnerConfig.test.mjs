import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const repositoryRoot = resolve(import.meta.dirname, "..")

async function scriptTestFiles() {
  const found = []
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(path)
      } else if (entry.name.endsWith(".test.mjs")) {
        found.push(path)
      }
    }
  }
  await walk(resolve(repositoryRoot, "scripts"))
  return found.sort()
}

export function importsNodeTest(source) {
  return /^\s*import\s+(?:[\w$]+\s*,\s*)?(?:\*\s+as\s+[\w$]+|\{[^}]*\}|[\w$]+)\s+from\s+(["'])node:test\1\s*;?/m.test(source)
}

describe("test runner configuration", () => {
  // Two runners share one directory tree. vitest's include reaches
  // `scripts/**/*.test.mjs` for the suites written against it, and a file
  // written against `node --test` lands there too — where vitest reports "No
  // test suite found" and fails the run. That is a whole-suite failure from
  // adding a passing test file, and the only thing standing between the two is
  // a hand-written list of names.
  it("excludes every node:test file under scripts from vitest", async () => {
    const config = await readFile(resolve(repositoryRoot, "vitest.config.ts"), "utf8")
    const files = await scriptTestFiles()
    expect(files.length).toBeGreaterThanOrEqual(4)

    let nodeTestFiles = 0
    let vitestFiles = 0
    for (const path of files) {
      const relative = path.slice(repositoryRoot.length + 1)
      const source = await readFile(path, "utf8")
      // An import statement, not a mention: this file names both runners in
      // its own assertions and would otherwise classify itself.
      const isNodeTest = importsNodeTest(source)
      const excluded = config.includes(`"${relative}"`)
      if (isNodeTest) {
        nodeTestFiles += 1
        expect(excluded, `${relative} runs on node --test and must be excluded`).toBe(true)
      } else {
        vitestFiles += 1
        // The opposite mistake is quieter: excluding a vitest suite drops it
        // from the run and nothing turns red.
        expect(excluded, `${relative} is a vitest suite and must not be excluded`).toBe(false)
      }
    }

    // A sweep that matched neither kind would satisfy both branches above.
    expect(nodeTestFiles).toBeGreaterThan(0)
    expect(vitestFiles).toBeGreaterThan(0)
  })

  it("recognizes valid node:test import forms", () => {
    expect(importsNodeTest("import test from 'node:test'\n")).toBe(true)
    expect(importsNodeTest('import {\n  describe,\n  it,\n} from "node:test"\n')).toBe(true)
    expect(importsNodeTest('import test, { mock } from "node:test"\n')).toBe(true)
    expect(importsNodeTest('// import test from "node:test"\n')).toBe(false)
    expect(importsNodeTest('const runner = "node:test"\n')).toBe(false)
  })
})
