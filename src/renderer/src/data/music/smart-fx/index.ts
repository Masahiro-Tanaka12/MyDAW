import type { SmartFxPresetRecord } from '../types'

export const smartFxPresets: Record<string, SmartFxPresetRecord> = {

  preset_neutral: {
    id:    'preset_neutral',
    label: 'おまかせ',
    chord:  { volume:  0, pan:  0,    reverb: 0.1, eq: { low:  0, mid:  0, high:  0 } },
    bass:   { volume:  0, pan:  0,    reverb: 0,   eq: { low:  0, mid:  0, high:  0 } },
    drum:   { volume:  0, pan:  0,    reverb: 0,   eq: { low:  0, mid:  0, high:  0 } },
    melody: { volume:  0, pan:  0,    reverb: 0.1, eq: { low:  0, mid:  0, high:  0 } },
  },

  preset_heavy_bass: {
    id:    'preset_heavy_bass',
    label: 'ズッシリした低音',
    chord:  { volume: -1, pan:  0,    reverb: 0.15, eq: { low: -3, mid: +1, high: -1 } },
    bass:   { volume: +1, pan:  0.05, reverb: 0,    eq: { low: +4, mid:  0, high: -2 } },
    drum:   { volume:  0, pan:  0.05, reverb: 0,    eq: { low: +2, mid: -1, high: -2 } },
    melody: { volume:  0, pan:  0,    reverb: 0.20, eq: { low: -2, mid:  0, high: +1 } },
  },

  preset_clean: {
    id:    'preset_clean',
    label: 'スッキリ',
    chord:  { volume: -1, pan: -0.15, reverb: 0.20, eq: { low: -2, mid:  0, high: +2 } },
    bass:   { volume: -1, pan:  0.05, reverb: 0,    eq: { low:  0, mid: -1, high: +1 } },
    drum:   { volume:  0, pan:  0.15, reverb: 0.10, eq: { low: -1, mid:  0, high: +2 } },
    melody: { volume: +1, pan:  0,    reverb: 0.25, eq: { low: -2, mid: +1, high: +3 } },
  },

  preset_forward_melody: {
    id:    'preset_forward_melody',
    label: '前に出る',
    chord:  { volume: -3, pan:  0,    reverb: 0.25, eq: { low: -1, mid: -3, high: -2 } },
    bass:   { volume: -2, pan:  0.05, reverb: 0,    eq: { low: +1, mid: -2, high: -2 } },
    drum:   { volume: -1, pan:  0,    reverb: 0.10, eq: { low:  0, mid: -2, high: -1 } },
    melody: { volume: +3, pan:  0,    reverb: 0.15, eq: { low: -1, mid: +2, high: +4 } },
  },
}

// ユーザーに見せる選択肢（preset_neutral は内部デフォルトなので除く）
export const SMART_FX_OPTIONS: { id: string; label: string }[] = [
  { id: 'preset_heavy_bass',     label: 'ズッシリした低音' },
  { id: 'preset_clean',          label: 'スッキリ'         },
  { id: 'preset_forward_melody', label: '前に出る'          },
]
