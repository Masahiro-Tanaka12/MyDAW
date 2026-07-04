import type { ProgressionTemplate } from '../types'

/**
 * コード進行テンプレート（度数表現）
 *
 * degrees: ダイアトニック度数の配列（1〜7）
 * qualityOverrides: [配列インデックス] → ChordQuality の例外指定
 *   未指定の位置はダイアトニックデフォルト（DIATONIC_QUALITY）を使用
 * scale: このテンプレートが前提とするスケール文脈
 *   Generator が mood.scale と組み合わせ、実キーで解決する
 */
export const progressionTemplates: Record<string, ProgressionTemplate> = {

  // ──── 😊 元気 / 🌸 春 — major ─────────────────────────────────────────

  prog_happy_pop: {
    id:               'prog_happy_pop',
    scale:            'major',
    degrees:          [1, 5, 6, 4],   // I-V-vi-IV 王道進行
    qualityOverrides: {},
    bars:             4,
    alias:            '王道の明るさ',
  },

  prog_happy_circle: {
    id:               'prog_happy_circle',
    scale:            'major',
    degrees:          [1, 6, 4, 5],   // I-vi-IV-V 循環進行
    qualityOverrides: {},
    bars:             4,
    alias:            'ノリのある明るさ',
  },

  prog_happy_simple: {
    id:               'prog_happy_simple',
    scale:            'major',
    degrees:          [1, 4, 5, 1],   // I-IV-V-I スリーコード
    qualityOverrides: {},
    bars:             4,
    alias:            'すっきりした明るさ',
  },

  prog_spring_bright: {
    id:               'prog_spring_bright',
    scale:            'major',
    degrees:          [1, 5, 6, 4],   // I-V-vi-IV（春の王道）
    qualityOverrides: {},
    bars:             4,
    alias:            '春の王道',
  },

  prog_spring_rise: {
    id:               'prog_spring_rise',
    scale:            'major',
    degrees:          [1, 2, 4, 5],   // I-ii-IV-V 上昇感
    qualityOverrides: {},
    bars:             4,
    alias:            '希望の春',
  },

  prog_spring_simple: {
    id:               'prog_spring_simple',
    scale:            'major',
    degrees:          [1, 4, 5, 1],   // I-IV-V-I スリーコード
    qualityOverrides: {},
    bars:             4,
    alias:            '爽やかな春',
  },

  // ──── 汎用メジャー ─────────────────────────────────────────────────────

  royal_road: {
    id:               'royal_road',
    scale:            'major',
    degrees:          [1, 5, 6, 4],   // I-V-vi-IV
    qualityOverrides: {},
    bars:             4,
    alias:            '王道進行',
  },

  circle_50s: {
    id:               'circle_50s',
    scale:            'major',
    degrees:          [1, 6, 4, 5],   // I-vi-IV-V 50年代進行
    qualityOverrides: {},
    bars:             4,
    alias:            '循環進行（50年代進行）',
  },

  canon: {
    id:               'canon',
    scale:            'major',
    degrees:          [1, 5, 6, 3, 4, 1, 4, 5],   // カノン進行
    qualityOverrides: {},
    bars:             8,
    alias:            'カノン進行',
  },

  komuro_general: {
    id:               'komuro_general',
    scale:            'major',
    degrees:          [6, 4, 1, 5],   // vi-IV-I-V 小室進行
    qualityOverrides: {},
    bars:             4,
    alias:            '小室進行（哀愁進行）',
  },

  blues12: {
    id:               'blues12',
    scale:            'major',
    degrees:          [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 1],   // 12小節ブルース
    qualityOverrides: { 0:'dominant7', 1:'dominant7', 2:'dominant7', 3:'dominant7', 4:'dominant7', 5:'dominant7', 6:'dominant7', 7:'dominant7', 8:'dominant7', 9:'dominant7', 10:'dominant7', 11:'dominant7' },
    bars:             12,
    alias:            'ブルース進行',
  },

  marusa: {
    id:               'marusa',
    scale:            'major',
    degrees:          [4, 3, 6, 1],   // IV-III7-vi-I 丸サ進行（III7が借用和音）
    qualityOverrides: { 0:'major7', 1:'dominant7', 2:'minor7', 3:'major7' },
    bars:             4,
    alias:            '丸サ進行',
  },

  // ──── 🌙 夜 — minor ────────────────────────────────────────────────────

  prog_night_ballad: {
    id:               'prog_night_ballad',
    scale:            'minor',
    degrees:          [1, 5, 6, 7],   // i-v-VI-VII バラード
    qualityOverrides: {},
    bars:             4,
    alias:            'しっとりした夜',
  },

  prog_night_komuro: {
    id:               'prog_night_komuro',
    scale:            'minor',
    degrees:          [1, 6, 3, 7],   // i-VI-III-VII 小室進行
    qualityOverrides: {},
    bars:             4,
    alias:            '切ない夜',
  },

  prog_night_dark: {
    id:               'prog_night_dark',
    scale:            'minor',
    degrees:          [1, 4, 7, 3],   // i-iv-VII-III 暗め
    qualityOverrides: {},
    bars:             4,
    alias:            '深夜の静けさ',
  },

  // ──── 🌧 雨 — minor ────────────────────────────────────────────────────

  prog_rain_melancholy: {
    id:               'prog_rain_melancholy',
    scale:            'minor',
    degrees:          [1, 5, 3, 7],   // i-v-III-VII 憂鬱
    qualityOverrides: {},
    bars:             4,
    alias:            'しとしと雨',
  },

  prog_rain_quiet: {
    id:               'prog_rain_quiet',
    scale:            'minor',
    degrees:          [1, 7, 6, 7],   // i-VII-VI-VII 静かな雨
    qualityOverrides: {},
    bars:             4,
    alias:            '静かな雨',
  },

  prog_rain_slow: {
    id:               'prog_rain_slow',
    scale:            'minor',
    degrees:          [1, 4, 7, 3],   // i-iv-VII-III 緩やか
    qualityOverrides: {},
    bars:             4,
    alias:            'ゆったりした雨',
  },
}
