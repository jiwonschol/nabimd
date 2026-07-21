import { access, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
)
const lockfilePath = resolve(repositoryRoot, "package-lock.json")
const defaultOutputPath = resolve(
  repositoryRoot,
  "public/THIRD-PARTY-NOTICES.txt",
)
const defaultHtmlOutputPath = resolve(
  repositoryRoot,
  "public/third-party-licenses.html",
)

const compareCodePoints = (left, right) =>
  left < right ? -1 : left > right ? 1 : 0

const normalizeNewlines = (value) => value.replace(/\r\n?/g, "\n")

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const normalizePerson = (person) => {
  if (typeof person === "string") {
    return person.trim()
  }

  if (!person || typeof person !== "object") {
    return ""
  }

  const details = [person.name, person.email, person.url]
    .filter((detail) => typeof detail === "string" && detail.trim().length > 0)
    .map((detail) => detail.trim())

  return details.join(" | ")
}

const normalizeLicenseIdentifier = (license) => {
  if (typeof license === "string" && license.trim().length > 0) {
    return license.trim()
  }

  if (license && typeof license === "object") {
    if (typeof license.type === "string" && license.type.trim().length > 0) {
      return license.type.trim()
    }
  }

  return "UNKNOWN"
}

const legalFileRank = (fileName) => {
  const lowerName = fileName.toLowerCase()
  if (lowerName.startsWith("license") || lowerName.startsWith("licence")) {
    return 0
  }
  if (lowerName.startsWith("copying")) {
    return 1
  }
  return 2
}

const findLegalFiles = async (packageDirectory) => {
  const entries = await readdir(packageDirectory, { withFileTypes: true })

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        /^(licen[cs]e|copying|notice)(\..*)?$/i.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort(
      (left, right) =>
        legalFileRank(left) - legalFileRank(right) ||
        compareCodePoints(left.toLowerCase(), right.toLowerCase()) ||
        compareCodePoints(left, right),
    )
}

const resolveInstalledDependency = (packages, fromLocation, dependencyName) => {
  let searchLocation = fromLocation

  while (true) {
    const candidate = `${searchLocation ? `${searchLocation}/` : ""}node_modules/${dependencyName}`
    if (packages[candidate]) {
      return candidate
    }

    const nestedNodeModulesIndex = searchLocation.lastIndexOf("/node_modules/")
    if (nestedNodeModulesIndex >= 0) {
      searchLocation = searchLocation.slice(0, nestedNodeModulesIndex)
    } else if (searchLocation.length > 0) {
      searchLocation = ""
    } else {
      throw new Error(
        `Cannot resolve production dependency ${dependencyName} from ${fromLocation || "the project root"}`,
      )
    }
  }
}

const isPackageInstalled = async (packageLocation) => {
  try {
    await access(resolve(repositoryRoot, packageLocation, "package.json"))
    return true
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return false
    }
    throw error
  }
}

