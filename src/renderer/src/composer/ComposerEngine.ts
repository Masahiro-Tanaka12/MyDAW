import type { UserIntent, SongBlueprint, RealMoodId } from '../theory/types'
import { moods }    from '../data/music/moods'
import { Selector } from './Selector'
import { generate } from './Generator'

const REAL_MOODS: RealMoodId[] = ['happy', 'night', 'rain', 'spring']

// 「選択」と「生成」を Selector / Generator に委譲するオーケストレーター
export class ComposerEngine {
  private selector = new Selector()

  compose(intent: UserIntent): SongBlueprint {
    const seed   = Math.floor(Math.random() * 1_000_000)
    const moodId: RealMoodId =
      intent.mood === 'random'
        ? REAL_MOODS[Math.floor(Math.random() * REAL_MOODS.length)]
        : intent.mood

    const mood      = moods[moodId]
    const selection = this.selector.select(mood)
    return { ...generate(mood, selection), seed, moodId }
  }
}

export const composerEngine = new ComposerEngine()
