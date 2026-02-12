import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MigrationResult } from '@spotify2lidarr/types'
import { indexedDBStorage } from '@/lib/storage/IndexedDBStorage'

export interface MigrationState {
  results: MigrationResult[]
  progress: {
    current: number
    total: number
    currentItem: string
  } | null
  isMigrating: boolean
  migrationComplete: boolean
  error: string | null

  startMigration: (total: number) => void
  updateProgress: (current: number, currentItem: string) => void
  addResult: (result: MigrationResult) => void
  completeMigration: () => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = {
  results: [],
  progress: null,
  isMigrating: false,
  migrationComplete: false,
  error: null,
}

export const useMigrationStore = create<MigrationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startMigration: (total) =>
        set({
          isMigrating: true,
          migrationComplete: false,
          error: null,
          results: [],
          progress: { current: 0, total, currentItem: '' },
        }),

      updateProgress: (current, currentItem) =>
        set({
          progress: {
            current,
            total: get().progress?.total || 0,
            currentItem,
          },
        }),

      addResult: (result) =>
        set((state) => ({
          results: [...state.results, result],
        })),

      completeMigration: () =>
        set({
          isMigrating: false,
          migrationComplete: true,
          progress: null,
        }),

      setError: (error) =>
        set({
          error,
          isMigrating: false,
        }),

      reset: () =>
        set(initialState),
    }),
    {
      name: 'spotify2lidarr-migration',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        results: state.results,
        migrationComplete: state.migrationComplete,
      }),
    }
  )
)
