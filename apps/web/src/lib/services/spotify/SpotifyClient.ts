import { SpotifyAuth } from './SpotifyAuth'
import { spotifyRateLimiter } from '@/lib/utils/rateLimiter'
import type {
  SpotifyAlbum,
  SpotifyArtist,
} from '@spotify2lidarr/types'
import type { SpotifyPaginatedResponse, SpotifyUser } from './types'

const API_BASE = 'https://api.spotify.com/v1'

export class SpotifyClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return spotifyRateLimiter.execute(async () => {
      const accessToken = await SpotifyAuth.getValidAccessToken()

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error?.message || `API request failed: ${response.status}`
        )
      }

      return response.json()
    })
  }

  static async getCurrentUser(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>('/me')
  }

  private static async getAllPaginated<T>(
    endpoint: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<T[]> {
    const items: T[] = []
    let nextUrl: string | null = endpoint
    let offset = 0
    const limit = 50

    while (nextUrl) {
      const url: string = nextUrl.startsWith('http')
        ? nextUrl.replace(API_BASE, '')
        : `${nextUrl}${nextUrl.includes('?') ? '&' : '?'}limit=${limit}&offset=${offset}`

      const response: SpotifyPaginatedResponse<T> = await this.request<SpotifyPaginatedResponse<T>>(url)

      items.push(...response.items)

      if (onProgress) {
        onProgress(items.length, response.total)
      }

      nextUrl = response.next
      offset += limit
    }

    return items
  }

  static async getSavedAlbums(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyAlbum[]> {
    const items = await this.getAllPaginated<{ album: SpotifyAlbum }>(
      '/me/albums',
      onProgress
    )
    return items.map((item) => item.album)
  }

  static async getFollowedArtists(
    onProgress?: (current: number, total: number) => void
  ): Promise<SpotifyArtist[]> {
    const items: SpotifyArtist[] = []
    let after: string | undefined

    while (true) {
      const url = after
        ? `/me/following?type=artist&limit=50&after=${after}`
        : '/me/following?type=artist&limit=50'

      const response = await this.request<{
        artists: SpotifyPaginatedResponse<SpotifyArtist>
      }>(url)

      items.push(...response.artists.items)

      if (onProgress) {
        onProgress(items.length, response.artists.total)
      }

      if (!response.artists.next) break

      const nextUrl = new URL(response.artists.next)
      after = nextUrl.searchParams.get('after') || undefined
      if (!after) break
    }

    return items
  }

  static async extractArtistsAndAlbums(
    onStageChange?: (stage: 'artists' | 'albums' | 'complete') => void,
    onProgress?: (stage: string, current: number, total: number) => void
  ): Promise<{ artists: SpotifyArtist[]; albums: SpotifyAlbum[] }> {
    onStageChange?.('artists')
    const artists = await this.getFollowedArtists((current, total) =>
      onProgress?.('artists', current, total)
    )

    onStageChange?.('albums')
    const albums = await this.getSavedAlbums((current, total) =>
      onProgress?.('albums', current, total)
    )

    onStageChange?.('complete')

    return { artists, albums }
  }
}
