import type { SongBlueprint, NoteEvent, RelativeNote } from '../theory/types'
import type { MoodRecord, ProgressionTemplate }         from '../data/music/types'
import type { SelectionSet }                            from './Selector'
import { bassPatterns }                                 from '../data/music/bass-patterns'
import { drumPatterns }                                 from '../data/music/drum-patterns'
import { instrumentPresets }                            from '../data/music/instrument-presets'
import { smartFxPresets }                               from '../data/music/smart-fx'
import {
  resolveChordRoot,
  chordToSymbol,
  DIATONIC_QUALITY,
  scaleDegreeToNote,
} from '../theory/chordTheory'

function shiftBarTime(time: string, barOffset: number): string {
  if (time.endsWith('m')) {
    return `${parseFloat(time.slice(0, -1)) + barOffset}m`
  }
  const [bar, ...rest] = time.split(':')
  return [parseInt(bar, 10) + barOffset, ...rest].join(':')
}

// 「生成」の責務を担う純粋関数
// template はカタログ由来でも customProgression 由来でも同じ経路で処理する
// 副作用なし・同じ入力なら常に同じ出力（テスト容易）
export function generate(
  mood:          MoodRecord,
  selection:     SelectionSet,
  template:      ProgressionTemplate,
  bpmOverride?:  number,
  melodyNotes?:  RelativeNote[],
): Omit<SongBlueprint, 'seed' | 'moodId'> {
  const bass   = bassPatterns[selection.bassPatternId]
  const drum   = drumPatterns[selection.drumPatternId]
  const preset = instrumentPresets[selection.instrumentPresetId]
  const fx     = smartFxPresets[selection.smartFxId] ?? smartFxPresets['preset_neutral']

  function tileDrumVoice(events: NoteEvent[]): NoteEvent[] {
    const drumBars    = drum.bars
    const repeatCount = Math.ceil(template.bars / drumBars)
    const result: NoteEvent[] = []
    for (let r = 0; r < repeatCount; r++) {
      const barOffset = r * drumBars
      for (const ev of events) {
        const evBar = parseInt(ev.time.split(':')[0], 10)
        if (evBar + barOffset >= template.bars) continue
        result.push({ ...ev, time: shiftBarTime(ev.time, barOffset) })
      }
    }
    return result
  }

  // テンプレートの度数 → 実キーのコードシンボル文字列に解決
  // scale は mood ではなく template 基準（借用和音テンプレートで正しく解決するため）
  const chords: string[] = template.degrees.map((deg, i) => {
    const quality = template.qualityOverrides[i] ?? DIATONIC_QUALITY[template.scale][deg]
    return chordToSymbol(resolveChordRoot(mood.key, template.scale, deg), quality)
  })

  const chordProgression = { id: template.id, chords, bars: template.bars }

  // ベースパターンを実ルート音に解決（タイリング対応）
  const chordRoots  = template.degrees.map(d => resolveChordRoot(mood.key, template.scale, d))
  const patternBars = bass.bars
  const repeatCount = Math.ceil(template.bars / patternBars)
  const bassNotes: NoteEvent[] = []
  for (let r = 0; r < repeatCount; r++) {
    const barOffset = r * patternBars
    for (const ev of bass.events) {
      const evBar = ev.time.endsWith('m')
        ? parseFloat(ev.time.slice(0, -1))
        : parseInt(ev.time.split(':')[0], 10)
      if (evBar + barOffset >= template.bars) continue
      bassNotes.push({
        time:     shiftBarTime(ev.time, barOffset),
        note:     chordRoots[(ev.chordIndex + barOffset) % chordRoots.length] + ev.octave,
        duration: ev.duration,
        velocity: ev.velocity,
      })
    }
  }

  // RelativeNote[] → NoteEvent[]（メロディがある場合のみ）
  const melodyNoteEvents: NoteEvent[] = (melodyNotes ?? []).reduce<NoteEvent[]>(
    (acc, rn, i) => {
      // 直前ノートの終端時刻を概算して次の開始位置を決める（単純な連結）
      const prev    = acc[acc.length - 1]
      const prevEnd = prev ? prev.time : '0:0:0'
      // Tone.js の時刻計算を避けるため、小節:拍:細分 形式で単純にインデックスを使う
      // 8分音符単位の通算インデックスとして i を利用（簡易実装）
      const beatIdx  = i  // 各ノートを順に並べるための連番（簡易）
      const bar      = Math.floor(beatIdx / 8)
      const beat     = Math.floor((beatIdx % 8) / 2)
      const sub      = (beatIdx % 2) * 2  // 0 or 2
      const time     = `${bar}:${beat}:${sub}`
      if (bar >= template.bars) return acc  // 曲の長さを超えたら追加しない
      acc.push({ time, note: scaleDegreeToNote(rn.degree, mood.key, mood.scale), duration: rn.duration, velocity: rn.velocity })
      return acc
    },
    [],
  )

  const melodyPattern = melodyNotes && melodyNotes.length > 0
    ? { id: 'recorded', notes: melodyNotes }
    : { id: 'none', notes: [] }

  const tracks: SongBlueprint['tracks'] = [
    {
      kind:        'chord',
      presetId:    preset.chordPresetId,
      progression: chordProgression,
      mixConfig:   fx.chord,
    },
    {
      kind:      'bass',
      presetId:  preset.bassPresetId,
      notes:     bassNotes,
      mixConfig: fx.bass,
    },
    {
      kind:        'drum',
      presetId:    preset.drumPresetId,
      kickNotes:   tileDrumVoice(drum.kick),
      snareNotes:  tileDrumVoice(drum.snare),
      hihatNotes:  tileDrumVoice(drum.hihat),
      mixConfig:   fx.drum,
    },
  ]

  if (melodyNoteEvents.length > 0) {
    tracks.push({
      kind:      'melody',
      presetId:  preset.melodyPresetId,
      pattern:   melodyPattern,
      notes:     melodyNoteEvents,
      mixConfig: fx.chord,  // SmartFX にメロディ専用設定がなければコードと共用
    })
  }

  return {
    bpm:   bpmOverride ?? mood.bpm,
    key:   mood.key,
    scale: mood.scale,
    chordProgression,
    melodyPattern,
    instrumentMap: {
      melody: preset.melodyPresetId,
      chord:  preset.chordPresetId,
      bass:   preset.bassPresetId,
      drum:   preset.drumPresetId,
    },
    tracks,
  }
}
