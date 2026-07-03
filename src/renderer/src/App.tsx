import { useEffect, useState } from 'react'
import type { MoodId, RealMoodId, SongBlueprint, SavedSong } from './theory/types'
import { composerEngine } from './composer/ComposerEngine'
import { playbackEngine } from './audio/engine'
import { SongRepository } from './repository/SongRepository'

type Status      = 'idle' | 'loading' | 'error' | 'playing' | 'done'
type Screen      = 'home' | 'stepup' | 'mysongs'
type PlayContext = 'compose' | 'library'

const MOODS: { emoji: string; label: string; id: MoodId }[] = [
  { emoji: '😊', label: '元気',    id: 'happy'  },
  { emoji: '🌙', label: '夜',      id: 'night'  },
  { emoji: '🌧', label: '雨',      id: 'rain'   },
  { emoji: '🌸', label: '春',      id: 'spring' },
]

const MOOD_MAP: Record<RealMoodId, { emoji: string; label: string }> = {
  happy:  { emoji: '😊', label: '元気' },
  night:  { emoji: '🌙', label: '夜'   },
  rain:   { emoji: '🌧', label: '雨'   },
  spring: { emoji: '🌸', label: '春'   },
}

// アルバムアートプレースホルダー色（Moodごと）
const MOOD_COLORS: Record<RealMoodId, string> = {
  happy:  'linear-gradient(135deg, #d97706, #fbbf24)',
  night:  'linear-gradient(135deg, #5b21b6, #8b5cf6)',
  rain:   'linear-gradient(135deg, #1d4ed8, #60a5fa)',
  spring: 'linear-gradient(135deg, #be185d, #f472b6)',
}

