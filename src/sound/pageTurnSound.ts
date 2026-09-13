import {
  readSoundMuted,
  SOUND_VOLUME,
  subscribeSoundMuted,
} from "./feedbackSound"
import pageTurnSoundAsset from "./nabi-page-turn.mp3?url"

export const PAGE_TURN_SOUND_ASSET = pageTurnSoundAsset

let pageTurnAudio: HTMLAudioElement | null = null
let pageTurnUnlocked = false
let pageTurnPriming: Promise<void> | null = null
let pageTurnRetryAfterPriming = false

subscribeSoundMuted((muted) => {
  if (!pageTurnAudio) return
  pageTurnAudio.muted = muted || pageTurnPriming !== null
  if (muted) {
    pageTurnRetryAfterPriming = false
    pageTurnAudio.pause()
    pageTurnAudio.currentTime = 0
  } else if (!pageTurnUnlocked) {
    if (pageTurnPriming === null) {
      // The sound toggle is itself a user gesture. If muting aborted the first
      // browser unlock attempt, use this later gesture to make the channel
      // retryable instead of leaving Summary turns silent for the whole run.
      playPageTurnAudio(true, true)
    } else {
      pageTurnRetryAfterPriming = true
    }
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

function playPageTurnAudio(unlockOnSuccess: boolean, primeSilently = false) {
  const muted = readSoundMuted()
  if (muted && !unlockOnSuccess) return

  const audio = getPageTurnAudio()
  if (!audio) return

  audio.muted = muted || primeSilently
  audio.currentTime = 0
  try {
    const playback = Promise.resolve(audio.play())
    if (unlockOnSuccess) {
      pageTurnPriming = playback
      void playback.then(
        () => {
          if (pageTurnPriming !== playback) return
          pageTurnPriming = null
          pageTurnRetryAfterPriming = false
          pageTurnUnlocked = true
          if (muted || primeSilently) {
            audio.pause()
            audio.currentTime = 0
          }
          audio.muted = readSoundMuted()
        },
        () => {
          if (pageTurnPriming !== playback) return
          const shouldRetry =
            pageTurnRetryAfterPriming && !readSoundMuted()
          pageTurnPriming = null
          pageTurnRetryAfterPriming = false
          audio.muted = readSoundMuted()
          if (shouldRetry) playPageTurnAudio(true, true)
        },
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
  pageTurnPriming = null
  pageTurnRetryAfterPriming = false
}
