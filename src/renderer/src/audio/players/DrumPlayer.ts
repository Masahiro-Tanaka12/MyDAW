import * as Tone from 'tone'
import type { DrumTrack } from '../../theory/types'

export class DrumPlayer {
  private kick: Tone.MembraneSynth | null = null

  schedule(track: DrumTrack): void {
    this.kick = new Tone.MembraneSynth({
      pitchDecay:  0.05,
      octaves:     8,
      envelope: { attack: 0.001, decay: 0.35, sustain: 0, release: 0.1 },
      volume: -2,
    }).toDestination()

    const kick = this.kick

    for (const event of track.notes) {
      Tone.getTransport().schedule((time) => {
        kick.triggerAttackRelease(event.note, event.duration, time, event.velocity)
      }, event.time)
    }
  }

  dispose(): void {
    this.kick?.dispose()
    this.kick = null
  }
}
