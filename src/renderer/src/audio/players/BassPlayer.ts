import * as Tone from 'tone'
import type { BassTrack } from '../../theory/types'

export class BassPlayer {
  private synth: Tone.Synth | null = null

  schedule(track: BassTrack): void {
    this.synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.5, release: 0.8 },
      volume: -4,
    }).toDestination()

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
