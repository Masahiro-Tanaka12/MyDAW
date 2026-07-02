import type { InstrumentPresetRecord } from '../types'

// 現在は全ムード共通の1プリセット。楽器選択UI実装時に拡充予定
export const instrumentPresets: Record<string, InstrumentPresetRecord> = {
  preset_default: {
    id:             'preset_default',
    chordPresetId:  'pad_warm',
    bassPresetId:   'bass_pluck',
    drumPresetId:   'drum_standard',
    melodyPresetId: 'pop_lead_synth',
  },
}
