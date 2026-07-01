import type { NoteEvent } from '../../theory/types'

// 重み付き候補参照
export type WeightedRef = {
  id:     string
  weight: number  // 相対的な選ばれやすさ（合計が100である必要はない）
}

export type ProgressionRecord = {
  id:     string
  chords: string[]
  bars:   number
}

export type BassPatternRecord = {
  id:    string
  // Phase5時点: モードのキーに対して安全なノートを使用（全ノート同一キー内）
  // Phase6以降: chordRoot からの相対パターンへ移行予定
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
  progressionCandidates: WeightedRef[]
  bassPatternCandidates: WeightedRef[]
  drumPatternCandidates: WeightedRef[]
  instrumentPresetId:    string
}
