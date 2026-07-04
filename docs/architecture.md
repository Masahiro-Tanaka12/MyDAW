# システム設計書 (architecture.md)

## システム全体構成

ユーザーが触るのは「選択」だけ。内部処理はすべて自動。
テンポのみ例外的に数値設定とする(ユーザー判断)

直感モードの主軸は **コード → ドラム → 音質 → メロディ** の4層の逐次選択。
ムード／ジャンルは生成のトリガーではなく、各層の候補を絞り込む **任意のフィルタ**。

```
[ユーザー]
    │ ムード／ジャンルを「選ぶ」（任意・フィルタとして機能）
    ▼
[コード層]  4コードセット／進行候補から選ぶ
    ▼
[ドラム層]  パターンを選ぶ
    ▼
[音質層]    Smart FXの感覚ラベルで選ぶ
    ▼
[メロディ層] 候補から選ぶ
    ▼
[音声エンジンレイヤー]  Tone.js
    │ 自動ミックス（EQ/リバーブ/コンプ/パン）適用
    ▼
[音出力]  スピーカー
```

> **現状（v0.1.0）**: 実装済みなのは「ムード選択（フィルタ）→ コード選択」まで。ドラム・音質・メロディは `Selector` が重み付きランダムで自動的に決めており、まだユーザーに選択肢として見せていない（Roadmap: v0.2.0で選択UI化）。

---

## 採用技術

| 技術 | 用途 | 選定理由 |
|---|---|---|
| **Electron** | デスクトップアプリ化 | Windows/Mac両対応、ファイル保存が容易 |
| **React + TypeScript** | UI構築 | 型安全、画面ウィザード実装に適切 |
| **Tone.js** | 音声合成・再生 | 音楽的タイミング管理、内蔵シンセ・エフェクト |
| **Zustand** | 状態管理 | 依存として導入済みだが現状未使用（`useState`＋イベントバスで足りている）。DAWモード（Phase3）でピアノロール・ミキサーの状態管理が複雑化した時点で採用する |
| **Vite** | ビルドツール | 高速HMR、Electron-viteプラグインで連携 |

> AIライブラリは使用しない。すべての候補提示は `data/music/` 以下のTypeScriptデータベースから行う。

---

## アーキテクチャ判断

### なぜWebアプリではなくElectronか
- 音声処理はローカルリソースを使う方が安定する
- ファイル保存（曲データのエクスポート）がブラウザより容易
- 「DAWっぽさ」がユーザーの初回体験に寄与する

### なぜMIDIではなくTone.jsか
- MIDI設定はユーザーへの負荷が高い（ドライバ、デバイス選択）
- Tone.jsはブラウザ音源のみで完結、インストール不要
- Phase1〜2では内蔵シンセのみを使用し、音質より「音が鳴ること」を優先する（実音サンプルは未使用）

### なぜ4層の逐次選択で、ジャンル×ムード×シーンの3軸生成ではないか
- 初期草案（`brain.txt`、旧architecture.md）では「ジャンル・ムード・シーン」の3軸を入力にGenre/Mood/SceneResolverがコード進行を一括スコアリングして決定する設計だった
- しかし、ユーザーが最初に3つの抽象的な軸を選ばされるのは「選ぶだけで曲が完成する」という直感モードの体験として遠回りになる
- コード → ドラム → 音質 → メロディという「曲を組み立てていく手触り」を4つのカード選択に分解し、ムード／ジャンルはその手前で候補を絞り込む**任意のフィルタ**に格下げする
- 3軸Resolver構想は古い草案として扱い、以後のResolver設計は「4層それぞれの候補フィルタ」として再定義する

### なぜTypeScript Recordであり、JSON DBではないか
- 初期草案では `data/*.json` を音楽理論DBとする想定だったが、実装では `data/music/*/index.ts` の `Record` オブジェクトを採用した
- 型安全（`MoodRecord` 等の型でコンパイル時に検証できる）とimportの軽さを優先し、これを正式なデータ形式とする
- JSONファイルへの移行は行わない

---

## フォルダ構成（現状）

