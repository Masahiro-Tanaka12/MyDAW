import type { SongBlueprint, UserIntent } from '../theory/types'
import { happySong }  from '../audio/sampleSongs/happy'
import { nightSong }  from '../audio/sampleSongs/night'
import { rainSong }   from '../audio/sampleSongs/rain'
import { springSong } from '../audio/sampleSongs/spring'

const SONG_MAP: Record<string, SongBlueprint> = {
  happy:  happySong,
  night:  nightSong,
  rain:   rainSong,
  spring: springSong,
}

const ALL = Object.values(SONG_MAP)

export class ComposerEngine {
  compose(intent: UserIntent): SongBlueprint {
    if (intent.mood === 'random') {
      return ALL[Math.floor(Math.random() * ALL.length)]
    }
    return SONG_MAP[intent.mood] ?? happySong
  }
}

export const composerEngine = new ComposerEngine()
