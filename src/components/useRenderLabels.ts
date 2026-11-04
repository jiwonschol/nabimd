import { useMemo } from "react"
import { useText } from "../i18n/useText"
import type { RenderLabels } from "./RenderedDocument"

export function useRenderLabels(): RenderLabels {
  const { t } = useText()
  return useMemo(
    () => ({
      image: (alt: string) =>
        t("render.image", { alt: alt || t("render.imageFallback") }),
      task: (checked: boolean) =>
        checked ? t("render.taskDone") : t("render.taskOpen"),
    }),
    [t],
  )
}
