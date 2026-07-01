# システム設計書 (architecture.md)

## システム全体構成

ユーザーが触るのは「選択」だけ。内部処理はすべて自動。

```
[ユーザー]
    │ ジャンル・雰囲気・コード・メロディ を「選ぶ」だけ
    ▼
[UIレイヤー]  React + Electron
    │ 選択IDを渡す
    ▼
[音楽理論レイヤー]
    │ スケール計算・コード展開・BPM決定
    ▼
[音声エンジンレイヤー]  Tone.js
    │ 自動ミックス（EQ/リバーブ/コンプ/パン）適用
    ▼
[音出力]  スピーカー
```

---

## 採用技術

| 技術 | 用途 | 選定理由 |
|---|---|---|
| **Electron** | デスクトップアプリ化 | Windows/Mac両対応、ファイル保存が容易 |
| **React + TypeScript** | UI構築 | 型安全、画面ウィザード実装に適切 |
| **Tone.js** | 音声合成・再生 | 音楽的タイミング管理、内蔵シンセ・エフェクト |
| **Zustand** | 状態管理 | シンプルAPI、ボイラープレートが少ない |
| **Vite** | ビルドツール | 高速HMR、Electron-viteプラグインで連携 |
| **Tailwind CSS** | スタイリング | 素早いUI構築、カスタムデザイン対応 |

> AIライブラリは使用しない。すべての候補提示は `data/` 以下のJSONデータベースから行う。

---

## アーキテクチャ判断

### なぜWebアプリではなくElectronか
- 音声処理はローカルリソースを使う方が安定する
- ファイル保存（曲データのエクスポート）がブラウザより容易
- 「DAWっぽさ」がユーザーの初回体験に寄与する

### なぜMIDIではなくTone.jsか
- MIDI設定はユーザーへの負荷が高い（ドライバ、デバイス選択）
- Tone.jsはブラウザ音源のみで完結、インストール不要
- Phase1では音が鳴ること > 音質

### なぜZustandか（ReduxやContextではなく）
- 画面ウィザードの「現在の選択状態」管理のみでよい
- グローバル状態が少なく、Reduxは過剰

---

## フォルダ構成案

```
MyDAW/
├── docs/                        # 設計書（このファイル群）
├── src/
│   ├── main/                    # Electronメインプロセス
│   │   └── index.ts             # ウィンドウ生成・IPC設定
│   │
│   ├── renderer/                # Reactアプリ（UIレイヤー）
│   │   ├── screens/             # 画面単位のコンポーネント
│   │   │   ├── WelcomeScreen.tsx   # おまかせ / 自分で選ぶ の分岐
│   │   │   ├── GenreScreen.tsx
│   │   │   ├── MoodScreen.tsx
│   │   │   ├── SceneScreen.tsx     # シーン・感情選択（コード進行は非表示）
│   │   │   ├── MelodyScreen.tsx
│   │   │   ├── PlayScreen.tsx
│   │   │   └── CompleteScreen.tsx
│   │   ├── components/          # 再利用UIパーツ
│   │   │   ├── SelectCard.tsx   # 選択カード（共通）
│   │   │   ├── PreviewButton.tsx # 試し聴きボタン
│   │   │   └── ProgressBar.tsx  # ステップ進捗
│   │   └── store/
│   │       └── songStore.ts     # Zustandストア（選択状態管理）
│   │
│   ├── audio/                   # 音声エンジンレイヤー
│   │   ├── engine.ts            # Tone.jsラッパー（再生・停止・BPM設定）
│   │   ├── instruments.ts       # 楽器プリセット定義
│   │   ├── arranger.ts          # コード進行→パート別音符列に変換
│   │   └── mixer.ts             # 自動ミックス（ユーザー非公開）
│   │
│   └── theory/                  # 音楽理論レイヤー
│       ├── composerEngine.ts        # オーケストレーター（SongBlueprint を生成）
│       ├── resolvers/               # 責務分割された個別リゾルバー
│       │   ├── genreResolver.ts     # ジャンル → BPMセンター・キー候補
│       │   ├── moodResolver.ts      # 雰囲気 → スケール・明暗・エネルギー
│       │   ├── sceneResolver.ts     # シーン → テンポ補正・密度
│       │   ├── chordResolver.ts     # コンテキスト → コード進行スコアリング
│       │   ├── melodyResolver.ts    # コンテキスト → メロディパターン選択
│       │   └── bpmResolver.ts       # コンテキスト → BPM確定
│       ├── transpose.ts             # 相対音程→実音変換
│       ├── chordVoicing.ts          # コードの音符展開
│       └── db.ts                    # data/ JSONの読み込み・検索
│
├── data/                        # 音楽理論DB（JSONファイル）
│   ├── chord-progressions.json  # コード進行パターン
│   ├── melody-patterns.json     # メロディパターン
│   ├── genres.json              # ジャンル定義（BPM・キー候補）
│   └── instruments.json         # 楽器プリセット
│
└── public/
    └── samples/                 # 将来の音声サンプル置き場（Phase3以降）
```

