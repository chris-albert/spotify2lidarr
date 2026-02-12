import type { AuthTokens } from '@/store/authStore'

const SPOTIFY_TOKEN_KEY = 'spotify2lidarr_spotify_tokens'
const PKCE_VERIFIER_KEY = 'spotify2lidarr_pkce_verifier'

export class TokenStore {
  static saveSpotifyTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(tokens))
    } catch (error) {
      console.error('Failed to save Spotify tokens:', error)
      throw new Error('Failed to save authentication tokens')
    }
  }

  static getSpotifyTokens(): AuthTokens | null {
    try {
      const tokensJson = localStorage.getItem(SPOTIFY_TOKEN_KEY)
      if (!tokensJson) return null
      return JSON.parse(tokensJson) as AuthTokens
    } catch (error) {
      console.error('Failed to retrieve Spotify tokens:', error)
      return null
    }
  }

  static isSpotifyTokenValid(): boolean {
    const tokens = this.getSpotifyTokens()
    if (!tokens) return false
    const bufferMs = 5 * 60 * 1000
    return Date.now() < tokens.expiresAt - bufferMs
  }

  static clearSpotifyTokens(): void {
    localStorage.removeItem(SPOTIFY_TOKEN_KEY)
  }

  static clearAllTokens(): void {
    this.clearSpotifyTokens()
    this.clearPKCEVerifier()
  }

  static savePKCEVerifier(verifier: string): void {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier)
  }

  static getPKCEVerifier(): string | null {
    return sessionStorage.getItem(PKCE_VERIFIER_KEY)
  }

  static clearPKCEVerifier(): void {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  }

  static getValidSpotifyToken(): string | null {
    if (!this.isSpotifyTokenValid()) return null
    const tokens = this.getSpotifyTokens()
    return tokens?.accessToken || null
  }
}
