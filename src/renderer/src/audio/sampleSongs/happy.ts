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
    {
      kind: 'bass',
      presetId: 'bass_pluck',
      notes: [
        { time: '0m', note: 'C2',  duration: '1m', velocity: 0.8 },
        { time: '1m', note: 'G2',  duration: '1m', velocity: 0.8 },
        { time: '2m', note: 'A2',  duration: '1m', velocity: 0.8 },
        { time: '3m', note: 'F2',  duration: '1m', velocity: 0.8 },
      ],
    },
    {
      kind: 'drum',
      presetId: 'drum_standard',
      notes: [
        { time: '0:0:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '0:1:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '0:2:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '0:3:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '1:0:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '1:1:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '1:2:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '1:3:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '2:0:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '2:1:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '2:2:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '2:3:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '3:0:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '3:1:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '3:2:0', note: 'C1', duration: '8n', velocity: 0.9 },
        { time: '3:3:0', note: 'C1', duration: '8n', velocity: 0.8 },
      ],
    },
  ],
}