---

## レイヤー間のデータフロー

```
ユーザーが「ジャンル=Pop, 雰囲気=Happy, シーン=朝」を選択
    ↓
theory/composerEngine.ts が genre+mood+scene から
chord-progressions.json の属性スコアをスコアリングし
最適なコード進行・BPM・キーを自動決定（ユーザーには見えない）
    ↓
ユーザーがメロディを選択
    ↓
audio/arranger.ts が 4トラック分の音符列を生成
  - melody: MelodyPatternをKeyに移調
  - chord: コードを3音ボイシングに展開
  - bass:  コードのルート音を8分音符で生成
  - drum:  ジャンル別パターンを適用
    ↓
audio/mixer.ts が各トラックにEQ・リバーブ・コンプを自動適用
    ↓
audio/engine.ts が Tone.js で再生
```

---

## ComposerEngine 詳細設計

**ファイル**: `src/renderer/theory/composerEngine.ts`  
**サブモジュール**: `src/renderer/theory/resolvers/`

### 責務

ユーザーが選んだ「ジャンル・雰囲気・シーン」を受け取り、
コード進行・メロディパターン・BPM・キー・楽器割り当てを含む
**曲全体の設計図（SongBlueprint）** を生成して返す。

「推薦」ではなく「作曲」の代行。ユーザーは音楽理論を一切知らなくてよい。

---

### 入出力

```typescript
// 入力
type UserSelection = {
  genre: string;   // "pop" | "rock" | "jazz" | "edm" | ...
  mood:  string;   // "happy" | "sad" | "cool" | "dreamy" | ...
  scene: string;   // "morning" | "night" | "drive" | "relax" | ...
};

// 出力
type SongBlueprint = {
  chordProgression: ChordProgression;
  melodyPattern:    MelodyPattern;
  bpm:              number;
  key:              string;            // "C" | "G" | "Am" | ...
  scale:            string;            // "major" | "minor" | "dorian" | ...
  instrumentMap:    InstrumentMap;     // トラック別プリセットID
};

type ChordProgression = {
  id:     string;     // "pop_basic_01"
  chords: string[];   // ["C", "Am", "F", "G"]
  bars:   number;     // 4 | 8 | 16
};

type MelodyPattern = {
  id:      string;
  notes:   RelativeNote[];   // 相対音程（transpose.ts で実音に変換）
};

type InstrumentMap = {
  melody: string;   // preset id
  chord:  string;
  bass:   string;
  drum:   string;
};
```

---

### サブリゾルバー設計

ComposerEngine は6つのリゾルバーを順に呼び出してSongBlueprintを組み立てる。
各リゾルバーは単一の判断のみを行い、依存は `context` オブジェクト経由で受け取る。

```
UserSelection
    │
    ├─→ GenreResolver  → GenreContext  (BPMセンター・キー候補・スケール傾向)
    ├─→ MoodResolver   → MoodContext   (明暗・エネルギー・スケール優先度)
    ├─→ SceneResolver  → SceneContext  (テンポ補正値・密度)
    │
    │   ↓ 3つのContextを統合
    ├─→ ChordResolver  → ChordProgression  (スコアリングで選択)
    ├─→ BPMResolver    → number            (Contextとコード進行から確定)
    └─→ MelodyResolver → MelodyPattern     (キー・スケール・ジャンルで選択)
```

#### GenreResolver

```typescript
type GenreContext = {
  bpmCenter:  number;            // ジャンルの標準BPM
  keyPool:    Record<"major" | "minor", string[]>;  // 使いやすいキー一覧
  scaleBias:  "major" | "minor" | "neutral";        // ジャンルのスケール傾向
};

// genres.json を参照して返す。ロジックなし、純粋なデータ取得。
function resolveGenre(genre: string): GenreContext;
```

#### MoodResolver

