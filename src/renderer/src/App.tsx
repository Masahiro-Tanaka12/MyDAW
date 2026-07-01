import { useEffect, useState } from 'react'
import { playbackEngine } from './audio/engine'
import { sampleSong } from './audio/sampleSong'

type Status = 'idle' | 'playing' | 'done'

export default function App(): JSX.Element {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    const offPlay = playbackEngine.on('play', () => setStatus('playing'))
    const offEnd  = playbackEngine.on('end',  () => setStatus('done'))
    const offStop = playbackEngine.on('stop', () => setStatus('idle'))
    return () => {
      offPlay()
      offEnd()
      offStop()
    }
  }, [])

  const handlePlay = async (): Promise<void> => {
    await playbackEngine.play(sampleSong)
  }

  const handleStop = (): void => {
    playbackEngine.stop()
  }

  return (
    <div style={styles.root}>
      <h1 style={styles.title}>First Song</h1>
      <p style={styles.subtitle}>音楽経験ゼロでも、音が鳴らせる。</p>

      <button
        onClick={status === 'playing' ? handleStop : handlePlay}
        style={{
          ...styles.button,
          ...(status === 'playing' ? styles.buttonStop : {}),
        }}
      >
        {status === 'playing' ? '⏹ 停止' : '🎵 サンプル曲を聴く'}
      </button>

      <p style={styles.statusText}>
        {status === 'idle'    && 'C → G → Am → F（BPM 120）'}
        {status === 'playing' && '🎶 再生中...'}
        {status === 'done'    && '✅ 再生完了！もう一度聴けます。'}
      </p>
    </div>
  )
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    fontFamily: "'Hiragino Sans', 'Yu Gothic', sans-serif",
    gap: '16px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#888888',
    margin: 0,
  },
  button: {
    marginTop: '24px',
    padding: '20px 48px',
    fontSize: '1.25rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonStop: {
    backgroundColor: '#dc2626',
  },
  statusText: {
    fontSize: '0.9rem',
    color: '#9ca3af',
    minHeight: '1.5em',
    margin: 0,
  },
} as const
