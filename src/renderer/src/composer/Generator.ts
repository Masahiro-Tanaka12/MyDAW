import type { SongBlueprint, NoteEvent }        from '../theory/types'
import type { MoodRecord, ProgressionTemplate }  from '../data/music/types'
import type { SelectionSet }                     from './Selector'
import { bassPatterns }                          from '../data/music/bass-patterns'
import { drumPatterns }                          from '../data/music/drum-patterns'
import { instrumentPresets }                     from '../data/music/instrument-presets'
import { smartFxPresets }                        from '../data/music/smart-fx'
import {
  resolveChordRoot,
  chordToSymbol,
  DIATONIC_QUALITY,
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
  mood:        MoodRecord,
  selection:   SelectionSet,
  template:    ProgressionTemplate,
  bpmOverride?: number,
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

  return {
    bpm:   bpmOverride ?? mood.bpm,
    key:   mood.key,
    scale: mood.scale,
    chordProgression,
    melodyPattern: { id: 'none', notes: [] },
    instrumentMap: {
      melody: preset.melodyPresetId,
      chord:  preset.chordPresetId,
      bass:   preset.bassPresetId,
      drum:   preset.drumPresetId,
    },
    tracks: [
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
    ],
  }
}
