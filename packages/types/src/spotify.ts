/**
 * Spotify API Types
 */

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  isrc: string | null
  duration_ms: number
  explicit: boolean
  uri: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  external_urls: {
    spotify: string
  }
  genres?: string[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  artists: SpotifyArtist[]
  release_date: string
  total_tracks: number
  uri: string
  images: SpotifyImage[]
  external_urls: {
    spotify: string
  }
}

export interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  public: boolean
  collaborative: boolean
  owner: {
    id: string
    display_name: string
  }
  tracks: {
    total: number
    items: SpotifyPlaylistTrack[]
  }
  images: SpotifyImage[]
  uri: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylistTrack {
  added_at: string
  track: SpotifyTrack
}

export interface SpotifyLibrary {
  playlists: SpotifyPlaylist[]
  savedTracks: SpotifyTrack[]
  savedAlbums: SpotifyAlbum[]
  followedArtists: SpotifyArtist[]
}

export interface SpotifyTokens {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export interface ExtractionProgress {
  stage: 'artists' | 'albums' | 'complete'
  current: number
  total: number
  currentItem?: string
}
