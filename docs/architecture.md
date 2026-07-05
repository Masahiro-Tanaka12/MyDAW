# システム設計書 (architecture.md)

## システム全体構成

ユーザーが触るのは「選択」だけ。内部処理はすべて自動。
テンポのみ例外的に数値設定とする(ユーザー判断)

直感モードの主軸は **コード → ドラム → 音質 → メロディ** の4層の逐次選択。
ムード／ジャンルは生成のトリガーではなく、各層の候補を絞り込む **任意のフィルタ**。

```
[ユーザー]
    │ ムード（任意フィルタ）＋テンポ（数値スライダー、例外的に設定）
    ▼
[コード層]  テンプレートから選ぶ／1コードずつ度数で組み立てる
    ▼
[ドラム層]  キック・スネア・ハイハットのグルーヴをリズムプレビュー付きで選ぶ
    ▼
[音質層]    Smart FXの感覚ラベルで選ぶ
    ▼
[メロディ層] 鼻歌を録音し自動採譜（pitchfinder/YIN）
    ▼
[音声エンジンレイヤー]  Tone.js
    │ 自動ミックス（EQ/リバーブ/コンプ/パン）適用
    ▼
[音出力]  スピーカー
```

> **現状**: コード・ドラム・音質・メロディの4層すべてUI化済み。メロディは鼻歌を録音し`pitchfinder`（YIN）で自動採譜する方式（`audio/MelodyRecorder.ts`）。ホーム画面はムードチップ＋テンポスライダー＋コード選択（テンプレート/1コードずつのタブ）そのもの。コード進行は度数（ダイアトニックコード理論）ベースで内部管理し、キーに依存せず使い回せる（詳細は後述の「度数ベース理論エンジン」参照）。ドラムはプリセット選択後、1拍1マスのグリッドで微調整できる（詳細は後述の「DrumGrid」参照）。

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

### なぜコードを絶対音程ではなく度数（ダイアトニックコード理論）で持つか
- 初期実装ではムードごとに `['C', 'G', 'Am', 'F']` のような絶対音程を直書きしていたが、これだと「王道進行」等の同じ形をキーごとに手で書き写す必要があり拡張性がなかった
- さらに、ベースパターンも絶対音程で固定していたため、同じムード内でも進行によってはベースのルート音がコードと一致しない実害あるバグがあった（例: 夜ムードで`komuro`以外の進行を選ぶとベースがズレる）
- `theory/chordTheory.ts` に度数→実音の変換エンジンを作り、進行・ベースとも度数（＋ムードの`key`）から都度解決する方式に統一した。これによりベースは常にコードルートと一致し、進行テンプレートもキーを問わず使い回せる
- 度数の品質（メジャー/マイナー/ディミニッシュ/セブンス）解決は `template.scale` を基準にする（`mood.scale` ではない）。借用和音を含むテンプレート（丸サ進行など）が、ムードのスケールに引きずられず正しく解決されるようにするため

### なぜテンポだけ例外的に数値スライダーか
- 開発ルール上は「設定より選択」だが、テンポはユーザーが「もう少し速く/遅く」と連続的に微調整したい対象であり、有限のラベル選択肢（ゆったり/ふつう/はやい等）に押し込めると使い勝手が落ちる、というユーザー判断による意図的な例外
- 生のBPM数値をそのまま表示してよいことにした（他の層は感覚的なラベルのみで数値を見せない）

### なぜ「1コードずつ選ぶ」と「テンプレートから選ぶ」の2モードか
- 初期構想（brain.txt）にあった「最初のコードを選ぶと次に繋がる候補が理論的に提示される」という体験と、「王道進行のような完成された型をそのまま使いたい」という体験は、どちらも需要があり両立できる
- 内部的には同じ度数エンジンを共有する：テンプレートは度数列の固定パターン、1コードずつ選ぶモードは度数間の遷移重み表（`data/music/theory/transitions.ts`、機能和声の慣習に基づく目安値）から都度候補を提示する

