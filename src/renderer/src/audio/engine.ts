import * as Tone from 'tone'
import type { PlaybackEventMap, SongBlueprint, TrackData } from '../theory/types'

type Handler<K extends keyof PlaybackEventMap> = (
  payload: PlaybackEventMap[K]
) => void

// コード名 → Tone.js 音符配列（3和音）
function chordNameToNotes(chord: string): string[] {
  const map: Record<string, string[]> = {
    'C':   ['C3', 'E3', 'G3'],
    'Cm':  ['C3', 'Eb3', 'G3'],
    'D':   ['D3', 'F#3', 'A3'],
    'Dm':  ['D3', 'F3', 'A3'],
    'E':   ['E3', 'G#3', 'B3'],
    'Em':  ['E3', 'G3', 'B3'],
    'F':   ['F3', 'A3', 'C4'],
    'Fm':  ['F3', 'Ab3', 'C4'],
    'G':   ['G3', 'B3', 'D4'],
    'Gm':  ['G3', 'Bb3', 'D4'],
    'A':   ['A3', 'C#4', 'E4'],
    'Am':  ['A3', 'C4', 'E4'],
    'B':   ['B3', 'D#4', 'F#4'],
    'Bm':  ['B3', 'D4', 'F#4'],
  }
  return map[chord] ?? ['C3', 'E3', 'G3']
}

export class PlaybackEngine {
  private handlers = new Map<string, Handler<keyof PlaybackEventMap>[]>()
  private activeSynth: Tone.PolySynth | null = null
  private endTimer: ReturnType<typeof setTimeout> | null = null

  on<K extends keyof PlaybackEventMap>(
    event: K,
    handler: Handler<K>
  ): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, [])
    this.handlers.get(event)!.push(handler as Handler<keyof PlaybackEventMap>)
    return () => {
      const list = this.handlers.get(event) ?? []
      this.handlers.set(
        event,
        list.filter(h => h !== (handler as Handler<keyof PlaybackEventMap>))
      )
    }
  }

  private emit<K extends keyof PlaybackEventMap>(
    event: K,
    payload: PlaybackEventMap[K]
  ): void {
    const list = this.handlers.get(event) ?? []
    list.forEach(h => h(payload))
  }

  private cleanup(): void {
    if (this.endTimer !== null) {
      clearTimeout(this.endTimer)
      this.endTimer = null
    }
    if (this.activeSynth) {
      this.activeSynth.dispose()
      this.activeSynth = null
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 主API: SongBlueprint を受け取りコード進行を再生する
  // ─────────────────────────────────────────────────────────────
  async play(blueprint: SongBlueprint): Promise<void> {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.cleanup()

    await Tone.start()

    const { chords, bars } = blueprint.chordProgression
    const { bpm } = blueprint

    Tone.getTransport().bpm.value = bpm

    this.activeSynth = new Tone.PolySynth(Tone.Synth).toDestination()
    const synth = this.activeSynth

    // 1コードあたりの小節数（均等割り）
    const barsPerChord = bars / chords.length

    chords.forEach((chord, i) => {
      const notes = chordNameToNotes(chord)
      Tone.getTransport().schedule((time) => {
        synth.triggerAttackRelease(notes, `${barsPerChord}m`, time)
      }, `${i * barsPerChord}m`)
    })

    Tone.getTransport().start()
    this.emit('play', { bpm })

    // 全小節 + リリース時間後に終了
    const totalSeconds = bars * 4 * (60 / bpm) + 1.5
    this.endTimer = setTimeout(() => {
      this.cleanup()
      this.emit('end', {})
    }, totalSeconds * 1000)
  }

  stop(): void {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.cleanup()
    this.emit('stop', {})
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm
  }

  // Phase 2 で実装: 全トラック（melody/chord/bass/drum）をロード
  async load(_tracks: TrackData[], _bpm: number): Promise<void> {
    this.emit('load', {})
  }

  // @deprecated play(blueprint) を使用してください。今後削除予定。
  async playCMajor(): Promise<void> {
    await Tone.start()
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()
    synth.triggerAttackRelease(['C4', 'E4', 'G4'], '1n')
    this.emit('play', { bpm: 120 })
    setTimeout(() => {
      synth.dispose()
      this.emit('end', {})
    }, 3000)
  }
}

export const playbackEngine = new PlaybackEngine()
