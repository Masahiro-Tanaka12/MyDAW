import * as Tone from 'tone'
import type { ChordTrack } from '../../theory/types'
import { parseChordSymbol, chordSymbolToNotes } from '../../theory/chordTheory'

const STRUM_OFFSET = 0.018
const BASE_VOLUME  = -8  // dB（シンセ固有の基準音量）

// コードシンボル文字列 → Tone.js ノート配列（オクターブ 3 起点）
function resolve(symbol: string): string[] {
  const { root, quality } = parseChordSymbol(symbol)
  return chordSymbolToNotes(root, quality, 3)
}

export class ChordPlayer {
  private synth:      Tone.PolySynth | null = null
  private panner:     Tone.Panner    | null = null
  private eq3:        Tone.EQ3       | null = null
  private reverbSend: Tone.Gain      | null = null

  async load(output: Tone.ToneAudioNode, reverbBus: Tone.Gain): Promise<void> {
    if (this.synth) return

    this.eq3        = new Tone.EQ3()
    this.panner     = new Tone.Panner(0)
    this.reverbSend = new Tone.Gain(0)

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.3, release: 2.0 },
      volume: BASE_VOLUME,
    })

    // ドライ: synth → panner → eq3 → output
    this.synth.chain(this.panner, this.eq3, output)
    // リバーブセンド: eq3 → reverbSend → reverbBus
    this.eq3.connect(this.reverbSend)
    this.reverbSend.connect(reverbBus)
  }

  schedule(track: ChordTrack): void {
    if (!this.synth || !this.eq3 || !this.panner || !this.reverbSend) return

    const mix = track.mixConfig
    if (mix) {
      this.synth.volume.value      = BASE_VOLUME + mix.volume
      this.panner.pan.value        = mix.pan
      this.eq3.low.value           = mix.eq.low
      this.eq3.mid.value           = mix.eq.mid
      this.eq3.high.value          = mix.eq.high
      this.reverbSend.gain.value   = mix.reverb
    }

    const { chords, bars } = track.progression
    const barsPerChord = bars / chords.length

    chords.forEach((chord, i) => {
      const notes = resolve(chord)
      Tone.getTransport().schedule((time) => {
        notes.forEach((note, ni) => {
          this.synth!.triggerAttackRelease(note, `${barsPerChord}m`, time + ni * STRUM_OFFSET)
        })
      }, `${i * barsPerChord}m`)
    })
  }

  dispose(): void {
    this.synth?.dispose()
    this.eq3?.dispose()
    this.panner?.dispose()
    this.reverbSend?.dispose()
    this.synth = null; this.eq3 = null; this.panner = null; this.reverbSend = null
  }
}