```
MyDAW/
├── docs/                        # 設計書（このファイル群）
├── src/
│   ├── main/                    # Electronメインプロセス
│   ├── preload/
│   │
│   └── renderer/
│       ├── public/samples/      # 将来の音声サンプル置き場（Phase3以降）
│       └── src/
│           ├── App.tsx          # 全画面ロジック（home/chord/stepup/mysongs）
│           ├── main.tsx
│           │
│           ├── theory/
│           │   └── types.ts     # UserIntent / SongBlueprint など全体で共有する型定義
│           │
│           ├── composer/                # 「選択」と「生成」のオーケストレーション
│           │   ├── ComposerEngine.ts    # ムード解決・seed付与・公開API
│           │   ├── Selector.ts          # 重み付きランダム抽選（直前と同じIDを避ける）
│           │   └── Generator.ts         # SelectionSet → SongBlueprint の純粋関数
│           │
│           ├── data/music/              # 音楽理論データベース（TypeScript Record）
│           │   ├── types.ts             # MoodRecord / ProgressionRecord などのレコード型
│           │   ├── moods/               # ComposerEngineの起点テーブル（ムードごとの候補と重み）
│           │   ├── progressions/        # コード進行の実データ
│           │   ├── bass-patterns/
│           │   ├── drum-patterns/
│           │   └── instrument-presets/
│           │
│           ├── audio/                   # 音声エンジンレイヤー（Tone.jsに依存する唯一の場所）
│           │   ├── engine.ts            # PlaybackEngine（マスターチェーン・再生制御）
│           │   └── players/
│           │       ├── ChordPlayer.ts
│           │       ├── BassPlayer.ts
│           │       └── DrumPlayer.ts
│           │
│           └── repository/
│               └── SongRepository.ts    # LocalStorageへの曲データ永続化
│
└── data/                         # 未使用（実データは src/renderer/src/data/music/ 配下）
```

---

## レイヤー間のデータフロー（現状のコード選択まで）

```
ユーザーが「ムード=happy」を選択（任意・フィルタ）
    ↓
App.tsx が composerEngine.getProgressionOptions('happy') を呼び
moods['happy'].progressionCandidates をコード選択カードとして提示
    ↓
ユーザーがコード進行カードを選択
    ↓
composerEngine.compose({ mood, chordProgressionId }) が呼ばれる
    ├─ Selector.select() がドラム・ベース・楽器プリセットを重み付き抽選（未UI化）
    └─ Generator.generate() が SelectionSet + MoodRecord から SongBlueprint を構築
    ↓
PlaybackEngine.play(blueprint) が Tone.js で再生
  - ChordPlayer / BassPlayer / DrumPlayer が各トラックをスケジュール
  - masterVolume → Compressor → Limiter → Destination でフェードイン/アウト
```

ドラム・音質・メロディの層が選択UIとして追加されると、上記フローの「Selector.select()」の該当部分がユーザー操作に置き換わる。

---

## ComposerEngine 詳細設計

**ファイル**: `src/renderer/src/composer/ComposerEngine.ts`
**関連**: `Selector.ts`（選択）, `Generator.ts`（生成）, `data/music/types.ts`（レコード型）

### 責務

`ComposerEngine` は「選択」を `Selector` に、「生成」を `Generator` に委譲するオーケストレーター。

- ムードの解決（`random` → 実ムードへの変換）
- `seed` の付与（保存曲のタイトル生成に使用）
- ユーザーが選んだコード進行での上書き

「推薦」ではなく「作曲」の代行。ユーザーは音楽理論を一切知らなくてよい。

---

### 入出力

```typescript
// 入力（theory/types.ts）
type UserIntent = {
  mood: MoodId                      // 'happy' | 'night' | 'rain' | 'spring' | 'random'
  chordProgressionId?: string       // コード層でユーザーが選んだ場合に指定
  tempo?: number                    // Phase4以降に解放
  instrumentPresetId?: string       // Phase4以降に解放
}

// 出力
type SongBlueprint = {
  seed:             number
  moodId:           RealMoodId
  chordProgression: ChordProgression
  melodyPattern:    MelodyPattern   // 現状 notes: [] （メロディ層は未実装）
  bpm:              number
  key:              string
  scale:            'major' | 'minor'
  instrumentMap:    InstrumentMap
  tracks:           TrackLayer[]
}
```

---

### Selector — 「選択」の責務

重み付きランダム抽選を行う。直前と同じIDが選ばれるとバリエーションが乏しくなるため、可能な限り直前と異なる候補を選ぶ。

```typescript
class Selector {
  select(mood: MoodRecord): SelectionSet {
    // progressionId / bassPatternId / drumPatternId / instrumentPresetId を
    // mood.progressionCandidates 等から重み付き抽選
  }
}
```

将来的にこのクラスを `AISelector` 等に差し替えることを想定した設計（AIによる楽曲生成は禁止事項だが、選択ロジックの差し替え可能性は残す）。

ドラム層・音質層・メロディ層がUI化される際は、`Selector.select()` の該当プロパティをユーザー操作の結果で上書きする形で拡張する（`ComposerEngine.compose()` が `chordProgressionId` を上書きしているのと同じパターン）。

---

### Generator — 「生成」の責務

副作用のない純粋関数。同じ入力なら常に同じ出力を返す（テスト容易）。

```typescript
function generate(
  mood: MoodRecord,
  selection: SelectionSet
): Omit<SongBlueprint, 'seed' | 'moodId'>
```

`progressions` / `bassPatterns` / `drumPatterns` / `instrumentPresets` の各データベースから該当IDのレコードを引き、`SongBlueprint` の `tracks` を組み立てる。

---

### MoodRecord — ムード（フィルタ）のデータ構造

