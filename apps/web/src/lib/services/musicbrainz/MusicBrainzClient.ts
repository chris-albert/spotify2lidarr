import { musicbrainzRateLimiter } from '@/lib/utils/rateLimiter'

export interface MusicBrainzArtist {
  id: string // MusicBrainz ID (= Lidarr foreignArtistId)
  name: string
  score: number
  type?: string
  country?: string
  disambiguation?: string
}

interface MusicBrainzSearchResponse {
  artists: Array<{
    id: string
    name: string
    score: number
    type?: string
    country?: string
    disambiguation?: string
  }>
  count: number
}

export class MusicBrainzClient {
  private static readonly BASE_URL = 'https://musicbrainz.org/ws/2'
  private static readonly USER_AGENT = 'Spotify2Lidarr/1.0 (https://github.com/chris-albert/spotify2lidarr)'

  static async searchArtist(name: string): Promise<MusicBrainzArtist[]> {
    return musicbrainzRateLimiter.execute(async () => {
      const url = `${this.BASE_URL}/artist/?query=artist:${encodeURIComponent(name)}&fmt=json&limit=10`

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`MusicBrainz ${response.status}: ${await response.text().catch(() => '')}`)
      }

      const data: MusicBrainzSearchResponse = await response.json()

      return data.artists.map((a) => ({
        id: a.id,
        name: a.name,
        score: a.score,
        type: a.type,
        country: a.country,
        disambiguation: a.disambiguation,
      }))
    })
  }
}
