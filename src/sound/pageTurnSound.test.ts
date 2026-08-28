import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  muted = false
  preload = ""
  volume = 1
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())
}

describe("pageTurnSound", () => {
  let audio: FakeAudio

  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
    audio = new FakeAudio()
    vi.stubGlobal(
      "Audio",
      class {
        constructor() {
          return audio
        }
      },
    )
  })

  afterEach(async () => {
    const { __resetPageTurnSoundForTesting } = await import(
      "./pageTurnSound"
    )
    __resetPageTurnSoundForTesting()
    vi.unstubAllGlobals()
  })

  it("plays the real page-turn asset on an independent audio channel", async () => {
    const {
      PAGE_TURN_SOUND_ASSET,
      playPageTurnSound,
      unlockAndPlayPageTurnSound,
    } = await import("./pageTurnSound")
    const { SOUND_VOLUME } = await import("./feedbackSound")

    unlockAndPlayPageTurnSound()
    await Promise.resolve()
    playPageTurnSound()

    expect(PAGE_TURN_SOUND_ASSET).toContain("nabi-page-turn.mp3")
    expect(audio.preload).toBe("auto")
    expect(audio.currentTime).toBe(0)
    expect(audio.volume).toBe(SOUND_VOLUME)
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("does not attempt timer-driven playback before a gesture unlock", async () => {
    const { playPageTurnSound } = await import("./pageTurnSound")

    playPageTurnSound()

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("shares the existing feedback-sound mute preference", async () => {
    window.localStorage.setItem("nabimd.sound-muted", "true")
    const { unlockAndPlayPageTurnSound } = await import("./pageTurnSound")

    unlockAndPlayPageTurnSound()

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("swallows browser playback rejection", async () => {
    audio.play.mockImplementationOnce(() => Promise.reject(new Error("blocked")))
    const { unlockAndPlayPageTurnSound } = await import("./pageTurnSound")

    expect(() => unlockAndPlayPageTurnSound()).not.toThrow()
    await Promise.resolve()
  })
})
