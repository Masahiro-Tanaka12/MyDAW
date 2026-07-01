import type { ProgressionRecord } from '../types'

export const progressions: Record<string, ProgressionRecord> = {

  // ──── 😊 元気 (C major) ────────────────────────────────────────────────
  prog_happy_pop: {
    id:     'prog_happy_pop',
    chords: ['C', 'G', 'Am', 'F'],  // 王道進行 I-V-vi-IV
    bars:   4,
  },
  prog_happy_circle: {
    id:     'prog_happy_circle',
    chords: ['C', 'Am', 'F', 'G'],  // 循環進行 I-vi-IV-V
    bars:   4,
  },
  prog_happy_simple: {
    id:     'prog_happy_simple',
    chords: ['C', 'F', 'G', 'C'],   // スリーコード I-IV-V-I
    bars:   4,
  },

  // ──── 🌙 夜 (A minor) ────────────────────────────────────────────────
  prog_night_ballad: {
    id:     'prog_night_ballad',
    chords: ['Am', 'Em', 'F', 'G'], // バラード i-v-VI-VII
    bars:   4,
  },
  prog_night_komuro: {
    id:     'prog_night_komuro',
    chords: ['Am', 'F', 'C', 'G'],  // 小室進行 vi-IV-I-V
    bars:   4,
  },
  prog_night_dark: {
    id:     'prog_night_dark',
    chords: ['Am', 'Dm', 'G', 'C'], // 暗め i-iv-VII-III
    bars:   4,
  },

  // ──── 🌧 雨 (D minor) ────────────────────────────────────────────────
  prog_rain_melancholy: {
    id:     'prog_rain_melancholy',
    chords: ['Dm', 'Am', 'F', 'C'],  // 憂鬱 i-v-VI-III
    bars:   4,
  },
  prog_rain_quiet: {
    id:     'prog_rain_quiet',
    chords: ['Dm', 'C', 'Bb', 'C'], // 静かな雨 i-VII-VI-VII
    bars:   4,
  },
  prog_rain_slow: {
    id:     'prog_rain_slow',
    chords: ['Dm', 'Gm', 'C', 'F'], // 緩やか i-iv-VII-VI
    bars:   4,
  },

  // ──── 🌸 春 (G major) ────────────────────────────────────────────────
  prog_spring_bright: {
    id:     'prog_spring_bright',
    chords: ['G', 'D', 'Em', 'C'],  // 王道進行 I-V-vi-IV
    bars:   4,
  },
  prog_spring_rise: {
    id:     'prog_spring_rise',
    chords: ['G', 'Am', 'C', 'D'],  // 上昇感 I-ii-IV-V
    bars:   4,
  },
  prog_spring_simple: {
    id:     'prog_spring_simple',
    chords: ['G', 'C', 'D', 'G'],   // スリーコード I-IV-V-I
    bars:   4,
  },
}