### なぜドラムに「グリッドでの微調整」を追加したか
- プリセット選択だけだと「用意された型から選ぶ」で完結し、ユーザーが持っている「ここは強く」「ここは抜きたい」という細かい意図を反映できない
- ただしフルの16分ステップシーケンサーは直感モードには重すぎる（Phase3 DAWモード相当）ため、「1拍=1マス」という粗い解像度に絞ったグリッドを、プリセットを選んだ後の微調整としてのみ提供する
- グリッドの解像度を超えるパターン（シンコペーション、8分/16分単位のヒットを含むもの）は、微調整の対象から外し「プリセットのまま」使う。無理に丸めて反映すると、選択画面で見た/プレビューした内容と実際に鳴る曲がズレるため（詳細は後述の「DrumGrid」参照）

### なぜメロディ層は鼻歌採譜方式にし、ピッチ検出は自前実装しないか
- 候補から選ぶだけでは、ユーザーが頭の中で思っているメロディを反映できず「ありもの」にしかならないという課題があり、鼻歌を録音してメロディに自動採譜する方式を採用する
- ただし、ピッチ検出アルゴリズム（自己相関/YIN等）をゼロから自前実装するのは実装コストが大きく、車輪の再発明になる。既存のnpmライブラリ（例: pitchy、pitchfinder等）を採用し、実装コストを下げる
- 「AIには依存しない」という開発理念があるため、ライブラリ選定時はニューラルネットベースのピッチ検出（CREPE系等）は避け、自己相関・YIN等の古典的なDSPアルゴリズムを使うものを選ぶ
- 検出したピッチはコード/キーのスケールに沿った音へスナップし、タイミングもリズムグリッドにスナップすることで、歌が多少不正確でも音楽的に破綻しない結果にする
- 歌うのが苦手・恥ずかしいユーザー向けに、候補から選ぶ方式を併用する可能性も残す（要検討）

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
│           ├── App.tsx          # 全画面ロジック（home=コード選択/drum/smartfx/stepup/mysongs）
│           ├── main.tsx
│           │
│           ├── theory/
│           │   ├── types.ts       # UserIntent / SongBlueprint など全体で共有する型定義
│           │   └── chordTheory.ts # 度数ベース和声理論エンジン（度数→実音の変換、純粋計算のみ）
│           │
│           ├── composer/                # 「選択」と「生成」のオーケストレーション
│           │   ├── ComposerEngine.ts    # ムード解決・seed付与・公開API
│           │   ├── Selector.ts          # 重み付きランダム抽選（直前と同じIDを避ける）
│           │   └── Generator.ts         # SelectionSet + Template → SongBlueprint の純粋関数
│           │
│           ├── data/music/              # 音楽理論データベース（TypeScript Record）
│           │   ├── types.ts             # MoodRecord / ProgressionTemplate などのレコード型
│           │   ├── theory/
│           │   │   ├── transitions.ts   # 度数遷移の重み表（1コードずつ選ぶモード用）
│           │   │   └── tempoRange.ts    # テンポスライダーの範囲定義
│           │   ├── moods/               # ComposerEngineの起点テーブル（ムードごとの候補と重み、bpm/key/scale）
│           │   ├── progression-templates/  # コード進行テンプレート（度数ベース、moodTagsで任意に絞り込み）
│           │   ├── bass-patterns/       # ベースパターン（度数+オクターブ、パターン自身のbarsでタイリング）
│           │   ├── drum-patterns/       # ドラムグルーヴ（キック/スネア/ハイハット3声、bars=1でタイリング）
│           │   ├── instrument-presets/  # 楽器音色プリセット（Phase4以降の楽器選択用、現状preset_defaultのみ）
│           │   └── smart-fx/            # Smart FXプリセット（感覚ラベル→トラック別MixConfigの束）
│           │
│           ├── audio/                   # 音声エンジンレイヤー（Tone.jsに依存する唯一の場所）
│           │   ├── engine.ts            # PlaybackEngine（マスターチェーン・共有リバーブバス・ループ再生）
│           │   └── players/
│           │       ├── ChordPlayer.ts   # panner/EQ3/reverbSend付き。度数エンジンでコードシンボル解決
│           │       ├── BassPlayer.ts    # 同上
│           │       └── DrumPlayer.ts    # kick/snare/hihat 3声。EQ3等はdrumVolバスにまとめて適用
│           │
│           └── repository/
│               └── SongRepository.ts    # LocalStorageへの曲データ永続化
│
└── data/                         # 未使用（実データは src/renderer/src/data/music/ 配下）
```

旧 `data/music/progressions/`（絶対音程版）は度数ベースへの移行に伴い削除済み。

---

## レイヤー間のデータフロー（現状のコード選択まで）

```
ユーザーが任意でムードチップを選ぶ（絞り込み）／テンポスライダーを調整
    ↓
