import { describe, expect, it } from "vitest"
import { en } from "./en"
import { ko } from "./ko"
import { formatText, LANG_STORAGE_KEY, resolveInitialLang } from "./text"

function storageWith(value: string | null) {
  return { getItem: (key: string) => (key === LANG_STORAGE_KEY ? value : null) }
}

describe("screen language", () => {
  it("starts from the hub-wide stored choice", () => {
    expect(
      resolveInitialLang({ storage: storageWith("en"), languages: ["ko-KR"] }),
    ).toBe("en")
  })

  it("falls back to the browser language list, then Korean", () => {
    expect(resolveInitialLang({ storage: storageWith(null), languages: ["en-US"] })).toBe("en")
    expect(resolveInitialLang({ storage: storageWith("fr"), languages: ["fr", "ko"] })).toBe("ko")
    expect(resolveInitialLang({ storage: storageWith(null), languages: ["de"] })).toBe("ko")
  })

  it("survives a storage that throws", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked")
      },
    }
    expect(resolveInitialLang({ storage: blocked, languages: ["en"] })).toBe("en")
  })
})

describe("dictionaries", () => {
  it("give every key a non-empty sentence in both languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort())
    for (const dictionary of [ko, en]) {
      for (const [key, value] of Object.entries(dictionary)) {
        expect(value.trim(), key).not.toBe("")
      }
    }
  })

  it("use the same slots in both languages", () => {
    const slots = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(ko) as (keyof typeof ko)[]) {
      expect(slots(en[key]), key).toEqual(slots(ko[key]))
    }
  })

  it("fills slots and leaves unknown ones visible", () => {
    expect(formatText("{a} and {b}", { a: 1 })).toBe("1 and {b}")
  })
})
