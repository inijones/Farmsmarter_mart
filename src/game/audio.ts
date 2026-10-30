let ctx: AudioContext | null = null

function context(): AudioContext | null {
  if (ctx) return ctx
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  ctx = new Ctx()
  return ctx
}

export function unlockAudio(): void {
  const audio = context()
  if (audio && audio.state === 'suspended') void audio.resume()
}

export function chime(kind: 'ok' | 'coin' | 'no' | 'stack', pitch = 1): void {
  const audio = context()
  if (!audio) return
  const now = audio.currentTime
  if (kind === 'stack') {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 280 * pitch
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(now)
    osc.stop(now + 0.1)
    return
  }
  const notes = kind === 'coin' ? [660, 880] : kind === 'ok' ? [520, 700] : [196]
  notes.forEach((freq, index) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = kind === 'no' ? 'triangle' : 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 + index * 0.07)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(now + index * 0.07)
    osc.stop(now + 0.2 + index * 0.07)
  })
}