コード選択（テンプレートタブ or 1コードずつタブ）で chordProgressionId or customProgression が決まる
    ↓
ドラム選択（getAllDrumOptions） → （グリッド互換パターンなら）4拍グリッドで微調整 → Smart FX選択（getSmartFxOptions）
    ↓
composerEngine.compose({ mood, chordProgressionId | customProgression, drumPatternId, smartFxId, bpm }) が呼ばれる
    ├─ Selector.select() がベース・楽器プリセットを重み付き抽選（ユーザー選択があれば上書き）
    └─ Generator.generate(mood, selection, template, bpmOverride) が SongBlueprint を構築
    ↓
PlaybackEngine.play(blueprint) が Tone.js で再生
  - ChordPlayer / BassPlayer / DrumPlayer が各トラックをスケジュール（トラックごとにEQ3・パン・リバーブセンドを適用）
  - masterVolume → Compressor → Limiter → Destination でフェードイン/アウト
  - Transport.loop でコード進行を約45秒分ループ再生
```

メロディ層が選択UIとして追加されると、上記フローの「Selector.select()」の該当部分がユーザー操作に置き換わる。

コード選択は実際には2モードある。テンプレートタブは`composerEngine.getAllProgressionOptions(moodFilter?)`がカード一覧を返す。1コードずつタブは、ムード未選択なら先にmajor/minorを選び、`getNextDegreeOptions(scale, degree)`で次候補を提示し続け、4〜8個で「できた」を押すと`customProgression`として確定する。`compose()`は`customProgression`があればその場で`ProgressionTemplate`相当を合成し、無ければカタログ(`progressionTemplates`)から解決する。ムード未選択の場合、`compose()`に渡す`mood`は「裏側のバッキングムード」（選んだスケールがmajorなら'happy'、minorなら'night'）で、ドラム・ベースの候補プールと基準キーの解決だけに使う。

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
  chordProgressionId?: string       // テンプレートタブで選んだ場合
  customProgression?: { scale: 'major'|'minor'; degrees: number[] }  // 1コードずつ選ぶモードで組み立てた場合
  drumPatternId?: string
  smartFxId?: string
  bpm?: number                      // テンポスライダーの値（未指定時は mood.bpm）
  instrumentPresetId?: string       // Phase4以降に解放
}

// 出力
type SongBlueprint = {
  seed:             number
  moodId:           RealMoodId
  chordProgression: ChordProgression
  melodyPattern:    MelodyPattern   // 鼻歌録音を採譜した場合は notes: RelativeNote[]。録音なしなら notes: []
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
    // progressionId / bassPatternId / drumPatternId / instrumentPresetId を重み付き抽選
    // smartFxId は常に 'preset_neutral'（ランダム抽選対象にしない）
  }
}
```

将来的にこのクラスを `AISelector` 等に差し替えることを想定した設計（AIによる楽曲生成は禁止事項だが、選択ロジックの差し替え可能性は残す）。

メロディ層がUI化される際は、`Selector.select()` の該当プロパティをユーザー操作の結果で上書きする形で拡張する（コード・ドラム・SmartFXと同じパターン）。

---

### Generator — 「生成」の責務

副作用のない純粋関数。同じ入力なら常に同じ出力を返す（テスト容易）。

```typescript
function generate(
  mood: MoodRecord,
  selection: SelectionSet,
  template: ProgressionTemplate,
  bpmOverride?: number,
): Omit<SongBlueprint, 'seed' | 'moodId'>
```

