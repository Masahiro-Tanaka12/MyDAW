// ユーザーの選択入力
export type UserSelection = {
  genre: string  // "pop" | "rock" | "jazz" | "edm"
  mood:  string  // "happy" | "sad" | "cool" | "dreamy"
  scene: string  // "morning" | "night" | "drive" | "relax"
}

// ムードボタンの識別子
export type MoodId = 'happy' | 'night' | 'rain' | 'spring' | 'random'
// 実際の曲データが存在するムード（'random' は除外）
export type RealMoodId = Exclude<MoodId, 'random'>

// ComposerEngine への入力
export type UserIntent = {
  mood: MoodId
  // Phase4以降に解放される選択肢（未指定時はComposerEngineが自動決定）
  chordProgressionId?: string
  drumPatternId?: string
  smartFxId?: string
  bpm?: number              // 未指定時は mood のデフォルト BPM を使用
  instrumentPresetId?: string
  customProgression?: { scale: 'major' | 'minor'; degrees: number[] }
  melodyNotes?: RelativeNote[]  // 鼻歌から採譜したメロディ（未指定時はメロディなし）
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
  kind:        'chord'
  progression: ChordProgression
  presetId:    string
  mixConfig?:  MixConfig
}

export type MelodyTrack = {
  kind:       'melody'
  pattern:    MelodyPattern   // RelativeNote[] 原本（度数表現）
  notes:      NoteEvent[]     // Generator が解決した実音イベント列
  presetId:   string
  mixConfig?: MixConfig
}

export type BassTrack = {
  kind:       'bass'
  notes:      NoteEvent[]
  presetId:   string
  mixConfig?: MixConfig
}

export type DrumTrack = {
  kind:        'drum'
  kickNotes:   NoteEvent[]
  snareNotes:  NoteEvent[]
  hihatNotes:  NoteEvent[]
  presetId:    string
  mixConfig?:  MixConfig
}

export type TrackLayer = ChordTrack | MelodyTrack | BassTrack | DrumTrack

// ComposerEngine が生成する曲設計図
export type SongBlueprint = {
  seed:             number       // compose() ごとに生成されるランダム値
  moodId:           RealMoodId   // 実際に使われたムード（'random' 解決後）
  chordProgression: ChordProgression
  melodyPattern:    MelodyPattern
  bpm:              number
  key:              string   // "C" | "G" | "Am" ...
  scale:            string   // "major" | "minor"
  instrumentMap:    InstrumentMap
  tracks:           TrackLayer[]
}

// LocalStorage に保存する曲データ
export type SavedSong = {
  id:         string      // Date.now().toString()
  title:      string      // "Happy #123"
  createdAt:  string      // ISO 8601
  updatedAt?: string      // タイトル編集時に更新（旧データとの互換のためオプショナル）
  seed:       number
  mood:       RealMoodId
  blueprint:  SongBlueprint
}

// スコアリング重み（初心者は触らない。Phase3以降のチューニング用）
export type WeightConfig = {
  genre: number  // default: 3
  mood:  number  // default: 2
  scene: number  // default: 1
}

// コード選択画面に渡す進行オプション
export type ProgressionOption = {
  id:     string
  label:  string
  chords: string[]
}

// ドラム選択画面に渡すオプション
export type DrumOption = {
  id:          string
  label:       string
  beatPattern: (number | null)[]  // 拍0〜3のベロシティ（null=ヒットなし）
}

// Smart FX 選択画面に渡すオプション
export type SmartFxOption = {
  id:    string
  label: string
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
