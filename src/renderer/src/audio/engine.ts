import * as Tone from 'tone'
import type { PlaybackEventMap, SongBlueprint, TrackData } from '../theory/types'
import { ChordPlayer } from './players/ChordPlayer'

type Handler<K extends keyof PlaybackEventMap> = (
  payload: PlaybackEventMap[K]
) => void

export class PlaybackEngine {
  private handlers = new Map<string, Handler<keyof PlaybackEventMap>[]>()
  private chordPlayer = new ChordPlayer()
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
    this.chordPlayer.dispose()
  }

  async play(blueprint: SongBlueprint): Promise<void> {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.cleanup()

    await Tone.start()

    Tone.getTransport().bpm.value = blueprint.bpm

    for (const track of blueprint.tracks) {
      if (track.kind === 'chord') {
        this.chordPlayer.schedule(track)
      }
      // melody / bass / drum は Phase2以降に追加
    }

    Tone.getTransport().start()
    this.emit('play', { bpm: blueprint.bpm })

    const { bars } = blueprint.chordProgression
    const totalSeconds = bars * 4 * (60 / blueprint.bpm) + 1.5
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
}

export const playbackEngine = new PlaybackEngine()
