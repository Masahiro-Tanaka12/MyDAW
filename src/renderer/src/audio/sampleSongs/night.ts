import type { SongBlueprint } from '../../theory/types'

export const nightSong: SongBlueprint = {
  bpm: 78,
  key: 'A',
  scale: 'minor',
  chordProgression: {
    id: 'night_ballad',
    chords: ['Am', 'Em', 'F', 'G'],
    bars: 4,
  },
  melodyPattern: { id: 'none', notes: [] },
  instrumentMap: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  tracks: [
    {
      kind: 'chord',
      presetId: 'pad_warm',
      progression: {
        id: 'night_ballad',
        chords: ['Am', 'Em', 'F', 'G'],
        bars: 4,
      },
    },
  ],
}
