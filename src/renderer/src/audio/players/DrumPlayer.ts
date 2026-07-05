import * as Tone from 'tone'
import type { DrumTrack } from '../../theory/types'

export class DrumPlayer {
  private kick:       Tone.MembraneSynth | null = null
  private snare:      Tone.Player        | null = null
  private hihat:      Tone.MetalSynth    | null = null
  private drumVol:    Tone.Volume        | null = null
  private panner:     Tone.Panner        | null = null
  private eq3:        Tone.EQ3           | null = null
  private reverbSend: Tone.Gain          | null = null

  load(output: Tone.ToneAudioNode, reverbBus: Tone.Gain): void {
    if (this.kick) return

    this.eq3        = new Tone.EQ3()
    this.panner     = new Tone.Panner(0)
    this.drumVol    = new Tone.Volume(0)
    this.reverbSend = new Tone.Gain(0)

    // ドライチェーン: kick/snare/hihat → drumVol → panner → eq3 → output
    this.drumVol.chain(this.panner, this.eq3, output)
    // リバーブセンド
    this.eq3.connect(this.reverbSend)
    this.reverbSend.connect(reverbBus)

    this.kick = new Tone.MembraneSynth({
      pitchDecay:  0.04,
      octaves:     7,
      volume:      -5,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
    }).connect(this.drumVol)

    // Tone.NoiseSynth は内部で Tone.Noise (AudioWorklet / blob: URL) を使うため
    // Electron のレンダラープロセスがクラッシュする。
    // 代わりにノイズ AudioBuffer を手動生成し Tone.Player で再生する。
    const rawCtx = Tone.getContext().rawContext as AudioContext
    const sr     = rawCtx.sampleRate
    const len    = Math.floor(sr * 0.25)
    const ab     = rawCtx.createBuffer(1, len, sr)
    const data   = ab.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.035))
    }
    const snareBuf = new Tone.ToneAudioBuffer()
    snareBuf.set(ab)
    this.snare = new Tone.Player({ url: snareBuf, volume: -12, retrigger: true }).connect(this.drumVol)

    this.hihat = new Tone.MetalSynth({
      volume:          -18,
      envelope:        { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity:     5.1,
      modulationIndex: 32,
      resonance:       4000,
      octaves:         1.5,
    }).connect(this.drumVol)
  }

  schedule(track: DrumTrack): void {
    const { kick, snare, hihat, drumVol, eq3, panner, reverbSend } = this
    if (!kick || !snare || !hihat || !drumVol || !eq3 || !panner || !reverbSend) return

    const mix = track.mixConfig
    if (mix) {
      drumVol.volume.value   = mix.volume
      panner.pan.value       = mix.pan
      eq3.low.value          = mix.eq.low
      eq3.mid.value          = mix.eq.mid
      eq3.high.value         = mix.eq.high
      reverbSend.gain.value  = mix.reverb
    }

    for (const event of track.kickNotes) {
      Tone.getTransport().schedule((time) => {
        kick.triggerAttackRelease(event.note, event.duration, time, event.velocity)
      }, event.time)
    }

    for (const event of track.snareNotes) {
      Tone.getTransport().schedule((time) => { snare!.start(time) }, event.time)
    }

    for (const event of track.hihatNotes) {
      const vel = event.velocity
      Tone.getTransport().schedule((time) => {
        hihat.triggerAttackRelease(event.duration, time, vel)
      }, event.time)
    }
  }

  dispose(): void {
    this.kick?.dispose()
    this.snare?.dispose()
    this.hihat?.dispose()
    this.drumVol?.dispose()
    this.eq3?.dispose()
    this.panner?.dispose()
    this.reverbSend?.dispose()
    this.kick = null; this.snare = null; this.hihat = null
    this.drumVol = null; this.eq3 = null; this.panner = null; this.reverbSend = null
  }
}
