import type { ProgressionTemplate } from '../types'

/**
 * コード進行テンプレート（度数表現）
 *
 * degrees: ダイアトニック度数の配列（1〜7）
 * qualityOverrides: [配列インデックス] → ChordQuality の例外指定
 *   未指定の位置はダイアトニックデフォルト（DIATONIC_QUALITY）を使用
 * scale: このテンプレートが前提とするスケール文脈
 * moodTags: 紐づくムードID。未指定 = 全ムード共通テンプレート
 */
export const progressionTemplates: Record<string, ProgressionTemplate> = {

  // ──── 😊 元気 — major ──────────────────────────────────────────────────

  prog_happy_pop: {
    id:               'prog_happy_pop',
    scale:            'major',
    degrees:          [1, 5, 6, 4],
    qualityOverrides: {},
    bars:             4,
    alias:            '王道の明るさ',
    moodTags:         ['happy'],
  },

  prog_happy_circle: {
    id:               'prog_happy_circle',
    scale:            'major',
    degrees:          [1, 6, 4, 5],
    qualityOverrides: {},
    bars:             4,
    alias:            'ノリのある明るさ',
    moodTags:         ['happy'],
  },

  prog_happy_simple: {
    id:               'prog_happy_simple',
    scale:            'major',
    degrees:          [1, 4, 5, 1],
    qualityOverrides: {},
    bars:             4,
    alias:            'すっきりした明るさ',
    moodTags:         ['happy'],
  },

  // ──── 🌸 春 — major ────────────────────────────────────────────────────

  prog_spring_bright: {
    id:               'prog_spring_bright',
    scale:            'major',
    degrees:          [1, 5, 6, 4],
    qualityOverrides: {},
    bars:             4,
    alias:            '春の王道',
    moodTags:         ['spring'],
  },

  prog_spring_rise: {
    id:               'prog_spring_rise',
    scale:            'major',
    degrees:          [1, 2, 4, 5],
    qualityOverrides: {},
    bars:             4,
    alias:            '希望の春',
    moodTags:         ['spring'],
  },

  prog_spring_simple: {
    id:               'prog_spring_simple',
    scale:            'major',
    degrees:          [1, 4, 5, 1],
    qualityOverrides: {},
    bars:             4,
    alias:            '爽やかな春',
    moodTags:         ['spring'],
  },

  // ──── 🌙 夜 — minor ────────────────────────────────────────────────────

  prog_night_ballad: {
    id:               'prog_night_ballad',
    scale:            'minor',
    degrees:          [1, 5, 6, 7],
    qualityOverrides: {},
    bars:             4,
    alias:            'しっとりした夜',
    moodTags:         ['night'],
  },

  prog_night_komuro: {
    id:               'prog_night_komuro',
    scale:            'minor',
    degrees:          [1, 6, 3, 7],
    qualityOverrides: {},
    bars:             4,
    alias:            '切ない夜',
    moodTags:         ['night'],
  },

  prog_night_dark: {
    id:               'prog_night_dark',
    scale:            'minor',
    degrees:          [1, 4, 7, 3],
    qualityOverrides: {},
    bars:             4,
    alias:            '深夜の静けさ',
    moodTags:         ['night'],
  },

  // ──── 🌧 雨 — minor ────────────────────────────────────────────────────

  prog_rain_melancholy: {
    id:               'prog_rain_melancholy',
    scale:            'minor',
    degrees:          [1, 5, 3, 7],
    qualityOverrides: {},
    bars:             4,
    alias:            'しとしと雨',
    moodTags:         ['rain'],
  },

  prog_rain_quiet: {
    id:               'prog_rain_quiet',
    scale:            'minor',
    degrees:          [1, 7, 6, 7],
    qualityOverrides: {},
    bars:             4,
    alias:            '静かな雨',
    moodTags:         ['rain'],
  },

  prog_rain_slow: {
    id:               'prog_rain_slow',
    scale:            'minor',
    degrees:          [1, 4, 7, 3],
    qualityOverrides: {},
    bars:             4,
    alias:            'ゆったりした雨',
    moodTags:         ['rain'],
  },

  // ──── 汎用（moodTags なし = 全ムードで使用可能） ──────────────────────

  royal_road: {
    id:               'royal_road',
    scale:            'major',
    degrees:          [1, 5, 6, 4],
    qualityOverrides: {},
    bars:             4,
    alias:            '王道進行',
  },

  circle_50s: {
    id:               'circle_50s',
    scale:            'major',
    degrees:          [1, 6, 4, 5],
    qualityOverrides: {},
    bars:             4,
    alias:            '循環進行（50年代進行）',
  },

  canon: {
    id:               'canon',
    scale:            'major',
    degrees:          [1, 5, 6, 3, 4, 1, 4, 5],
    qualityOverrides: {},
    bars:             8,
    alias:            'カノン進行',
  },

  komuro_general: {
    id:               'komuro_general',
    scale:            'major',
    degrees:          [6, 4, 1, 5],
    qualityOverrides: {},
    bars:             4,
    alias:            '小室進行（哀愁進行）',
  },

  blues12: {
    id:               'blues12',
    scale:            'major',
    degrees:          [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 1],
    qualityOverrides: { 0:'dominant7', 1:'dominant7', 2:'dominant7', 3:'dominant7', 4:'dominant7', 5:'dominant7', 6:'dominant7', 7:'dominant7', 8:'dominant7', 9:'dominant7', 10:'dominant7', 11:'dominant7' },
    bars:             12,
    alias:            'ブルース進行',
  },

  marusa: {
    id:               'marusa',
    scale:            'major',
    degrees:          [4, 3, 6, 1],
    qualityOverrides: { 0:'major7', 1:'dominant7', 2:'minor7', 3:'major7' },
    bars:             4,
    alias:            '丸サ進行',
  },
}
