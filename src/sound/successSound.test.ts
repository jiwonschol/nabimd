import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

class FakeAudio {
  currentTime = 0
  muted = false
  pause = vi.fn()
  play = vi.fn(() => Promise.resolve())

  constructor(readonly src: string) {}
}

function createDeferredPlayback() {
  let reject: (reason?: unknown) => void = () => {}
  let resolve: () => void = () => {}
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

async function flushPlayback() {
  await Promise.resolve()
  await Promise.resolve()
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

  afterEach(async () => {
    const { __resetSuccessSoundForTesting } = await import("./successSound")
    __resetSuccessSoundForTesting(false)
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
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(audio.muted).toBe(false)
  })

  it("unlocks sound from the first pointer gesture", async () => {
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playSuccessSound()
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it("plays once after sound has been unlocked", async () => {
    const { playSuccessSound, unlockSuccessSound } = await import(
      "./successSound"
    )

    unlockSuccessSound()
    await flushPlayback()
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)
    expect(audio.muted).toBe(false)
  })

  it("suppresses playback when muted", async () => {
    const { playSuccessSound, setSoundMuted, unlockSuccessSound } =
      await import("./successSound")

    unlockSuccessSound()
    await flushPlayback()
    setSoundMuted(true)
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem("nabimd.sound-muted")).toBe("true")
  })

  it("immediately silences and resets cached audio when muted", async () => {
    const { playSuccessSound, setSoundMuted, unlockSuccessSound } =
      await import("./successSound")

    unlockSuccessSound()
    await flushPlayback()
    playSuccessSound()
    audio.currentTime = 0.25

    setSoundMuted(true)

    expect(audio.muted).toBe(true)
    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.currentTime).toBe(0)

    setSoundMuted(false)

    expect(audio.muted).toBe(false)
  })

  it("retries priming on a later gesture after the first attempt is rejected", async () => {
    const firstPriming = createDeferredPlayback()
    audio.play
      .mockReturnValueOnce(firstPriming.promise)
      .mockReturnValueOnce(Promise.resolve())
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    firstPriming.reject(new Error("blocked"))
    await flushPlayback()

    document.dispatchEvent(new Event("keydown", { bubbles: true }))
    await flushPlayback()
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(3)
  })

  it("clears a queued verdict when priming is rejected", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playSuccessSound()
    priming.reject(new Error("blocked"))
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(1)
  })

  it("does not play a verdict before asynchronous priming succeeds", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(audio.pause).not.toHaveBeenCalled()

    priming.resolve()
    await flushPlayback()
  })

  it("does not start concurrent priming from another gesture", async () => {
    const priming = createDeferredPlayback()
    audio.play.mockReturnValueOnce(priming.promise)
    await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    document.dispatchEvent(new Event("keydown", { bubbles: true }))

    expect(audio.play).toHaveBeenCalledTimes(1)

    priming.resolve()
    await flushPlayback()
  })

  it("plays one pending matched verdict after priming succeeds", async () => {
    const priming = createDeferredPlayback()
    audio.play
      .mockReturnValueOnce(priming.promise)
      .mockReturnValueOnce(Promise.resolve())
    const { playSuccessSound } = await import("./successSound")

    document.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    playSuccessSound()

    expect(audio.play).toHaveBeenCalledTimes(1)

    priming.resolve()
    await flushPlayback()

    expect(audio.play).toHaveBeenCalledTimes(2)
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
    await flushPlayback()

    expect(() => playSuccessSound()).not.toThrow()
  })
})
