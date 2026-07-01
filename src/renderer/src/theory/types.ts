// ユーザーの選択入力
export type UserSelection = {
  genre: string  // "pop" | "rock" | "jazz" | "edm"
  mood:  string  // "happy" | "sad" | "cool" | "dreamy"
  scene: string  // "morning" | "night" | "drive" | "relax"
}

// ムードボタンの識別子
export type MoodId = 'happy' | 'night' | 'rain' | 'spring' | 'random'

// ComposerEngine への入力
export type UserIntent = {
  mood: MoodId
}

// コード進行
export type ChordProgression = {
  id:     string    // "pop_basic_01"
  chords: string[]  // ["C", "Am", "F", "G"]
  bars:   number    // 4 | 8 | 16
}

// メロディパターン（相対音程）
export type RelativeNote = {
  degree:   number   // スケール上のステップ (0=ルート, 2=3度, 4=5度 ...)
  duration: string   // "4n" | "8n" | "2n"
  velocity: number   // 0.0〜1.0
}

export type MelodyPattern = {
  id:    string
  notes: RelativeNote[]
}

// トラック別プリセットID
export type InstrumentMap = {
  melody: string
  chord:  string
  bass:   string
  drum:   string
}

// ─── トラック層（Phase2〜順次実装） ───────────────────────────────────────

export type ChordTrack = {
  kind:      'chord'
  progression: ChordProgression
  presetId:  string
}

// Phase2以降 型のみ定義
export type MelodyTrack = {
  kind:     'melody'
  pattern:  MelodyPattern
  presetId: string
}

export type BassTrack = {
  kind:     'bass'
  presetId: string
}

export type DrumTrack = {
  kind:     'drum'
  presetId: string
}

export type TrackLayer = ChordTrack | MelodyTrack | BassTrack | DrumTrack

// ComposerEngine が生成する曲設計図
export type SongBlueprint = {
  chordProgression: ChordProgression
  melodyPattern:    MelodyPattern
  bpm:              number
  key:              string   // "C" | "G" | "Am" ...
  scale:            string   // "major" | "minor"
  instrumentMap:    InstrumentMap
  tracks:           TrackLayer[]
}

// スコアリング重み（初心者は触らない。Phase3以降のチューニング用）
export type WeightConfig = {
  genre: number  // default: 3
  mood:  number  // default: 2
  scene: number  // default: 1
}

// PlaybackEngine のイベント定義
export type PlaybackEventMap = {
  play:  { bpm: number }
  stop:  Record<string, never>
  end:   Record<string, never>
  tick:  { bar: number; beat: number }
  load:  Record<string, never>
}

// トラックデータ（arranger.ts が生成）
export type NoteEvent = {
  time:     string   // "0:0:0" = 小節:拍:細分
  note:     string   // "C4" | "rest"
  duration: string   // "4n" | "8n" | "2n"
  velocity: number   // 0.0〜1.0
}

export type MixConfig = {
  volume: number   // dB (-20〜0)
  pan:    number   // -1〜1
  reverb: number   // 0〜1
  eq: {
    low:  number
    mid:  number
    high: number
  }
}

export type TrackId = 'melody' | 'chord' | 'bass' | 'drum'

export type TrackData = {
  id:        TrackId
  notes:     NoteEvent[]
  presetId:  string
  mixConfig: MixConfig
}
