import * as Tone from 'tone'
import type { DrumTrack } from '../../theory/types'

export class DrumPlayer {
  private kick:  Tone.MembraneSynth | null = null
  private snare: Tone.Player        | null = null
  private hihat: Tone.MetalSynth    | null = null

  load(output: Tone.Volume): void {
    if (this.kick) return

    this.kick = new Tone.MembraneSynth({
      pitchDecay:  0.04,
      octaves:     7,
      volume:      -5,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
    }).connect(output)

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
    this.snare = new Tone.Player({ url: snareBuf, volume: -12, retrigger: true }).connect(output)

    this.hihat = new Tone.MetalSynth({
      volume:          -18,
      envelope:        { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity:     5.1,
      modulationIndex: 32,
      resonance:       4000,
      octaves:         1.5,
    }).connect(output)
  }

  schedule(track: DrumTrack, totalBars: number): void {
    const { kick, snare, hihat } = this
    if (!kick || !snare || !hihat) return

    for (const event of track.notes) {
      Tone.getTransport().schedule((time) => {
        kick.triggerAttackRelease(event.note, event.duration, time, event.velocity)
      }, event.time)
    }

    // スネア: 2・4拍
    for (let bar = 0; bar < totalBars; bar++) {
      Tone.getTransport().schedule((time) => {
        snare!.start(time)
      }, `${bar}:1:0`)
      Tone.getTransport().schedule((time) => {
        snare!.start(time)
      }, `${bar}:3:0`)
    }

    // ハイハット: 8分音符ごと
    for (let bar = 0; bar < totalBars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const onVel = beat % 2 === 0 ? 0.45 : 0.38
        Tone.getTransport().schedule((time) => {
          hihat.triggerAttackRelease('32n', time, onVel)
        }, `${bar}:${beat}:0`)
        Tone.getTransport().schedule((time) => {
          hihat.triggerAttackRelease('32n', time, 0.28)
        }, `${bar}:${beat}:2`)
      }
    }
  }

  dispose(): void {
    this.kick?.dispose()
    this.snare?.dispose()
    this.hihat?.dispose()
    this.kick  = null
    this.snare = null
    this.hihat = null
  }
}
