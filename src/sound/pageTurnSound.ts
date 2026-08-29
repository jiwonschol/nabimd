import {
  readSoundMuted,
  SOUND_VOLUME,
  subscribeSoundMuted,
} from "./feedbackSound"
import pageTurnSoundAsset from "./nabi-page-turn.mp3?url"

export const PAGE_TURN_SOUND_ASSET = pageTurnSoundAsset

let pageTurnAudio: HTMLAudioElement | null = null
let pageTurnUnlocked = false

subscribeSoundMuted((muted) => {
  if (!pageTurnAudio) return
  pageTurnAudio.muted = muted
  if (muted) {
    pageTurnAudio.pause()
    pageTurnAudio.currentTime = 0
  }
})

function getPageTurnAudio(): HTMLAudioElement | null {
  if (pageTurnAudio) return pageTurnAudio
  if (typeof Audio === "undefined") return null

  pageTurnAudio = new Audio(PAGE_TURN_SOUND_ASSET)
  pageTurnAudio.preload = "auto"
  pageTurnAudio.volume = SOUND_VOLUME
  return pageTurnAudio
}

function playPageTurnAudio(unlockOnSuccess: boolean) {
  const muted = readSoundMuted()
  if (muted && !unlockOnSuccess) return

  const audio = getPageTurnAudio()
  if (!audio) return

  audio.muted = muted
  audio.currentTime = 0
  try {
    const playback = Promise.resolve(audio.play())
    if (unlockOnSuccess) {
      void playback.then(
        () => {
          pageTurnUnlocked = true
          if (muted) {
            audio.pause()
            audio.currentTime = 0
            audio.muted = readSoundMuted()
          }
        },
        () => {},
      )
    } else {
      void playback.catch(() => {})
    }
  } catch {
    // Navigation must not fail when a browser rejects optional audio.
  }
}

// Chapter selection runs inside a user gesture, so this call both voices the
// first page turn and unlocks the same audio element for the timer-driven
// Summary turn later in the session.
export function unlockAndPlayPageTurnSound() {
  playPageTurnAudio(true)
}

// A restored Matched session can complete without any gesture in this page.
// Browsers cannot legally unlock audible playback there, so fail silent
// without making a play() call that Safari will reject.
export function playPageTurnSound() {
  if (!pageTurnUnlocked) return
  playPageTurnAudio(false)
}

export function __resetPageTurnSoundForTesting() {
  pageTurnAudio = null
  pageTurnUnlocked = false
}
