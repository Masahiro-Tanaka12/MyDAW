import type { TrackId } from '../theory/types'

export type SynthType =
  | 'synth'
  | 'amSynth'
  | 'fmSynth'
  | 'membraneSynth'
  | 'metalSynth'

export type SoundCharacter =
  | 'warm'    // 暖かい・丸い
  | 'bright'  // 明るい・抜ける
  | 'hard'    // 硬い・アタックが強い
  | 'soft'    // 柔らかい・控えめ
  | 'dark'    // 暗い・重い
  | 'airy'    // 空気感・軽い

export type EnvelopeConfig = {
  attack:  number  // 秒 (0.001〜2.0)
  decay:   number
  sustain: number  // 0〜1
  release: number
}

export type InstrumentPreset = {
  id:               string
  label:            string          // デバッグ用（ユーザーには非表示）
  synthType:        SynthType
  envelope:         EnvelopeConfig
  character:        SoundCharacter[] // Phase 3以降の自動選択で使用
  oscillator?:      { type: 'sine' | 'square' | 'sawtooth' | 'triangle' }
  modulationIndex?: number           // fmSynth 専用
  harmonicity?:     number           // amSynth / fmSynth 専用
}

// Phase 1 用プリセット定義（Phase 3 以降 instruments.json から読み込む）
const PRESETS: Record<string, InstrumentPreset> = {
  pop_lead_synth: {
    id: 'pop_lead_synth',
    label: 'Pop Lead',
    synthType: 'synth',
    character: ['bright', 'soft'],
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
  },
  pad_warm: {
    id: 'pad_warm',
    label: 'Warm Pad',
    synthType: 'amSynth',
    character: ['warm', 'soft'],
    harmonicity: 2.5,
    envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.5 },
  },
  bass_pluck: {
    id: 'bass_pluck',
    label: 'Bass Pluck',
    synthType: 'synth',
    character: ['warm'],
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.2 },
  },
  drum_standard: {
    id: 'drum_standard',
    label: 'Standard Kit',
    synthType: 'membraneSynth',
    character: ['hard'],
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.0, release: 0.1 },
  },
}

// ジャンル×トラック種別 → プリセットID
const GENRE_PRESET_MAP: Record<string, Record<TrackId, string>> = {
  pop:  { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  rock: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  jazz: { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
  edm:  { melody: 'pop_lead_synth', chord: 'pad_warm', bass: 'bass_pluck', drum: 'drum_standard' },
}

export function getPresetById(id: string): InstrumentPreset {
  const preset = PRESETS[id]
  if (!preset) throw new Error(`InstrumentPreset not found: ${id}`)
  return preset
}

export function getPresetForTrack(genre: string, trackId: TrackId): InstrumentPreset {
  const map = GENRE_PRESET_MAP[genre] ?? GENRE_PRESET_MAP['pop']
  return getPresetById(map[trackId])
}