テンプレートの解決（カタログ参照 or `customProgression`からの合成）は`ComposerEngine`側の責務で、`Generator`は解決済みの`template`を受け取るだけ。`bassPatterns` / `drumPatterns` / `instrumentPresets` / `smartFxPresets` の各データベースから該当IDのレコードを引き、度数を`chordTheory`で実音に解決し、ベース・ドラムはパターン自身の`bars`でタイリングして進行の長さに合わせ、`SongBlueprint`の`tracks`を組み立てる。

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
  bpm:                   number   // テンポスライダーの初期値（ムード選択時）
  key:                   string
  scale:                 'major' | 'minor'
  progressionCandidates: ProgressionCandidateRef[]
  bassPatternCandidates: WeightedRef[]
  drumPatternCandidates: DrumPatternCandidateRef[]
  instrumentPresetId:    string
}
```

ムードは `ComposerEngine` の起点テーブルであり、コード・ベース・ドラムそれぞれの候補プールを絞り込む「任意の」入り口。現状4ムード（happy / night / rain / spring）を実データとして持つ。ムード未選択時は、選んだ/組み立てたコード進行のスケール（major→'happy'、minor→'night'）を「裏側のバッキングムード」として自動的に使い、ドラム・ベースの候補プールと基準キーを決める。

---

### ProgressionTemplate — 度数ベースのコード進行

**ファイル**: `data/music/types.ts`, `data/music/progression-templates/index.ts`, `theory/chordTheory.ts`

```typescript
type ProgressionTemplate = {
  id:               string
  scale:            'major' | 'minor'                       // 品質解決の基準スケール（mood.scaleではない）
  degrees:          number[]                                // ダイアトニック度数（1〜7）
  qualityOverrides: Partial<Record<number, ChordQuality>>    // 借用和音・セブンス化などの例外
  bars:             number
  alias:            string                                  // 日本語ラベル
  moodTags?:        RealMoodId[]                             // 任意。未指定 = 全ムード共通
}
```

18テンプレートを実データとして持つ。既存4ムード×3種（moodTags付き）に加え、汎用6種（moodTagsなし、全ムード共通）として王道進行／循環進行（50年代進行）／カノン進行／小室進行（哀愁進行）／ブルース進行（セブンスコード）／丸サ進行（セブンス＋借用和音）を用意した。

`chordTheory.ts`が度数→実キーのコードシンボル変換を担う（`resolveChordRoot` / `chordSymbolToNotes` / `resolveChordNotes` / `chordToSymbol` / `parseChordSymbol`）。品質未指定の度数は`DIATONIC_QUALITY[template.scale][degree]`のデフォルトを使う。

---

### 公開API

```typescript
class ComposerEngine {
  // 全テンプレートから進行オプションを返す（任意のムードフィルタ対応）
  getAllProgressionOptions(moodFilter?: RealMoodId): ProgressionOption[]

  // 次に選べる度数の候補を重み付きで返す（「1コードずつ選ぶ」UI用）
  getNextDegreeOptions(scale: 'major'|'minor', currentDegree: number): { degree: number; label: string; weight: number }[]

  // ドラムパターンの選択肢を返す（任意のムードフィルタ対応）
  getAllDrumOptions(moodFilter?: RealMoodId): DrumOption[]

  // Smart FXの選択肢を返す（全ムード共通）
  getSmartFxOptions(): SmartFxOption[]

  // 曲を生成する。chordProgressionId/customProgression未指定ならSelectorが自動選択
  compose(intent: UserIntent): SongBlueprint
}
```

---

### スコアリング補足

- `Selector.pick()` は重み付き抽選 + 直前IDの除外
- メロディ層をUI化する際、同様に候補一覧を返すAPIを追加する想定

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
共有リバーブバス: 各プレイヤーの reverbSend → reverbBus(Gain) → Convolver → Limiter
```

