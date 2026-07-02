import * as Tone from 'tone'
import type { PlaybackEventMap, SongBlueprint, TrackData } from '../theory/types'
import { ChordPlayer } from './players/ChordPlayer'
import { BassPlayer }  from './players/BassPlayer'
import { DrumPlayer }  from './players/DrumPlayer'

type Handler<K extends keyof PlaybackEventMap> = (
  payload: PlaybackEventMap[K]
) => void

const FADE_IN_SEC  = 0.8
const FADE_OUT_SEC = 1.5

export class PlaybackEngine {
  private handlers    = new Map<string, Handler<keyof PlaybackEventMap>[]>()
  private chordPlayer = new ChordPlayer()
  private bassPlayer  = new BassPlayer()
  private drumPlayer  = new DrumPlayer()
  private endTimer:  ReturnType<typeof setTimeout> | null = null
  private fadeTimer: ReturnType<typeof setTimeout> | null = null
  private stopTimer: ReturnType<typeof setTimeout> | null = null

  // マスターチェーン: masterVolume → compressor → limiter → Destination
  private masterVolume = new Tone.Volume(0)
  private compressor   = new Tone.Compressor({ threshold: -18, ratio: 3, attack: 0.02, release: 0.2 })
  private limiter      = new Tone.Limiter(-1)

  constructor() {
    this.masterVolume.chain(this.compressor, this.limiter, Tone.getDestination())
  }

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

  private clearTimers(): void {
    if (this.endTimer  !== null) { clearTimeout(this.endTimer);  this.endTimer  = null }
    if (this.fadeTimer !== null) { clearTimeout(this.fadeTimer); this.fadeTimer = null }
    if (this.stopTimer !== null) { clearTimeout(this.stopTimer); this.stopTimer = null }
  }

  private cleanup(): void {
    this.clearTimers()
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.value = 0
    this.chordPlayer.dispose()
    this.bassPlayer.dispose()
    this.drumPlayer.dispose()
  }

  async play(blueprint: SongBlueprint): Promise<void> {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.cleanup()

    await Tone.start()

    Tone.getTransport().bpm.value = blueprint.bpm

    for (const track of blueprint.tracks) {
      if (track.kind === 'chord') {
        this.chordPlayer.schedule(track, this.masterVolume)
      } else if (track.kind === 'bass') {
        this.bassPlayer.schedule(track, this.masterVolume)
      } else if (track.kind === 'drum') {
        this.drumPlayer.schedule(track, this.masterVolume)
      }
    }

    // フェードイン
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.value = -60
    Tone.getTransport().start()
    this.masterVolume.volume.rampTo(0, FADE_IN_SEC)

    this.emit('play', { bpm: blueprint.bpm })

    const { bars } = blueprint.chordProgression
    const songSeconds = bars * 4 * (60 / blueprint.bpm)

    // フェードアウト：最後のバーが終わる手前から開始
    const fadeOutStartMs = Math.max(0, songSeconds - FADE_OUT_SEC + 0.3) * 1000
    this.fadeTimer = setTimeout(() => {
      this.masterVolume.volume.rampTo(-60, FADE_OUT_SEC)
    }, fadeOutStartMs)

    // フェードアウト完了後にクリーンアップ
    this.endTimer = setTimeout(() => {
      this.cleanup()
      this.emit('end', {})
    }, (songSeconds + 0.5) * 1000)
  }

  stop(): void {
    this.clearTimers()
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.rampTo(-60, 0.15)
    this.stopTimer = setTimeout(() => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      this.chordPlayer.dispose()
      this.bassPlayer.dispose()
      this.drumPlayer.dispose()
      this.masterVolume.volume.value = 0
      this.stopTimer = null
      this.emit('stop', {})
    }, 160)
  }

  setBpm(bpm: number): void {
    Tone.getTransport().bpm.value = bpm
  }

  async load(_tracks: TrackData[], _bpm: number): Promise<void> {
    this.emit('load', {})
  }
}

export const playbackEngine = new PlaybackEngine()
