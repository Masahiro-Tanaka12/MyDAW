import type { BassPatternRecord } from '../types'
import type { NoteEvent }        from '../../../theory/types'

// ── ヘルパー: 半音符パターン（4小節分）──────────────────────────────────
// roots: 各バーのルート音（4要素）
function halfNotes(roots: [string, string, string, string], vel = 0.8): NoteEvent[] {
  return roots.flatMap((note, bar) => [
    { time: `${bar}:0:0`, note, duration: '2n', velocity: vel      },
    { time: `${bar}:2:0`, note, duration: '2n', velocity: vel - 0.1 },
  ])
}

// ── ヘルパー: トニックペダル（4小節同じ音）───────────────────────────────
function tonicPedal(note: string, vel = 0.75): NoteEvent[] {
  return [0, 1, 2, 3].map(bar => ({
    time: `${bar}m`, note, duration: '1m', velocity: vel,
  }))
}

export const bassPatterns: Record<string, BassPatternRecord> = {

  // ──── 😊 元気 (ルート音列: C2/G2/A2/F2) ─────────────────────────────
  // whole: 各コードのルートを1小節伸ばす（安定・シンプル）
  bass_happy_whole: {
    id: 'bass_happy_whole',
    notes: [
      { time: '0m', note: 'C2', duration: '1m', velocity: 0.8 },
      { time: '1m', note: 'G2', duration: '1m', velocity: 0.8 },
      { time: '2m', note: 'A2', duration: '1m', velocity: 0.8 },
      { time: '3m', note: 'F2', duration: '1m', velocity: 0.8 },
    ],
  },
  // half: ルートを半小節ずつ2回打つ（躍動感）
  bass_happy_half: {
    id: 'bass_happy_half',
    notes: halfNotes(['C2', 'G2', 'A2', 'F2'], 0.8),
  },
  // pedal: トニック C2 を4小節保持（骨太な土台）
  bass_happy_pedal: {
    id: 'bass_happy_pedal',
    notes: tonicPedal('C2', 0.75),
  },

  // ──── 🌙 夜 (ルート音列: A1/E2/F2/G2) ──────────────────────────────
  bass_night_whole: {
    id: 'bass_night_whole',
    notes: [
      { time: '0m', note: 'A1', duration: '1m', velocity: 0.7 },
      { time: '1m', note: 'E2', duration: '1m', velocity: 0.7 },
      { time: '2m', note: 'F2', duration: '1m', velocity: 0.7 },
      { time: '3m', note: 'G2', duration: '1m', velocity: 0.7 },
    ],
  },
  bass_night_half: {
    id: 'bass_night_half',
    notes: halfNotes(['A1', 'E2', 'F2', 'G2'], 0.7),
  },
  // pedal: A1 は夜らしい深みある低音
  bass_night_pedal: {
    id: 'bass_night_pedal',
    notes: tonicPedal('A1', 0.65),
  },

  // ──── 🌧 雨 (ルート音列: D2/A1/F2/C2) ──────────────────────────────
  bass_rain_whole: {
    id: 'bass_rain_whole',
    notes: [
      { time: '0m', note: 'D2', duration: '1m', velocity: 0.7 },
      { time: '1m', note: 'A1', duration: '1m', velocity: 0.7 },
      { time: '2m', note: 'F2', duration: '1m', velocity: 0.7 },
      { time: '3m', note: 'C2', duration: '1m', velocity: 0.7 },
    ],
  },
  bass_rain_half: {
    id: 'bass_rain_half',
    notes: halfNotes(['D2', 'A1', 'F2', 'C2'], 0.65),
  },
  // pedal: D2 の静かな持続（雨音のような）
  bass_rain_pedal: {
    id: 'bass_rain_pedal',
    notes: tonicPedal('D2', 0.6),
  },

  // ──── 🌸 春 (ルート音列: G2/D2/E2/C2) ──────────────────────────────
  bass_spring_whole: {
    id: 'bass_spring_whole',
    notes: [
      { time: '0m', note: 'G2', duration: '1m', velocity: 0.8 },
      { time: '1m', note: 'D2', duration: '1m', velocity: 0.8 },
      { time: '2m', note: 'E2', duration: '1m', velocity: 0.8 },
      { time: '3m', note: 'C2', duration: '1m', velocity: 0.8 },
    ],
  },
  bass_spring_half: {
    id: 'bass_spring_half',
    notes: halfNotes(['G2', 'D2', 'E2', 'C2'], 0.8),
  },
  // pedal: G2 の爽やかな持続
  bass_spring_pedal: {
    id: 'bass_spring_pedal',
    notes: tonicPedal('G2', 0.72),
  },
}
