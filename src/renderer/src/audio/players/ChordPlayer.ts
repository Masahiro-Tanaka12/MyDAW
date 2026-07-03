import * as Tone from 'tone'
import type { ChordTrack } from '../../theory/types'

const STRUM_OFFSET = 0.018

const CHORD_NOTES: Record<string, string[]> = {
  'C':  ['C3', 'E3', 'G3', 'C4'],
  'Cm': ['C3', 'Eb3', 'G3'],
  'D':  ['D3', 'A3', 'D4'],
  'Dm': ['D3', 'A3', 'D4', 'F4'],
  'E':  ['E2', 'B2', 'E3', 'G#3'],
  'Em': ['E2', 'B2', 'E3', 'G3'],
  'F':  ['F3', 'A3', 'C4', 'F4'],
  'Fm': ['F3', 'Ab3', 'C4'],
  'G':  ['G3', 'B3', 'D4', 'G4'],
  'Gm': ['G3', 'Bb3', 'D4'],
  'A':  ['A2', 'E3', 'A3', 'C#4'],
  'Am': ['A2', 'E3', 'A3', 'C4'],
  'B':  ['B2', 'F#3', 'B3', 'D#4'],
  'Bm': ['B2', 'F#3', 'B3', 'D4'],
}

function resolve(chord: string): string[] {
  return CHORD_NOTES[chord] ?? ['C3', 'E3', 'G3']
}

export class ChordPlayer {
  private synth: Tone.PolySynth | null = null

  async load(output: Tone.Volume): Promise<void> {
    if (this.synth) return
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.3, release: 2.0 },
      volume: -8,
    }).connect(output)
  }

  schedule(track: ChordTrack): void {
    if (!this.synth) return
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
    this.synth = null
  }
}
