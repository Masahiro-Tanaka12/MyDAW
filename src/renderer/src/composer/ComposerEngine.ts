import type { UserIntent, SongBlueprint, RealMoodId, ProgressionOption, DrumOption, SmartFxOption } from '../theory/types'
import { moods }                from '../data/music/moods'
import { progressionTemplates } from '../data/music/progression-templates'
import { SMART_FX_OPTIONS }     from '../data/music/smart-fx'
import { SCALE_TRANSITIONS }    from '../data/music/theory/transitions'
import { Selector }             from './Selector'
import { generate }             from './Generator'
import {
  resolveChordRoot,
  chordToSymbol,
  DIATONIC_QUALITY,
} from '../theory/chordTheory'

const DEGREE_LABELS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII',
}

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

  // 全テンプレートから進行オプションを返す（任意のムードフィルタ対応）
  // moodFilter 指定時: moodTags 未設定（共通）または moodTags に含まれるものだけ返す
  // moodFilter 未指定時: 全テンプレートを返す
  getAllProgressionOptions(moodFilter?: RealMoodId): ProgressionOption[] {
    const refMood = moodFilter ? moods[moodFilter] : null
    const key     = refMood?.key ?? 'C'

    return Object.values(progressionTemplates)
      .filter(tmpl =>
        !moodFilter || !tmpl.moodTags || tmpl.moodTags.includes(moodFilter),
      )
      .map(tmpl => {
        const chords = tmpl.degrees.map((deg, i) => {
          const quality = tmpl.qualityOverrides[i] ?? DIATONIC_QUALITY[tmpl.scale][deg]
          return chordToSymbol(resolveChordRoot(key, tmpl.scale, deg), quality)
        })
        return { id: tmpl.id, label: tmpl.alias, chords }
      })
  }

  // 次に選べる度数の候補を重み付きで返す（「1コードずつ選ぶ」UI 用）
  getNextDegreeOptions(
    scale: 'major' | 'minor',
    currentDegree: number,
  ): { degree: number; label: string; weight: number }[] {
    const weights = SCALE_TRANSITIONS[scale][currentDegree]
    if (!weights) return []
    return (Object.entries(weights) as [string, number][])
      .map(([deg, weight]) => ({
        degree: Number(deg),
        label:  DEGREE_LABELS[Number(deg)] ?? `${deg}`,
        weight,
      }))
      .sort((a, b) => b.weight - a.weight)
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

    return { ...generate(mood, finalSelection, intent.bpm), seed, moodId }
  }
}

export const composerEngine = new ComposerEngine()
