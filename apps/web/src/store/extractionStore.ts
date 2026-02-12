import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SpotifyArtist, SpotifyAlbum, ExtractionProgress } from '@spotify2lidarr/types'
import { indexedDBStorage } from '@/lib/storage/IndexedDBStorage'

export interface ExtractionState {
  artists: SpotifyArtist[]
  albums: SpotifyAlbum[]

  progress: ExtractionProgress | null
  isExtracting: boolean
  extractionComplete: boolean

  error: string | null

  startExtraction: () => void
  setProgress: (progress: ExtractionProgress) => void
  setResults: (artists: SpotifyArtist[], albums: SpotifyAlbum[]) => void
  completeExtraction: () => void
  setError: (error: string) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  artists: [],
  albums: [],
  progress: null,
  isExtracting: false,
  extractionComplete: false,
  error: null,
}

export const useExtractionStore = create<ExtractionState>()(
  persist(
    (set) => ({
      ...initialState,

      startExtraction: () =>
        set({
          isExtracting: true,
          extractionComplete: false,
          error: null,
          progress: {
            stage: 'artists',
            current: 0,
            total: 0,
          },
        }),

      setProgress: (progress) =>
        set({ progress }),

      setResults: (artists, albums) =>
        set({ artists, albums }),

      completeExtraction: () =>
        set({
          isExtracting: false,
          extractionComplete: true,
          progress: null,
        }),

      setError: (error) =>
        set({
          error,
          isExtracting: false,
        }),

      clearError: () =>
        set({ error: null }),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'spotify2lidarr-extraction',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        artists: state.artists,
        albums: state.albums,
        extractionComplete: state.extractionComplete,
      }),
    }
  )
)
