import type { WeightedRef, MoodRecord } from '../data/music/types'

export type SelectionSet = {
  progressionId:      string
  bassPatternId:      string
  drumPatternId:      string
  instrumentPresetId: string
}

// 「選択」の責務を担うクラス
// 将来: このクラスを AISelector に差し替えることで選択ロジックを AI 化できる
export class Selector {
  private last: Partial<SelectionSet> = {}

  // 重み付きランダム抽選（直前と同じ ID を可能な限り避ける）
  private pick(candidates: WeightedRef[], excludeId?: string): string {
    let pool = candidates

    if (excludeId !== undefined && candidates.length > 1) {
      const filtered = candidates.filter(c => c.id !== excludeId)
      if (filtered.length > 0) pool = filtered
    }

    const total = pool.reduce((sum, c) => sum + c.weight, 0)
    let r = Math.random() * total
    for (const c of pool) {
      r -= c.weight
      if (r <= 0) return c.id
    }
    return pool[pool.length - 1].id
  }

  select(mood: MoodRecord): SelectionSet {
    const result: SelectionSet = {
      progressionId:      this.pick(mood.progressionCandidates, this.last.progressionId),
      bassPatternId:      this.pick(mood.bassPatternCandidates, this.last.bassPatternId),
      drumPatternId:      this.pick(mood.drumPatternCandidates, this.last.drumPatternId),
      instrumentPresetId: mood.instrumentPresetId,
    }
    this.last = result
    return result
  }
}
