# RecommendationEngine 設計書

## 役割

ユーザーの選択（ジャンル・雰囲気・シーン）から、
最適なコード進行・メロディパターン・BPMを自動決定する。

ユーザーは「コード進行を選んだ」ことを知らない。
「シーン」を選んだだけで、音楽的に正しい設定がすべて整う。

---

## 入出力

### 入力
```
RecommendationInput {
  genre: Genre          // 'pop' | 'lofi' | 'rock' | 'game' | 'ballad'
  mood: Mood            // 'happy' | 'sad' | 'cool' | 'relaxed' | 'epic'
  scene: Scene          // '朝' | '夜' | '春' | '夏' | 'ドライブ' | '雨' | '切ない' | '元気'
  mode: 'auto' | 'manual'
}
```

### 出力
```
RecommendationOutput {
  chordProgressionId: string   // 選ばれたコード進行
  melodyPatternId: string      // 選ばれたメロディパターン
  bpm: number
  key: Note
  scale: Scale
}
```

---

## シーン定義と目標属性値

各シーンに「target」を定義する。
コード進行の属性スコアがtargetに近いほど高スコアになる。

| シーン | energy | brightness | sadness | tension | 合うジャンル |
|---|---|---|---|---|---|
| 朝 | 50 | 80 | 10 | 15 | pop, lofi, ballad |
| 夜 | 35 | 30 | 50 | 25 | lofi, ballad, rock |
| 春 | 55 | 75 | 20 | 15 | pop, ballad |
| 夏 | 75 | 85 | 5 | 20 | pop, rock, game |
| ドライブ | 70 | 65 | 15 | 35 | pop, rock |
| 雨 | 30 | 25 | 70 | 20 | lofi, ballad |
| 切ない | 35 | 30 | 80 | 40 | pop, ballad, lofi |
| 元気 | 90 | 85 | 5 | 30 | pop, rock, game |

---

## スコアリングアルゴリズム

### Step 1: ジャンルフィルタ
`genre` と `scene.合うジャンル` の両方に一致するコード進行のみを候補とする。

### Step 2: 属性スコア計算
各コード進行について、シーンのtarget値との距離をスコア化する。

```
attributeScore = 100 - (
  |cp.energy     - scene.energy|     +
  |cp.brightness - scene.brightness| +
  |cp.sadness    - scene.sadness|    +
  |cp.tension    - scene.tension|
) / 4
```

### Step 3: 最終スコア計算
```
finalScore = attributeScore  * 0.5
           + cp.beginnerScore * 0.3
           + cp.popularity    * 0.2
```

`beginnerScore` の重みを高くすることで、
スコアが拮抗した場合に初心者向けの定番進行が優先される。

### Step 4: 上位選択
`finalScore` が最も高いコード進行を1つ選択して返す。

---

## おまかせモードの処理

「おまかせで1曲作る」が押されたとき、scene選択をスキップして以下のデフォルト値を使用する。

```
genre = 'pop'
mood  = 'happy'
scene = '元気'
```

その後、通常のスコアリングアルゴリズムを実行する。
`beginnerScore` と `popularity` が高い進行（王道進行など）が自然に選ばれる設計。

---

## BPM決定ルール

ジャンル基準BPMに、シーンによる補正値を加算する。

| シーン | BPM補正 | 理由 |
|---|---|---|
| 朝 | -8 | ゆったりしたスタート感 |
| 夜 | -15 | 落ち着いた深夜の雰囲気 |
| 春 | -5 | 穏やかなテンポ |
| 夏 | +10 | アップテンポで躍動感 |
| ドライブ | +5 | 走る感覚 |
| 雨 | -18 | ゆっくり落ち着いた |
| 切ない | -10 | 感情的なスロー |
| 元気 | +12 | 最も速く、エネルギッシュ |

---

## キー・スケール決定ルール

mood → scene の順に優先して決定する。

| mood | scene上書き | scale | key |
|---|---|---|---|
| happy | - | major | C |
| happy | 夏 | major | G |
| sad | - | minor | Am |
| sad | 雨 | minor | Em |
| cool | - | minor | Am |
| cool | 夜 | minor | Dm |
| relaxed | - | major | F |
| relaxed | 朝 | major | C |
| epic | - | minor | Am |
| epic | 夏 | major | C |

---

## メロディパターン決定ルール

コード進行が決まった後、`scene` と `mood` に合うメロディパターンを選ぶ。

| scene | 推奨メロディパターン |
|---|---|
| 朝, 春 | やさしいメロディ（ステップワイズ） |
| 夏, 元気 | 元気なメロディ（跳躍）, ノリのいいメロディ |
| 夜, 雨, 切ない | 流れるメロディ（山型）, やさしいメロディ |
| ドライブ | ノリのいいメロディ（シンコペーション） |

---

## 実装ファイル

`src/theory/recommendationEngine.ts`

外部から呼び出すインターフェース：

```typescript
recommend(input: RecommendationInput): RecommendationOutput
recommendAuto(): RecommendationOutput   // おまかせモード用
```

- 外部APIへの通信は行わない
- データはすべて `data/` のJSONから読み込む
- ランダム性は持たせない（同じ入力は常に同じ出力）
