import type { NoteEvent, MixConfig } from '../../theory/types'
import type { ChordQuality }         from '../../theory/chordTheory'

// 重み付き候補参照
export type WeightedRef = {
  id:     string
  weight: number  // 相対的な選ばれやすさ（合計が100である必要はない）
}

// 度数ベースのコード進行テンプレート
export type ProgressionTemplate = {
  id:               string
  scale:            'major' | 'minor'
  degrees:          number[]                             // ダイアトニック度数（1〜7）
  qualityOverrides: Partial<Record<number, ChordQuality>> // [配列インデックス] → 品質例外
  bars:             number
  alias:            string  // 日本語ラベル
}

// ベースパターンの1イベント（度数ベース）
export type BassEventTemplate = {
  time:       string   // Tone.js 時刻文字列 ("0m", "0:2:0" など)
  chordIndex: number   // コード進行配列のインデックス（0 始まり）
  octave:     number   // 音域指定（例: 2 → 全ルートをオクターブ2で）
  duration:   string   // "1m" | "2n" など
  velocity:   number   // 0.0〜1.0
}

// コード進行候補（ラベルを持つ）
export type ProgressionCandidateRef = WeightedRef & {
  label: string  // コード選択画面に表示する日本語ラベル（例: "王道の明るさ"）
}

// ドラムパターン候補（ラベルを持つ）
export type DrumPatternCandidateRef = WeightedRef & {
  label: string  // ドラム選択画面に表示する日本語ラベル（例: "力強いビート"）
}

export type ProgressionRecord = {
  id:     string
  chords: string[]
  bars:   number
}

export type BassPatternRecord = {
  id:     string
  events: BassEventTemplate[]  // 度数ベース。Generator が実キーで NoteEvent に解決する
}

export type DrumPatternRecord = {
  id:    string
  notes: NoteEvent[]
}

export type InstrumentPresetRecord = {
  id:             string
  chordPresetId:  string
  bassPresetId:   string
  drumPresetId:   string
  melodyPresetId: string
}

export type SmartFxPresetRecord = {
  id:     string
  label:  string
  chord:  MixConfig
  bass:   MixConfig
  drum:   MixConfig
  melody: MixConfig
}

export type MoodRecord = {
  id:                    string
  bpm:                   number
  key:                   string
  scale:                 'major' | 'minor'
  progressionCandidates: ProgressionCandidateRef[]   // ラベル付き
  bassPatternCandidates: WeightedRef[]
  drumPatternCandidates: DrumPatternCandidateRef[]   // ラベル付き
  instrumentPresetId:    string
}
