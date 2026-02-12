import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import { lidarrRateLimiter } from '@/lib/utils/rateLimiter'
import type {
  LidarrArtist,
  LidarrAlbum,
  LidarrQualityProfile,
  LidarrMetadataProfile,
  LidarrRootFolder,
  LidarrSystemStatus,
  LidarrAddArtistOptions,
} from '@spotify2lidarr/types'

export class LidarrClient {
  private static getConfig(): { url: string; apiKey: string } | null {
    const url = CredentialsStore.getLidarrUrl()
    const apiKey = CredentialsStore.getLidarrApiKey()
    if (!url || !apiKey) return null
    return { url, apiKey }
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return lidarrRateLimiter.execute(async () => {
      const config = this.getConfig()
      if (!config) {
        throw new Error('Lidarr not configured. Please enter URL and API key.')
      }

      const requestUrl = `${config.url}/api/v1${endpoint}`

      let response: Response
      try {
        response = await fetch(requestUrl, {
          ...options,
          headers: {
            'X-Api-Key': config.apiKey,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
      } catch (networkError) {
        throw new Error(
          `Network error calling ${requestUrl}: ${networkError instanceof Error ? networkError.message : 'Failed to fetch'}`
        )
      }

      if (!response.ok) {
        let detail = ''
        try {
          const error = await response.json()
          if (error.message) detail = error.message
          else if (typeof error === 'string') detail = error
          else if (Array.isArray(error)) detail = error.map((e: any) => e.errorMessage || e.propertyName).join(', ')
          else detail = JSON.stringify(error)
        } catch {
          detail = await response.text().catch(() => '')
        }
        throw new Error(
          `Lidarr ${response.status} on ${options.method || 'GET'} ${endpoint}: ${detail}`
        )
      }

      return response.json()
    })
  }

  static async testConnection(): Promise<LidarrSystemStatus> {
    return this.request<LidarrSystemStatus>('/system/status')
  }

  static async getQualityProfiles(): Promise<LidarrQualityProfile[]> {
    return this.request<LidarrQualityProfile[]>('/qualityprofile')
  }

  static async getMetadataProfiles(): Promise<LidarrMetadataProfile[]> {
    return this.request<LidarrMetadataProfile[]>('/metadataprofile')
  }

  static async getRootFolders(): Promise<LidarrRootFolder[]> {
    return this.request<LidarrRootFolder[]>('/rootfolder')
  }

  static async getArtists(): Promise<LidarrArtist[]> {
    return this.request<LidarrArtist[]>('/artist')
  }

  static async getAlbums(): Promise<LidarrAlbum[]> {
    return this.request<LidarrAlbum[]>('/album')
  }

  static async lookupArtist(term: string): Promise<LidarrArtist[]> {
    return this.request<LidarrArtist[]>(
      `/artist/lookup?term=${encodeURIComponent(term)}`
    )
  }

  static async lookupAlbum(term: string): Promise<LidarrAlbum[]> {
    return this.request<LidarrAlbum[]>(
      `/album/lookup?term=${encodeURIComponent(term)}`
    )
  }

  static async addArtist(
    artist: LidarrArtist,
    options: {
      qualityProfileId: number
      metadataProfileId: number
      rootFolderPath: string
      monitored: boolean
      addOptions: LidarrAddArtistOptions
    }
  ): Promise<LidarrArtist> {
    const body = {
      artistName: artist.artistName,
      foreignArtistId: artist.foreignArtistId,
      qualityProfileId: options.qualityProfileId,
      metadataProfileId: options.metadataProfileId,
      rootFolderPath: options.rootFolderPath,
      monitored: options.monitored,
      addOptions: options.addOptions,
      images: artist.images,
      tags: [],
    }

    return this.request<LidarrArtist>('/artist', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
}
