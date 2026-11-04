import type { Lang } from "../i18n/text"
import type { PracticeItem } from "./practiceItem"

const cache = new Map<Lang, Promise<readonly PracticeItem[]>>()

/**
 * Each language's documents load as their own chunk on first use, so the
 * 1.4 MB English bank never weighs on the first paint (plan §6 G2).
 */
export function loadBank(lang: Lang): Promise<readonly PracticeItem[]> {
  let pending = cache.get(lang)
  if (!pending) {
    pending =
      lang === "en"
        ? import("./bankEn").then((module) => module.englishItems())
        : import("./bankKo").then((module) => module.koreanItems())
    // A failed load is not cached, so the next visit to the screen retries.
    pending.catch(() => cache.delete(lang))
    cache.set(lang, pending)
  }
  return pending
}
