import * as Tone from 'tone'
import type { MelodyTrack } from '../../theory/types'

export class MelodyPlayer {
  private synth:      Tone.Synth   | null = null
  private vol:        Tone.Volume  | null = null
  private panner:     Tone.Panner  | null = null
  private eq3:        Tone.EQ3     | null = null
  private reverbSend: Tone.Gain    | null = null

  load(output: Tone.ToneAudioNode, reverbBus: Tone.Gain): void {
    if (this.synth) return

    this.eq3        = new Tone.EQ3()
    this.panner     = new Tone.Panner(0)
    this.vol        = new Tone.Volume(-6)
    this.reverbSend = new Tone.Gain(0)

    this.vol.chain(this.panner, this.eq3, output)
    this.eq3.connect(this.reverbSend)
    this.reverbSend.connect(reverbBus)

    this.synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope:   { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.4 },
      volume:     -6,
    }).connect(this.vol)
  }

  schedule(track: MelodyTrack): void {
    const { synth, vol, eq3, panner, reverbSend } = this
    if (!synth || !vol || !eq3 || !panner || !reverbSend) return

    const mix = track.mixConfig
    if (mix) {
      vol.volume.value         = mix.volume
      panner.pan.value         = mix.pan
      eq3.low.value            = mix.eq.low
      eq3.mid.value            = mix.eq.mid
      eq3.high.value           = mix.eq.high
      reverbSend.gain.value    = mix.reverb
    }

    for (const event of track.notes) {
      if (event.note === 'rest') continue
      Tone.getTransport().schedule((time) => {
        synth.triggerAttackRelease(event.note, event.duration, time, event.velocity)
      }, event.time)
    }
  }

  dispose(): void {
    this.synth?.dispose()
    this.vol?.dispose()
    this.panner?.dispose()
    this.eq3?.dispose()
    this.reverbSend?.dispose()
    this.synth = null; this.vol = null; this.panner = null
    this.eq3 = null; this.reverbSend = null
  }
}
