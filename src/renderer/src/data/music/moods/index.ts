import type { RealMoodId } from '../../../theory/types'
import type { MoodRecord, DrumPatternCandidateRef } from '../types'

// ComposerEngine の起点テーブル
// 各候補の weight は「他候補との相対比率」であり、合計が100である必要はない
export const moods: Record<RealMoodId, MoodRecord> = {

  happy: {
    id:    'happy',
    bpm:   132,
    key:   'C',
    scale: 'major',
    progressionCandidates: [
      { id: 'prog_happy_pop',    weight: 45, label: '王道の明るさ'            },
      { id: 'prog_happy_circle', weight: 35, label: 'ノリのある明るさ'         },
      { id: 'prog_happy_simple', weight: 20, label: 'すっきりした明るさ'       },
      { id: 'royal_road',        weight: 10, label: '王道進行'                },
      { id: 'circle_50s',        weight: 10, label: '循環進行（50年代進行）'   },
      { id: 'canon',             weight:  8, label: 'カノン進行'               },
      { id: 'komuro_general',    weight:  8, label: '小室進行（哀愁進行）'     },
      { id: 'blues12',           weight:  6, label: 'ブルース進行'             },
      { id: 'marusa',            weight:  8, label: '丸サ進行'                },
    ],
    bassPatternCandidates: [
      { id: 'bass_happy_whole', weight: 50 }, // 安定した全音符
      { id: 'bass_happy_half',  weight: 30 }, // 弾む半音符
      { id: 'bass_happy_pedal', weight: 20 }, // トニックペダル
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_strong', weight: 50, label: '力強いビート'     },
      { id: 'drum_4beat_groove', weight: 30, label: 'ノリのあるビート' },
      { id: 'drum_halfbeat',     weight: 20, label: 'ゆったりしたビート' },
    ] satisfies DrumPatternCandidateRef[],
    instrumentPresetId: 'preset_default',
  },

  night: {
    id:    'night',
    bpm:   78,
    key:   'A',
    scale: 'minor',
    progressionCandidates: [
      { id: 'prog_night_ballad', weight: 40, label: 'しっとりした夜' },
      { id: 'prog_night_komuro', weight: 35, label: '切ない夜'       },
      { id: 'prog_night_dark',   weight: 25, label: '深夜の静けさ'   },
    ],
    bassPatternCandidates: [
      { id: 'bass_night_whole', weight: 50 }, // 伸ばす・落ち着き
      { id: 'bass_night_pedal', weight: 30 }, // A1 ペダル（深い低音）
      { id: 'bass_night_half',  weight: 20 }, // 半音符（少し動く）
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_medium',  weight: 45, label: 'おだやかなビート' },
      { id: 'drum_halfbeat',      weight: 35, label: 'ゆったりしたビート' },
      { id: 'drum_halfbeat_soft', weight: 20, label: '静かなビート'     },
    ] satisfies DrumPatternCandidateRef[],
    instrumentPresetId: 'preset_default',
  },

  rain: {
    id:    'rain',
    bpm:   70,
    key:   'D',
    scale: 'minor',
    progressionCandidates: [
      { id: 'prog_rain_melancholy', weight: 40, label: 'しとしと雨'     },
      { id: 'prog_rain_quiet',      weight: 35, label: '静かな雨'       },
      { id: 'prog_rain_slow',       weight: 25, label: 'ゆったりした雨' },
    ],
    bassPatternCandidates: [
      { id: 'bass_rain_pedal', weight: 45 }, // D2 持続（雨音のよう）
      { id: 'bass_rain_whole', weight: 35 }, // ルート全音符
      { id: 'bass_rain_half',  weight: 20 }, // 半音符（やや動く）
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_soft',    weight: 40, label: '控えめなビート' },
      { id: 'drum_halfbeat',      weight: 35, label: 'ゆったりしたビート' },
      { id: 'drum_halfbeat_soft', weight: 25, label: '雨音のように静かに' },
    ] satisfies DrumPatternCandidateRef[],
    instrumentPresetId: 'preset_default',
  },

  spring: {
    id:    'spring',
    bpm:   108,
    key:   'G',
    scale: 'major',
    progressionCandidates: [
      { id: 'prog_spring_bright',  weight: 45, label: '春の王道' },
      { id: 'prog_spring_rise',    weight: 30, label: '希望の春' },
      { id: 'prog_spring_simple',  weight: 25, label: '爽やかな春' },
    ],
    bassPatternCandidates: [
      { id: 'bass_spring_whole', weight: 50 }, // 安定
      { id: 'bass_spring_half',  weight: 30 }, // 軽やか
      { id: 'bass_spring_pedal', weight: 20 }, // G2 ペダル
    ],
    drumPatternCandidates: [
      { id: 'drum_4beat_strong', weight: 45, label: '弾むビート'       },
      { id: 'drum_4beat_medium', weight: 35, label: 'おだやかなビート' },
      { id: 'drum_halfbeat',     weight: 20, label: 'ゆったりしたビート' },
    ] satisfies DrumPatternCandidateRef[],
    instrumentPresetId: 'preset_default',
  },
}
