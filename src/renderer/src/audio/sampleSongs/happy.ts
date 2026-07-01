import type { SongBlueprint } from '../../theory/types'

export const happySong: SongBlueprint = {
  bpm: 132,
  key: 'C',
  scale: 'major',
  chordProgression: {
    id: 'happy_pop',
    chords: ['C', 'G', 'Am', 'F'],
    bars: 4,
  },
  melodyPattern: { id: 'none', notes: [] },
  instrumentMap: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  tracks: [
    {
      kind: 'chord',
      presetId: 'pad_warm',
      progression: {
        id: 'happy_pop',
        chords: ['C', 'G', 'Am', 'F'],
        bars: 4,
      },
    },
  ],
}
