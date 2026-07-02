import * as Tone from 'tone'
import type { DrumTrack } from '../../theory/types'

export class DrumPlayer {
  private kick: Tone.MembraneSynth | null = null

  schedule(track: DrumTrack, output: Tone.Volume): void {
    this.kick = new Tone.MembraneSynth({
      pitchDecay:  0.04,
      octaves:     7,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -5,
    })
    this.kick.connect(output)

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
