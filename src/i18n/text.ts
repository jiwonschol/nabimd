import type { DiagnosticLocation } from "../engine/types"
import { en } from "./en"
import { ko, type TextKey } from "./ko"

export type Lang = "ko" | "en"
export type { TextKey }

export const LANGS: readonly Lang[] = ["ko", "en"]

/** Shared with the onsoonlabs hub (site/shared/site.js): one choice per site. */
export const LANG_STORAGE_KEY = "onsoon-lang"

const dictionaries: Readonly<Record<Lang, Readonly<Record<TextKey, string>>>> = {
  ko,
  en,
}

export type TextParams = Readonly<Record<string, string | number>>

/** Fills `{name}` slots. An unknown slot stays visible so a test can see it. */
export function formatText(template: string, params?: TextParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  )
}

export type Translate = (key: TextKey, params?: TextParams) => string

export function translator(lang: Lang): Translate {
  const dictionary = dictionaries[lang]
  return (key, params) => formatText(dictionary[key], params)
}

export function isLang(value: unknown): value is Lang {
  return value === "ko" || value === "en"
}

type LanguageSource = {
  storage?: Pick<Storage, "getItem"> | null
  languages?: readonly string[]
}

/**
 * The language a visit starts in: the hub-wide choice in localStorage, then
 * the browser's own language list, then Korean (the product is Korean-first).
 */
export function resolveInitialLang({ storage, languages }: LanguageSource): Lang {
  try {
    const stored = storage?.getItem(LANG_STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    // Storage can throw when the browser blocks it; fall through.
  }
  for (const language of languages ?? []) {
    const primary = language.toLowerCase().split("-")[0]
    if (primary === "ko") return "ko"
    if (primary === "en") return "en"
  }
  return "ko"
}

export function readBrowserLang(): Lang {
  if (typeof window === "undefined") return "ko"
  let storage: Storage | null = null
  try {
    storage = window.localStorage
  } catch {
    storage = null
  }
  return resolveInitialLang({
    storage,
    languages: navigator.languages?.length
      ? navigator.languages
      : [navigator.language],
  })
}

export function storeLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // A blocked store keeps the choice for this page only.
  }
}

export function describeLocation(
  location: DiagnosticLocation,
  t: Translate,
): string {
  switch (location.kind) {
    case "document":
      return t("location.document")
    case "document-title":
      return t("location.document-title")
    case "section":
      return t("location.section", { heading: location.heading })
  }
}
