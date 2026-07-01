import type { SongBlueprint } from '../theory/types'

export const sampleSong: SongBlueprint = {
  chordProgression: {
    id: 'sample_pop_c_major',
    chords: ['C', 'G', 'Am', 'F'],
    bars: 4,
  },
  melodyPattern: {
    id: 'none',
    notes: [],
  },
  bpm: 120,
  key: 'C',
  scale: 'major',
  instrumentMap: {
    melody: 'pop_lead_synth',
    chord:  'pad_warm',
    bass:   'bass_pluck',
    drum:   'drum_standard',
  },
}