export const collectProductionLocations = async (
  lockfile,
  { isInstalled = isPackageInstalled } = {},
) => {
  const packages = lockfile.packages
  const rootPackage = packages?.[""]

  if (!packages || !rootPackage) {
    throw new Error(
      "package-lock.json must use a lockfile format with a packages map",
    )
  }

  const pending = []
  const visited = new Set()

  const enqueueDependencies = async (
    packageEntry,
    fromLocation,
    { includePeerDependencies = true } = {},
  ) => {
    const optionalNames = new Set(
      Object.keys(packageEntry.optionalDependencies ?? {}),
    )
    const requiredNames = new Set(
      Object.keys(packageEntry.dependencies ?? {}).filter(
        (name) => !optionalNames.has(name),
      ),
    )

    if (includePeerDependencies) {
      for (const peerName of Object.keys(packageEntry.peerDependencies ?? {})) {
        if (
          packageEntry.peerDependenciesMeta?.[peerName]?.optional !== true &&
          !optionalNames.has(peerName)
        ) {
          requiredNames.add(peerName)
        }
      }
    }

    for (const dependencyName of [...requiredNames].sort(compareCodePoints)) {
      const packageLocation = resolveInstalledDependency(
        packages,
        fromLocation,
        dependencyName,
      )
      if (!(await isInstalled(packageLocation))) {
        throw new Error(
          `Required production dependency ${dependencyName} from ${fromLocation || "the project root"} is not installed`,
        )
      }
      pending.push(packageLocation)
    }

    for (const dependencyName of [...optionalNames].sort(compareCodePoints)) {
      let packageLocation
      try {
        packageLocation = resolveInstalledDependency(
          packages,
          fromLocation,
          dependencyName,
        )
      } catch {
        continue
      }

      if (await isInstalled(packageLocation)) {
        pending.push(packageLocation)
      }
    }
  }

  await enqueueDependencies(rootPackage, "", {
    includePeerDependencies: false,
  })

  while (pending.length > 0) {
    const packageLocation = pending.shift()
    if (!packageLocation || visited.has(packageLocation)) {
      continue
    }

    const packageEntry = packages[packageLocation]
    if (!packageEntry) {
      throw new Error(`Missing lockfile entry for ${packageLocation}`)
    }
    if (packageEntry.dev === true) {
      throw new Error(
        `Production dependency traversal reached dev-only package ${packageLocation}`,
      )
    }

    visited.add(packageLocation)
    await enqueueDependencies(packageEntry, packageLocation)
  }

  return [...visited]
}

const collectRightsHolder = (packageManifest, licenseTexts) => {
  if (
    typeof packageManifest.copyright === "string" &&
    packageManifest.copyright.trim().length > 0
  ) {
    return packageManifest.copyright.trim()
  }

  const copyrightLines = licenseTexts
    .flatMap(({ text }) => normalizeNewlines(text).split("\n"))
    .map((line) => line.trim())
    .filter((line) => /^(copyright\b|©)/i.test(line))
    .filter((line, index, lines) => lines.indexOf(line) === index)

  if (copyrightLines.length > 0) {
    return copyrightLines.join(" | ")
  }

  const author = normalizePerson(packageManifest.author)
  if (author.length > 0) {
    return author
  }

  const contributors = Array.isArray(packageManifest.contributors)
    ? packageManifest.contributors.map(normalizePerson).filter(Boolean)
    : []
  if (contributors.length > 0) {
    return contributors.join(" | ")
  }

  throw new Error(
    `No copyright or author information found for ${packageManifest.name}@${packageManifest.version}`,
  )
}

const loadNoticeEntry = async (packageLocation) => {
  const packageDirectory = resolve(repositoryRoot, packageLocation)
  const packageManifest = JSON.parse(
    await readFile(resolve(packageDirectory, "package.json"), "utf8"),
  )
  const legalFiles = await findLegalFiles(packageDirectory)

  if (legalFiles.length === 0) {
    throw new Error(
      `No LICENSE, LICENCE, COPYING, or NOTICE file found for ${packageManifest.name}@${packageManifest.version}`,
    )
  }

  const licenseTexts = await Promise.all(
    legalFiles.map(async (fileName) => ({
      fileName,
      text: normalizeNewlines(
        await readFile(resolve(packageDirectory, fileName), "utf8"),
      ).trim(),
    })),
  )

  return {
    name: packageManifest.name,
    version: packageManifest.version,
    license: normalizeLicenseIdentifier(packageManifest.license),
    rightsHolder: collectRightsHolder(packageManifest, licenseTexts),
    licenseTexts,
  }
}

const renderNotices = (entries) => {
  const separator = "=".repeat(80)
  const sections = entries.map((entry) => {
    const legalTexts = entry.licenseTexts
      .map(
        ({ fileName, text }) =>
          `----- ${fileName} -----\n${text}`,
      )
      .join("\n\n")

    return [
      separator,
      `Package: ${entry.name}`,
      `Version: ${entry.version}`,
      `SPDX license: ${entry.license}`,
      `Copyright / author: ${entry.rightsHolder}`,
      `License file(s): ${entry.licenseTexts.map(({ fileName }) => fileName).join(", ")}`,
      "",
      legalTexts,
    ].join("\n")
  })

  return [
    "Nabi Markdown Third-Party Notices",
    "=================================",
    "",
    "This file contains license notices for production dependencies distributed with Nabi Markdown.",
    "The entries are generated from package-lock.json and installed package license files.",
    "Development-only dependencies are excluded.",
    "",
    `Production dependency packages: ${entries.length}`,
    "",
    ...sections,
    separator,
    "",
  ].join("\n")
}