```typescript
type MoodContext = {
  scalePref:  "major" | "minor";   // happy→major, sad→minor
  energy:     number;              // 0〜1（テンポ上振れの度合い）
  brightness: number;              // 0〜1（将来のInstrumentPreset.character選択に使用）
};

function resolveMood(mood: string): MoodContext;
```

#### SceneResolver

```typescript
type SceneContext = {
  tempoModifier: number;   // -10〜+10 BPMへの加算値。朝=+5, 夜=-5 など
  density:       "sparse" | "normal" | "dense";  // 将来のアレンジ密度制御用
};

function resolveScene(scene: string): SceneContext;
```

#### ChordResolver

```typescript
// WeightConfig（後述）を受け取り、スコアリングを行う
function resolveChord(
  selection: UserSelection,
  weight:    WeightConfig
): ChordProgression;
```

#### BPMResolver

```typescript
function resolveBpm(
  genreCtx: GenreContext,
  sceneCtx: SceneContext,
  moodCtx:  MoodContext,
  chord:    ChordProgression
): number;
// 計算: bpmCenter + tempoModifier + (energy * 10) を chord.bpmRange でクランプ
```

#### MelodyResolver

```typescript
function resolveMelody(
  genre: string,
  key:   string,
  scale: string
): MelodyPattern;
```

---

### WeightConfig — スコアリング重み設定

ChordResolver のスコアリングで使う重みを外部から差し替えられる設計。
**初心者は一切触らない**。デフォルト値がそのまま使われる。

```typescript
type WeightConfig = {
  genre: number;   // default: 3（最重要）
  mood:  number;   // default: 2
  scene: number;   // default: 1
};

const DEFAULT_WEIGHT: WeightConfig = { genre: 3, mood: 2, scene: 1 };

// スコア計算（ChordResolver 内部）
function calcScore(
  entry:     ChordProgressionEntry,
  selection: UserSelection,
  weight:    WeightConfig
): number {
  let s = 0;
  if (entry.tags.genre.includes(selection.genre)) s += weight.genre;
  if (entry.tags.mood.includes(selection.mood))   s += weight.mood;
  if (entry.tags.scene.includes(selection.scene)) s += weight.scene;
  return s;
}
```

WeightConfig の用途：
- **Phase1〜2**: 変更しない。デフォルト固定。
- **Phase3以降**: A/Bテスト・ジャンルごとの精度チューニングに使用。
- UIには **公開しない**。

---

### 公開API

```typescript
class ComposerEngine {
  // 通常の作曲（デフォルト重みを使用）
  compose(selection: UserSelection): SongBlueprint;

  // 同じ条件で別の候補を返す（「別のパターン」ボタン用）
  composeAlternative(
    selection: UserSelection,
    excludeChordId: string
  ): SongBlueprint;

  // 重みを上書きして作曲（将来の内部チューニング用。UIには非公開）
  composeWithWeight(
    selection: UserSelection,
    weight:    WeightConfig
  ): SongBlueprint;
}
```

---

### スコアリング補足

- 同スコアが複数ある場合は **ランダムに1つ選ぶ**（毎回同じ結果にならないよう）
- スコアが0のエントリーは候補から除外
- フォールバック（全エントリーが0点）は `genre` 一致のみのエントリーを使用
- フォールバックも空なら `chord-progressions.json` の先頭エントリーを使用

---

## PlaybackEngine 詳細設計

**ファイル**: `src/renderer/audio/engine.ts`

### 責務

Tone.js を薄くラップし、再生・停止・BPM変更などの操作を提供する。
このモジュールだけが Tone.js に依存する唯一の場所。

**UIは状態をポーリングしない。イベントを購読するだけ。**

---

### 状態モデル

```
idle ──→ loading ──→ ready ──→ playing ──→ stopped
                       ↑__________________________|
```

- `idle`: 初期状態。AudioContext 未起動。
- `loading`: `load()` 実行中。再生ボタンは無効。
- `ready`: ロード完了。再生可能。
- `playing`: Transport 動作中。音が出ている。
- `stopped`: Transport 停止。頭に戻った状態。

---

### イベント設計

UIはエンジンの状態を `getState()` で取得しない。
**イベントのみを購読し、自身のUIステートを更新する。**

```typescript
type PlaybackEventMap = {
  play:    { bpm: number };
  stop:    {};
  end:     {};                              // ループ1周完了、または曲終了
  tick:    { bar: number; beat: number };   // 再生位置の定期通知
  load:    {};                              // ロード完了
};
```

