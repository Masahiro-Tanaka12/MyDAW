import type { DrumPatternRecord } from '../types'
import type { NoteEvent }         from '../../../theory/types'

// 4つ打ちキックを4小節分生成
function fourOnFloor(strongVel: number, weakVel: number): NoteEvent[] {
  const hits: NoteEvent[] = []
  for (let bar = 0; bar < 4; bar++) {
    hits.push(
      { time: `${bar}:0:0`, note: 'C1', duration: '8n', velocity: strongVel },
      { time: `${bar}:1:0`, note: 'C1', duration: '8n', velocity: weakVel   },
      { time: `${bar}:2:0`, note: 'C1', duration: '8n', velocity: strongVel },
      { time: `${bar}:3:0`, note: 'C1', duration: '8n', velocity: weakVel   },
    )
  }
  return hits
}

// 1・3拍のみのハーフビートを4小節分生成（スパース・落ち着き）
function halfBeat(strongVel: number, weakVel: number): NoteEvent[] {
  const hits: NoteEvent[] = []
  for (let bar = 0; bar < 4; bar++) {
    hits.push(
      { time: `${bar}:0:0`, note: 'C1', duration: '4n', velocity: strongVel },
      { time: `${bar}:2:0`, note: 'C1', duration: '4n', velocity: weakVel   },
    )
  }
  return hits
}

export const drumPatterns: Record<string, DrumPatternRecord> = {

  // ── 4つ打ち系 ──────────────────────────────────────────────────────────

  // 力強い（😊元気・🌸春向け）
  drum_4beat_strong: {
    id:    'drum_4beat_strong',
    notes: fourOnFloor(0.9, 0.8),
  },

  // 中程度（🌙夜向け）
  drum_4beat_medium: {
    id:    'drum_4beat_medium',
    notes: fourOnFloor(0.8, 0.7),
  },

  // 控えめ（🌧雨向け）
  drum_4beat_soft: {
    id:    'drum_4beat_soft',
    notes: fourOnFloor(0.8, 0.6),
  },

  // グルーヴ感（1・3拍を強調してノリを出す）
  drum_4beat_groove: {
    id:    'drum_4beat_groove',
    notes: fourOnFloor(0.95, 0.65),
  },

  // 極めて弱い（🌧雨の静寂）
  drum_4beat_weak: {
    id:    'drum_4beat_weak',
    notes: fourOnFloor(0.72, 0.52),
  },

  // ── ハーフビート系 ─────────────────────────────────────────────────────
  // 2拍しか打たない → 広がりと余白が生まれる

  // ハーフビート（夜・雨・春のスローな場面に）
  drum_halfbeat: {
    id:    'drum_halfbeat',
    notes: halfBeat(0.88, 0.75),
  },

  // ハーフビート・ソフト（🌧雨の静寂）
  drum_halfbeat_soft: {
    id:    'drum_halfbeat_soft',
    notes: halfBeat(0.72, 0.58),
  },
}
