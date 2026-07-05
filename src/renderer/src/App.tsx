import { useEffect, useState } from 'react'
import type { RealMoodId, SongBlueprint, SavedSong, DrumOption, SmartFxOption, NoteEvent } from './theory/types'
import { composerEngine } from './composer/ComposerEngine'
import { playbackEngine } from './audio/engine'
import { SongRepository } from './repository/SongRepository'
import { moods }          from './data/music/moods'
import { BPM_RANGE }      from './data/music/theory/tempoRange'
import { drumPatterns }   from './data/music/drum-patterns'
import { BEAT_STRENGTH } from './data/music/theory/beatStrength'

type Status      = 'idle' | 'loading' | 'error' | 'playing' | 'done'
type Screen      = 'home' | 'drum' | 'smartfx' | 'stepup' | 'mysongs'
type PlayContext = 'compose' | 'library' | 'drumPreview'
type ChordTab   = 'template' | 'step'

// ── ドラムグリッド型 ────────────────────────────────────────────────────
type GridVel = 0 | 0.4 | 0.65 | 0.9
type DrumGrid = {
  kick:  [GridVel, GridVel, GridVel, GridVel]
  snare: [GridVel, GridVel, GridVel, GridVel]
  hihat: [GridVel, GridVel, GridVel, GridVel]
}
type CustomDrumNotes = { kick: NoteEvent[]; snare: NoteEvent[]; hihat: NoteEvent[] }

const MOOD_CHIPS: { emoji: string; label: string; id: RealMoodId }[] = [
  { emoji: '😊', label: '元気',  id: 'happy'  },
  { emoji: '🌙', label: '夜',    id: 'night'  },
  { emoji: '🌧', label: '雨',    id: 'rain'   },
  { emoji: '🌸', label: '春',    id: 'spring' },
]

const MOOD_MAP: Record<RealMoodId, { emoji: string; label: string }> = {
  happy:  { emoji: '😊', label: '元気' },
  night:  { emoji: '🌙', label: '夜'   },
  rain:   { emoji: '🌧', label: '雨'   },
  spring: { emoji: '🌸', label: '春'   },
}

const MOOD_LABELS: Record<RealMoodId, string> = {
  happy: '😊 元気', night: '🌙 夜', rain: '🌧 雨', spring: '🌸 春',
}

