import * as Tone from 'tone'
import { YIN } from 'pitchfinder'
import type { RelativeNote } from '../theory/types'
import { midiToScaleDegree } from '../theory/chordTheory'

const FRAME_SIZE   = 2048
const HOP_SIZE     = 512
const RMS_THRESH   = 0.01
const PITCH_THRESH = 0.15
const MIN_NOTE_SEC = 0.08

// AudioWorklet プロセッサーコード。
// decodeAudioData を一切使わず PCM を直接収集するための実装。
const WORKLET_CODE = `
class MelodyRecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0]?.[0]
    if (ch && ch.length > 0) {
      this.port.postMessage(new Float32Array(ch))
    }
    return true
  }
}
registerProcessor('melody-recorder-processor', MelodyRecorderProcessor)
`

function rms(buf: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

function freqToMidi(freq: number): number {
  return Math.round(69 + 12 * Math.log2(freq / 440))
}

function quantizeDuration(seconds: number, bpm: number): string {
  const eighthSec = 60 / bpm / 2
  const units     = Math.max(1, Math.round(seconds / eighthSec))
  if (units >= 16) return '1m'
  if (units >= 8)  return '2n'
  if (units >= 4)  return '4n'
  if (units >= 2)  return '8n'
  return '16n'
}

interface RawSegment { midi: number; frames: number }

function segment(frameHz: (number | null)[]): RawSegment[] {
  const segs: RawSegment[] = []
  let cur: RawSegment | null = null
  for (const hz of frameHz) {
    if (hz === null) {
      if (cur) { segs.push(cur); cur = null }
      continue
    }
    const midi = freqToMidi(hz)
    if (cur && cur.midi === midi) {
      cur.frames++
    } else {
      if (cur) segs.push(cur)
      cur = { midi, frames: 1 }
    }
  }
  if (cur) segs.push(cur)
  return segs
}

export class MelodyRecorder {
  private stream:       MediaStream                | null = null
  private sourceNode:   MediaStreamAudioSourceNode | null = null
  private workletNode:  AudioWorkletNode           | null = null
  private silentGain:   GainNode                   | null = null
  private recordingCtx: AudioContext               | null = null
  private pcmChunks:    Float32Array[]             = []

  async start(): Promise<void> {
    await Tone.start()
    this.stream    = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    this.pcmChunks = []

    // 録音専用の AudioContext を作成する。
    // decodeAudioData を呼ばないためクラッシュしない。
    // Tone.js が別途 AudioContext を持っているが、2つ同時でも問題ない。
    this.recordingCtx = new AudioContext()

    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' })
    const url  = URL.createObjectURL(blob)
    await this.recordingCtx.audioWorklet.addModule(url)
    URL.revokeObjectURL(url)

    this.workletNode = new AudioWorkletNode(this.recordingCtx, 'melody-recorder-processor')
    this.workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
      this.pcmChunks.push(e.data)
    }

    this.sourceNode = this.recordingCtx.createMediaStreamSource(this.stream)
    this.sourceNode.connect(this.workletNode)

    // destinationまで接続しないとブラウザの最適化でWorkletの処理が間引かれる。
    // 音量0のGainNode経由で繋ぎ、音は鳴らさずグラフ上の到達を保証する。
    this.silentGain = this.recordingCtx.createGain()
    this.silentGain.gain.value = 0
    this.workletNode.connect(this.silentGain)
    this.silentGain.connect(this.recordingCtx.destination)
  }

  async stop(): Promise<{ pcm: Float32Array; sampleRate: number }> {
    const sampleRate = this.recordingCtx?.sampleRate ?? 44100

    this.sourceNode?.disconnect()
    this.workletNode?.disconnect()
    this.silentGain?.disconnect()
    this.stream?.getTracks().forEach(t => t.stop())

    // port.postMessage は非同期配送のため、close前に少し待って末尾フレームを回収する
    await new Promise<void>(r => setTimeout(r, 50))

    await this.recordingCtx?.close()

    this.sourceNode   = null
    this.workletNode  = null
    this.silentGain   = null
    this.stream       = null
    this.recordingCtx = null

    const chunks = this.pcmChunks
    this.pcmChunks = []

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0)
    const pcm = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of chunks) { pcm.set(chunk, offset); offset += chunk.length }

    return { pcm, sampleRate }
  }

  process(
    pcm:        Float32Array,
    sampleRate: number,
    bpm:        number,
    key:        string,
    scale:      'major' | 'minor',
  ): RelativeNote[] {
    const detect = YIN({ sampleRate, threshold: PITCH_THRESH })
    const frameHz: (number | null)[] = []
    for (let i = 0; i + FRAME_SIZE <= pcm.length; i += HOP_SIZE) {
      const frame = pcm.slice(i, i + FRAME_SIZE)
      if (rms(frame) < RMS_THRESH) { frameHz.push(null); continue }
      const hz = detect(frame)
      frameHz.push(hz && hz > 50 && hz < 2000 ? hz : null)
    }

    const frameSec  = HOP_SIZE / sampleRate
    const minFrames = Math.ceil(MIN_NOTE_SEC / frameSec)
    const segs      = segment(frameHz).filter(s => s.frames >= minFrames)

    return segs.map(s => ({
      degree:   midiToScaleDegree(s.midi, key, scale),
      duration: quantizeDuration(s.frames * frameSec, bpm),
      velocity: 0.75,
    }))
  }
}

export const melodyRecorder = new MelodyRecorder()
