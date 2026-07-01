import type { SongBlueprint }  from '../theory/types'
import type { MoodRecord }     from '../data/music/types'
import type { SelectionSet }   from './Selector'
import { progressions }        from '../data/music/progressions'
import { bassPatterns }        from '../data/music/bass-patterns'
import { drumPatterns }        from '../data/music/drum-patterns'
import { instrumentPresets }   from '../data/music/instrument-presets'

// 「生成」の責務を担う純粋関数
// SelectionSet（選ばれた ID 群）+ MoodRecord → SongBlueprint（seed/moodId は ComposerEngine が付与）
// 副作用なし・同じ入力なら常に同じ出力（テスト容易）
export function generate(mood: MoodRecord, selection: SelectionSet): Omit<SongBlueprint, 'seed' | 'moodId'> {
  const prog   = progressions[selection.progressionId]
  const bass   = bassPatterns[selection.bassPatternId]
  const drum   = drumPatterns[selection.drumPatternId]
  const preset = instrumentPresets[selection.instrumentPresetId]

  return {
    bpm:   mood.bpm,
    key:   mood.key,
    scale: mood.scale,
    chordProgression: {
      id:     prog.id,
      chords: prog.chords,
      bars:   prog.bars,
    },
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
        progression: { id: prog.id, chords: prog.chords, bars: prog.bars },
      },
      {
        kind:     'bass',
        presetId: preset.bassPresetId,
        notes:    bass.notes,
      },
      {
        kind:     'drum',
        presetId: preset.drumPresetId,
        notes:    drum.notes,
      },
    ],
  }
}
