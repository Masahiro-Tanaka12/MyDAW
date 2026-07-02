import * as Tone from 'tone'
import type { BassTrack } from '../../theory/types'

export class BassPlayer {
  private synth: Tone.Synth | null = null

  schedule(track: BassTrack, output: Tone.Volume): void {
    this.synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 },
      volume: -8,
    })
    this.synth.connect(output)

    const synth = this.synth
    for (const event of track.notes) {
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