- `play()` 呼び出し時にフェードイン（0.8秒）、曲の終わりにフェードアウト（1.5秒）
- `Compressor(threshold: -18, ratio: 3)` + `Limiter(-1)` で音割れを防止
- `Tone.Reverb`は内部で`Tone.Noise`(AudioWorklet/blob:URL)を使いElectronのレンダラープロセスをクラッシュさせるため使用しない。代わりに手動生成したインパルス応答バッファを`Tone.Convolver`に渡す自前リバーブを、`load()`時（AudioContext確立後）に1つだけ生成し、全トラックが共有センドする
- 同様の理由で`Tone.NoiseSynth`も使わず、`DrumPlayer`のスネアは手動生成したノイズバッファを`Tone.Player`で再生する
- コード進行（4〜12小節）を`Transport.loop`で目標尺（約45秒、`TARGET_LOOP_SEC`）に達する最小ループ回数だけ繰り返し、小節境界でぴったり終わる

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
- **`InstrumentPreset`（楽器の音色そのもの）と`SmartFxPreset`（EQ/コンプ等のミックス処理）は意図的に別軸**。同じレコードに混ぜると「音色N種 × 音質M種」の組み合わせを手作業でペアリングする必要が生まれ、組み合わせ爆発を起こすため分離した。

---

## SmartFxPreset 設計

**ファイル**: `src/renderer/src/data/music/smart-fx/index.ts`

### 責務

感覚ラベル（「ズッシリした低音」等）ひとつにつき、コード・ベース・ドラム・メロディそれぞれの`MixConfig`（音量・パン・リバーブ・EQ）をひとまとめにしたプリセットを提供する。DAWモードのトラックミキサーと将来同じ`MixConfig`型を共有する想定（CLAUDE.mdの「直感モードとDAWモードは同じ楽曲データを共有する」を音質面で実現する）。

```typescript
type SmartFxPresetRecord = {
  id:     string
  label:  string
  chord:  MixConfig
  bass:   MixConfig
  drum:   MixConfig
  melody: MixConfig
}
```

`preset_neutral`（全帯域0、控えめなリバーブ）を内部デフォルトとして持ち、ユーザー未選択時やSelectorの自動抽選時はこれを使う。ユーザー向けの選択肢（`SMART_FX_OPTIONS`）からは除外する。

各`Player`（Chord/Bass/Drum）は`synth → panner → EQ3 → output`のドライ経路と、`EQ3 → reverbSend → 共有reverbBus`のセンド経路を持つ。ドラムは kick/snare/hihat をまず`drumVol`（Volume）にまとめてから共通のEQ3に通す。

---

## DrumPatternRecord — キック・スネア・ハイハットのグルーヴ設計

**ファイル**: `src/renderer/src/data/music/drum-patterns/index.ts`

```typescript
type DrumPatternRecord = {
  id:        string
  label:     string
  moodTags?: RealMoodId[]   // 任意。未指定 = 全ムード共通
  bars:      number         // パターン自身の小節長（タイリング単位。基本は1）
  kick:      NoteEvent[]
  snare:     NoteEvent[]
  hihat:     NoteEvent[]
}
```

7グルーヴ（力強いビート／おだやかなビート／控えめなビート／ノリのあるビート／極めて静かなビート／ゆったりしたビート／静かなビート）を実データとして持つ。各グルーヴは1小節分のキック・スネア・ハイハットをまとめて定義し、`Generator.ts`がベースと同じタイリングロジック（`shiftBarTime`流用）でコード進行の小節数まで繰り返す。`DrumPlayer.ts`は`track.kickNotes`/`snareNotes`/`hihatNotes`をそのままスケジュールするだけで、スネア・ハイハットのパターンをハードコードしない。

ドラム選択カードには、キックの拍0〜3のヒット有無・ベロシティから生成した簡易リズムプレビュー（`DrumOption.beatPattern`）を表示する。

`DrumPlayer.schedule()`は`triggerAttackRelease`にvelocityを直接渡せるkick/hihatと異なり、スネアは`Tone.Player`（`start()`にvelocity引数がない）を使うため、発音直前に`snare.volume.value = -12 + Tone.gainToDb(event.velocity)`でdB換算して反映する。

