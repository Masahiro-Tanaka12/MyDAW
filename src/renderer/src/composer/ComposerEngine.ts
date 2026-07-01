import type { UserIntent, SongBlueprint, RealMoodId } from '../theory/types'
import { moods }    from '../data/music/moods'
import { Selector } from './Selector'
import { generate } from './Generator'

const REAL_MOODS: RealMoodId[] = ['happy', 'night', 'rain', 'spring']

// 「選択」と「生成」を Selector / Generator に委譲するオーケストレーター
export class ComposerEngine {
  private selector = new Selector()

  compose(intent: UserIntent): SongBlueprint {
    const moodId: RealMoodId =
      intent.mood === 'random'
        ? REAL_MOODS[Math.floor(Math.random() * REAL_MOODS.length)]
        : intent.mood

    const mood      = moods[moodId]
    const selection = this.selector.select(mood)   // 重み付き抽選
    return generate(mood, selection)               // 純粋な組み立て
  }
}

export const composerEngine = new ComposerEngine()
