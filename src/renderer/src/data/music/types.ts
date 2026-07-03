import type { NoteEvent } from '../../theory/types'

// 重み付き候補参照
export type WeightedRef = {
  id:     string
  weight: number  // 相対的な選ばれやすさ（合計が100である必要はない）
}

// コード進行候補（ラベルを持つ）
export type ProgressionCandidateRef = WeightedRef & {
  label: string  // コード選択画面に表示する日本語ラベル（例: "王道の明るさ"）
}

export type ProgressionRecord = {
  id:     string
  chords: string[]
  bars:   number
}

export type BassPatternRecord = {
  id:    string
  // 現在: キー固定の絶対音程。今後コードルート相対音程へ移行予定
  notes: NoteEvent[]
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

export type MoodRecord = {
  id:                    string
  bpm:                   number
  key:                   string
  scale:                 'major' | 'minor'
  progressionCandidates: ProgressionCandidateRef[]  // ラベル付き
  bassPatternCandidates: WeightedRef[]
  drumPatternCandidates: WeightedRef[]
  instrumentPresetId:    string
}
