import type { DrumPatternRecord } from '../types'
import type { NoteEvent }         from '../../../theory/types'

// 1小節分のキックイベントを生成するヘルパー
// beats: 鳴らす拍インデックスと velocity のペア配列
function makeKick(hits: { beat: number; sub?: number; vel: number }[]): NoteEvent[] {
  return hits.map(h => ({
    time:     `0:${h.beat}:${h.sub ?? 0}`,
    note:     'C1',
    duration: '8n',
    velocity: h.vel,
  }))
}

function makeSnare(hits: { beat: number; sub?: number; vel: number }[]): NoteEvent[] {
  return hits.map(h => ({
    time:     `0:${h.beat}:${h.sub ?? 0}`,
    note:     'C2',
    duration: '8n',
    velocity: h.vel,
  }))
}

function makeHihat(hits: { beat: number; sub?: number; vel: number }[]): NoteEvent[] {
  return hits.map(h => ({
    time:     `0:${h.beat}:${h.sub ?? 0}`,
    note:     'A6',
    duration: '32n',
    velocity: h.vel,
  }))
}

// 8分音符ハイハット（拍0〜3 それぞれの表・裏）
function hihat8th(onVel: number, offVel: number): NoteEvent[] {
  const hits: { beat: number; sub: number; vel: number }[] = []
  for (let b = 0; b < 4; b++) {
    hits.push({ beat: b, sub: 0, vel: onVel })
    hits.push({ beat: b, sub: 2, vel: offVel })
  }
  return makeHihat(hits)
}

// 16分音符ハイハット（グルーヴ用）
function hihat16th(strongVel: number, weakVel: number): NoteEvent[] {
  const hits: { beat: number; sub: number; vel: number }[] = []
  for (let b = 0; b < 4; b++) {
    hits.push({ beat: b, sub: 0, vel: strongVel })
    hits.push({ beat: b, sub: 1, vel: weakVel   })
    hits.push({ beat: b, sub: 2, vel: strongVel * 0.9 })
    hits.push({ beat: b, sub: 3, vel: weakVel   })
  }
  return makeHihat(hits)
}

// 4分音符ハイハット（静か・ハーフビート用）
function hihat4th(onVel: number, offVel: number): NoteEvent[] {
  return makeHihat([
    { beat: 0, vel: onVel  },
    { beat: 1, vel: offVel },
    { beat: 2, vel: onVel  },
    { beat: 3, vel: offVel },
  ])
}

export const drumPatterns: Record<string, DrumPatternRecord> = {

  // ── 4つ打ち系 ──────────────────────────────────────────────────────────

  // 力強い（元気・春向け）: 4つ打ちキック + バックビートスネア + 8分HH
  drum_4beat_strong: {
    id:       'drum_4beat_strong',
    label:    '力強いビート',
    moodTags: ['happy', 'spring'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.90 },
      { beat: 1, vel: 0.80 },
      { beat: 2, vel: 0.90 },
      { beat: 3, vel: 0.80 },
    ]),
    snare: makeSnare([
      { beat: 1, vel: 0.85 },
      { beat: 3, vel: 0.85 },
    ]),
    hihat: hihat8th(0.55, 0.45),
  },

  // 中程度（夜・春向け）: 1・3拍キック + バックビートスネア + 8分HH(控えめ)
  drum_4beat_medium: {
    id:       'drum_4beat_medium',
    label:    'おだやかなビート',
    moodTags: ['night', 'spring'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.80 },
      { beat: 2, vel: 0.80 },
    ]),
    snare: makeSnare([
      { beat: 1, vel: 0.75 },
      { beat: 3, vel: 0.75 },
    ]),
    hihat: hihat8th(0.42, 0.32),
  },

  // 控えめ（雨向け）: 1・3拍キック + バックビートスネア + 4分HH(静か)
  drum_4beat_soft: {
    id:       'drum_4beat_soft',
    label:    '控えめなビート',
    moodTags: ['rain'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.70 },
      { beat: 2, vel: 0.65 },
    ]),
    snare: makeSnare([
      { beat: 1, vel: 0.58 },
      { beat: 3, vel: 0.58 },
    ]),
    hihat: hihat4th(0.32, 0.28),
  },

  // グルーヴ感（元気向け）: シンコペーションキック + バックビートスネア + 16分HH
  drum_4beat_groove: {
    id:       'drum_4beat_groove',
    label:    'ノリのあるビート',
    moodTags: ['happy'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, sub: 0, vel: 0.95 },
      { beat: 1, sub: 2, vel: 0.75 },  // 2拍後半（シンコペ）
      { beat: 2, sub: 0, vel: 0.88 },
      { beat: 3, sub: 2, vel: 0.72 },  // 4拍後半（シンコペ）
    ]),
    snare: makeSnare([
      { beat: 1, vel: 0.90 },
      { beat: 3, vel: 0.88 },
    ]),
    hihat: hihat16th(0.58, 0.38),
  },

  // 極めて弱い（雨の静寂）: 1拍キックのみ + 3拍スネアのみ + 最弱4分HH
  drum_4beat_weak: {
    id:       'drum_4beat_weak',
    label:    '極めて静かなビート',
    moodTags: ['rain'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.62 },
    ]),
    snare: makeSnare([
      { beat: 2, vel: 0.52 },
    ]),
    hihat: hihat4th(0.28, 0.22),
  },

  // ── ハーフビート系 ─────────────────────────────────────────────────────

  // ハーフビート（全ムード共通）: 1・3拍キック + 3拍スネア(ハーフタイム) + 4分HH
  drum_halfbeat: {
    id:       'drum_halfbeat',
    label:    'ゆったりしたビート',
    moodTags: ['happy', 'night', 'rain', 'spring'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.88 },
      { beat: 2, vel: 0.75 },
    ]),
    snare: makeSnare([
      { beat: 2, vel: 0.80 },
    ]),
    hihat: hihat4th(0.45, 0.38),
  },

  // ハーフビート・ソフト（夜・雨向け）: 1・3拍キック + 3拍スネア弱め + 極少HH
  drum_halfbeat_soft: {
    id:       'drum_halfbeat_soft',
    label:    '静かなビート',
    moodTags: ['night', 'rain'],
    bars:     1,
    kick:  makeKick([
      { beat: 0, vel: 0.72 },
      { beat: 2, vel: 0.58 },
    ]),
    snare: makeSnare([
      { beat: 2, vel: 0.65 },
    ]),
    hihat: makeHihat([
      { beat: 0, vel: 0.25 },
      { beat: 2, vel: 0.22 },
    ]),
  },
}
