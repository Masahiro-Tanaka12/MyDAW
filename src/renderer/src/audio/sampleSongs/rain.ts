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
    {
      kind: 'bass',
      presetId: 'bass_pluck',
      notes: [
        { time: '0m', note: 'D2',  duration: '1m', velocity: 0.7 },
        { time: '1m', note: 'A1',  duration: '1m', velocity: 0.7 },
        { time: '2m', note: 'F2',  duration: '1m', velocity: 0.7 },
        { time: '3m', note: 'C2',  duration: '1m', velocity: 0.7 },
      ],
    },
    {
      kind: 'drum',
      presetId: 'drum_standard',
      notes: [
        { time: '0:0:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '0:1:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '0:2:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '0:3:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '1:0:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '1:1:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '1:2:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '1:3:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '2:0:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '2:1:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '2:2:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '2:3:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '3:0:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '3:1:0', note: 'C1', duration: '8n', velocity: 0.6 },
        { time: '3:2:0', note: 'C1', duration: '8n', velocity: 0.8 },
        { time: '3:3:0', note: 'C1', duration: '8n', velocity: 0.6 },
      ],
    },
  ],
}
