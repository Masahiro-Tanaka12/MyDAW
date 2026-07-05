import type { UserIntent, SongBlueprint, RealMoodId, ProgressionOption, DrumOption, SmartFxOption } from '../theory/types'
import type { ProgressionTemplate }            from '../data/music/types'
import { moods }                from '../data/music/moods'
import { progressionTemplates } from '../data/music/progression-templates'
import { drumPatterns }         from '../data/music/drum-patterns'
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

function extractBeatPattern(notes: import('../theory/types').NoteEvent[]): (number | null)[] {
  const beats: (number | null)[] = [null, null, null, null]
  for (const ev of notes) {
    const [barStr, beatStr] = ev.time.split(':')
    if (parseInt(barStr, 10) !== 0) continue
    const beat = parseInt(beatStr, 10)
    if (beat >= 0 && beat <= 3) beats[beat] = ev.velocity
  }
  return beats
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

  // ドラム選択画面用: 全パターンから任意のムードフィルタで絞り込む
  // moodFilter 指定時: moodTags 未設定（共通）または moodTags に含まれるものだけ返す
  // moodFilter 未指定時: 全パターンを返す
  getAllDrumOptions(moodFilter?: RealMoodId): DrumOption[] {
    return Object.values(drumPatterns)
      .filter(p => !moodFilter || !p.moodTags || p.moodTags.includes(moodFilter))
      .map(p => ({ id: p.id, label: p.label, beatPattern: extractBeatPattern(p.kick) }))
  }

  // 後方互換: 単一ムードで絞り込む
  getDrumOptions(moodId: RealMoodId): DrumOption[] {
    return this.getAllDrumOptions(moodId)
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

    // customProgression が指定されていればその場でテンプレートを組み立てる
    // 指定なしの場合はカタログから ID で引く
    const template: ProgressionTemplate = intent.customProgression
      ? {
          id:               'custom',
          scale:            intent.customProgression.scale,
          degrees:          intent.customProgression.degrees,
          qualityOverrides: {},
          bars:             intent.customProgression.degrees.length,
          alias:            'マイ進行',
        }
      : progressionTemplates[finalSelection.progressionId]

    return { ...generate(mood, finalSelection, template, intent.bpm, intent.melodyNotes), seed, moodId }
  }
}

export const composerEngine = new ComposerEngine()
