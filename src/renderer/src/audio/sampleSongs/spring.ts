import type { SongBlueprint } from '../../theory/types'

export const springSong: SongBlueprint = {
  bpm: 108,
  key: 'G',
  scale: 'major',
  chordProgression: {
    id: 'spring_bright',
    chords: ['G', 'D', 'Em', 'C'],
    bars: 4,
  },
  melodyPattern: { id: 'none', notes: [] },
  instrumentMap: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  tracks: [
    {
      kind: 'chord',
      presetId: 'pad_warm',
      progression: {
        id: 'spring_bright',
        chords: ['G', 'D', 'Em', 'C'],
        bars: 4,
      },
    },
  ],
}
