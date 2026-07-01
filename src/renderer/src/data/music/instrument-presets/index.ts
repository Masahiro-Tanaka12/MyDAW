import type { InstrumentPresetRecord } from '../types'

// Phase4.1: 全ムード共通の1プリセット
// Phase5以降: 楽器選択UIと連動して複数プリセットを追加予定
export const instrumentPresets: Record<string, InstrumentPresetRecord> = {
  preset_default: {
    id:             'preset_default',
    chordPresetId:  'pad_warm',
    bassPresetId:   'bass_pluck',
    drumPresetId:   'drum_standard',
    melodyPresetId: 'pop_lead_synth',
  },
}
