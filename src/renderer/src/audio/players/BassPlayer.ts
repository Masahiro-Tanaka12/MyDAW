import * as Tone from 'tone'
import type { BassTrack } from '../../theory/types'

const BASE_VOLUME = -4  // dB（シンセ固有の基準音量）

export class BassPlayer {
  private synth:      Tone.MonoSynth | null = null
  private panner:     Tone.Panner    | null = null
  private eq3:        Tone.EQ3       | null = null
  private reverbSend: Tone.Gain      | null = null

  async load(output: Tone.ToneAudioNode, reverbBus: Tone.Gain): Promise<void> {
    if (this.synth) return

    this.eq3        = new Tone.EQ3()
    this.panner     = new Tone.Panner(0)
    this.reverbSend = new Tone.Gain(0)

    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: { Q: 3, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.85, release: 0.3 },
      filterEnvelope: {
        attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.3,
        baseFrequency: 150, octaves: 2.5,
      },
      volume: BASE_VOLUME,
    })

    this.synth.chain(this.panner, this.eq3, output)
    this.eq3.connect(this.reverbSend)
    this.reverbSend.connect(reverbBus)
  }

  schedule(track: BassTrack): void {
    if (!this.synth || !this.eq3 || !this.panner || !this.reverbSend) return

    const mix = track.mixConfig
    if (mix) {
      this.synth.volume.value    = BASE_VOLUME + mix.volume
      this.panner.pan.value      = mix.pan
      this.eq3.low.value         = mix.eq.low
      this.eq3.mid.value         = mix.eq.mid
      this.eq3.high.value        = mix.eq.high
      this.reverbSend.gain.value = mix.reverb
    }

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
    this.eq3?.dispose()
    this.panner?.dispose()
    this.reverbSend?.dispose()
    this.synth = null; this.eq3 = null; this.panner = null; this.reverbSend = null
  }
}
