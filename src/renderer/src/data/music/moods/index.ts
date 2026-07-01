import type { RealMoodId } from '../../../theory/types'
import type { MoodRecord }  from '../types'

// ComposerEngine の起点テーブル
// 各候補の weight は「他候補との相対比率」であり、合計が100である必要はない
export const moods: Record<RealMoodId, MoodRecord> = {

  happy: {
    id:    'happy',
    bpm:   132,
    key:   'C',
    scale: 'major',
    progressionCandidates: [
      { id: 'prog_happy_pop',    weight: 45 }, // 王道進行（最も明るく安定）
      { id: 'prog_happy_circle', weight: 35 }, // 循環進行（ノリがある）
      { id: 'prog_happy_simple', weight: 20 }, // スリーコード（シンプル）
    ],
    bassPatternCandidates: [
      { id: 'bass_happy_whole', weight: 50 }, // 安定した全音符
      { id: 'bass_happy_half',  weight: 30 }, // 弾む半音符
      { id: 'bass_happy_pedal', weight: 20 }, // トニックペダル
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_strong', weight: 50 }, // 力強い
      { id: 'drum_4beat_groove', weight: 30 }, // グルーヴ
      { id: 'drum_halfbeat',     weight: 20 }, // ゆったり
    ],
    instrumentPresetId: 'preset_default',
  },

  night: {
    id:    'night',
    bpm:   78,
    key:   'A',
    scale: 'minor',
    progressionCandidates: [
      { id: 'prog_night_ballad', weight: 40 }, // バラード（夜の定番）
      { id: 'prog_night_komuro', weight: 35 }, // 小室進行（切ない疾走感）
      { id: 'prog_night_dark',   weight: 25 }, // 暗め（深夜感）
    ],
    bassPatternCandidates: [
      { id: 'bass_night_whole', weight: 50 }, // 伸ばす・落ち着き
      { id: 'bass_night_pedal', weight: 30 }, // A1 ペダル（深い低音）
      { id: 'bass_night_half',  weight: 20 }, // 半音符（少し動く）
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_medium',   weight: 45 }, // 中程度
      { id: 'drum_halfbeat',       weight: 35 }, // スパース
      { id: 'drum_halfbeat_soft',  weight: 20 }, // 静寂
    ],
    instrumentPresetId: 'preset_default',
  },

  rain: {
    id:    'rain',
    bpm:   70,
    key:   'D',
    scale: 'minor',
    progressionCandidates: [
      { id: 'prog_rain_melancholy', weight: 40 }, // 憂鬱（雨の定番）
      { id: 'prog_rain_quiet',      weight: 35 }, // 静かな雨
      { id: 'prog_rain_slow',       weight: 25 }, // ゆっくりした雨
    ],
    bassPatternCandidates: [
      { id: 'bass_rain_pedal', weight: 45 }, // D2 持続（雨音のよう）
      { id: 'bass_rain_whole', weight: 35 }, // ルート全音符
      { id: 'bass_rain_half',  weight: 20 }, // 半音符（やや動く）
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_soft',    weight: 40 }, // 控えめ
      { id: 'drum_halfbeat',      weight: 35 }, // スパース
      { id: 'drum_halfbeat_soft', weight: 25 }, // 極めて静か
    ],
    instrumentPresetId: 'preset_default',
  },

  spring: {
    id:    'spring',
    bpm:   108,
    key:   'G',
    scale: 'major',
    progressionCandidates: [
      { id: 'prog_spring_bright',  weight: 45 }, // 王道（春の定番）
      { id: 'prog_spring_rise',    weight: 30 }, // 上昇感（希望・出会い）
      { id: 'prog_spring_simple',  weight: 25 }, // スリーコード（爽やか）
    ],
    bassPatternCandidates: [
      { id: 'bass_spring_whole', weight: 50 }, // 安定
      { id: 'bass_spring_half',  weight: 30 }, // 軽やか
      { id: 'bass_spring_pedal', weight: 20 }, // G2 ペダル
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_strong', weight: 45 }, // 力強い
      { id: 'drum_4beat_medium', weight: 35 }, // 中程度
      { id: 'drum_halfbeat',     weight: 20 }, // ゆったり
    ],
    instrumentPresetId: 'preset_default',
  },
}
