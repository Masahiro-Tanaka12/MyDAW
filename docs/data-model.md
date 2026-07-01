# データモデル設計書 (data-model.md)

## 設計原則

ユーザーが直接操作するフィールドは **4つだけ**：

| ユーザーが選ぶもの | フィールド |
|---|---|
| ジャンル | `Song.genre` |
| 雰囲気 | `Song.mood` |
| シーン・感情 | `Song.scene` |
| メロディ | `Song.melodyPatternId` |

`chordProgressionId` はユーザーには見えない。RecommendationEngineが自動決定する。

それ以外（BPM, キー, ミックス設定, ボイシング等）はすべてシステムが自動決定する。

---

## 主要エンティティ

### Song（1曲）

```typescript
interface Song {
  id: string
  title: string                    // ユーザーが完成後に命名

  // ユーザーが選ぶ（4つ）
  genre: Genre
  mood: Mood
  scene: Scene                     // '朝' | '夜' | '春' | '夏' | 'ドライブ' | '雨' | '切ない' | '元気'
  melodyPatternId: string

  // システムが自動設定（ユーザーには非表示）
  chordProgressionId: string       // RecommendationEngineが決定
  bpm: number                      // RecommendationEngineが決定
  key: Note                        // RecommendationEngineが決定
  scale: Scale                     // RecommendationEngineが決定

  // 生成済みトラック
  tracks: Track[]

  createdAt: Date
  completedAt?: Date
}
```

### Track（1パート）

```typescript
interface Track {
  id: string
  role: TrackRole                  // 'melody' | 'chord' | 'bass' | 'drum'
  instrumentId: string
  pattern: ScheduledNote[]         // arranger.ts が生成する音符列

  // 以下はmixer.tsが自動設定（ユーザー非公開）
  volume: number                   // dB
  pan: number                      // -1.0 〜 1.0
  reverbAmount: number
  eqPreset: EQPresetId
}

// Song 1件に対して常に4トラック生成される
// Track[0]: melody
// Track[1]: chord
// Track[2]: bass
// Track[3]: drum
```

### Chord（1コード）

```typescript
interface Chord {
  root: Note                       // 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  quality: ChordQuality            // 'major' | 'minor' | 'maj7' | 'm7' | '7'
  displayName: string              // ユーザー向け表示名 例: "Am", "Fmaj7"
}
```

### ChordProgression（コード進行パターン）

```typescript
interface ChordProgression {
  id: string
  name: string                     // 開発者向け名称（例: "王道進行"）
  description: string              // 開発者向け説明（UIには出さない）
  chords: ScaleDegreeChord[]       // ルートに依存しない相対定義
  genre: Genre[]                   // 対応ジャンル
  mood: Mood[]                     // 対応雰囲気
  bars: 4                          // 固定: 4小節（Phase1〜3）

  // RecommendationEngineが使用する属性スコア（0〜100）
  attributes: ChordAttributes
}

interface ChordAttributes {
  energy: number        // 曲のエネルギー感（高=アップテンポ・力強い）
  brightness: number    // 明るさ（高=明るい・楽しい）
  sadness: number       // 哀愁・切なさ（高=悲しい・切ない）
  tension: number       // 緊張感・かっこよさ（高=ダーク・緊張）
  beginnerScore: number // 初心者向け度（高=定番・覚えやすい）
  popularity: number    // 人気度（高=多くの曲で使われている）
}

// 相対定義（移調に対応するため）
interface ScaleDegreeChord {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7
  quality: ChordQuality
  displayRoman: string             // 例: "I", "V", "vi", "IV"
}
```

### MelodyPattern（メロディパターン）

```typescript
interface MelodyPattern {
  id: string
  name: string                     // 例: "やさしいメロディ"
  description: string              // 例: "ゆったりと動く、覚えやすいメロディ"
  notes: RelativeNote[]            // スケール相対で定義（移調対応）
  mood: Mood[]                     // 合う雰囲気
  bars: 4                          // 固定: 4小節
}

// スケール上の相対音符（実音はtranspose.tsが変換）
interface RelativeNote {
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8   // 1=ルート, 8=オクターブ上
  octaveShift: -1 | 0 | 1
  duration: NoteDuration           // '1n' | '2n' | '4n' | '8n' | '16n'
  isRest: boolean
}
```

### Instrument（楽器）

```typescript
interface Instrument {
  id: string
  displayName: string              // 例: "ピアノ", "エレキギター"
  roles: TrackRole[]               // この楽器が担当できるパート
  toneJsSynthType: string          // Tone.jsのシンセタイプ
  toneJsOptions: object            // Tone.jsへの設定値（開発者向け）
  genre: Genre[]                   // 向いているジャンル
}
```

### ScheduledNote（再生スケジュール済み音符）

```typescript
// arranger.ts が生成する、Tone.jsに渡す最終形
interface ScheduledNote {
  time: string                     // Tone.js時間形式 例: "0:0:0"
  note: string                     // 実音名 例: "C4", "Am3"
  duration: NoteDuration
}
```

---

## 型定義

```typescript
type Genre   = 'pop' | 'lofi' | 'rock' | 'game' | 'ballad'
type Mood    = 'happy' | 'sad' | 'cool' | 'relaxed' | 'epic'
type Scene   = '朝' | '夜' | '春' | '夏' | 'ドライブ' | '雨' | '切ない' | '元気'
type Scale   = 'major' | 'minor'
type Note    = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
type TrackRole = 'melody' | 'chord' | 'bass' | 'drum'

type ChordQuality = 'major' | 'minor' | 'maj7' | 'm7' | '7' | 'sus4'

type NoteDuration = '1n' | '2n' | '4n' | '8n' | '16n'

type EQPresetId = 'bright' | 'warm' | 'neutral' | 'bass-heavy' | 'airy'
```

---

## エンティティ関係図

```
Song
 ├── genre ──────────────── genres.json
 ├── mood
 ├── chordProgressionId ──── chord-progressions.json
 ├── melodyPatternId ─────── melody-patterns.json
 └── tracks[]
      ├── Track[melody]
      │    ├── instrumentId ─ instruments.json
      │    └── pattern[] ─── arranger.ts が MelodyPattern から生成
      ├── Track[chord]
      │    └── pattern[] ─── arranger.ts が ChordProgression から生成
      ├── Track[bass]
      │    └── pattern[] ─── arranger.ts が ChordProgression のルート音から生成
      └── Track[drum]
           └── pattern[] ─── genres.json のドラムパターンから生成
```

---

## 自動設定の対応表

| ユーザーの選択 | システムが自動設定するもの |
|---|---|
| Genre = "pop" | 基準BPM = 128, 楽器 = ピアノ/シンセ |
| Genre = "lofi" | 基準BPM = 82, Reverbを強く、EQ = warm |
| Genre = "rock" | 基準BPM = 140, Guitar音源, Distortion適用 |
| Genre = "game" | 基準BPM = 150, 8bitシンセ, EQ = bright |
| Genre = "ballad" | 基準BPM = 72, Piano音源, Reverb = airy |
| Scene = "朝" | BPM補正 -8, Scale = major, Key = C |
| Scene = "夜" | BPM補正 -15, Scale = minor |
| Scene = "夏" | BPM補正 +10, Scale = major |
| Scene = "雨" | BPM補正 -18, Scale = minor, Key = Em |
| Scene = "元気" | BPM補正 +12, Scale = major |
| Genre+Mood+Scene の組み合わせ | RecommendationEngineがコード進行を自動決定 |