const STEPUP_CARDS = [
  {
    emoji: '🎵',
    title: '曲の流れを選ぶ',
    desc: '最初から最後まで、どんな雰囲気で進むかを自分で決められます',
  },
  {
    emoji: '🕐',
    title: '曲の速さを選ぶ',
    desc: 'ゆったりした曲にするか、テンポよく弾む曲にするかを調整できます',
  },
  {
    emoji: '🎸',
    title: '楽器を選ぶ',
    desc: 'ピアノ・ギター・シンセなど、音の雰囲気をがらりと変えられます',
  },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
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
`

export default function App(): JSX.Element {
  const [status,       setStatus]       = useState<Status>('idle')
  const [screen,       setScreen]       = useState<Screen>('home')
  const [playContext,  setPlayContext]  = useState<PlayContext>('compose')
  const [lastBlueprint, setLastBlueprint] = useState<SongBlueprint | null>(null)
  const [isSaved,      setIsSaved]      = useState(false)
  const [songs,        setSongs]        = useState<SavedSong[]>([])
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    const offPlay = playbackEngine.on('play', () => setStatus('playing'))
    const offEnd  = playbackEngine.on('end',  () => setStatus('done'))
    const offStop = playbackEngine.on('stop', () => setStatus('idle'))

    // Tone.js が onerror の外側でグローバルに reject を発火するケースをキャッチ
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

  // ── ホーム: 曲を作る ──────────────────────────────────────────────
  const handleSelect = async (mood: MoodId): Promise<void> => {
    setPlayContext('compose')
    const blueprint = composerEngine.compose({ mood })
    setLastBlueprint(blueprint)
    setIsSaved(false)
    setStatus('loading')
    try {
      await playbackEngine.play(blueprint)
    } catch {
      playbackEngine.resetLoad()
      setStatus('error')
    }
  }

  const handleStop = (): void => { playbackEngine.stop() }

  const handleRetry = (): void => { setStatus('idle') }

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

  // ── マイソング ────────────────────────────────────────────────────
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
    setSongs(prev => prev.filter(s => s.id !== id))
  }

  // ── 読み込み中 ──────────────────────────────────────────────────
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

  // ── エラー ──────────────────────────────────────────────────────
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
          <button
            className="retry-btn"
            onClick={() => setStatus('idle')}
            style={{ ...s.retryBtn, marginTop: '32px' }}
          >
            もどる
          </button>
        </div>
      </>
    )
  }

  // ── 再生中 ──────────────────────────────────────────────────────
  if (status === 'playing') {
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

  // ── 完成（ライブラリ再生） ─────────────────────────────────────
  if (status === 'done' && playContext === 'library') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={s.doneText}>🎵 再生完了</p>
          <button
            className="retry-btn"
            onClick={() => setStatus('idle')}
            style={s.retryBtn}
          >
            📚 マイソングにもどる
          </button>
        </div>
      </>
    )
  }

  // ── 完成（作曲） ──────────────────────────────────────────────
  if (status === 'done') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={s.doneText}>🎉 できた！</p>
          <p style={s.doneSubText}>はじめての曲が完成しました</p>
          {isSaved ? (
            <button disabled style={{...s.saveBtn, opacity: 0.45, cursor: 'default'}}>
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

  // ── ステップアップ画面 ──────────────────────────────────────────
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

  // ── マイソング画面 ──────────────────────────────────────────────
  if (screen === 'mysongs') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <div style={s.subHeader}>
            <button className="back-btn" onClick={() => setScreen('home')} style={s.backBtn}>
              ← もどる
            </button>
            <h2 style={{...s.subTitle, color: '#6ee7b7'}}>📚 マイソング</h2>
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
                <div
                  key={song.id}
                  className="song-card"
                  style={{...s.songCard, animationDelay: `${i * 0.06}s`}}
                >
                  <div style={s.songCardRow}>
                    {/* アルバムアートプレースホルダー */}
                    <div style={{...s.artBox, background: MOOD_COLORS[song.mood]}}>
                      <span style={s.artEmoji}>{MOOD_MAP[song.mood].emoji}</span>
                    </div>

                    {/* タイトル / 編集インプット */}
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
                        <p style={s.songMeta}>
                          {formatDate(song.updatedAt ?? song.createdAt)}
                        </p>
                      </div>
                    )}

                    {/* アクションボタン */}
                    {editingId === song.id ? (
                      <div style={s.actionBtns}>
                        <button
                          className="save-edit-btn"
                          onClick={() => handleEditSave(song.id)}
                          style={{...s.iconBtn, color: '#6ee7b7'}}
                          title="保存"
                        >✓</button>
                        <button
                          className="delete-song-btn"
                          onClick={() => setEditingId(null)}
                          style={s.iconBtn}
                          title="キャンセル"
                        >✕</button>
                      </div>
                    ) : (
                      <div style={s.actionBtns}>
                        <button
                          className="play-song-btn"
                          onClick={() => handlePlaySaved(song)}
                          style={s.iconBtn}
                          title="再生"
                        >▶</button>
                        <button
                          className="edit-song-btn"
                          onClick={() => handleEditStart(song)}
                          style={s.iconBtn}
                          title="タイトルを変更"
                        >✏</button>
                        <button
                          className="delete-song-btn"
                          onClick={() => handleDeleteSong(song.id)}
                          style={s.iconBtn}
                          title="削除"
                        >✕</button>
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

  // ── ホーム画面 ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={s.root}>
        <button
          className="mysongs-btn"
          onClick={handleOpenMySongs}
          style={s.mysongsEntryBtn}
        >
          📚 マイソング
        </button>
        <button
          className="stepup-btn"
          onClick={() => setScreen('stepup')}
          style={s.stepupEntryBtn}
        >
          🎓 ステップアップ
        </button>

        <header style={s.header}>
          <h1 style={s.title}>First Song</h1>
          <p style={s.question}>今日はどんな曲を作りますか？</p>
        </header>

        <div style={s.grid}>
          {MOODS.map(({ emoji, label, id }) => (
            <button key={id} className="mood-btn" onClick={() => handleSelect(id)}>
              <span style={s.moodEmoji}>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          className="mood-btn"
          onClick={() => handleSelect('random')}
          style={s.wideBtn}
        >
          <span style={s.moodEmoji}>✨</span>
          <span>おまかせ</span>
        </button>
      </div>
    </>
  )
}

const s = {
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
  header: { textAlign: 'center' as const, marginBottom: '12px' },
  title: {
    fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    background: 'linear-gradient(130deg, #c4b5fd 10%, #67e8f9 90%)',
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    lineHeight: 1.1,
    marginBottom: '20px',
  },
  question: { color: '#d1d5db', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '0.03em' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
    maxWidth: '380px',
  },
  wideBtn: { flexDirection: 'row' as const, maxWidth: '380px', padding: '20px 32px', gap: '12px' },
  moodEmoji: { fontSize: '2rem', lineHeight: 1 },

  // ── ホーム画面：左上・右上の小ボタン ──
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

  // ── ステップアップカード ──
  cardList: {
    display: 'flex', flexDirection: 'column' as const,
    gap: '12px', width: '100%', maxWidth: '400px', marginTop: '8px',
  },
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

  // ── マイソング一覧 ──
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

  // アルバムアートプレースホルダー（64×64）
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

  // タイトル編集インプット
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

  // アクションボタン群
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

  emptyState: { textAlign: 'center' as const, marginTop: '40px', display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  emptyText: { fontSize: '1.05rem', color: '#4b5563', fontWeight: 600 },
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
  doneText: { fontSize: '2.4rem', fontWeight: 800, color: '#86efac' },
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
