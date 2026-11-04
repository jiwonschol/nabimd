import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  type Lang,
  readBrowserLang,
  storeLang,
  type Translate,
  translator,
} from "./text"

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translate
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function setMeta(selector: string, content: string) {
  document.head.querySelector(selector)?.setAttribute("content", content)
}

/**
 * Owns the screen language. A change is saved to the hub-wide key and moves
 * `<html lang>`, the title and the description meta with it (plan §4.4).
 */
export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode
  initialLang?: Lang
}) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? readBrowserLang())
  const t = useMemo(() => translator(lang), [lang])

  const setLang = useCallback((next: Lang) => {
    storeLang(next)
    setLangState(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t("meta.title")
    setMeta('meta[name="description"]', t("meta.description"))
    setMeta('meta[property="og:title"]', t("meta.title"))
    setMeta('meta[property="og:description"]', t("meta.description"))
  }, [lang, t])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useText(): LanguageContextValue {
  const value = useContext(LanguageContext)
  if (!value) throw new Error("useText must be used inside LanguageProvider")
  return value
}
