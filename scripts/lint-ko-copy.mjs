#!/usr/bin/env node
/**
 * Korean copy lint (plan §6 G2):
 *
 * 1. No 해요체. Korean sentences end in "~다" (onsoonlabs intend.md); a
 *    sentence ending in 요 followed by . ? ! or the end of the string fails.
 *    Checked: the Korean dictionary and index.html.
 * 2. No user-facing copy written into components. Screen words come from
 *    src/i18n; a component may not carry JSX text with letters, a literal
 *    aria-label / placeholder / title / alt, or a Korean string.
 *
 * Run: node scripts/lint-ko-copy.mjs   (part of `npm run check`)
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"


/** Words a component may show as they are: the product's own name. */
const ALLOWED_TEXT = new Set(["Nabi Markdown"])
const USER_FACING_ATTRIBUTES = ["aria-label", "aria-description", "placeholder", "title", "alt"]
const HANGUL = /[ㄱ-ㆎ가-힣]/

/** Lines whose Korean sentence ends in 해요체. */
export function findPoliteEndings(text) {
  const findings = []
  text.split("\n").forEach((line, index) => {
    // Every quoted Korean string on the line, then each sentence in it.
    for (const match of line.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
      const value = match[1]
      if (!HANGUL.test(value)) continue
      if (/요(?:[.?!…]|\s*$)/.test(value) || /요[.?!]\s/.test(value)) {
        findings.push({ line: index + 1, text: value })
      }
    }
  })
  return findings
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, (whole, lead) => lead + " ".repeat(whole.length - lead.length))
}

/** Hard-coded user copy in one component's source. */
export function findHardcodedCopy(source) {
  const code = stripComments(source)
  const findings = []
  const lineOf = (offset) => code.slice(0, offset).split("\n").length

  // JSX text between a closing ">" of a tag and the next "<". Expressions
  // ({name}, {t("key")}) are cut out first, so text sitting beside one is
  // still seen: "<p>Hello {name}</p>" leaves "Hello".
  for (const match of code.matchAll(/>([^<>]*?)</g)) {
    let text = match[1]
    for (let previous = ""; previous !== text; ) {
      previous = text
      text = text.replace(/\{[^{}]*\}/g, " ")
    }
    // An expression cut by a nested tag ({cond ? <b/> : …}) leaves an
    // unclosed brace at either end; drop it too.
    text = text.replace(/\{[\s\S]*$/, " ").replace(/^[\s\S]*\}/, " ").trim()
    if (!text || !/[A-Za-zㄱ-ㆎ가-힣]/.test(text)) continue
    // Code between a generic or a closing tag and the next "<" (useRef<T>(…),
    // a ternary after </p>) carries brackets, "=" or ";"; screen text does not.
    if (/[()=;]/.test(text)) continue
    // Skip TypeScript generics and comparisons: JSX text never starts a line
    // of code with an operator, and the tag before it must look like JSX.
    const before = code.slice(Math.max(0, match.index - 200), match.index + 1)
    if (!/<[A-Za-z][\w.]*(?:\s[^<>]*)?>$|<\/[A-Za-z][\w.]*>$|<>$/.test(before)) continue
    if (ALLOWED_TEXT.has(text)) continue
    findings.push({ line: lineOf(match.index), text })
  }

  for (const attribute of USER_FACING_ATTRIBUTES) {
    const pattern = new RegExp(`\\s${attribute}="([^"]*[A-Za-z\\u3131-\\u318E\\uAC00-\\uD7A3][^"]*)"`, "g")
    for (const match of code.matchAll(pattern)) {
      findings.push({ line: lineOf(match.index), text: `${attribute}="${match[1]}"` })
    }
  }

  for (const match of code.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
    if (HANGUL.test(match[2])) {
      findings.push({ line: lineOf(match.index), text: match[2] })
    }
  }
  return findings
}

function walk(directory, keep) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) return walk(path, keep)
    return keep(path) ? [path] : []
  })
}

function main() {
  const ROOT = fileURLToPath(new URL("..", import.meta.url))
  const problems = []

  for (const file of [join(ROOT, "src/i18n/ko.ts"), join(ROOT, "index.html")]) {
    for (const finding of findPoliteEndings(readFileSync(file, "utf8"))) {
      problems.push(`${relative(ROOT, file)}:${finding.line} 해요체: ${finding.text}`)
    }
  }

  const components = [
    ...walk(join(ROOT, "src/components"), (path) => path.endsWith(".tsx") && !path.includes(".test.")),
    join(ROOT, "src/App.tsx"),
  ]
  for (const file of components) {
    for (const finding of findHardcodedCopy(readFileSync(file, "utf8"))) {
      problems.push(`${relative(ROOT, file)}:${finding.line} 하드코딩 문구: ${finding.text}`)
    }
  }

  if (problems.length > 0) {
    console.error(`Korean copy lint found ${problems.length} problem(s):`)
    for (const problem of problems) console.error(`  ${problem}`)
    process.exit(1)
  }
  console.log(
    `Korean copy lint: 해요체 0, hard-coded copy 0 across ${components.length} component file(s).`,
  )
}

if (import.meta.url.startsWith("file:") && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
