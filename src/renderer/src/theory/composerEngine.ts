import type { SongBlueprint, UserSelection, WeightConfig } from './types'

export const DEFAULT_WEIGHT: WeightConfig = { genre: 3, mood: 2, scene: 1 }

export class ComposerEngine {
  // Phase 2 で実装: genre+mood+scene → SongBlueprint
  compose(_selection: UserSelection): SongBlueprint {
    throw new Error('ComposerEngine.compose() は Phase 2 で実装')
  }

  // 同じ条件で別パターンを返す（「別の候補」ボタン用）
  composeAlternative(
    _selection: UserSelection,
    _excludeChordId: string
  ): SongBlueprint {
    throw new Error('ComposerEngine.composeAlternative() は Phase 2 で実装')
  }

  // 重みを差し替えて作曲（将来の内部チューニング用。UIには非公開）
  composeWithWeight(
    _selection: UserSelection,
    _weight: WeightConfig
  ): SongBlueprint {
    throw new Error('ComposerEngine.composeWithWeight() は Phase 2 で実装')
  }
}

export const composerEngine = new ComposerEngine()
