import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"

const assetsDir = resolve(process.cwd(), "dist/assets")
const javascriptFiles = (await readdir(assetsDir))
  .filter((file) => file.endsWith(".js"))
  .sort()

if (javascriptFiles.length === 0) {
  throw new Error("Production bundle verification found no JavaScript assets")
}

const bundle = (
  await Promise.all(
    javascriptFiles.map((file) => readFile(resolve(assetsDir, file), "utf8")),
  )
).join("\n")

const fixtureOnlySentinels = [
  "l1-heading-apple-different-prose",
  "Bicycle repair",
  "# Extra document title",
  "Skipped supporting detail",
]

const leaked = fixtureOnlySentinels.filter((sentinel) => bundle.includes(sentinel))
if (leaked.length > 0) {
  throw new Error(
    `Production bundle contains test-only problem fixtures: ${leaked.join(", ")}`,
  )
}

console.log(
  `Production bundle excludes ${fixtureOnlySentinels.length} fixture-only sentinels across ${javascriptFiles.length} JavaScript asset(s).`,
)
