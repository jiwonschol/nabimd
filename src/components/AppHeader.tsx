import type { MouseEvent, ReactNode } from "react"
import { navigate, routeHref } from "../app/routes"
import { useText } from "../i18n/useText"

/** Same layout as the hub's nav: logo on the left, tools at the far right. */
export function AppHeader({ tools }: { tools?: ReactNode }) {
  const { lang, setLang, t } = useText()
  const base = import.meta.env.BASE_URL

  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    navigate({ name: "home" })
  }

  return (
    <header className="rd-header">
      <a
        aria-label={t("header.home")}
        className="rd-logo"
        href={routeHref({ name: "home" }, base)}
        onClick={goHome}
      >
        <img alt="" height="28" src={`${base}brand/bfly-favicon.png`} width="28" />
        <span>Nabi Markdown</span>
      </a>
      <div className="rd-tools">
        {tools}
        {/* 알약 모양은 언어 토글 하나뿐이다(intend.md). */}
        <button
          aria-label={t("lang.toggleLabel")}
          className="rd-lang"
          data-testid="lang-toggle"
          lang={lang === "ko" ? "en" : "ko"}
          onClick={() => setLang(lang === "ko" ? "en" : "ko")}
          type="button"
        >
          {t("lang.toggle")}
        </button>
      </div>
    </header>
  )
}
