import { useEffect, useState } from 'react'
import type { MoodId } from './theory/types'
import { composerEngine } from './composer/ComposerEngine'
import { playbackEngine } from './audio/engine'

type Status = 'idle' | 'playing' | 'done'

const MOODS: { emoji: string; label: string; id: MoodId }[] = [
  { emoji: '😊', label: '元気',    id: 'happy'  },
  { emoji: '🌙', label: '夜',      id: 'night'  },
  { emoji: '🌧', label: '雨',      id: 'rain'   },
  { emoji: '🌸', label: '春',      id: 'spring' },
]

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #08080f; }

  @keyframes breathe {
    0%, 100% { opacity: 1;   transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.96); }
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

  .stop-btn:hover  { background: rgba(220, 38, 38, 0.25)   !important; }
  .retry-btn:hover { background: rgba(139, 92, 246, 0.25)  !important; }

  .breathing { animation: breathe 1.5s ease-in-out infinite; }
`

export default function App(): JSX.Element {
  const [status, setStatus] = useState<Status>('idle')

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

  return (
    <>
      <style>{CSS}</style>
      <div style={s.root}>
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
