import { readSoundMuted, SOUND_VOLUME } from "./feedbackSound"
import pageTurnSoundAsset from "./nabi-page-turn.mp3?url"

export const PAGE_TURN_SOUND_ASSET = pageTurnSoundAsset

let pageTurnAudio: HTMLAudioElement | null = null

function getPageTurnAudio(): HTMLAudioElement | null {
  if (pageTurnAudio) return pageTurnAudio
  if (typeof Audio === "undefined") return null

  pageTurnAudio = new Audio(PAGE_TURN_SOUND_ASSET)
  pageTurnAudio.preload = "auto"
  pageTurnAudio.volume = SOUND_VOLUME
  return pageTurnAudio
}

export function playPageTurnSound() {
  if (readSoundMuted()) return

  const audio = getPageTurnAudio()
  if (!audio) return

  audio.currentTime = 0
  try {
    void Promise.resolve(audio.play()).catch(() => {})
  } catch {
    // Navigation must not fail when a browser rejects optional audio.
  }
}

export function __resetPageTurnSoundForTesting() {
  pageTurnAudio = null
}
