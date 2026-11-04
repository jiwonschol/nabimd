import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react"
import { useText } from "../i18n/useText"
import {
  readSoundMuted,
  setSoundMuted,
  subscribeSoundMuted,
} from "../sound/feedbackSound"

export function SoundToggle() {
  const { t } = useText()
  const muted = useSyncExternalStore(subscribeSoundMuted, readSoundMuted, () => false)
  return (
    <button
      aria-label={t("sound.label")}
      aria-pressed={!muted}
      className="rd-tool"
      data-testid="sound-toggle"
      onClick={() => setSoundMuted(!muted)}
      type="button"
    >
      {muted ? t("sound.off") : t("sound.on")}
    </button>
  )
}

/**
 * Settings holds one thing: clearing progress, behind one confirmation
 * (plan §4.5). The map empties as soon as it is confirmed.
 */
export function SettingsMenu({ onClearProgress }: { onClearProgress: () => void }) {
  const { t } = useText()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = (returnFocus: boolean) => {
    setOpen(false)
    setConfirming(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true)
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open])

  return (
    <div className="rd-settings" ref={rootRef}>
      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        className="rd-tool"
        data-testid="settings"
        onClick={() => {
          setCleared(false)
          if (open) close(false)
          else setOpen(true)
        }}
        ref={buttonRef}
        type="button"
      >
        {t("settings.open")}
      </button>
      {open ? (
        <div className="rd-settings__panel" id={panelId}>
          {cleared ? (
            <p aria-live="polite" className="rd-settings__note">
              {t("settings.cleared")}
            </p>
          ) : confirming ? (
            <>
              <p className="rd-settings__note">{t("settings.clearConfirm")}</p>
              <div className="rd-settings__row">
                <button
                  className="rd-btn rd-btn--primary"
                  data-testid="clear-progress-confirm"
                  onClick={() => {
                    onClearProgress()
                    setConfirming(false)
                    setCleared(true)
                  }}
                  type="button"
                >
                  {t("settings.clearYes")}
                </button>
                <button
                  className="rd-btn rd-btn--ghost"
                  onClick={() => setConfirming(false)}
                  type="button"
                >
                  {t("settings.clearNo")}
                </button>
              </div>
            </>
          ) : (
            <button
              className="rd-btn rd-btn--ghost"
              data-testid="clear-progress"
              onClick={() => setConfirming(true)}
              type="button"
            >
              {t("settings.clear")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
