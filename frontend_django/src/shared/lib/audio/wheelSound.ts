export type WheelSoundOptions = {
  src: string
  volume?: number // 0..1
  enabled?: boolean
}

export type WheelSound = {
  play: () => void
  setVolume: (v: number) => void
  setEnabled: (b: boolean) => void
  dispose: () => void
}

export function createWheelSound(opts: WheelSoundOptions): WheelSound {
  const volume = clamp01(opts.volume ?? 0.02)
  let enabled = opts.enabled ?? true

  // Fallback element
  const el = typeof window !== 'undefined' ? new Audio(opts.src) : (null as HTMLAudioElement | null)
  if (el) {
    el.preload = 'auto'
    el.volume = volume
  }

  // WebAudio
  let ctx: AudioContext | null = null
  let gain: GainNode | null = null
  let buffer: AudioBuffer | null = null

  try {
    const Ctx = (typeof window !== 'undefined' && ((window as any)?.AudioContext || (window as any)?.webkitAudioContext)) as
      | (new () => AudioContext)
      | undefined
    if (Ctx) {
      const localCtx = new Ctx()
      ctx = localCtx
      gain = localCtx.createGain()
      gain.gain.setValueAtTime(volume, localCtx.currentTime)
      gain.connect(localCtx.destination)
      fetch(opts.src)
        .then((r) => r.arrayBuffer())
        .then((buf) => (ctx ? ctx.decodeAudioData(buf) : Promise.reject(new Error('no-audio-context'))))
        .then((decoded) => {
          buffer = decoded
        })
        .catch(() => {
          // fallback to element
        })
    }
  } catch {
    // ignore
  }

  const play = () => {
    if (!enabled) return
    if (ctx && gain && buffer) {
      try {
        if (ctx.state === 'suspended') void ctx.resume()
        gain.gain.setTargetAtTime(currentVolume, ctx.currentTime, 0.005)
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.connect(gain)
        src.start(0)
        return
      } catch {
        // fall through
      }
    }
    if (el) {
      el.volume = currentVolume
      el.currentTime = 0
      void el.play()
    }
  }

  let currentVolume = volume
  const setVolume = (v: number) => {
    currentVolume = clamp01(v)
    if (gain && ctx) gain.gain.setValueAtTime(currentVolume, ctx.currentTime)
    if (el) el.volume = currentVolume
  }

  const setEnabled = (b: boolean) => {
    enabled = !!b
  }

  const dispose = () => {
    try {
      if (el) {
        el.pause()
        // prevent further network
        // @ts-ignore
        el.src = ''
      }
      gain?.disconnect()
    } catch {}
  }

  return { play, setVolume, setEnabled, dispose }
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0
  return Math.min(1, Math.max(0, n))
}