---

## DrumGrid — ドラム4拍グリッドによる微調整

**ファイル**: `src/renderer/src/App.tsx`（`DrumGrid`型・`patternToGrid`/`rowToNotes`/`isGridCompatible`/`drumHint`）、`src/renderer/src/data/music/theory/beatStrength.ts`

### 責務

プリセット選択だけでは反映できないユーザーの細かい意図（「ここは強く」等）を、直感モードの範囲内で補助的に受け止める。フルの16分ステップシーケンサー（Phase3 DAWモード相当）は実装せず、「1拍=1マス」×3声（キック/スネア/ハイハット）という粗い解像度に絞る。

```typescript
type GridVel  = 0 | 0.4 | 0.65 | 0.9   // オフ/弱/中/強
type DrumGrid = {
  kick:  [GridVel, GridVel, GridVel, GridVel]
  snare: [GridVel, GridVel, GridVel, GridVel]
  hihat: [GridVel, GridVel, GridVel, GridVel]
}
```

- プリセットを選ぶと`patternToGrid()`がその内容をグリッドの初期状態として展開する
- セルはクリックで`GRID_VEL_CYCLE = [0, 0.4, 0.65, 0.9]`を順に巡回する
- グリッドの状態はいつでも1小節ループで試聴できる（`handlePreviewDrum`）
- 確定時（`handleConfirmDrum`）は`rowToNotes()`でグリッドを`NoteEvent[]`に変換し、`customDrumNotes`として最終トラックを上書きする

### グリッド非対応パターンのバイパス（`isGridCompatible`）

グリッドは1拍1イベントしか表現できないため、`sub !== 0`（8分・16分単位のヒット）を含むパターンや、同じ拍に複数のヒットを持つパターンは、グリッドに通すと情報が失われる（例：シンコペーションが表拍に矯正される、8分ハイハットが4分に丸められる）。

これを避けるため、`handleChooseDrum()`は選んだプリセットが`isGridCompatible()`を満たすかどうかで分岐する。

```typescript
function isGridCompatible(p: DrumPatternRecord): boolean {
  // bars !== 1、または kick/snare/hihat のいずれかに
  // sub !== 0 のイベントや同拍複数ヒットがあれば false
}
```

- `true`（現状: `drum_4beat_soft` / `drum_4beat_weak` / `drum_halfbeat` / `drum_halfbeat_soft`）→ グリッド画面へ進み、微調整可能
- `false`（現状: `drum_4beat_strong` / `drum_4beat_medium` / `drum_4beat_groove`）→ グリッドをバイパスし、プリセットのデータをそのままSmart FX画面以降に渡す（`customDrumNotes`は`null`のまま、`composerEngine.compose()`がカタログの`drumPatternId`を直接解決する）

判定はパターンIDのハードコードではなく、パターンが実際に持つデータ（`sub`フィールドの有無・拍の重複）から動的に行う。将来ドラムパターンを追加・変更しても、この分類は自動的に追従する。

### 拍節理論とヒントテキスト（`BEAT_STRENGTH` / `drumHint`）

`theory/beatStrength.ts`に、4/4拍子における拍の機能的な強さ（メトリック・ヒエラルキー理論）を構造化データとして持つ。

```typescript
export const BEAT_STRENGTH: Record<0 | 1 | 2 | 3, 'strong' | 'medium' | 'weak_backbeat'> = {
  0: 'strong',        // 1拍目：最強拍
  1: 'weak_backbeat', // 2拍目：弱拍。スネアを置くとバックビートになる
  2: 'medium',        // 3拍目：準強拍
  3: 'weak_backbeat', // 4拍目：弱拍。スネアを置くとバックビートになる
}
```

`drumHint(grid)`（App.tsx）はこのテーブルを参照し、現在のグリッド配置に応じた一言ヒントを動的に生成する（例：2・4拍にスネア→「ポップスらしいノリ（バックビート）」）。ハードコードした拍インデックス比較ではなく、必ずこのテーブルを介して判定することで、理論データとヒント文言の二重管理を避けている。
