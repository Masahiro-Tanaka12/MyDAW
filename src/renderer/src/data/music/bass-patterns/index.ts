import type { BassPatternRecord } from '../types'

/**
 * ベースパターン（度数ベース）
 *
 * events[n].chordIndex : コード進行の n 番目のコードのルート音を使う（0 始まり）
 * events[n].octave     : そのルート音をどのオクターブで鳴らすか
 *
 * Generator.ts が resolveChordRoot(key, scale, degrees[chordIndex]) + octave
 * に展開して NoteEvent に変換する。
 *
 * octave 選定方針:
 *   - 基本はオクターブ 2（C2〜B2 帯 = MIDI 36〜47）
 *   - 夜（A minor）のトニック A は低音感のため 1 に設定
 */
export const bassPatterns: Record<string, BassPatternRecord> = {

  // ──── 😊 元気 ─────────────────────────────────────────────────────────
  bass_happy_whole: {
    id: 'bass_happy_whole',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '1m', chordIndex: 1, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '2m', chordIndex: 2, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '3m', chordIndex: 3, octave: 2, duration: '1m', velocity: 0.80 },
    ],
  },

  bass_happy_half: {
    id: 'bass_happy_half',
    events: [
      { time: '0:0:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '0:2:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '1:0:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '1:2:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '2:0:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '2:2:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '3:0:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '3:2:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.70 },
    ],
  },

  bass_happy_pedal: {
    id: 'bass_happy_pedal',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.75 },
      { time: '1m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.75 },
      { time: '2m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.75 },
      { time: '3m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.75 },
    ],
  },

  // ──── 🌙 夜 ───────────────────────────────────────────────────────────
  // 夜のトニックは A minor。A をオクターブ 1（A1）にして深い低音を出す
  bass_night_whole: {
    id: 'bass_night_whole',
    events: [
      { time: '0m', chordIndex: 0, octave: 1, duration: '1m', velocity: 0.70 },
      { time: '1m', chordIndex: 1, octave: 2, duration: '1m', velocity: 0.70 },
      { time: '2m', chordIndex: 2, octave: 2, duration: '1m', velocity: 0.70 },
      { time: '3m', chordIndex: 3, octave: 2, duration: '1m', velocity: 0.70 },
    ],
  },

  bass_night_half: {
    id: 'bass_night_half',
    events: [
      { time: '0:0:0', chordIndex: 0, octave: 1, duration: '2n', velocity: 0.70 },
      { time: '0:2:0', chordIndex: 0, octave: 1, duration: '2n', velocity: 0.60 },
      { time: '1:0:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '1:2:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.60 },
      { time: '2:0:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '2:2:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.60 },
      { time: '3:0:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '3:2:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.60 },
    ],
  },

  bass_night_pedal: {
    id: 'bass_night_pedal',
    events: [
      { time: '0m', chordIndex: 0, octave: 1, duration: '1m', velocity: 0.65 },
      { time: '1m', chordIndex: 0, octave: 1, duration: '1m', velocity: 0.65 },
      { time: '2m', chordIndex: 0, octave: 1, duration: '1m', velocity: 0.65 },
      { time: '3m', chordIndex: 0, octave: 1, duration: '1m', velocity: 0.65 },
    ],
  },

  // ──── 🌧 雨 ───────────────────────────────────────────────────────────
  bass_rain_whole: {
    id: 'bass_rain_whole',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.70 },
      { time: '1m', chordIndex: 1, octave: 2, duration: '1m', velocity: 0.70 },
      { time: '2m', chordIndex: 2, octave: 2, duration: '1m', velocity: 0.70 },
      { time: '3m', chordIndex: 3, octave: 2, duration: '1m', velocity: 0.70 },
    ],
  },

  bass_rain_half: {
    id: 'bass_rain_half',
    events: [
      { time: '0:0:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.65 },
      { time: '0:2:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.55 },
      { time: '1:0:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.65 },
      { time: '1:2:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.55 },
      { time: '2:0:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.65 },
      { time: '2:2:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.55 },
      { time: '3:0:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.65 },
      { time: '3:2:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.55 },
    ],
  },

  bass_rain_pedal: {
    id: 'bass_rain_pedal',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.60 },
      { time: '1m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.60 },
      { time: '2m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.60 },
      { time: '3m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.60 },
    ],
  },

  // ──── 🌸 春 ───────────────────────────────────────────────────────────
  bass_spring_whole: {
    id: 'bass_spring_whole',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '1m', chordIndex: 1, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '2m', chordIndex: 2, octave: 2, duration: '1m', velocity: 0.80 },
      { time: '3m', chordIndex: 3, octave: 2, duration: '1m', velocity: 0.80 },
    ],
  },

  bass_spring_half: {
    id: 'bass_spring_half',
    events: [
      { time: '0:0:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '0:2:0', chordIndex: 0, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '1:0:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '1:2:0', chordIndex: 1, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '2:0:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '2:2:0', chordIndex: 2, octave: 2, duration: '2n', velocity: 0.70 },
      { time: '3:0:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.80 },
      { time: '3:2:0', chordIndex: 3, octave: 2, duration: '2n', velocity: 0.70 },
    ],
  },

  bass_spring_pedal: {
    id: 'bass_spring_pedal',
    events: [
      { time: '0m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.72 },
      { time: '1m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.72 },
      { time: '2m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.72 },
      { time: '3m', chordIndex: 0, octave: 2, duration: '1m', velocity: 0.72 },
    ],
  },
}
