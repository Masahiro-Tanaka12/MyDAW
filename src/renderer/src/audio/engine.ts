import * as Tone from 'tone'
import type { PlaybackEventMap, SongBlueprint } from '../theory/types'
import { ChordPlayer } from './players/ChordPlayer'
import { BassPlayer }  from './players/BassPlayer'
import { DrumPlayer }  from './players/DrumPlayer'

type Handler<K extends keyof PlaybackEventMap> = (
  payload: PlaybackEventMap[K]
) => void

const FADE_IN_SEC    = 0.8
const FADE_OUT_SEC   = 1.5
const TARGET_LOOP_SEC = 45  // 目標尺（秒）。小節境界でぴったり終わるよう繰り上げる

export class PlaybackEngine {
  private handlers    = new Map<string, Handler<keyof PlaybackEventMap>[]>()
  private chordPlayer = new ChordPlayer()
  private bassPlayer  = new BassPlayer()
  private drumPlayer  = new DrumPlayer()
  private endTimer:  ReturnType<typeof setTimeout> | null = null
  private fadeTimer: ReturnType<typeof setTimeout> | null = null
  private stopTimer: ReturnType<typeof setTimeout> | null = null

  // サンプラー読み込みは一度だけ。同時に複数回 play() が呼ばれても安全
  private loadPromise: Promise<void> | null = null

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

  // Transport イベントのキャンセルのみ。サンプラーは破棄しない
  private cleanup(): void {
    this.clearTimers()
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.value = 0
  }

  // サンプラーを初期化。2回目以降は即座に返る
  async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('音源の読み込みがタイムアウトしました')), 15000)
        )
        await Promise.race([
          Promise.all([
            this.chordPlayer.load(this.masterVolume),
            this.bassPlayer.load(this.masterVolume),
          ]),
          timeout,
        ])
        this.drumPlayer.load(this.masterVolume)
        this.emit('load', {})
      })()
    }
    return this.loadPromise
  }

  // ロード失敗後のリセット（リトライ用）
  resetLoad(): void {
    this.loadPromise = null
  }

  async play(blueprint: SongBlueprint): Promise<void> {
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.cleanup()

    await Tone.start()
    await this.load()

    Tone.getTransport().bpm.value = blueprint.bpm

    const bars = blueprint.chordProgression.bars

    // 4小節ブロックをループ再生。全プレイヤーのイベントは [0, bars*m) に収まるため
    // Transport がループ境界で先頭に戻るたびに自動的に再発火される
    Tone.getTransport().loop      = true
    Tone.getTransport().loopStart = 0
    Tone.getTransport().loopEnd   = `${bars}m`

    for (const track of blueprint.tracks) {
      if (track.kind === 'chord') {
        this.chordPlayer.schedule(track)
      } else if (track.kind === 'bass') {
        this.bassPlayer.schedule(track)
      } else if (track.kind === 'drum') {
        this.drumPlayer.schedule(track, bars)
      }
    }

    // フェードイン
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.value = -60
    Tone.getTransport().start()
    this.masterVolume.volume.rampTo(0, FADE_IN_SEC)

    this.emit('play', { bpm: blueprint.bpm })

    // 1周の秒数から、目標尺に達する最小ループ回数を求め小節境界でぴったり終わらせる
    const songSeconds = bars * 4 * (60 / blueprint.bpm)
    const loopCount   = Math.ceil(TARGET_LOOP_SEC / songSeconds)
    const totalSec    = songSeconds * loopCount

    const fadeOutStartMs = Math.max(0, totalSec - FADE_OUT_SEC + 0.3) * 1000
    this.fadeTimer = setTimeout(() => {
      this.masterVolume.volume.rampTo(-60, FADE_OUT_SEC)
    }, fadeOutStartMs)

    this.endTimer = setTimeout(() => {
      this.cleanup()
      this.emit('end', {})
    }, (totalSec + 0.5) * 1000)
  }

  stop(): void {
    this.clearTimers()
    Tone.getTransport().loop = false
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    this.masterVolume.volume.cancelScheduledValues(Tone.now())
    this.masterVolume.volume.rampTo(-60, 0.08)
    // volume はここでリセットしない。play() の cleanup() が次回 play 時にリセットする
    this.stopTimer = setTimeout(() => {
      this.stopTimer = null
      this.emit('stop', {})
    }, 120)
  }
}

export const playbackEngine = new PlaybackEngine()
