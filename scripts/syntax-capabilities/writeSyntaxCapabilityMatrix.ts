import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  buildSyntaxCapabilityMatrix,
  renderSyntaxCapabilityMarkdown,
} from "./syntaxCapabilityMatrix"

const outputPath = resolve(
  process.cwd(),
  "docs/syntax-capability-matrix.generated.md",
)
const rendered = renderSyntaxCapabilityMarkdown(buildSyntaxCapabilityMatrix())
const action = process.argv[2]

if (action === "--write") {
  await writeFile(outputPath, rendered)
} else if (action === "--check") {
  const committed = await readFile(outputPath, "utf8")
  if (committed !== rendered) {
    throw new Error(
      "docs/syntax-capability-matrix.generated.md is stale; run npm run syntax:capabilities:write",
    )
  }
} else {
  throw new Error(
    "Usage: writeSyntaxCapabilityMatrix.ts <--write|--check>",
  )
}