const MOOD_COLORS: Record<RealMoodId, string> = {
  happy:  'linear-gradient(135deg, #d97706, #fbbf24)',
  night:  'linear-gradient(135deg, #5b21b6, #8b5cf6)',
  rain:   'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  spring: 'linear-gradient(135deg, #be185d, #f472b6)',
}

const STEPUP_CARDS = [
  { emoji: '🎵', title: '曲の流れを選ぶ',  desc: '最初から最後まで、どんな雰囲気で進むかを自分で決められます' },
  { emoji: '🕐', title: '曲の速さを選ぶ',  desc: 'ゆったりした曲にするか、テンポよく弾む曲にするかを調整できます' },
  { emoji: '🎸', title: '楽器を選ぶ',      desc: 'ピアノ・ギター・シンセなど、音の雰囲気をがらりと変えられます' },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

// ── ドラムグリッドユーティリティ ────────────────────────────────────────

const GRID_VEL_CYCLE: GridVel[] = [0, 0.4, 0.65, 0.9]

function cycleVel(v: GridVel): GridVel {
  return GRID_VEL_CYCLE[(GRID_VEL_CYCLE.indexOf(v) + 1) % GRID_VEL_CYCLE.length]
}

// DrumPatternRecord（1小節分の kick/snare/hihat）をグリッドに変換
// シンコペーション（sub ≠ 0）は同じ拍の最大ベロシティとして丸める
function patternToGrid(p: { kick: NoteEvent[]; snare: NoteEvent[]; hihat: NoteEvent[] }): DrumGrid {
  const toGV = (vel: number): GridVel =>
    vel >= 0.8 ? 0.9 : vel >= 0.55 ? 0.65 : vel > 0 ? 0.4 : 0
  const rowOf = (notes: NoteEvent[]): [GridVel, GridVel, GridVel, GridVel] => {
    const row: [GridVel, GridVel, GridVel, GridVel] = [0, 0, 0, 0]
    for (const ev of notes) {
      const [barStr, beatStr] = ev.time.split(':')
      if (parseInt(barStr, 10) !== 0) continue
      const b = parseInt(beatStr, 10)
      if (b >= 0 && b <= 3) { const v = toGV(ev.velocity); if (v > row[b]) row[b] = v }
    }
    return row
  }
  return { kick: rowOf(p.kick), snare: rowOf(p.snare), hihat: rowOf(p.hihat) }
}

// グリッド1行 → NoteEvent[]（1小節分）
function rowToNotes(row: [GridVel, GridVel, GridVel, GridVel], voice: 'kick' | 'snare' | 'hihat'): NoteEvent[] {
  const note = voice === 'kick' ? 'C1' : voice === 'snare' ? 'C2' : 'A6'
  const dur  = voice === 'hihat' ? '32n' : '8n'
  return row.flatMap((vel, beat) =>
    vel === 0 ? [] : [{ time: `0:${beat}:0`, note, duration: dur, velocity: vel }]
  )
}

// 1小節分のノートをbars小節分タイリング
function tileNotes(notes: NoteEvent[], bars: number): NoteEvent[] {
  const result: NoteEvent[] = []
  for (let r = 0; r < bars; r++) {
    for (const ev of notes) {
      const [bar, ...rest] = ev.time.split(':')
      if (parseInt(bar, 10) + r >= bars) continue
      result.push({ ...ev, time: [parseInt(bar, 10) + r, ...rest].join(':') })
    }
  }
  return result
}

// パターンが4拍グリッドで完全再現可能かどうかを判定
// sub ≠ 0（8分・16分単位のヒット）や同拍複数ヒットはグリッドで再現不可
function isGridCompatible(p: { bars: number; kick: NoteEvent[]; snare: NoteEvent[]; hihat: NoteEvent[] }): boolean {
  if (p.bars !== 1) return false
  const check = (notes: NoteEvent[]): boolean => {
    const seen = new Set<number>()
    for (const ev of notes) {
      const parts = ev.time.split(':')
      if (parseInt(parts[0], 10) !== 0) return false
      if (parseInt(parts[2], 10) !== 0) return false
      const beat = parseInt(parts[1], 10)
      if (seen.has(beat)) return false
      seen.add(beat)
    }
    return true
  }
  return check(p.kick) && check(p.snare) && check(p.hihat)
}

// グリッドの配置から一言ヒントテキストを生成（BEAT_STRENGTH テーブル参照）
function drumHint(grid: DrumGrid): string {
  const snBeats = grid.snare.map((v, b) => v > 0 ? b : -1).filter(b => b >= 0) as (0 | 1 | 2 | 3)[]
  const hhCount = grid.hihat.filter(v => v > 0).length
  const kCount  = grid.kick.filter(v => v > 0).length
  if (snBeats.some(b => BEAT_STRENGTH[b] === 'weak_backbeat'))
    return '2・4拍のスネアがポップスらしいノリ（バックビート）を生んでいます'
  if (snBeats.some(b => BEAT_STRENGTH[b] === 'medium'))
    return '3拍目のスネアがゆったりとしたハーフタイムの重さを出しています'
  if (hhCount >= 6)
    return 'ハイハットを細かく刻むと、前に進む推進力が生まれます'
  if (hhCount <= 1)
    return 'ハイハットを少なくすると、静かで余白のある空気感になります'
  if (kCount >= 4)
    return '4つ打ちキックが安定したグルーヴを生んでいます'
  return 'このリズムで試してみましょう'
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08080f; }

  @keyframes breathe {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.96); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mood-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 22px;
    color: #f0f0f0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 28px 16px;
    width: 100%;
    transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .mood-btn:hover {
    background: rgba(255, 255, 255, 0.10);
    border-color: rgba(255, 255, 255, 0.35);
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
  }
  .mood-btn:active { transform: translateY(-1px) scale(0.99); transition-duration: 0.07s; }

  .stop-btn:hover        { background: rgba(220, 38, 38, 0.25)    !important; }
  .retry-btn:hover       { background: rgba(139, 92, 246, 0.25)   !important; }
  .stepup-btn:hover      { background: rgba(250, 204, 21, 0.15)   !important; border-color: rgba(250, 204, 21, 0.6) !important; color: #fde68a !important; }
  .mysongs-btn:hover     { background: rgba(52, 211, 153, 0.15)   !important; border-color: rgba(52, 211, 153, 0.6) !important; color: #6ee7b7 !important; }
  .back-btn:hover        { background: rgba(255, 255, 255, 0.08)  !important; }
  .save-btn:hover        { background: rgba(251, 191, 36, 0.3)    !important; }
  .play-song-btn:hover   { background: rgba(52, 211, 153, 0.22)   !important; color: #6ee7b7 !important; border-color: rgba(52, 211, 153, 0.55) !important; }
  .edit-song-btn:hover   { background: rgba(251, 191, 36, 0.22)   !important; color: #fde68a !important; border-color: rgba(251, 191, 36, 0.55) !important; }
  .save-edit-btn:hover   { background: rgba(52, 211, 153, 0.22)   !important; color: #6ee7b7 !important; border-color: rgba(52, 211, 153, 0.55) !important; }
  .delete-song-btn:hover { background: rgba(220, 38, 38, 0.22)    !important; color: #fca5a5 !important; border-color: rgba(220, 38, 38, 0.55) !important; }

  .chord-card-btn {
    animation: fadeInUp 0.35s ease both;
    background: rgba(196, 181, 253, 0.04);
    border: 1.5px solid rgba(196, 181, 253, 0.18);
    border-radius: 20px;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s, border-color 0.2s, transform 0.18s, box-shadow 0.18s;
    font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif;
  }
  .chord-card-btn:hover {
    background: rgba(196, 181, 253, 0.12);
    border-color: rgba(196, 181, 253, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .chord-card-btn:active { transform: translateY(0); transition-duration: 0.07s; }

  .drum-card-btn {
    animation: fadeInUp 0.35s ease both;
    background: rgba(52, 211, 153, 0.04);
    border: 1.5px solid rgba(52, 211, 153, 0.18);
    border-radius: 20px;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s, border-color 0.2s, transform 0.18s, box-shadow 0.18s;
    font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif;
  }
  .drum-card-btn:hover {
    background: rgba(52, 211, 153, 0.12);
    border-color: rgba(52, 211, 153, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .drum-card-btn:active { transform: translateY(0); transition-duration: 0.07s; }
  .drum-card-btn:nth-child(1) { animation-delay: 0.05s; }
  .drum-card-btn:nth-child(2) { animation-delay: 0.12s; }
  .drum-card-btn:nth-child(3) { animation-delay: 0.19s; }

  .smartfx-card-btn {
    animation: fadeInUp 0.35s ease both;
    background: rgba(251, 191, 36, 0.04);
    border: 1.5px solid rgba(251, 191, 36, 0.18);
    border-radius: 20px;
    padding: 22px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s, border-color 0.2s, transform 0.18s, box-shadow 0.18s;
    font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif;
  }
  .smartfx-card-btn:hover {
    background: rgba(251, 191, 36, 0.12);
    border-color: rgba(251, 191, 36, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
  .smartfx-card-btn:active { transform: translateY(0); transition-duration: 0.07s; }
  .smartfx-card-btn:nth-child(1) { animation-delay: 0.05s; }
  .smartfx-card-btn:nth-child(2) { animation-delay: 0.12s; }
  .smartfx-card-btn:nth-child(3) { animation-delay: 0.19s; }

  .stepup-card {
    animation: fadeInUp 0.4s ease both;
    background: rgba(255, 255, 255, 0.03);
    border: 1.5px solid rgba(255, 255, 255, 0.09);
    border-radius: 20px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .stepup-card:nth-child(1) { animation-delay: 0.05s; }
  .stepup-card:nth-child(2) { animation-delay: 0.12s; }
  .stepup-card:nth-child(3) { animation-delay: 0.19s; }

  .song-card { animation: fadeInUp 0.3s ease both; }

  .edit-input { outline: none; }
  .edit-input:focus { border-color: rgba(255,255,255,0.45) !important; background: rgba(255,255,255,0.09) !important; }

  .breathing { animation: breathe 1.5s ease-in-out infinite; }

  input[type=range] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 4px;
    background: rgba(196, 181, 253, 0.25);
    outline: none;
    cursor: pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #c4b5fd;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(196, 181, 253, 0.6);
  }
  input[type=range]::-moz-range-thumb {
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #c4b5fd;
    cursor: pointer;
    border: none;
  }
`

export default function App(): JSX.Element {
  // ── State ──────────────────────────────────────────────────────────────
  const [status,        setStatus]        = useState<Status>('idle')
  const [screen,        setScreen]        = useState<Screen>('home')
  const [playContext,   setPlayContext]   = useState<PlayContext>('compose')
  const [lastBlueprint, setLastBlueprint] = useState<SongBlueprint | null>(null)
  const [isSaved,       setIsSaved]       = useState(false)
  const [songs,         setSongs]         = useState<SavedSong[]>([])
  const [editingId,     setEditingId]     = useState<string | null>(null)
  const [editingTitle,  setEditingTitle]  = useState('')

  // コード選択状態
  const [moodFilter,      setMoodFilter]      = useState<RealMoodId | null>(null)
  const [bpm,             setBpm]             = useState<number>(BPM_RANGE.default)
  const [chordTab,        setChordTab]        = useState<ChordTab>('template')
  const [stepItems,       setStepItems]       = useState<{ degree: number; label: string }[]>([])
  const [stepScale,       setStepScale]       = useState<'major' | 'minor' | null>(null)
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null)
  const [customProg,      setCustomProg]      = useState<{ scale: 'major' | 'minor'; degrees: number[] } | null>(null)

  // ドラム・音質選択状態
  const [drumOptions,     setDrumOptions]     = useState<DrumOption[]>([])
  const [selectedDrumId,  setSelectedDrumId]  = useState<string | null>(null)
  const [drumGrid,        setDrumGrid]         = useState<DrumGrid | null>(null)
  const [customDrumNotes, setCustomDrumNotes]  = useState<CustomDrumNotes | null>(null)
  const [smartFxOptions,  setSmartFxOptions]  = useState<SmartFxOption[]>([])

  // ── 派生値 ─────────────────────────────────────────────────────────────
  // ステップモードで有効なスケール（ムードフィルタ優先）
  const effectiveScale: 'major' | 'minor' | null =
    moodFilter ? moods[moodFilter].scale : stepScale

  // 生成時のバッキングムード（ムードフィルタ → スケール由来 → デフォルト happy）
  const backingMoodId: RealMoodId =
    moodFilter ?? (effectiveScale === 'minor' ? 'night' : 'happy')

  // テンプレートタブの一覧（フィルタ適用済み）
  const templateOptions = composerEngine.getAllProgressionOptions(moodFilter ?? undefined)

  // ステップタブの次候補（現在の末尾度数から）
  const currentDegree = stepItems.length > 0 ? stepItems[stepItems.length - 1].degree : 1
  const nextDegreeOptions = effectiveScale
    ? composerEngine.getNextDegreeOptions(effectiveScale, currentDegree).slice(0, 4)
    : []

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    const offPlay = playbackEngine.on('play', () => setStatus('playing'))
    const offEnd  = playbackEngine.on('end',  () => setStatus('done'))
    const offStop = playbackEngine.on('stop', () => setStatus('idle'))

    const handleRejection = (e: PromiseRejectionEvent): void => {
      e.preventDefault()
      playbackEngine.resetLoad()
      setStatus('error')
    }
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      offPlay(); offEnd(); offStop()
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  // ドラム試聴（1小節ループ）が終わったらドラム画面に戻る
  useEffect(() => {
    if (status === 'done' && playContext === 'drumPreview') {
      setStatus('idle')
      setScreen('drum')
    }
  }, [status, playContext])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleMoodFilter = (mood: RealMoodId | null): void => {
    setMoodFilter(mood)
    setBpm(mood ? moods[mood].bpm : BPM_RANGE.default)
    // ステップ状態リセット（スケールが変わる可能性があるため）
    setStepScale(null)
    if (mood) {
      // ムード確定時はスケールが決まるのでステップ初期コード自動セット
      setStepItems(chordTab === 'step' ? [{ degree: 1, label: 'I' }] : [])
    } else {
      setStepItems([])
    }
  }

  const handleTabChange = (tab: ChordTab): void => {
    setChordTab(tab)
    // ステップタブに切り替えてスケールが確定していれば度数1を初期セット
    if (tab === 'step' && stepItems.length === 0 && effectiveScale) {
      setStepItems([{ degree: 1, label: 'I' }])
    }
  }

  const handleChooseChord = (progressionId: string): void => {
    setSelectedChordId(progressionId)
    setCustomProg(null)
    setDrumOptions(composerEngine.getAllDrumOptions(moodFilter ?? undefined))
    setScreen('drum')
  }

  const handleStepDone = (): void => {
    if (!effectiveScale || stepItems.length < 4) return
    const prog = { scale: effectiveScale, degrees: stepItems.map(i => i.degree) }
    setCustomProg(prog)
    setSelectedChordId(null)
    setDrumOptions(composerEngine.getAllDrumOptions(moodFilter ?? undefined))
    setScreen('drum')
  }

  const handleChooseDrum = (drumPatternId: string): void => {
    setSelectedDrumId(drumPatternId)
    setCustomDrumNotes(null)
    if (isGridCompatible(drumPatterns[drumPatternId])) {
      setDrumGrid(patternToGrid(drumPatterns[drumPatternId]))
      // drumGrid がセットされるとドラム画面内でグリッドUIに切り替わる
    } else {
      // グリッドで完全再現できないプリセット → グリッドをバイパスしてSmartFXへ
      setDrumGrid(null)
      setSmartFxOptions(composerEngine.getSmartFxOptions())
      setScreen('smartfx')
    }
  }

  // ドラムグリッドを確定してSmartFX画面へ
  const handleConfirmDrum = (): void => {
    if (!drumGrid) return
    setCustomDrumNotes({
      kick:  rowToNotes(drumGrid.kick,  'kick'),
      snare: rowToNotes(drumGrid.snare, 'snare'),
      hihat: rowToNotes(drumGrid.hihat, 'hihat'),
    })
    setSmartFxOptions(composerEngine.getSmartFxOptions())
    setScreen('smartfx')
  }

  // グリッドの現在状態を1小節ループで試聴（ドラムトラックのみ）
  const handlePreviewDrum = (): void => {
    if (!drumGrid) return
    const previewBp: SongBlueprint = {
      seed: 0, moodId: backingMoodId, bpm,
      key: 'C', scale: 'major',
      chordProgression: { id: 'preview', chords: [], bars: 1 },
      melodyPattern: { id: 'none', notes: [] },
      instrumentMap: { melody: '', chord: '', bass: '', drum: '' },
      tracks: [{
        kind: 'drum',
        kickNotes:  rowToNotes(drumGrid.kick,  'kick'),
        snareNotes: rowToNotes(drumGrid.snare, 'snare'),
        hihatNotes: rowToNotes(drumGrid.hihat, 'hihat'),
        presetId: '',
      }],
    }
    setPlayContext('drumPreview')
    setLastBlueprint(previewBp)
    setStatus('loading')
    playbackEngine.play(previewBp).catch(() => {
      playbackEngine.resetLoad()
      setStatus('error')
    })
  }

  const handleChooseSmartFx = (smartFxId: string): void => {
    if (!selectedDrumId) return
    if (!selectedChordId && !customProg) return
    let blueprint = composerEngine.compose({
      mood:               backingMoodId,
      chordProgressionId: selectedChordId ?? undefined,
      customProgression:  customProg ?? undefined,
      drumPatternId:      selectedDrumId,
      smartFxId,
      bpm,
    })
    // グリッドで微調整したノートがあればドラムトラックを差し替え
    if (customDrumNotes) {
      const bars = blueprint.chordProgression.bars
      blueprint = {
        ...blueprint,
        tracks: blueprint.tracks.map(t => t.kind !== 'drum' ? t : {
          ...t,
          kickNotes:  tileNotes(customDrumNotes.kick,  bars),
          snareNotes: tileNotes(customDrumNotes.snare, bars),
          hihatNotes: tileNotes(customDrumNotes.hihat, bars),
        }),
      }
    }
    startPlay(blueprint)
  }

  const handleOmakase = (): void => {
    startPlay(composerEngine.compose({ mood: 'random', bpm }))
  }

  const startPlay = (blueprint: SongBlueprint): void => {
    setPlayContext('compose')
    setLastBlueprint(blueprint)
    setIsSaved(false)
    setStatus('loading')
    playbackEngine.play(blueprint).catch(() => {
      playbackEngine.resetLoad()
      setStatus('error')
    })
  }

  const handleStop  = (): void => { playbackEngine.stop() }

  const handleRetry = (): void => {
    setStatus('idle')
    setScreen('home')
    setSelectedChordId(null)
    setCustomProg(null)
    setStepItems([])
    setStepScale(null)
    setDrumGrid(null)
    setCustomDrumNotes(null)
  }

  const handleSave = (): void => {
    if (!lastBlueprint || isSaved) return
    const { seed, moodId } = lastBlueprint
    const seedSuffix = String(seed % 1000).padStart(3, '0')
    const moodName   = moodId.charAt(0).toUpperCase() + moodId.slice(1)
    SongRepository.save({
      id:        Date.now().toString(),
      title:     `${moodName} #${seedSuffix}`,
      createdAt: new Date().toISOString(),
      seed,
      mood:      moodId,
      blueprint: lastBlueprint,
    })
    setIsSaved(true)
  }

  const handleOpenMySongs = (): void => {
    setSongs(SongRepository.loadAll())
    setEditingId(null)
    setScreen('mysongs')
  }

  const handlePlaySaved = async (song: SavedSong): Promise<void> => {
    setEditingId(null)
    setPlayContext('library')
    setStatus('loading')
    try {
      await playbackEngine.play(song.blueprint)
    } catch {
      playbackEngine.resetLoad()
      setStatus('error')
    }
  }

  const handleEditStart = (song: SavedSong): void => {
    setEditingId(song.id)
    setEditingTitle(song.title)
  }

  const handleEditSave = (id: string): void => {
    const title = editingTitle.trim()
    if (!title) return
    SongRepository.update(id, title)
    setSongs(SongRepository.loadAll())
    setEditingId(null)
  }

  const handleDeleteSong = (id: string): void => {
    if (editingId === id) setEditingId(null)
    SongRepository.delete(id)
    setSongs(prev => prev.filter(sng => sng.id !== id))
  }

  // ── 読み込み中 ─────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p className="breathing" style={{ ...s.playingText, fontSize: '1.5rem' }}>
            🎵 準備中...
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.82rem', marginTop: '8px' }}>
            音源を読み込んでいます（初回のみ）
          </p>
        </div>
      </>
    )
  }

  // ── エラー ─────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={{ fontSize: '2.5rem', lineHeight: 1 }}>⚠️</p>
          <p style={{ color: '#fca5a5', fontSize: '1.1rem', fontWeight: 700, marginTop: '12px' }}>
            音源の読み込みに失敗しました
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: '6px', textAlign: 'center' as const, lineHeight: 1.6 }}>
            インターネット接続を確認してから<br />もう一度お試しください
          </p>
          <button className="retry-btn" onClick={() => setStatus('idle')} style={{ ...s.retryBtn, marginTop: '32px' }}>
            もどる
          </button>
        </div>
      </>
    )
  }

  // ── 再生中 ─────────────────────────────────────────────────────────────
  if (status === 'playing' && playContext !== 'drumPreview') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p className="breathing" style={s.playingText}>🎶 再生中...</p>
          <button className="stop-btn" onClick={handleStop} style={s.stopBtn}>
            ⏹ 停止
          </button>
        </div>
      </>
    )
  }

  // ── 完成（ライブラリ再生） ──────────────────────────────────────────────
  if (status === 'done' && playContext === 'library') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={s.doneText}>🎵 再生完了</p>
          <button className="retry-btn" onClick={() => setStatus('idle')} style={s.retryBtn}>
            📚 マイソングにもどる
          </button>
        </div>
      </>
    )
  }

  // ── 完成（作曲） ───────────────────────────────────────────────────────
  if (status === 'done' && playContext !== 'drumPreview') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={s.doneText}>🎉 できた！</p>
          <p style={s.doneSubText}>はじめての曲が完成しました</p>
          {isSaved ? (
            <button disabled style={{ ...s.saveBtn, opacity: 0.45, cursor: 'default' }}>
              ✅ 保存済み
            </button>
          ) : (
            <button className="save-btn" onClick={handleSave} style={s.saveBtn}>
              ⭐ 保存する
            </button>
          )}
          <button className="retry-btn" onClick={handleRetry} style={s.retryBtn}>
            もう一度つくる
          </button>
        </div>
      </>
    )
  }

  // ── ドラム選択画面 ─────────────────────────────────────────────────────
  if (screen === 'drum') {
    const selectedOpt = drumOptions.find(o => o.id === selectedDrumId)

    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <div style={s.subHeader}>
            <button className="back-btn"
              onClick={() => drumGrid ? setDrumGrid(null) : setScreen('home')}
              style={s.backBtn}
            >
              ← {drumGrid ? 'プリセットに戻る' : 'もどる'}
            </button>
            <h2 style={{ ...s.subTitle, color: '#6ee7b7' }}>
              {moodFilter ? MOOD_LABELS[moodFilter] : ''}
            </h2>
            <p style={s.subSubtitle}>
              {drumGrid ? '細かく調整できます（クリックで強弱切り替え）' : 'リズムの雰囲気を選んでください'}
            </p>
          </div>

          {/* ── プリセット一覧 ── */}
          {!drumGrid && (
            <div style={s.cardList}>
              {drumOptions.map((opt) => (
                <button key={opt.id} className="drum-card-btn" onClick={() => handleChooseDrum(opt.id)}>
                  <span style={s.drumIcon}>🥁</span>
                  <span style={s.drumCardBody}>
                    <span style={s.drumLabel}>{opt.label}</span>
                    <span style={s.beatRow}>
                      {opt.beatPattern.map((vel, bi) => {
                        const hit = vel !== null
                        const size = hit ? 10 + Math.round((vel ?? 0) * 6) : 10
                        return (
                          <span key={bi} style={{
                            ...s.beatDot,
                            width:   size,
                            height:  size,
                            background: hit
                              ? `rgba(110,231,183,${0.35 + (vel ?? 0) * 0.65})`
                              : 'transparent',
                            border: hit
                              ? `1.5px solid rgba(110,231,183,${0.4 + (vel ?? 0) * 0.6})`
                              : '1.5px solid rgba(110,231,183,0.18)',
                          }} />
                        )
                      })}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── グリッドUI ── */}
          {drumGrid && (
            <div style={s.gridWrapper}>
              {selectedOpt && (
                <p style={s.gridPresetName}>🥁 {selectedOpt.label}</p>
              )}

              {/* グリッド本体: 拍ヘッダー + 3声 */}
              <div style={s.gridTable}>
                {/* 拍ヘッダー行 */}
                <div style={s.gridRow}>
                  <span style={s.gridRowLabel} />
                  {([1, 2, 3, 4] as const).map(n => (
                    <span key={n} style={{
                      ...s.gridBeatHeader,
                      color: n === 1 || n === 3 ? '#a5b4fc' : '#6b7280',
                    }}>
                      {n}拍
                    </span>
                  ))}
                </div>

                {/* キック行 */}
                <div style={s.gridRow}>
                  <span style={s.gridRowLabel}>キック</span>
                  {drumGrid.kick.map((vel, bi) => (
                    <button
                      key={bi}
                      style={{
                        ...s.gridCell,
                        background: vel === 0
                          ? 'rgba(52,211,153,0.05)'
                          : `rgba(52,211,153,${0.2 + vel * 0.75})`,
                        border: vel === 0
                          ? '1.5px solid rgba(52,211,153,0.18)'
                          : `1.5px solid rgba(52,211,153,${0.4 + vel * 0.55})`,
                        boxShadow: vel > 0.7 ? '0 0 8px rgba(52,211,153,0.3)' : 'none',
                      }}
                      onClick={() => setDrumGrid(g => g && { ...g, kick: g.kick.map((v, i) => i === bi ? cycleVel(v) : v) as DrumGrid['kick'] })}
                    />
                  ))}
                </div>

                {/* スネア行 */}
                <div style={s.gridRow}>
                  <span style={s.gridRowLabel}>スネア</span>
                  {drumGrid.snare.map((vel, bi) => (
                    <button
                      key={bi}
                      style={{
                        ...s.gridCell,
                        background: vel === 0
                          ? 'rgba(196,181,253,0.05)'
                          : `rgba(196,181,253,${0.2 + vel * 0.75})`,
                        border: vel === 0
                          ? '1.5px solid rgba(196,181,253,0.18)'
                          : `1.5px solid rgba(196,181,253,${0.4 + vel * 0.55})`,
                        boxShadow: vel > 0.7 ? '0 0 8px rgba(196,181,253,0.3)' : 'none',
                      }}
                      onClick={() => setDrumGrid(g => g && { ...g, snare: g.snare.map((v, i) => i === bi ? cycleVel(v) : v) as DrumGrid['snare'] })}
                    />
                  ))}
                </div>

                {/* ハイハット行 */}
                <div style={s.gridRow}>
                  <span style={s.gridRowLabel}>HH</span>
                  {drumGrid.hihat.map((vel, bi) => (
                    <button
                      key={bi}
                      style={{
                        ...s.gridCell,
                        background: vel === 0
                          ? 'rgba(251,191,36,0.05)'
                          : `rgba(251,191,36,${0.2 + vel * 0.75})`,
                        border: vel === 0
                          ? '1.5px solid rgba(251,191,36,0.18)'
                          : `1.5px solid rgba(251,191,36,${0.4 + vel * 0.55})`,
                        boxShadow: vel > 0.7 ? '0 0 8px rgba(251,191,36,0.3)' : 'none',
                      }}
                      onClick={() => setDrumGrid(g => g && { ...g, hihat: g.hihat.map((v, i) => i === bi ? cycleVel(v) : v) as DrumGrid['hihat'] })}
                    />
                  ))}
                </div>
              </div>

              {/* 凡例 */}
              <div style={s.gridLegend}>
                {([0, 0.4, 0.65, 0.9] as GridVel[]).map((v, i) => (
                  <span key={i} style={s.legendItem}>
                    <span style={{
                      ...s.legendDot,
                      background: v === 0 ? 'transparent' : `rgba(52,211,153,${0.25 + v * 0.7})`,
                      border: v === 0 ? '1.5px solid rgba(52,211,153,0.22)' : '1.5px solid rgba(52,211,153,0.6)',
                    }} />
                    <span style={s.legendLabel}>
                      {v === 0 ? 'オフ' : v === 0.4 ? '弱' : v === 0.65 ? '中' : '強'}
                    </span>
                  </span>
                ))}
              </div>

              {/* ヒントテキスト */}
              <p style={s.gridHint}>💡 {drumHint(drumGrid)}</p>

              {/* アクションボタン */}
              <div style={s.gridActions}>
                {status === 'playing' && playContext === 'drumPreview' ? (
                  <button className="stop-btn" onClick={handleStop} style={{ ...s.gridPreviewBtn, borderColor: '#dc2626', color: '#fca5a5', background: 'rgba(220,38,38,0.12)' }}>
                    ⏹ 停止
                  </button>
                ) : (
                  <button className="back-btn" onClick={handlePreviewDrum} style={s.gridPreviewBtn}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' && playContext === 'drumPreview' ? '...' : '▶ 試聴'}
                  </button>
                )}
                <button className="mysongs-btn" onClick={handleConfirmDrum} style={s.gridConfirmBtn}>
                  このリズムにする →
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  // ── Smart FX 選択画面 ──────────────────────────────────────────────────
  if (screen === 'smartfx') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <div style={s.subHeader}>
            <button className="back-btn" onClick={() => setScreen('drum')} style={s.backBtn}>
              ← もどる
            </button>
            <h2 style={{ ...s.subTitle, color: '#fde68a' }}>
              {moodFilter ? MOOD_LABELS[moodFilter] : ''}
            </h2>
            <p style={s.subSubtitle}>音の雰囲気を選んでください</p>
          </div>
          <div style={s.cardList}>
            {smartFxOptions.map((opt) => (
              <button key={opt.id} className="smartfx-card-btn" onClick={() => handleChooseSmartFx(opt.id)}>
                <span style={s.smartFxIcon}>✨</span>
                <span style={s.smartFxLabel}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── ステップアップ画面 ─────────────────────────────────────────────────
  if (screen === 'stepup') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <div style={s.subHeader}>
            <button className="back-btn" onClick={() => setScreen('home')} style={s.backBtn}>
              ← もどる
            </button>
            <h2 style={s.subTitle}>🎓 ステップアップ</h2>
            <p style={s.subSubtitle}>慣れてきたら、少しずつ自分でカスタマイズできます</p>
          </div>
          <div style={s.cardList}>
            {STEPUP_CARDS.map((card, i) => (
              <div key={i} className="stepup-card">
                <div style={s.cardTop}>
                  <span style={s.cardEmoji}>{card.emoji}</span>
                  <span style={s.cardTitle}>{card.title}</span>
                  <span style={s.comingSoon}>Coming Soon</span>
                </div>
                <p style={s.cardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── マイソング画面 ─────────────────────────────────────────────────────
  if (screen === 'mysongs') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <div style={s.subHeader}>
            <button className="back-btn" onClick={() => setScreen('home')} style={s.backBtn}>
              ← もどる
            </button>
            <h2 style={{ ...s.subTitle, color: '#6ee7b7' }}>📚 マイソング</h2>
            <p style={s.subSubtitle}>保存した曲の一覧</p>
          </div>

          {songs.length === 0 ? (
            <div style={s.emptyState}>
              <p style={s.emptyText}>まだ保存した曲がありません</p>
              <p style={s.emptySubText}>最初の曲を作ってみよう！</p>
            </div>
          ) : (
            <div style={s.songList}>
              {songs.map((song, i) => (
                <div key={song.id} className="song-card" style={{ ...s.songCard, animationDelay: `${i * 0.06}s` }}>
                  <div style={s.songCardRow}>
                    <div style={{ ...s.artBox, background: MOOD_COLORS[song.mood] }}>
                      <span style={s.artEmoji}>{MOOD_MAP[song.mood].emoji}</span>
                    </div>

                    {editingId === song.id ? (
                      <input
                        className="edit-input"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  handleEditSave(song.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        style={s.editInput}
                      />
                    ) : (
                      <div style={s.songInfo}>
                        <p style={s.songTitle}>{song.title}</p>
                        <p style={s.songMeta}>{formatDate(song.updatedAt ?? song.createdAt)}</p>
                      </div>
                    )}

                    {editingId === song.id ? (
                      <div style={s.actionBtns}>
                        <button className="save-edit-btn" onClick={() => handleEditSave(song.id)} style={{ ...s.iconBtn, color: '#6ee7b7' }} title="保存">✓</button>
                        <button className="delete-song-btn" onClick={() => setEditingId(null)} style={s.iconBtn} title="キャンセル">✕</button>
                      </div>
                    ) : (
                      <div style={s.actionBtns}>
                        <button className="play-song-btn" onClick={() => handlePlaySaved(song)} style={s.iconBtn} title="再生">▶</button>
                        <button className="edit-song-btn" onClick={() => handleEditStart(song)} style={s.iconBtn} title="タイトルを変更">✏</button>
                        <button className="delete-song-btn" onClick={() => handleDeleteSong(song.id)} style={s.iconBtn} title="削除">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )
  }

  // ── ホーム画面（= コード選択画面） ────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={s.homeRoot}>
        {/* 左上・右上 小ボタン */}
        <button className="mysongs-btn" onClick={handleOpenMySongs} style={s.mysongsEntryBtn}>
          📚 マイソング
        </button>
        <button className="stepup-btn" onClick={() => setScreen('stepup')} style={s.stepupEntryBtn}>
          🎓 ステップアップ
        </button>

        {/* タイトル */}
        <header style={{ ...s.header, marginTop: '8px' }}>
          <h1 style={s.title}>First Song</h1>
          <p style={s.question}>コードの雰囲気を選ぼう</p>
        </header>

        {/* ムードしぼりこみチップ */}
        <div style={s.moodChipsRow}>
          {MOOD_CHIPS.map(({ emoji, label, id }) => (
            <button
              key={id}
              style={{ ...s.moodChip, ...(moodFilter === id ? s.moodChipActive : {}) }}
              onClick={() => handleMoodFilter(moodFilter === id ? null : id)}
            >
              {emoji} {label}
            </button>
          ))}
          <button
            style={{ ...s.moodChip, ...(moodFilter === null ? s.moodChipActive : {}) }}
            onClick={() => handleMoodFilter(null)}
          >
            しぼらない
          </button>
        </div>

        {/* テンポスライダー */}
        <div style={s.bpmRow}>
          <span style={s.bpmLabel}>テンポ</span>
          <input
            type="range"
            min={BPM_RANGE.min}
            max={BPM_RANGE.max}
            step={BPM_RANGE.step}
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            style={s.bpmSlider}
          />
          <span style={s.bpmValue}>{bpm} BPM</span>
        </div>

        {/* タブ切り替え */}
        <div style={s.tabRow}>
          <button
            style={{ ...s.tabBtn, ...(chordTab === 'template' ? s.tabBtnActive : {}) }}
            onClick={() => handleTabChange('template')}
          >
            テンプレートから選ぶ
          </button>
          <button
            style={{ ...s.tabBtn, ...(chordTab === 'step' ? s.tabBtnActive : {}) }}
            onClick={() => handleTabChange('step')}
          >
            1コードずつ選ぶ
          </button>
        </div>

        {/* ── テンプレートタブ ── */}
        {chordTab === 'template' && (
          <div style={s.cardList}>
            {templateOptions.map((opt, i) => (
              <button
                key={opt.id}
                className="chord-card-btn"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.28)}s` }}
                onClick={() => handleChooseChord(opt.id)}
              >
                <span style={s.chordLabel}>{opt.label}</span>
                <span style={s.chordPills}>
                  {opt.chords.map((ch, ci) => (
                    <span key={ci} style={s.chordPillWrap}>
                      <span style={s.chordPill}>{ch}</span>
                      {ci < opt.chords.length - 1 && <span style={s.chordArrow}>→</span>}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── ステップタブ ── */}
        {chordTab === 'step' && (
          <div style={s.stepContainer}>

            {/* スケール未選択かつムードフィルタなし → 明るい/暗い 選択 */}
            {!effectiveScale && (
              <>
                <p style={s.scaleChoiceLabel}>どんな感じにしますか？</p>
                <div style={s.scaleChoiceBtns}>
                  <button
                    className="chord-card-btn"
                    style={s.scaleChoiceBtn}
                    onClick={() => { setStepScale('major'); setStepItems([{ degree: 1, label: 'I' }]) }}
                  >
                    ☀️ 明るい感じ
                  </button>
                  <button
                    className="chord-card-btn"
                    style={s.scaleChoiceBtn}
                    onClick={() => { setStepScale('minor'); setStepItems([{ degree: 1, label: 'I' }]) }}
                  >
                    🌙 暗い感じ
                  </button>
                </div>
              </>
            )}

            {/* 度数ビルダー */}
            {effectiveScale && (
              <>
                {/* 現在の進行チェーン */}
                {stepItems.length > 0 && (
                  <div style={s.stepChain}>
                    {stepItems.map((item, i) => (
                      <span key={i} style={s.chordPillWrap}>
                        <span style={{ ...s.chordPill, ...s.stepPill }}>{item.label}</span>
                        {i < stepItems.length - 1 && <span style={s.chordArrow}>→</span>}
                      </span>
                    ))}
                    {stepItems.length < 8 && <span style={s.stepChainNext}>→ ?</span>}
                  </div>
                )}

                {/* 次の度数候補（最大8個まで追加可能） */}
                {stepItems.length < 8 && (
                  <div style={s.cardList}>
                    {nextDegreeOptions.map((opt, i) => (
                      <button
                        key={opt.degree}
                        className="chord-card-btn"
                        style={{ animationDelay: `${i * 0.06}s` }}
                        onClick={() => setStepItems(prev => [...prev, { degree: opt.degree, label: opt.label }])}
                      >
                        <span style={s.chordLabel}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* できたボタン（4個以上から） */}
                {stepItems.length >= 4 && (
                  <button className="retry-btn" style={s.stepDoneBtn} onClick={handleStepDone}>
                    できた ✓
                  </button>
                )}

                {/* リセット */}
                {stepItems.length > 1 && (
                  <button
                    style={s.stepResetBtn}
                    onClick={() => setStepItems([{ degree: 1, label: 'I' }])}
                  >
                    最初からやり直す
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* おまかせ */}
        <button className="mood-btn" onClick={handleOmakase} style={s.omakaseBtn}>
          <span style={s.moodEmoji}>✨</span>
          <span>おまかせ</span>
        </button>
      </div>
    </>
  )
}

const s = {
  // ── 再生中・完成・サブ画面共通ルート（垂直中央） ──
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 15%, #1a0e40 0%, #08080f 65%)',
    padding: '40px 24px',
    gap: '14px',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    color: '#fff',
    position: 'relative' as const,
  },

  // ── ホーム画面ルート（上揃えスクロール対応） ──
  homeRoot: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    background: 'radial-gradient(ellipse at 50% 15%, #1a0e40 0%, #08080f 65%)',
    padding: '64px 24px 48px',
    gap: '14px',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    color: '#fff',
    position: 'relative' as const,
  },

  // ── タイトル ──
  header: { textAlign: 'center' as const, marginBottom: '4px' },
  title: {
    fontSize: 'clamp(2.0rem, 5vw, 2.8rem)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(130deg, #c4b5fd 10%, #67e8f9 90%)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    lineHeight: 1.1,
    marginBottom: '10px',
  },
  question: { color: '#d1d5db', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.03em' },
  moodEmoji: { fontSize: '1.6rem', lineHeight: 1 },

  // ── ムードフィルタチップ ──
  moodChipsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '440px',
  },
  moodChip: {
    padding: '7px 14px',
    borderRadius: '20px',
    border: '1.5px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.04)',
    color: '#6b7280',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.03em',
  },
  moodChipActive: {
    background: 'rgba(196,181,253,0.18)',
    border: '1.5px solid rgba(196,181,253,0.55)',
    color: '#c4b5fd',
  },

  // ── BPM スライダー ──
  bpmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '12px 18px',
  },
  bpmLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: 600,
    letterSpacing: '0.05em',
    flexShrink: 0,
  },
  bpmSlider: {
    flex: 1,
    cursor: 'pointer',
  },
  bpmValue: {
    fontSize: '0.9rem',
    color: '#c4b5fd',
    fontWeight: 700,
    letterSpacing: '0.02em',
    flexShrink: 0,
    minWidth: '58px',
    textAlign: 'right' as const,
  },

  // ── タブ切り替え ──
  tabRow: {
    display: 'flex',
    gap: '4px',
    width: '100%',
    maxWidth: '440px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px',
    padding: '4px',
  },
  tabBtn: {
    flex: 1,
    padding: '10px 8px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.02em',
  },
  tabBtnActive: {
    background: 'rgba(196,181,253,0.18)',
    color: '#c4b5fd',
  },

  // ── ステップモード ──
  stepContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '440px',
  },
  scaleChoiceLabel: {
    fontSize: '1rem',
    color: '#d1d5db',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  scaleChoiceBtns: {
    display: 'flex',
    gap: '10px',
    width: '100%',
  },
  scaleChoiceBtn: {
    flex: 1,
    fontSize: '1rem',
    fontWeight: 700,
    gap: '8px',
    padding: '20px 12px',
    justifyContent: 'center' as const,
    textAlign: 'center' as const,
  },
  stepChain: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '6px',
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    minHeight: '48px',
  },
  stepPill: {
    background: 'rgba(196,181,253,0.2)',
    border: '1.5px solid rgba(196,181,253,0.5)',
    color: '#c4b5fd',
    fontWeight: 800,
  },
  stepChainNext: {
    fontSize: '0.85rem',
    color: '#374151',
    fontWeight: 600,
  },
  stepDoneBtn: {
    marginTop: '4px',
    padding: '14px 40px',
    fontSize: '1.05rem',
    fontWeight: 700,
  } as const,
  stepResetBtn: {
    padding: '8px 16px',
    fontSize: '0.78rem',
    fontWeight: 600,
    background: 'transparent',
    border: 'none',
    color: '#4b5563',
    cursor: 'pointer',
    textDecoration: 'underline' as const,
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
  },

  // ── おまかせ ──
  omakaseBtn: {
    flexDirection: 'row' as const,
    maxWidth: '440px',
    padding: '14px 24px',
    gap: '10px',
    marginTop: '4px',
    opacity: 0.65,
  },

  // ── 左上・右上 小ボタン ──
  mysongsEntryBtn: {
    position: 'absolute' as const,
    top: '20px', left: '20px',
    padding: '8px 16px',
    fontSize: '0.78rem', fontWeight: 600,
    background: 'rgba(52, 211, 153, 0.07)',
    border: '1.5px solid rgba(52, 211, 153, 0.28)',
    borderRadius: '20px',
    color: 'rgba(110, 231, 183, 0.7)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
  },
  stepupEntryBtn: {
    position: 'absolute' as const,
    top: '20px', right: '20px',
    padding: '8px 16px',
    fontSize: '0.78rem', fontWeight: 600,
    background: 'rgba(250, 204, 21, 0.07)',
    border: '1.5px solid rgba(250, 204, 21, 0.28)',
    borderRadius: '20px',
    color: 'rgba(253, 230, 138, 0.7)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
  },

  // ── サブ画面共通 ──
  subHeader: {
    textAlign: 'center' as const,
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    maxWidth: '420px',
  },
  backBtn: {
    alignSelf: 'flex-start' as const,
    padding: '8px 16px',
    fontSize: '0.88rem', fontWeight: 600,
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
  subTitle: {
    fontSize: '1.6rem', fontWeight: 800,
    letterSpacing: '-0.01em',
    color: '#fde68a',
  },
  subSubtitle: { fontSize: '0.9rem', color: '#6b7280', letterSpacing: '0.02em' },

  // ── カードリスト（テンプレート・ドラム・SmartFX 共通） ──
  cardList: {
    display: 'flex', flexDirection: 'column' as const,
    gap: '12px', width: '100%', maxWidth: '440px', marginTop: '4px',
    maxHeight: '55vh',
    overflowY: 'auto' as const,
  },

  // ── ステップアップカード ──
  cardTop: { display: 'flex', alignItems: 'center', gap: '10px' },
  cardEmoji: { fontSize: '1.5rem', lineHeight: 1 },
  cardTitle: { fontSize: '1.0rem', fontWeight: 700, color: '#e5e7eb', flex: 1 },
  comingSoon: {
    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
    color: '#6b7280',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '3px 8px',
    textTransform: 'uppercase' as const,
  },
  cardDesc: { fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6, letterSpacing: '0.02em', paddingLeft: '2px' },

  // ── マイソング ──
  songList: {
    display: 'flex', flexDirection: 'column' as const,
    gap: '10px', width: '100%', maxWidth: '420px', marginTop: '8px',
  },
  songCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: '18px',
    padding: '14px 16px',
  },
  songCardRow: { display: 'flex', alignItems: 'center', gap: '14px' },
  artBox: {
    width: '64px', height: '64px',
    borderRadius: '14px',
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
  },
  artEmoji: { fontSize: '1.8rem', lineHeight: 1, userSelect: 'none' as const },
  songInfo: { flex: 1, minWidth: 0 },
  songTitle: {
    fontSize: '0.97rem', fontWeight: 700,
    color: '#e5e7eb', letterSpacing: '0.02em',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
  },
  songMeta: { fontSize: '0.75rem', color: '#6b7280', marginTop: '5px', letterSpacing: '0.02em' },
  editInput: {
    flex: 1, minWidth: 0,
    background: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    borderRadius: '10px',
    color: '#e5e7eb',
    fontSize: '0.95rem', fontWeight: 600,
    padding: '7px 12px',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.02em',
    transition: 'border-color 0.15s, background 0.15s',
  },
  actionBtns: { display: 'flex', gap: '5px', flexShrink: 0 },
  iconBtn: {
    padding: '6px 9px',
    fontSize: '0.78rem', fontWeight: 700,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '9px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s, border-color 0.18s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    minWidth: '30px', textAlign: 'center' as const,
  },

  // ── ドラム選択 ──
  drumIcon:     { fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 },
  drumCardBody: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  drumLabel:    { fontSize: '1.05rem', fontWeight: 700, color: '#6ee7b7', letterSpacing: '0.03em' },
  beatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  beatDot: {
    display: 'inline-block',
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.15s',
  },

  // ── ドラムグリッド ──
  gridWrapper: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: '14px', width: '100%', maxWidth: '440px',
  },
  gridPresetName: {
    fontSize: '0.9rem', fontWeight: 700, color: '#6ee7b7',
    letterSpacing: '0.03em', alignSelf: 'flex-start' as const,
  },
  gridTable: { display: 'flex', flexDirection: 'column' as const, gap: '10px', width: '100%' },
  gridRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  gridRowLabel: {
    width: '52px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700,
    color: '#6b7280', letterSpacing: '0.03em', textAlign: 'right' as const,
  },
  gridBeatHeader: {
    flex: 1, textAlign: 'center' as const,
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
  },
  gridCell: {
    flex: 1, aspectRatio: '1', borderRadius: '10px',
    cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s, border-color 0.15s',
    minWidth: '44px', maxWidth: '72px',
  },
  gridLegend: {
    display: 'flex', alignItems: 'center', gap: '14px',
    alignSelf: 'flex-start' as const, paddingLeft: '62px',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
  legendDot: {
    display: 'inline-block', width: '12px', height: '12px',
    borderRadius: '50%', flexShrink: 0,
  },
  legendLabel: { fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 },
  gridHint: {
    fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6,
    letterSpacing: '0.02em', textAlign: 'center' as const,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px', padding: '10px 14px', width: '100%',
  },
  gridActions: { display: 'flex', gap: '10px', width: '100%' },
  gridPreviewBtn: {
    flex: 1, padding: '12px 8px',
    fontSize: '0.92rem', fontWeight: 700,
    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.18)',
    borderRadius: '14px', color: '#9ca3af',
    cursor: 'pointer', transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.03em',
  },
  gridConfirmBtn: {
    flex: 2, padding: '12px 8px',
    fontSize: '0.95rem', fontWeight: 700,
    background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.45)',
    borderRadius: '14px', color: '#6ee7b7',
    cursor: 'pointer', transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.03em',
  },

  // ── Smart FX 選択 ──
  smartFxIcon: { fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 },
  smartFxLabel: { fontSize: '1.05rem', fontWeight: 700, color: '#fde68a', letterSpacing: '0.03em' },

  // ── コード進行カード ──
  chordLabel: { fontSize: '1.05rem', fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.03em' },
  chordPills: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '6px' },
  chordPillWrap: { display: 'flex', alignItems: 'center', gap: '6px' },
  chordPill: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(196, 181, 253, 0.12)',
    border: '1px solid rgba(196, 181, 253, 0.3)',
    borderRadius: '20px',
    fontSize: '0.92rem', fontWeight: 700,
    color: '#c4b5fd', letterSpacing: '0.04em',
  },
  chordArrow: { fontSize: '0.75rem', color: '#4b5563' },

  emptyState: { textAlign: 'center' as const, marginTop: '40px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  emptyText:  { fontSize: '1.05rem', color: '#4b5563', fontWeight: 600 },
  emptySubText: { fontSize: '0.88rem', color: '#374151' },

  // ── 再生中・完成 ──
  playingText: { fontSize: '2rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.03em' },
  stopBtn: {
    marginTop: '40px', padding: '16px 56px',
    fontSize: '1.1rem', fontWeight: 600,
    background: 'rgba(220,38,38,0.12)', border: '1.5px solid #dc2626',
    borderRadius: '16px', color: '#fca5a5',
    cursor: 'pointer', transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
  doneText:    { fontSize: '2.4rem', fontWeight: 800, color: '#86efac' },
  doneSubText: { fontSize: '1rem', color: '#6b7280', marginTop: '8px' },
  saveBtn: {
    marginTop: '24px', padding: '14px 48px',
    fontSize: '1.05rem', fontWeight: 700,
    background: 'rgba(251,191,36,0.12)', border: '1.5px solid rgba(251,191,36,0.5)',
    borderRadius: '16px', color: '#fde68a',
    cursor: 'pointer', transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
  retryBtn: {
    marginTop: '14px', padding: '16px 48px',
    fontSize: '1.05rem', fontWeight: 600,
    background: 'rgba(139,92,246,0.12)', border: '1.5px solid #8b5cf6',
    borderRadius: '16px', color: '#c4b5fd',
    cursor: 'pointer', transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
} as const
