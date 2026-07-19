export const FEEDBACK_SOUND_ASSETS = {
  matched: "/audio/matched.mp3",
  retry: "/audio/try-again.mp3",
  summary: "/audio/summary.mp3",
} as const

export type FeedbackSoundCue = keyof typeof FEEDBACK_SOUND_ASSETS

const SOUND_MUTED_KEY = "nabimd.sound-muted"

let audio: HTMLAudioElement | null = null
let activeCue: FeedbackSoundCue = "matched"
let unlocked = false
let priming: Promise<void> | null = null
let pendingCue: FeedbackSoundCue | null = null
let soundMuted: boolean | undefined
const muteListeners = new Set<(muted: boolean) => void>()

let removeGestureUnlockListeners = () => {}

function readStoredSoundMuted(): boolean {
  try {
    return window.localStorage.getItem(SOUND_MUTED_KEY) === "true"
  } catch {
    return false
  }
}

function getAudio(): HTMLAudioElement | null {
  if (audio) return audio
  if (typeof Audio === "undefined") return null
  audio = new Audio(FEEDBACK_SOUND_ASSETS[activeCue])
  audio.preload = "auto"
  return audio
}

function swallowPlaybackRejection(playback: Promise<void> | undefined) {
  void playback?.catch(() => {})
}

export function readSoundMuted(): boolean {
  soundMuted ??= readStoredSoundMuted()
  return soundMuted
}

export function setSoundMuted(muted: boolean) {
  soundMuted = muted
  if (audio) {
    audio.muted = muted || priming !== null
    if (muted) {
      audio.pause()
      audio.currentTime = 0
    }
  }
  try {
    window.localStorage.setItem(SOUND_MUTED_KEY, String(muted))
  } catch {
    // Sound preferences are optional when browser storage is unavailable.
  }
  muteListeners.forEach((listener) => listener(muted))
}

export function subscribeSoundMuted(listener: (muted: boolean) => void) {
  muteListeners.add(listener)
  return () => {
    muteListeners.delete(listener)
  }
}

export function unlockFeedbackSound() {
  if (unlocked || priming) return

  const sound = getAudio()
  if (!sound) return

  sound.muted = true
  let playback: Promise<void>
  try {
    playback = Promise.resolve(sound.play())
  } catch {
    sound.muted = readSoundMuted()
    return
  }

  priming = playback
  void playback.then(
    () => {
      if (priming !== playback) return

      priming = null
      unlocked = true
      removeGestureUnlockListeners()
      sound.pause()
      sound.currentTime = 0
      sound.muted = readSoundMuted()

      const cue = pendingCue
      pendingCue = null
      if (cue) playFeedbackSound(cue)
    },
    () => {
      if (priming !== playback) return

      priming = null
      pendingCue = null
      sound.muted = readSoundMuted()
    },
  )
}

export function playFeedbackSound(cue: FeedbackSoundCue) {
  if (!unlocked) {
    if (priming) pendingCue = cue
    return
  }
  if (readSoundMuted()) return

  const sound = getAudio()
  if (!sound) return

  if (activeCue !== cue) {
    sound.pause()
    sound.src = FEEDBACK_SOUND_ASSETS[cue]
    activeCue = cue
  }
  sound.muted = false
  sound.currentTime = 0
  swallowPlaybackRejection(sound.play())
}

function installGestureUnlockListeners() {
  if (typeof document === "undefined") return

  const unlockFromGesture = () => unlockFeedbackSound()
  removeGestureUnlockListeners = () => {
    document.removeEventListener("pointerdown", unlockFromGesture, true)
    document.removeEventListener("keydown", unlockFromGesture, true)
  }
  document.addEventListener("pointerdown", unlockFromGesture, {
    capture: true,
  })
  document.addEventListener("keydown", unlockFromGesture, {
    capture: true,
  })
}

export function __resetFeedbackSoundForTesting(
  reinstallGestureListeners = true,
) {
  removeGestureUnlockListeners()
  if (audio) {
    audio.pause()
    audio.currentTime = 0
  }
  audio = null
  activeCue = "matched"
  unlocked = false
  priming = null
  pendingCue = null
  soundMuted = undefined
  muteListeners.clear()
  removeGestureUnlockListeners = () => {}
  if (reinstallGestureListeners) installGestureUnlockListeners()
}

installGestureUnlockListeners()
