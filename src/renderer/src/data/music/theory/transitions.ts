/**
 * コード遷移重みテーブル
 *
 * Stage 2 の「1コードずつ選ぶ」モードで使用する。
 * [現在の度数] → [次の度数: 重み] の形で、よく使われる進行に高い重みを設定。
 *
 * 重みは相対値（合計が100である必要はない）。
 * 一般的なポップス・ロック的な和声進行の傾向を反映している。
 */
export type TransitionWeights = Record<number, Record<number, number>>

export const MAJOR_TRANSITIONS: TransitionWeights = {
  1: { 4: 25, 5: 25, 6: 20, 2: 15, 3: 10, 7: 5 },
  2: { 5: 35, 7: 20, 4: 20, 1: 15, 6: 10 },
  3: { 6: 30, 4: 20, 1: 20, 2: 15, 5: 15 },
  4: { 5: 30, 1: 25, 2: 20, 6: 15, 7: 10 },
  5: { 1: 40, 6: 20, 4: 15, 2: 15, 3: 10 },
  6: { 2: 25, 4: 25, 5: 20, 1: 15, 7: 15 },
  7: { 1: 50, 6: 20, 3: 15, 5: 15 },
}

export const MINOR_TRANSITIONS: TransitionWeights = {
  1: { 7: 25, 6: 25, 4: 20, 5: 20, 3: 10 },
  2: { 5: 35, 7: 30, 1: 20, 3: 15 },
  3: { 6: 25, 4: 25, 7: 20, 1: 15, 5: 15 },
  4: { 7: 25, 1: 25, 5: 20, 6: 20, 3: 10 },
  5: { 1: 35, 6: 20, 4: 20, 7: 15, 3: 10 },
  6: { 7: 25, 3: 25, 4: 20, 2: 15, 1: 15 },
  7: { 1: 40, 3: 20, 6: 20, 4: 20 },
}

export const SCALE_TRANSITIONS: Record<'major' | 'minor', TransitionWeights> = {
  major: MAJOR_TRANSITIONS,
  minor: MINOR_TRANSITIONS,
}

/** 重み付きランダムで次の度数を選ぶ（Stage 2 でコード選択 UI から呼ぶ） */
export function pickNextDegree(
  scale: 'major' | 'minor',
  currentDegree: number,
  rng: () => number = Math.random,
): number {
  const weights = SCALE_TRANSITIONS[scale][currentDegree]
  if (!weights) return 1
  const entries = Object.entries(weights) as [string, number][]
  const total   = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [deg, w] of entries) {
    r -= w
    if (r <= 0) return Number(deg)
  }
  return Number(entries[entries.length - 1][0])
}
