import * as Tone from 'tone'
import type { ChordTrack } from '../../theory/types'

const CHORD_NOTES: Record<string, string[]> = {
  'C':   ['C3', 'E3', 'G3'],
  'Cm':  ['C3', 'Eb3', 'G3'],
  'D':   ['D3', 'F#3', 'A3'],
  'Dm':  ['D3', 'F3', 'A3'],
  'E':   ['E3', 'G#3', 'B3'],
  'Em':  ['E3', 'G3', 'B3'],
  'F':   ['F3', 'A3', 'C4'],
  'Fm':  ['F3', 'Ab3', 'C4'],
  'G':   ['G3', 'B3', 'D4'],
  'Gm':  ['G3', 'Bb3', 'D4'],
  'A':   ['A3', 'C#4', 'E4'],
  'Am':  ['A3', 'C4', 'E4'],
  'B':   ['B3', 'D#4', 'F#4'],
  'Bm':  ['B3', 'D4', 'F#4'],
}

function resolve(chord: string): string[] {
  return CHORD_NOTES[chord] ?? ['C3', 'E3', 'G3']
}

export class ChordPlayer {
  private synth: Tone.PolySynth | null = null

  schedule(track: ChordTrack): void {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination()
    const { chords, bars } = track.progression
    const barsPerChord = bars / chords.length

    chords.forEach((chord, i) => {
      const notes = resolve(chord)
      Tone.getTransport().schedule((time) => {
        this.synth?.triggerAttackRelease(notes, `${barsPerChord}m`, time)
      }, `${i * barsPerChord}m`)
    })
  }

  dispose(): void {
    this.synth?.dispose()
    this.synth = null
  }
}