const renderPackageList = (entries) =>
  entries
    .map(
      (entry) => `          <li class="package-entry">
            <div class="package-entry__identity">
              <h3>${escapeHtml(entry.name)}</h3>
              <span class="package-entry__version">${escapeHtml(entry.version)}</span>
            </div>
            <p>${escapeHtml(entry.rightsHolder)}</p>
          </li>`,
    )
    .join("\n")

const renderLicenseGroups = (entries) => {
  const entriesByLicense = new Map()

  for (const entry of entries) {
    const licenseEntries = entriesByLicense.get(entry.license) ?? []
    licenseEntries.push(entry)
    entriesByLicense.set(entry.license, licenseEntries)
  }

  return [...entriesByLicense.entries()]
    .sort(
      ([leftLicense, leftEntries], [rightLicense, rightEntries]) =>
        rightEntries.length - leftEntries.length ||
        compareCodePoints(leftLicense, rightLicense),
    )
    .map(
      ([license, licenseEntries]) => `      <details class="license-group">
        <summary>
          <span class="license-group__name">${escapeHtml(license)}</span>
          <span class="license-group__count">${licenseEntries.length} ${licenseEntries.length === 1 ? "package" : "packages"}</span>
        </summary>
        <ol class="package-list">
${renderPackageList(licenseEntries)}
        </ol>
      </details>`,
    )
    .join("\n")
}

const renderLicensesHtml = (entries) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Licenses and acknowledgements for Nabi Markdown and its third-party software."
    />
    <title>Licenses &amp; acknowledgements · Nabi Markdown</title>
    <link rel="icon" type="image/png" href="/brand/bfly-favicon.png" />
    <link rel="stylesheet" href="/licenses.css" />
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to licenses</a>
    <main class="licenses-page" id="main-content">
      <header class="licenses-hero">
        <a class="brand" href="/" aria-label="Nabi Markdown home">
          <img
            alt=""
            height="48"
            src="/brand/bfly-wordmark.png"
            width="48"
          />
          <span>Nabi Markdown</span>
        </a>
        <p class="eyebrow">Open work, carefully credited</p>
        <h1>Licenses &amp;<br />acknowledgements</h1>
        <p class="licenses-hero__intro">
          Nabi Markdown is possible because many people chose to share their
          work. This page records the terms that protect that generosity and
          gives each project its due credit.
        </p>
      </header>

      <section class="project-licenses" aria-labelledby="project-licenses-title">
        <div class="section-heading">
          <p class="section-number">01</p>
          <div>
            <h2 id="project-licenses-title">This project</h2>
            <p>Different parts of Nabi Markdown carry different licenses.</p>
          </div>
        </div>
        <dl class="project-license-list">
          <div>
            <dt>Application source</dt>
            <dd>
              <a
                href="https://github.com/jiwonschol/nabimd/blob/main/LICENSE"
                rel="noopener noreferrer"
                target="_blank"
              >AGPL-3.0-or-later</a>
            </dd>
          </div>
          <div>
            <dt>Learning content</dt>
            <dd>
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                rel="noopener noreferrer"
                target="_blank"
              >CC BY-SA 4.0</a>
            </dd>
          </div>
          <div>
            <dt>Typefaces</dt>
            <dd>
              SIL OFL 1.1 ·
              <a href="/fonts/source-serif-4/LICENSE.md">Source Serif 4</a>
              and
              <a href="/fonts/jetbrains-mono/LICENSE.txt">JetBrains Mono</a>
            </dd>
          </div>
          <div>
            <dt>Interface sounds</dt>
            <dd>
              <a href="/audio/LICENSE.md">Mixkit Sound Effects Free License</a>
            </dd>
          </div>
        </dl>
      </section>

      <section class="software-licenses" aria-labelledby="software-licenses-title">
        <div class="section-heading section-heading--software">
          <p class="section-number">02</p>
          <div>
            <h2 id="software-licenses-title">Third-party software</h2>
            <p>
              ${entries.length} production dependency packages, grouped by
              SPDX license. Expand a group to read package-level credits.
            </p>
          </div>
          <a
            class="raw-notices-link"
            download
            href="/THIRD-PARTY-NOTICES.txt"
          >Download full notices <span aria-hidden="true">.txt</span></a>
        </div>
