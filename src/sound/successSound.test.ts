import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  muted = false
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())

  constructor(readonly src: string) {}
}

describe("successSound", () => {
  let audio: FakeAudio

  beforeEach(() => {
    vi.resetModules()
    audio = new FakeAudio("")
    vi.stubGlobal(
      "Audio",
      class {
        constructor() {
          return audio
        }
      },
    )
  })

  afterEach(() => {
    document.dispatchEvent(new Event("pointerdown"))
    vi.unstubAllGlobals()
  })

  it("ignores playback before a user gesture unlocks sound", async () => {
    const { playSuccessSound } = await import("./successSound")

    playSuccessSound()

    expect(audio.play).not.toHaveBeenCalled()
  })

  it("primes the audio silently when sound is unlocked", async () => {
    const { unlockSuccessSound } = await import("./successSound")

    unlockSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(audio.muted).toBe(false)
  })

  it("unlocks sound from the first pointer gesture", async () => {
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("plays once after sound has been unlocked", async () => {
    const { playSuccessSound, unlockSuccessSound } = await import(
      "./successSound"
    )

    unlockSuccessSound()
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)
    expect(audio.muted).toBe(false)
  })

  it("suppresses playback when muted", async () => {
    const { playSuccessSound, setSoundMuted, unlockSuccessSound } =
      await import("./successSound")

    unlockSuccessSound()
    setSoundMuted(true)
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem("nabimd.sound-muted")).toBe("true")
  })

  it("restores the stored mute preference", async () => {
    window.localStorage.setItem("nabimd.sound-muted", "true")

    const { readSoundMuted } = await import("./successSound")

    expect(readSoundMuted()).toBe(true)
  })

  it("swallows a browser playback rejection", async () => {
    audio.play.mockReturnValueOnce(Promise.reject(new Error("blocked")))
    const { playSuccessSound, unlockSuccessSound } = await import(
      "./successSound"
    )

    unlockSuccessSound()

    expect(() => playSuccessSound()).not.toThrow()
  })
})