```typescript
// イベント購読API
class PlaybackEngine {
  on<K extends keyof PlaybackEventMap>(
    event:   K,
    handler: (payload: PlaybackEventMap[K]) => void
  ): () => void;   // 戻り値は unsubscribe 関数
}
```

#### UIでの使用例

```typescript
// PlayScreen.tsx
useEffect(() => {
  const off = [
    engine.on("play",  ()         => setIsPlaying(true)),
    engine.on("stop",  ()         => setIsPlaying(false)),
    engine.on("end",   ()         => setIsPlaying(false)),
    engine.on("tick",  ({ bar })  => setCurrentBar(bar)),
    engine.on("load",  ()         => setCanPlay(true)),
  ];
  return () => off.forEach(fn => fn());
}, []);
```

UIコンポーネントはエンジンの内部状態を一切知らない。
イベントが来たら自分のstateを更新するだけ。

---

### 公開API

```typescript
class PlaybackEngine {
  // 曲データをセットして再生準備（"load" イベントで完了通知）
  load(tracks: TrackData[], bpm: number): Promise<void>;

  // 再生（初回はAudioContext起動を兼ねる。ユーザー操作から呼ぶこと）
  play(): void;

  // 停止（頭に戻る）
  stop(): void;

  // BPMをライブ変更（再生中も即時反映）
  setBpm(bpm: number): void;

  // イベント購読（戻り値で購読解除）
  on<K extends keyof PlaybackEventMap>(
    event:   K,
    handler: (payload: PlaybackEventMap[K]) => void
  ): () => void;
}
```

`getState()` は公開しない。UIが状態をポーリングする設計にしない。

---

### インターフェース型

```typescript
type TrackData = {
  id:        "melody" | "chord" | "bass" | "drum";
  notes:     NoteEvent[];
  preset:    InstrumentPreset;
  mixConfig: MixConfig;
};

type NoteEvent = {
  time:     string;   // "0:0:0" = 小節:拍:細分
  note:     string;   // "C4" | "rest"
  duration: string;   // "4n" | "8n" | "2n"
  velocity: number;   // 0.0〜1.0
};

type MixConfig = {
  volume: number;   // dB (-20〜0)
  pan:    number;   // -1〜1
  reverb: number;   // 0〜1
  eq: { low: number; mid: number; high: number };
};
```

---

### 内部実装方針

```typescript
function buildPart(track: TrackData): Tone.Part {
  const synth = buildSynth(track.preset);
  applyMix(synth, track.mixConfig);
  return new Tone.Part((time, event) => {
    if (event.note !== "rest") {
      synth.triggerAttackRelease(event.note, event.duration, time, event.velocity);
    }
  }, track.notes);
}

function setupLoop(bars: number): void {
  Tone.Transport.loopStart = 0;
  Tone.Transport.loopEnd   = `${bars}m`;
  Tone.Transport.loop      = true;
}

// ループ1周完了を "end" イベントとして発火
Tone.Transport.scheduleRepeat((time) => {
  if (Tone.Transport.position === "0:0:0") emit("end", {});
}, "1m");
```

---

### 注意事項

- `Tone.start()` はユーザー操作イベント内でのみ呼べる（ブラウザ制約）。
  `play()` は必ずボタンクリックハンドラから呼ぶこと。
- UIは `load()` の `Promise` 完了ではなく `"load"` イベントで再生ボタンを有効化する。
- 複数回 `load()` する場合は前の Part を `dispose()` してからセットする。

---

## InstrumentPreset 設計

**ファイル**: `src/renderer/audio/instruments.ts`  
**データ**: `data/instruments.json`

### 責務

トラック種別（melody / chord / bass / drum）ごとに
どんな音を鳴らすかを定義する。

ユーザーは楽器を選ばない。ジャンルに応じて自動で割り当てられる。

---

### 型定義

