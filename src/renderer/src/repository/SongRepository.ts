import type { SavedSong } from '../theory/types'

const STORAGE_KEY = 'firstsong_v1'

export const SongRepository = {
  save(song: SavedSong): void {
    const all = this.loadAll()
    all.unshift(song)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },

  loadAll(): SavedSong[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as SavedSong[]) : []
    } catch {
      return []
    }
  },

  update(id: string, title: string): void {
    const all = this.loadAll().map(s =>
      s.id === id
        ? { ...s, title, updatedAt: new Date().toISOString() }
        : s
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  },

  delete(id: string): void {
    const filtered = this.loadAll().filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },
}
