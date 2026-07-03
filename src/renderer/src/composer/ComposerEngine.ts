import type { UserIntent, SongBlueprint, RealMoodId, ProgressionOption, DrumOption } from '../theory/types'
import { moods }        from '../data/music/moods'
import { progressions } from '../data/music/progressions'
import { Selector }     from './Selector'
import { generate }     from './Generator'

const REAL_MOODS: RealMoodId[] = ['happy', 'night', 'rain', 'spring']

// 「選択」と「生成」を Selector / Generator に委譲するオーケストレーター
export class ComposerEngine {
  private selector = new Selector()

  // コード選択画面用: ムードに紐づくコード進行の選択肢を返す
  getProgressionOptions(moodId: RealMoodId): ProgressionOption[] {
    return moods[moodId].progressionCandidates.map(c => ({
      id:     c.id,
      label:  c.label,
      chords: progressions[c.id].chords,
    }))
  }

  // ドラム選択画面用: ムードに紐づくドラムパターンの選択肢を返す
  getDrumOptions(moodId: RealMoodId): DrumOption[] {
    return moods[moodId].drumPatternCandidates.map(c => ({
      id:    c.id,
      label: c.label,
    }))
  }

  compose(intent: UserIntent): SongBlueprint {
    const seed   = Math.floor(Math.random() * 1_000_000)
    const moodId: RealMoodId =
      intent.mood === 'random'
        ? REAL_MOODS[Math.floor(Math.random() * REAL_MOODS.length)]
        : intent.mood

    const mood      = moods[moodId]
    const selection = this.selector.select(mood)

    // ユーザーが選んだ場合は Selector の結果を上書き
    const finalSelection = {
      ...selection,
      ...(intent.chordProgressionId && { progressionId: intent.chordProgressionId }),
      ...(intent.drumPatternId      && { drumPatternId: intent.drumPatternId }),
    }

    return { ...generate(mood, finalSelection), seed, moodId }
  }
}

export const composerEngine = new ComposerEngine()
