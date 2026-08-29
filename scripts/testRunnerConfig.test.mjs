import { readdir, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { parseAst } from "vite"

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
  const moduleName = (node) => {
    if (node?.type === "Literal" && typeof node.value === "string") {
      return node.value
    }
    if (
      node?.type === "TemplateLiteral" &&
      node.expressions.length === 0 &&
      node.quasis.length === 1
    ) {
      return node.quasis[0].value.cooked
    }
    return null
  }
  const runnerApis = new Set(["default", "test", "it", "describe", "suite"])
  const importsRunnerApi = (node, ancestors) => {
    if (node.type === "ImportExpression") {
      let expression = node
      let parentIndex = ancestors.length - 1
      if (
        ancestors[parentIndex]?.type === "AwaitExpression" &&
        ancestors[parentIndex].argument === node
      ) {
        expression = ancestors[parentIndex]
        parentIndex -= 1
      }
      const consumer = ancestors[parentIndex]
      if (consumer?.type === "VariableDeclarator" && consumer.init === expression) {
        if (consumer.id.type !== "ObjectPattern") return true
        return consumer.id.properties.some((property) =>
          runnerApis.has(property.key?.name ?? property.key?.value),
        )
      }
      if (consumer?.type === "MemberExpression" && consumer.object === expression) {
        return runnerApis.has(consumer.property?.name ?? consumer.property?.value)
      }
      return true
    }
    return node.specifiers.some((specifier) => {
      if (specifier.type === "ImportDefaultSpecifier" || specifier.type === "ImportNamespaceSpecifier") {
        return true
      }
      return runnerApis.has(specifier.imported?.name ?? specifier.imported?.value)
    })
  }
  let importsNodeRunner = false
  let importsVitestRunner = false
  const visit = (node, ancestors = []) => {
    if (
      (node.type === "ImportDeclaration" || node.type === "ImportExpression") &&
      moduleName(node.source) === "node:test" &&
      importsRunnerApi(node, ancestors)
    ) {
      importsNodeRunner = true
    }
    if (
      (node.type === "ImportDeclaration" || node.type === "ImportExpression") &&
      moduleName(node.source) === "vitest" &&
      importsRunnerApi(node, ancestors)
    ) {
      importsVitestRunner = true
    }
    for (const value of Object.values(node)) {
      if (value === null || typeof value !== "object") continue
      if (Array.isArray(value)) value.forEach((child) => child && visit(child, [...ancestors, node]))
      else if (typeof value.type === "string") visit(value, [...ancestors, node])
    }
  }
  visit(parseAst(source))
  return importsNodeRunner && !importsVitestRunner
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
    expect(importsNodeTest('const { test } = await import("node:test")\n')).toBe(true)
    expect(importsNodeTest('const { test } = await import(`node:test`)\n')).toBe(true)
    expect(importsNodeTest('// import test from "node:test"\n')).toBe(false)
    expect(importsNodeTest('/*\nimport test from "node:test"\n*/\n')).toBe(false)
    expect(importsNodeTest('const fixture = `\nimport test from "node:test"\n`\n')).toBe(false)
    expect(importsNodeTest('const runner = "node:test"\n')).toBe(false)
    expect(importsNodeTest('/* await import("node:test") */\n')).toBe(false)
    expect(importsNodeTest('const fixture = `await import("node:test")`\n')).toBe(false)
    expect(importsNodeTest('const matcher = /import("node:test")/\n')).toBe(false)
    expect(importsNodeTest('const matcher = () => /import("node:test")/\n')).toBe(false)
    expect(importsNodeTest('function matcher() { return /import("node:test")/ }\n')).toBe(false)
    expect(
      importsNodeTest(
        'import { mock } from "node:test"\nimport { describe, it } from "vitest"\n',
      ),
    ).toBe(false)
    expect(
      importsNodeTest(
        'import test from "node:test"\nimport { expect } from "vitest"\n',
      ),
    ).toBe(true)
    expect(
      importsNodeTest(
        'import test from "node:test"\nconst { expect } = await import("vitest")\n',
      ),
    ).toBe(true)
    expect(
      importsNodeTest(
        'import test from "node:test"\nconst { it } = await import("vitest")\n',
      ),
    ).toBe(false)
  })
})
