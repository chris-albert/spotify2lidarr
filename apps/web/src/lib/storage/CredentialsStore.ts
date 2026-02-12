const SPOTIFY_CLIENT_ID_KEY = 'spotify2lidarr-spotify-client-id'
const LIDARR_URL_KEY = 'spotify2lidarr-lidarr-url'
const LIDARR_API_KEY_KEY = 'spotify2lidarr-lidarr-api-key'

/**
 * CredentialsStore - Manages OAuth client IDs and Lidarr config in localStorage
 */
export const CredentialsStore = {
  // Spotify
  getSpotifyClientId(): string | null {
    return localStorage.getItem(SPOTIFY_CLIENT_ID_KEY)
  },

  saveSpotifyClientId(clientId: string): void {
    localStorage.setItem(SPOTIFY_CLIENT_ID_KEY, clientId.trim())
  },

  clearSpotifyClientId(): void {
    localStorage.removeItem(SPOTIFY_CLIENT_ID_KEY)
  },

  // Lidarr
  getLidarrUrl(): string | null {
    return localStorage.getItem(LIDARR_URL_KEY)
  },

  saveLidarrUrl(url: string): void {
    localStorage.setItem(LIDARR_URL_KEY, url.trim().replace(/\/+$/, ''))
  },

  getLidarrApiKey(): string | null {
    return localStorage.getItem(LIDARR_API_KEY_KEY)
  },

  saveLidarrApiKey(apiKey: string): void {
    localStorage.setItem(LIDARR_API_KEY_KEY, apiKey.trim())
  },

  clearLidarrCredentials(): void {
    localStorage.removeItem(LIDARR_URL_KEY)
    localStorage.removeItem(LIDARR_API_KEY_KEY)
  },
}
