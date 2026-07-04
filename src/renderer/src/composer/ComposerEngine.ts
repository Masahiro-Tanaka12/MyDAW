import type { UserIntent, SongBlueprint, RealMoodId, ProgressionOption, DrumOption, SmartFxOption } from '../theory/types'
import { moods }                from '../data/music/moods'
import { progressionTemplates } from '../data/music/progression-templates'
import { SMART_FX_OPTIONS }     from '../data/music/smart-fx'
import { Selector }             from './Selector'
import { generate }             from './Generator'
import {
  resolveChordRoot,
  chordToSymbol,
  DIATONIC_QUALITY,
} from '../theory/chordTheory'

const REAL_MOODS: RealMoodId[] = ['happy', 'night', 'rain', 'spring']

// 「選択」と「生成」を Selector / Generator に委譲するオーケストレーター
export class ComposerEngine {
  private selector = new Selector()

  // コード選択画面用: ムードに紐づくコード進行の選択肢を返す
  getProgressionOptions(moodId: RealMoodId): ProgressionOption[] {
    const mood = moods[moodId]
    return mood.progressionCandidates.map(c => {
      const tmpl = progressionTemplates[c.id]
      const chords = tmpl.degrees.map((deg, i) => {
        const quality = tmpl.qualityOverrides[i] ?? DIATONIC_QUALITY[tmpl.scale][deg]
        return chordToSymbol(resolveChordRoot(mood.key, tmpl.scale, deg), quality)
      })
      return { id: c.id, label: c.label, chords }
    })
  }

  // ドラム選択画面用: ムードに紐づくドラムパターンの選択肢を返す
  getDrumOptions(moodId: RealMoodId): DrumOption[] {
    return moods[moodId].drumPatternCandidates.map(c => ({
      id:    c.id,
      label: c.label,
    }))
  }

  // Smart FX 選択画面用: 全ムード共通の選択肢を返す
  getSmartFxOptions(): SmartFxOption[] {
    return SMART_FX_OPTIONS
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
      ...(intent.smartFxId          && { smartFxId:     intent.smartFxId }),
    }

    return { ...generate(mood, finalSelection), seed, moodId }
  }
}

export const composerEngine = new ComposerEngine()
