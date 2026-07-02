# First Song

> 音楽経験ゼロでも、30分以内に人生初の1曲を完成できる DAW。

---

## コンセプト

既存のDAWは「自由すぎる」。  
初心者が迷うのは、選択肢が多すぎるから。

**First Song** はあえて選べることを減らし、完成率を上げる。

ユーザーが選ぶのは **ムード** だけ。  
コード進行・テンポ・楽器・ミックスはすべて自動で決まる。

---

## スクリーンショット

| ホーム画面 | 再生中 | マイソング |
|---|---|---|
| *(screenshots/home.png)* | *(screenshots/playing.png)* | *(screenshots/mysongs.png)* |

---

## 現在できること（v0.1.0）

| 機能 | 状態 |
|---|---|
| ムード選択（元気 / 夜 / 雨 / 春 / おまかせ）| ✅ |
| コード伴奏・ベース・ドラムの自動生成 | ✅ |
| ムードごとに異なるコード進行・テンポ・ベースライン | ✅ |
| フェードイン・フェードアウト再生 | ✅ |
| マスターコンプレッサー＋リミッター（音割れ防止）| ✅ |
| 曲の保存（ローカル／LocalStorage）| ✅ |
| マイソング一覧（再生・タイトル編集・削除）| ✅ |
| ステップアップ画面 | 🚧 Coming Soon |
| メロディトラック | 🚧 Coming Soon |
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

---

## アーキテクチャ概要

```
[ユーザー] ── ムードを選ぶ ──▶ [ComposerEngine]
                                    │ コード進行・BPM・楽器を自動決定
                                    ▼
                              [SongBlueprint]
                                    │
                                    ▼
                          [PlaybackEngine / Tone.js]
                            │ Volume → Compressor → Limiter → Out
                            ├─ ChordPlayer（Freeverb リバーブ付き）
                            ├─ BassPlayer
                            └─ DrumPlayer
```

音楽理論のデータベース（`src/renderer/src/data/music/`）から候補を重み付き抽選し、毎回異なる曲を生成する。AI は使用しない。

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
