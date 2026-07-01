import { useEffect, useState } from 'react'
import type { MoodId } from './theory/types'
import { composerEngine } from './composer/ComposerEngine'
import { playbackEngine } from './audio/engine'

type Status = 'idle' | 'playing' | 'done'
type Screen = 'home' | 'stepup'

const MOODS: { emoji: string; label: string; id: MoodId }[] = [
  { emoji: '😊', label: '元気',    id: 'happy'  },
  { emoji: '🌙', label: '夜',      id: 'night'  },
  { emoji: '🌧', label: '雨',      id: 'rain'   },
  { emoji: '🌸', label: '春',      id: 'spring' },
]

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

  .mood-btn:active {
    transform: translateY(-1px) scale(0.99);
    transition-duration: 0.07s;
  }

  .stop-btn:hover    { background: rgba(220, 38, 38, 0.25)    !important; }
  .retry-btn:hover   { background: rgba(139, 92, 246, 0.25)   !important; }
  .stepup-btn:hover  { background: rgba(250, 204, 21, 0.15)   !important; border-color: rgba(250, 204, 21, 0.6) !important; color: #fde68a !important; }
  .back-btn:hover    { background: rgba(255, 255, 255, 0.08)  !important; }

  .stepup-card {
    animation: fadeInUp 0.4s ease both;
    background: rgba(255, 255, 255, 0.03);
    border: 1.5px solid rgba(255, 255, 255, 0.09);
    border-radius: 20px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .stepup-card:nth-child(1) { animation-delay: 0.05s; }
  .stepup-card:nth-child(2) { animation-delay: 0.12s; }
  .stepup-card:nth-child(3) { animation-delay: 0.19s; }

  .breathing { animation: breathe 1.5s ease-in-out infinite; }
`

export default function App(): JSX.Element {
  const [status, setStatus] = useState<Status>('idle')
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    const offPlay = playbackEngine.on('play', () => setStatus('playing'))
    const offEnd  = playbackEngine.on('end',  () => setStatus('done'))
    const offStop = playbackEngine.on('stop', () => setStatus('idle'))
    return () => { offPlay(); offEnd(); offStop() }
  }, [])

  const handleSelect = async (mood: MoodId): Promise<void> => {
    const blueprint = composerEngine.compose({ mood })
    await playbackEngine.play(blueprint)
  }

  const handleStop = (): void => {
    playbackEngine.stop()
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

  // ── 完成 ────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <>
        <style>{CSS}</style>
        <div style={s.root}>
          <p style={s.doneText}>🎉 できた！</p>
          <p style={s.doneSubText}>はじめての曲が完成しました</p>
          <button className="retry-btn" onClick={() => setStatus('idle')} style={s.retryBtn}>
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
          <div style={s.stepupHeader}>
            <button className="back-btn" onClick={() => setScreen('home')} style={s.backBtn}>
              ← もどる
            </button>
            <h2 style={s.stepupTitle}>🎓 ステップアップ</h2>
            <p style={s.stepupSubtitle}>慣れてきたら、少しずつ自分でカスタマイズできます</p>
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

  // ── ホーム画面 ──────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={s.root}>
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
  header: {
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
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
  question: {
    color: '#d1d5db',
    fontSize: '1.15rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
    maxWidth: '380px',
  },
  wideBtn: {
    flexDirection: 'row' as const,
    maxWidth: '380px',
    padding: '20px 32px',
    gap: '12px',
  },
  moodEmoji: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  // ステップアップ入口ボタン（右上、目立たせすぎない）
  stepupEntryBtn: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    padding: '8px 16px',
    fontSize: '0.78rem',
    fontWeight: 600,
    background: 'rgba(250, 204, 21, 0.07)',
    border: '1.5px solid rgba(250, 204, 21, 0.28)',
    borderRadius: '20px',
    color: 'rgba(253, 230, 138, 0.7)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
  },
  // ── ステップアップ画面 ──
  stepupHeader: {
    textAlign: 'center' as const,
    marginBottom: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
  },
  backBtn: {
    alignSelf: 'flex-start' as const,
    padding: '8px 16px',
    fontSize: '0.88rem',
    fontWeight: 600,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1.5px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '14px',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
  stepupTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    color: '#fde68a',
  },
  stepupSubtitle: {
    fontSize: '0.9rem',
    color: '#6b7280',
    letterSpacing: '0.02em',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
    marginTop: '8px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardEmoji: {
    fontSize: '1.5rem',
    lineHeight: 1,
  },
  cardTitle: {
    fontSize: '1.0rem',
    fontWeight: 700,
    color: '#e5e7eb',
    flex: 1,
  },
  comingSoon: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#6b7280',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '3px 8px',
    textTransform: 'uppercase' as const,
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#6b7280',
    lineHeight: 1.6,
    letterSpacing: '0.02em',
    paddingLeft: '2px',
  },
  // ── 再生中・完成 ──
  playingText: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#c4b5fd',
    letterSpacing: '0.03em',
  },
  stopBtn: {
    marginTop: '40px',
    padding: '16px 56px',
    fontSize: '1.1rem',
    fontWeight: 600,
    background: 'rgba(220, 38, 38, 0.12)',
    border: '1.5px solid #dc2626',
    borderRadius: '16px',
    color: '#fca5a5',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
  doneText: {
    fontSize: '2.4rem',
    fontWeight: 800,
    color: '#86efac',
  },
  doneSubText: {
    fontSize: '1rem',
    color: '#6b7280',
    marginTop: '8px',
  },
  retryBtn: {
    marginTop: '36px',
    padding: '16px 48px',
    fontSize: '1.05rem',
    fontWeight: 600,
    background: 'rgba(139, 92, 246, 0.12)',
    border: '1.5px solid #8b5cf6',
    borderRadius: '16px',
    color: '#c4b5fd',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: "'Hiragino Sans', 'Yu Gothic UI', 'Meiryo', sans-serif",
    letterSpacing: '0.04em',
  },
} as const
