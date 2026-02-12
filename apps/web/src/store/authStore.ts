import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope: string
}

export interface AuthState {
  spotifyTokens: AuthTokens | null
  spotifyConnected: boolean
  spotifyUserId: string | null

  setSpotifyTokens: (tokens: AuthTokens) => void
  setSpotifyUserId: (userId: string) => void
  clearSpotifyAuth: () => void
  isSpotifyTokenValid: () => boolean
  clearAllAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      spotifyTokens: null,
      spotifyConnected: false,
      spotifyUserId: null,

      setSpotifyTokens: (tokens) =>
        set({
          spotifyTokens: tokens,
          spotifyConnected: true,
        }),

      setSpotifyUserId: (userId) =>
        set({ spotifyUserId: userId }),

      clearSpotifyAuth: () =>
        set({
          spotifyTokens: null,
          spotifyConnected: false,
          spotifyUserId: null,
        }),

      isSpotifyTokenValid: () => {
        const { spotifyTokens } = get()
        if (!spotifyTokens) return false
        return Date.now() < spotifyTokens.expiresAt
      },

      clearAllAuth: () =>
        set({
          spotifyTokens: null,
          spotifyConnected: false,
          spotifyUserId: null,
        }),
    }),
    {
      name: 'spotify2lidarr-auth',
      partialize: (state) => ({
        spotifyTokens: state.spotifyTokens,
        spotifyConnected: state.spotifyConnected,
        spotifyUserId: state.spotifyUserId,
      }),
    }
  )
)