```typescript
type SynthType = "synth" | "amSynth" | "fmSynth" | "membraneSynth" | "metalSynth";

type EnvelopeConfig = {
  attack:  number;   // 秒 (0.001〜2.0)
  decay:   number;   // 秒
  sustain: number;   // 0〜1
  release: number;   // 秒
};

// 音の質感を表す属性。将来の自動選択に使用。ユーザーには非表示。
type SoundCharacter =
  | "warm"    // 暖かい・丸い（pad系、ピアノ）
  | "bright"  // 明るい・抜ける（リード、アコギ）
  | "hard"    // 硬い・アタックが強い（ロック系、EDMリード）
  | "soft"    // 柔らかい・控えめ（ストリングス、バックコーラス）
  | "dark"    // 暗い・重い（マイナー系、deep house）
  | "airy";   // 空気感・軽い（アコースティック、フルート系）

type InstrumentPreset = {
  id:          string;              // "pop_lead_synth"
  label:       string;              // デバッグ用（ユーザーには非表示）
  synthType:   SynthType;
  envelope:    EnvelopeConfig;
  character:   SoundCharacter[];    // 複数指定可。例: ["warm", "soft"]
  oscillator?: {
    type: "sine" | "square" | "sawtooth" | "triangle";
  };
  modulationIndex?: number;   // fmSynth 専用
  harmonicity?:     number;   // amSynth / fmSynth 専用
};
```

---

### character の使われ方

**Phase1〜2**: データとして保持するのみ。音生成には影響しない。

**Phase3以降（予定）**:  
MoodResolver が `brightness` / `energy` を返し、
`getPresetForTrack()` がそれを使って character でプリセットを絞り込む。

```
mood=happy (brightness: 0.8) → character "bright" を優先して選択
mood=sad   (brightness: 0.2) → character "warm" or "dark" を優先して選択
```

ユーザーは「暖かい音にして」とは言わない。
moodを選ぶだけで自動的に character が考慮される。

---

### ジャンル別プリセット割り当て表

| ジャンル | melody | chord | bass | drum |
|---|---|---|---|---|
| pop | `pop_lead_synth` | `pad_warm` | `bass_pluck` | `drum_standard` |
| rock | `lead_distortion` | `pad_power` | `bass_driven` | `drum_rock` |
| jazz | `piano_soft` | `piano_chord` | `bass_acoustic` | `drum_brush` |
| edm | `lead_edm` | `pad_edm` | `bass_edm` | `drum_edm` |

割り当てロジックは `getPresetForTrack(genre, trackId)` が担う。

---

### プリセット例（instruments.json）

```json
{
  "presets": [
    {
      "id": "pop_lead_synth",
      "label": "Pop Lead",
      "synthType": "synth",
      "character": ["bright", "soft"],
      "oscillator": { "type": "triangle" },
      "envelope": {
        "attack":  0.02,
        "decay":   0.1,
        "sustain": 0.5,
        "release": 0.8
      }
    },
    {
      "id": "pad_warm",
      "label": "Warm Pad",
      "synthType": "amSynth",
      "character": ["warm", "soft"],
      "harmonicity": 2.5,
      "envelope": {
        "attack":  0.4,
        "decay":   0.2,
        "sustain": 0.8,
        "release": 1.5
      }
    },
    {
      "id": "lead_distortion",
      "label": "Distortion Lead",
      "synthType": "fmSynth",
      "character": ["hard", "bright"],
      "modulationIndex": 10,
      "harmonicity": 3,
      "envelope": {
        "attack":  0.01,
        "decay":   0.2,
        "sustain": 0.6,
        "release": 0.5
      }
    },
    {
      "id": "drum_standard",
      "label": "Standard Kit",
      "synthType": "membraneSynth",
      "character": ["hard"],
      "envelope": {
        "attack":  0.001,
        "decay":   0.4,
        "sustain": 0.0,
        "release": 0.1
      }
    }
  ]
}
```

---

### 公開API

```typescript
// instruments.json からプリセットを取得
function getPresetById(id: string): InstrumentPreset;

// ジャンルとトラック種別から適切なプリセットを自動選択
function getPresetForTrack(
  genre:   string,
  trackId: "melody" | "chord" | "bass" | "drum"
): InstrumentPreset;

// InstrumentPreset → Tone.js のシンセインスタンスに変換
function buildSynth(
  preset: InstrumentPreset
): Tone.Synth | Tone.AMSynth | Tone.FMSynth | Tone.MembraneSynth;
```

---

### 設計上の制約

- Phase1〜2 では Tone.js 内蔵シンセのみ使用。外部サンプルファイルは使わない。
- Phase3 以降、`synthType: "sampler"` を追加して実音源に切り替える拡張を想定。
  型定義を変えずに `buildSynth()` 内の分岐追加だけで対応する。
- `character` はデータ定義のみ。UIには Phase3 以降まで公開しない。
- ユーザーがプリセットを選ぶ画面は **Phase3 以降まで実装しない**。
