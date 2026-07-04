// 度数ベースの和声理論エンジン
// Electron 対応: Tone.Noise / AudioWorklet に一切依存しない純粋計算モジュール

export type ChordQuality =
  | 'major' | 'minor' | 'diminished'
  | 'major7' | 'dominant7' | 'minor7'

// ── 音程テーブル（ルートからの半音数） ─────────────────────────────────────
export const INTERVALS: Record<ChordQuality, number[]> = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  diminished: [0, 3, 6],
  major7:     [0, 4, 7, 11],
  dominant7:  [0, 4, 7, 10],
  minor7:     [0, 3, 7, 10],
}

// ── スケール音程オフセット（度数 1〜7 → ルートからの半音数）────────────────
export const SCALE_OFFSETS: Record<'major' | 'minor', readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
}

// ── ダイアトニックコード品質（トライアド）──────────────────────────────────
export const DIATONIC_QUALITY: Record<'major' | 'minor', Record<number, ChordQuality>> = {
  major: { 1: 'major', 2: 'minor', 3: 'minor', 4: 'major', 5: 'major', 6: 'minor', 7: 'diminished' },
  minor: { 1: 'minor', 2: 'diminished', 3: 'major', 4: 'minor', 5: 'minor', 6: 'major', 7: 'major' },
}

// ── ダイアトニックコード品質（7th）─────────────────────────────────────────
export const DIATONIC_QUALITY_7TH: Record<'major' | 'minor', Record<number, ChordQuality>> = {
  major: { 1: 'major7', 2: 'minor7', 3: 'minor7', 4: 'major7', 5: 'dominant7', 6: 'minor7', 7: 'minor7' },
  minor: { 1: 'minor7', 2: 'minor7', 3: 'major7', 4: 'minor7', 5: 'minor7', 6: 'major7', 7: 'dominant7' },
}

// 音名配列（0=C … 11=B）。Tone.js が受け付けるエンハーモニック表記に準拠
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

// 音名 → インデックス（エンハーモニック別名も解決）
const ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'E#': 'F', 'Fb': 'E',
  'G#': 'Ab', 'A#': 'Bb', 'B#': 'C', 'Cb': 'B',
}
const NOTE_INDEX: Record<string, number> = Object.fromEntries(
  NOTE_NAMES.map((n, i) => [n, i])
)

function noteIndex(name: string): number {
  const canonical = ENHARMONIC[name] ?? name
  const idx = NOTE_INDEX[canonical]
  if (idx === undefined) throw new Error(`chordTheory: unknown note "${name}"`)
  return idx
}

// ── コードシンボルのサフィックス表 ──────────────────────────────────────────
const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major:      '',
  minor:      'm',
  diminished: 'dim',
  major7:     'M7',
  dominant7:  '7',
  minor7:     'm7',
}

// ── 公開 API ────────────────────────────────────────────────────────────────

/** 度数 → ルート音名（例: key="A", scale="minor", degree=5 → "E"） */
export function resolveChordRoot(
  key: string,
  scale: 'major' | 'minor',
  degree: number,
): string {
  const rootIdx = noteIndex(key)
  const offset  = SCALE_OFFSETS[scale][degree - 1]
  return NOTE_NAMES[(rootIdx + offset) % 12]
}

/** ルート音名 + 品質 → Tone.js ノート文字列の配列（例: "A","minor",3 → ["A3","C4","E4"]） */
export function chordSymbolToNotes(
  root: string,
  quality: ChordQuality,
  octave = 3,
): string[] {
  const rootIdx   = noteIndex(root)
  const intervals = INTERVALS[quality]
  return intervals.map(semitones => {
    const abs  = rootIdx + semitones
    return NOTE_NAMES[abs % 12] + (octave + Math.floor(abs / 12))
  })
}

/**
 * 度数 → Tone.js ノート文字列の配列
 * quality を省略するとダイアトニックデフォルト（トライアド）を使用
 */
export function resolveChordNotes(
  key: string,
  scale: 'major' | 'minor',
  degree: number,
  quality?: ChordQuality,
  octave = 3,
): string[] {
  const root = resolveChordRoot(key, scale, degree)
  const q    = quality ?? DIATONIC_QUALITY[scale][degree]
  return chordSymbolToNotes(root, q, octave)
}

/** ルート名 + 品質 → コードシンボル文字列（例: "A","minor" → "Am"） */
export function chordToSymbol(root: string, quality: ChordQuality): string {
  return root + QUALITY_SUFFIX[quality]
}

/** コードシンボル文字列 → { root, quality }（例: "F#m7" → { root:"F#", quality:"minor7" }） */
export function parseChordSymbol(symbol: string): { root: string; quality: ChordQuality } {
  const m = symbol.match(/^([A-G][b#]?)(.*)$/)
  if (!m) throw new Error(`chordTheory: invalid chord symbol "${symbol}"`)
  const root      = m[1]
  const suffix    = m[2]
  let quality: ChordQuality
  if      (suffix === 'm7')                       quality = 'minor7'
  else if (suffix === 'M7' || suffix === 'maj7')  quality = 'major7'
  else if (suffix === '7')                        quality = 'dominant7'
  else if (suffix === 'm')                        quality = 'minor'
  else if (suffix === 'dim')                      quality = 'diminished'
  else                                            quality = 'major'
  return { root, quality }
}