**ファイル**: `data/music/types.ts`, `data/music/moods/index.ts`

```typescript
type WeightedRef = {
  id:     string
  weight: number   // 相対的な選ばれやすさ。合計が100である必要はない
}

type ProgressionCandidateRef = WeightedRef & {
  label: string    // コード選択カードに表示する日本語ラベル（例: "王道の明るさ"）
}

type MoodRecord = {
  id:                    string
  bpm:                   number
  key:                   string
  scale:                 'major' | 'minor'
  progressionCandidates: ProgressionCandidateRef[]
  bassPatternCandidates: WeightedRef[]
  drumPatternCandidates: WeightedRef[]
  instrumentPresetId:    string
}
```

ムードは `ComposerEngine` の起点テーブルであり、コード・ベース・ドラムそれぞれの候補プールを絞り込む。現状4ムード（happy / night / rain / spring）を実データとして持つ。

---

### 公開API

```typescript
class ComposerEngine {
  // ムードに紐づくコード進行の選択肢を返す（コード選択カード用）
  getProgressionOptions(moodId: RealMoodId): ProgressionOption[]

  // 曲を生成する。chordProgressionId未指定ならSelectorが自動選択
  compose(intent: UserIntent): SongBlueprint
}
```

---

### スコアリング補足

- `Selector.pick()` は重み付き抽選 + 直前IDの除外
- 将来ドラム・音質・メロディ層をUI化する際、各層の候補一覧を返すAPI（`getDrumPatternOptions()` 等）を `ComposerEngine` に追加する想定

---

## PlaybackEngine 詳細設計

**ファイル**: `src/renderer/src/audio/engine.ts`

### 責務

Tone.js を薄くラップし、`SongBlueprint` を受け取って再生・停止を行う。
このモジュール（と `audio/players/` 配下）だけが Tone.js に依存する。

**UIは状態をポーリングしない。イベントを購読するだけ。**

---

### マスターチェーン

```
masterVolume（フェードイン/アウト制御）→ Compressor → Limiter → Destination
```

- `play()` 呼び出し時にフェードイン（0.8秒）、曲の終わりにフェードアウト（1.5秒）
- `Compressor(threshold: -18, ratio: 3)` + `Limiter(-1)` で音割れを防止

---

### イベント設計

```typescript
type PlaybackEventMap = {
  play: { bpm: number }
  stop: Record<string, never>
  end:  Record<string, never>   // フェードアウト完了・曲終了
  tick: { bar: number; beat: number }
  load: Record<string, never>
}

class PlaybackEngine {
  on<K extends keyof PlaybackEventMap>(
    event:   K,
    handler: (payload: PlaybackEventMap[K]) => void
  ): () => void   // 戻り値は unsubscribe 関数
}
```

UIコンポーネント（`App.tsx`）はエンジンの内部状態を一切知らない。イベントが来たら自分のstateを更新するだけ。

---

### 公開API

```typescript
class PlaybackEngine {
  // 音源を初期化（初回のみ実処理、2回目以降は即座に返る）
  load(): Promise<void>

  // SongBlueprintをスケジュールして再生。初回はAudioContext起動を兼ねる
  play(blueprint: SongBlueprint): Promise<void>

  // 停止（フェードアウト後に"stop"イベント）
  stop(): void

  // 失敗時のリトライ用にloadPromiseをリセット
  resetLoad(): void

  on<K extends keyof PlaybackEventMap>(
    event:   K,
    handler: (payload: PlaybackEventMap[K]) => void
  ): () => void
}
```

`getState()` は公開しない。UIが状態をポーリングする設計にしない。

---

### 注意事項

- `Tone.start()` はユーザー操作イベント内でのみ呼べる（ブラウザ制約）。`play()` は必ずボタンクリックハンドラから呼ぶこと。
- `unhandledrejection` をグローバルに拾い、Tone.jsが内部でrejectするケースもエラー状態に落とす（`App.tsx`）。

---

## InstrumentPreset 設計

**ファイル**: `src/renderer/src/data/music/instrument-presets/index.ts`

### 責務

トラック種別（melody / chord / bass / drum）ごとにどんな音を鳴らすかを定義する。ユーザーは楽器を選ばない。ムードに応じて自動で割り当てられる（現状は全ムード共通の `preset_default` のみ。Known Issues参照）。

```typescript
type InstrumentPresetRecord = {
  id:             string
  chordPresetId:  string
  bassPresetId:   string
  drumPresetId:   string
  melodyPresetId: string
}
```

### 設計上の制約

- Phase1〜2 では Tone.js 内蔵シンセのみ使用。外部サンプルファイルは使わない。
- Phase3 以降、サンプル音源への切り替えを想定するが、型定義への影響は最小限に抑える。
- ユーザーがプリセットを直接選ぶ画面は Phase3 以降まで実装しない（音質選択は「Smart FXの感覚ラベル」経由のみ）。
