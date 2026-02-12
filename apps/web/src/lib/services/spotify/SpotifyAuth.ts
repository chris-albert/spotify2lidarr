import { generateCodeVerifier, generateCodeChallenge } from '@/lib/utils/pkce'
import { TokenStore } from '@/lib/storage/TokenStore'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import type { AuthTokens } from '@/store/authStore'

const getSpotifyClientId = () => CredentialsStore.getSpotifyClientId()
const REDIRECT_URI = `${import.meta.env.VITE_REDIRECT_URI || window.location.origin}/spotify2lidarr/`
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

const SCOPES = [
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-follow-read',
].join(' ')

export class SpotifyAuth {
  static async initiateAuth(): Promise<void> {
    const clientId = getSpotifyClientId()
    if (!clientId) {
      throw new Error('Spotify Client ID not configured')
    }

    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    TokenStore.savePKCEVerifier(verifier)
    sessionStorage.setItem('oauth_provider', 'spotify')

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
      show_dialog: 'false',
    })

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`
  }

  static async handleCallback(code: string): Promise<AuthTokens> {
    const clientId = getSpotifyClientId()
    if (!clientId) {
      throw new Error('Spotify Client ID not configured')
    }

    const verifier = TokenStore.getPKCEVerifier()
    if (!verifier) {
      throw new Error('PKCE verifier not found. Please restart authentication.')
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: clientId,
          code_verifier: verifier,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Token exchange failed')
      }

      const data = await response.json()
      const expiresAt = Date.now() + data.expires_in * 1000

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
        scope: data.scope,
      }

      TokenStore.saveSpotifyTokens(tokens)
      TokenStore.clearPKCEVerifier()

      return tokens
    } catch (error) {
      TokenStore.clearPKCEVerifier()
      throw error
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const clientId = getSpotifyClientId()
    if (!clientId) {
      throw new Error('Spotify Client ID not configured')
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error_description || 'Token refresh failed')
      }

      const data = await response.json()
      const expiresAt = Date.now() + data.expires_in * 1000

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt,
        scope: data.scope,
      }

      TokenStore.saveSpotifyTokens(tokens)
      return tokens
    } catch (error) {
      TokenStore.clearSpotifyTokens()
      throw error
    }
  }

  static async getValidAccessToken(): Promise<string> {
    const tokens = TokenStore.getSpotifyTokens()

    if (!tokens) {
      throw new Error('Not authenticated with Spotify')
    }

    if (TokenStore.isSpotifyTokenValid()) {
      return tokens.accessToken
    }

    if (!tokens.refreshToken) {
      throw new Error('No refresh token available. Please re-authenticate.')
    }

    const newTokens = await this.refreshToken(tokens.refreshToken)
    return newTokens.accessToken
  }

  static logout(): void {
    TokenStore.clearSpotifyTokens()
    TokenStore.clearPKCEVerifier()
  }
}