${renderLicenseGroups(entries)}
      </section>

      <footer class="licenses-footer">
        <p>Thank you to every maintainer and contributor represented here.</p>
        <nav aria-label="License page links">
          <a href="/">Return to Nabi Markdown</a>
          <a
            href="https://github.com/jiwonschol/nabimd"
            rel="noopener noreferrer"
            target="_blank"
          >Source code</a>
          <a href="/THIRD-PARTY-NOTICES.txt">Raw notices</a>
        </nav>
      </footer>
    </main>
  </body>
</html>
`

const generateNotices = async () => {
  const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"))
  const packageLocations = await collectProductionLocations(lockfile)
  const entriesByIdentity = new Map()

  for (const packageLocation of packageLocations) {
    const entry = await loadNoticeEntry(packageLocation)
    const identity = `${entry.name}@${entry.version}`
    if (!entriesByIdentity.has(identity)) {
      entriesByIdentity.set(identity, entry)
    }
  }

  const entries = [...entriesByIdentity.values()].sort(
    (left, right) =>
      compareCodePoints(left.name, right.name) ||
      compareCodePoints(left.version, right.version),
  )

  return {
    htmlContent: renderLicensesHtml(entries),
    packageCount: entries.length,
    textContent: renderNotices(entries),
  }
}

const parseArguments = (argumentsList) => {
  let check = false
  let requestedHtmlOutputPath = null
  let requestedTextOutputPath = null

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === "--check") {
      check = true
    } else if (argument === "--output") {
      const requestedPath = argumentsList[index + 1]
      if (!requestedPath) {
        throw new Error("--output requires a file path")
      }
      requestedTextOutputPath = resolve(process.cwd(), requestedPath)
      index += 1
    } else if (argument === "--html-output") {
      const requestedPath = argumentsList[index + 1]
      if (!requestedPath) {
        throw new Error("--html-output requires a file path")
      }
      requestedHtmlOutputPath = resolve(process.cwd(), requestedPath)
      index += 1
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }

  return {
    check,
    htmlOutputPath:
      requestedHtmlOutputPath ??
      (requestedTextOutputPath ? null : defaultHtmlOutputPath),
    textOutputPath: requestedTextOutputPath ?? defaultOutputPath,
  }
}

const assertCurrent = async (outputPath, expectedContent) => {
  let currentContent
  try {
    currentContent = normalizeNewlines(await readFile(outputPath, "utf8"))
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      throw new Error(
        `${outputPath} is missing. Run npm run third-party-notices:generate.`,
      )
    }
    throw error
  }

  if (currentContent !== expectedContent) {
    throw new Error(
      `${outputPath} is stale. Run npm run third-party-notices:generate.`,
    )
  }
}

const main = async () => {
  const { check, htmlOutputPath, textOutputPath } = parseArguments(
    process.argv.slice(2),
  )
  const { htmlContent, packageCount, textContent } = await generateNotices()

  if (check) {
    await assertCurrent(textOutputPath, textContent)
    if (htmlOutputPath) {
      await assertCurrent(htmlOutputPath, htmlContent)
    }

    console.log(
      `Third-party notices${htmlOutputPath ? " and license page are" : " are"} current for ${packageCount} production dependency package(s).`,
    )
    return
  }

  await writeFile(textOutputPath, textContent, "utf8")
  if (htmlOutputPath) {
    await writeFile(htmlOutputPath, htmlContent, "utf8")
  }
  console.log(
    `Wrote ${textOutputPath}${htmlOutputPath ? ` and ${htmlOutputPath}` : ""} for ${packageCount} production dependency package(s).`,
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main()
}
