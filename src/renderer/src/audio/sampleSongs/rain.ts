import type { SongBlueprint } from '../../theory/types'

export const rainSong: SongBlueprint = {
  bpm: 70,
  key: 'D',
  scale: 'minor',
  chordProgression: {
    id: 'rain_melancholy',
    chords: ['Dm', 'Am', 'F', 'C'],
    bars: 4,
  },
  melodyPattern: { id: 'none', notes: [] },
  instrumentMap: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  tracks: [
    {
      kind: 'chord',
      presetId: 'pad_warm',
      progression: {
        id: 'rain_melancholy',
        chords: ['Dm', 'Am', 'F', 'C'],
        bars: 4,
      },
    },
  ],
}
