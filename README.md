# First Song

> 音楽経験ゼロでも、30分以内に人生初の1曲を完成できる DAW。

---

## コンセプト

既存のDAWは「自由すぎる」。  
初心者が迷うのは、選択肢が多すぎるから。

**First Song** はあえて選べることを減らし、完成率を上げる。

直感モードの主軸は **コード → ドラム → 音質 → メロディ** の4層の逐次選択。  
ムード／ジャンルは生成のトリガーではなく、各層の候補を絞り込む **任意のフィルタ**。  
テンポ・楽器・ミックスはすべて自動で決まる。

> 現在のv0.1.0はこの4層のうち「コード」までを実装済み（詳細は下表）。ドラム・音質・メロディの選択UIは開発中。

---

## スクリーンショット

| ホーム画面 | 再生中 | マイソング |
|---|---|---|
| *(screenshots/home.png)* | *(screenshots/playing.png)* | *(screenshots/mysongs.png)* |

---

## 現在できること（v0.1.0）

| 機能 | 状態 |
|---|---|
| ムード選択（元気 / 夜 / 雨 / 春 / おまかせ。以降の候補を絞り込むフィルタ）| ✅ |
| コード進行の選択（ムードごとに3候補からカード選択）| ✅ |
| ベース・ドラムの自動生成（重み付き抽選。選択UIはまだ無い）| ✅ |
| Tone.js内蔵シンセによる再生（実音サンプルは未使用）| ✅ |
| フェードイン・フェードアウト再生 | ✅ |
| マスターコンプレッサー＋リミッター（音割れ防止）| ✅ |
| 曲の保存（ローカル／LocalStorage）| ✅ |
| マイソング一覧（再生・タイトル編集・削除）| ✅ |
| ドラムパターンの選択UI | 🚧 Coming Soon |
| Smart FX Wizard（音質の感覚ラベル選択）| 🚧 Coming Soon |
| メロディトラック | 🚧 Coming Soon |
| ステップアップ（DAWモード）画面 | 🚧 Coming Soon |
| WAV エクスポート | 🚧 Coming Soon |

---

## 開発

```bash
npm install
npm run dev
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動（Electron + Vite HMR）|
| `npm run build` | プロダクションビルド |

---

## 技術スタック

| 技術 | 用途 |
|---|---|
| Electron 28 | デスクトップアプリ化 |
| React 18 + TypeScript | UI 構築 |
| Tone.js 14 | 音声合成・再生・エフェクト |
| Vite / electron-vite | ビルド・HMR |
| LocalStorage | 曲データの永続化 |
| Zustand | 依存として導入済みだが未使用。DAWモード（Phase3）導入時に状態管理として採用予定 |

---

## アーキテクチャ概要

```
[ユーザー] ── ムード選択（任意フィルタ）──▶ [ComposerEngine]
                                                  │ moods[moodId] を起点に
                                                  ▼
[ユーザー] ── コード選択 ──▶            [Selector] 候補を重み付き抽選
                                                  │ (SelectionSet)
                                                  ▼
                                          [Generator] 純粋関数
                                                  │
                                                  ▼
                                          [SongBlueprint]
                                                  │
                                                  ▼
                                  [PlaybackEngine / Tone.js]
                                    │ masterVolume → Compressor → Limiter → Out
                                    ├─ ChordPlayer
                                    ├─ BassPlayer
                                    └─ DrumPlayer
```

`ComposerEngine`（オーケストレーター）・`Selector`（重み付き抽選）・`Generator`（`SelectionSet` → `SongBlueprint` の純粋関数）の3分割構成（`src/renderer/src/composer/`）。

音楽理論のデータベースは TypeScript の Record オブジェクト（`src/renderer/src/data/music/`）として定義され、これが正式なデータ形式（JSONへの移行はしない）。AI は使用しない。

詳細は [アーキテクチャ詳細](docs/architecture.md) を参照。

---

## ドキュメント

- [ロードマップ](docs/roadmap.md)
- [既知の課題](docs/known-issues.md)
- [アーキテクチャ詳細](docs/architecture.md)

---

## 開発理念

> 「音楽経験ゼロのユーザーが、15〜30分で人生初の1曲を完成できること」
>
> 自由を減らし、完成率を上げることを最優先とする。
