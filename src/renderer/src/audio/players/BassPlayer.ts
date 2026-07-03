import * as Tone from 'tone'
import type { BassTrack } from '../../theory/types'

export class BassPlayer {
  private synth: Tone.MonoSynth | null = null

  async load(output: Tone.Volume): Promise<void> {
    if (this.synth) return
    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 3, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.85, release: 0.3 },
      filterEnvelope: {
        attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3,
        baseFrequency: 150, octaves: 2.5,
      },
      volume: -4,
    }).connect(output)
  }

  schedule(track: BassTrack): void {
    if (!this.synth) return
    const synth = this.synth
    for (const event of track.notes) {
      if (event.note === 'rest') continue
      Tone.getTransport().schedule((time) => {
        synth.triggerAttackRelease(event.note, event.duration, time, event.velocity)
      }, event.time)
    }
  }

  dispose(): void {
    this.synth?.dispose()
    this.synth = null
  }
}
