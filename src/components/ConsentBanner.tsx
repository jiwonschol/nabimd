import { useEffect, useId, useState } from "react"
import {
  analyticsLoaded,
  loadAnalytics,
  readConsent,
  storeConsent,
} from "../consent/consent"
import { useText } from "../i18n/useText"

/**
 * The hub's cookie window as a React component (plan §4.6): necessary only,
 * accept all, or choose items. Closing without a choice on the first visit
 * stores "necessary only".
 */
export function ConsentBanner({ onClose }: { onClose: () => void }) {
  const { t } = useText()
  const titleId = useId()
  const bodyId = useId()
  const [choosing, setChoosing] = useState(false)
  const [analytics, setAnalytics] = useState(
    () => readConsent()?.analytics === true,
  )

  const choose = (allow: boolean) => {
    storeConsent(allow)
    if (allow) {
      loadAnalytics()
    } else if (analyticsLoaded()) {
      // A running beacon cannot be unloaded and keeps counting address
      // changes, so withdrawing consent reloads the page without it.
      window.location.reload()
      return
    }
    onClose()
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (!readConsent()) storeConsent(false)
      onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <section
      aria-describedby={bodyId}
      aria-labelledby={titleId}
      className="rd-consent"
      data-testid="consent"
      role="dialog"
    >
      <h2 className="rd-consent__title" id={titleId}>
        {t("consent.title")}
      </h2>
      <p className="rd-consent__body" id={bodyId}>
        {t("consent.body")}
      </p>
      {choosing ? (
        <div className="rd-consent__items">
          <label className="rd-consent__item">
            <input checked disabled type="checkbox" />
            <span>
              <strong>{t("consent.need")}</strong>
              <span>{t("consent.needNote")}</span>
            </span>
          </label>
          <label className="rd-consent__item">
            <input
              checked={analytics}
              data-testid="consent-stats"
              onChange={(event) => setAnalytics(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>{t("consent.stats")}</strong>
              <span>{t("consent.statsNote")}</span>
            </span>
          </label>
        </div>
      ) : null}
      <div className="rd-consent__actions">
        {choosing ? (
          <button
            className="rd-btn rd-btn--ghost"
            data-testid="consent-save"
            onClick={() => choose(analytics)}
            type="button"
          >
            {t("consent.save")}
          </button>
        ) : (
          <button
            aria-expanded={false}
            className="rd-btn rd-btn--ghost"
            onClick={() => setChoosing(true)}
            type="button"
          >
            {t("consent.choose")}
          </button>
        )}
        <button
          className="rd-btn rd-btn--ghost"
          data-testid="consent-reject"
          onClick={() => choose(false)}
          type="button"
        >
          {t("consent.reject")}
        </button>
        <button
          className="rd-btn rd-btn--primary"
          data-testid="consent-accept"
          onClick={() => choose(true)}
          type="button"
        >
          {t("consent.accept")}
        </button>
      </div>
    </section>
  )
}
