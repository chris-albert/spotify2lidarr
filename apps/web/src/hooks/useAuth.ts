import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { TokenStore } from '@/lib/storage/TokenStore'

export function useAuth() {
  const {
    spotifyConnected,
    spotifyUserId,
    setSpotifyTokens,
    setSpotifyUserId,
    clearSpotifyAuth,
    isSpotifyTokenValid,
    clearAllAuth,
  } = useAuthStore()

  const initializeAuth = useCallback(() => {
    const spotifyTokens = TokenStore.getSpotifyTokens()
    if (spotifyTokens && TokenStore.isSpotifyTokenValid()) {
      setSpotifyTokens(spotifyTokens)
    } else {
      clearSpotifyAuth()
    }
  }, [setSpotifyTokens, clearSpotifyAuth])

  const disconnectSpotify = useCallback(() => {
    TokenStore.clearSpotifyTokens()
    clearSpotifyAuth()
  }, [clearSpotifyAuth])

  const disconnectAll = useCallback(() => {
    TokenStore.clearAllTokens()
    clearAllAuth()
  }, [clearAllAuth])

  const connectionStatus = {
    spotify: {
      connected: spotifyConnected,
      userId: spotifyUserId,
      tokenValid: isSpotifyTokenValid(),
    },
  }

  return {
    spotifyConnected,
    spotifyUserId,
    connectionStatus,

    initializeAuth,
    setSpotifyTokens,
    setSpotifyUserId,
    disconnectSpotify,
    disconnectAll,
    isSpotifyTokenValid,
  }
}
