/**
 * Lidarr API Types
 */

export interface LidarrArtist {
  id: number
  artistName: string
  foreignArtistId: string // MusicBrainz ID
  overview?: string
  artistType?: string
  status?: string
  images: LidarrImage[]
  genres: string[]
  monitored: boolean
  qualityProfileId: number
  metadataProfileId: number
  rootFolderPath: string
  tags: number[]
  added: string
  statistics?: LidarrStatistics
}

export interface LidarrAlbum {
  id: number
  title: string
  foreignAlbumId: string // MusicBrainz Release Group ID
  artistId: number
  albumType: string
  releaseDate: string
  images: LidarrImage[]
  monitored: boolean
  artist?: LidarrArtist
  statistics?: LidarrStatistics
}

export interface LidarrImage {
  coverType: string
  url: string
  remoteUrl?: string
}

export interface LidarrStatistics {
  albumCount: number
  trackFileCount: number
  trackCount: number
  totalTrackCount: number
  sizeOnDisk: number
  percentOfTracks: number
}

export interface LidarrQualityProfile {
  id: number
  name: string
}

export interface LidarrMetadataProfile {
  id: number
  name: string
}

export interface LidarrRootFolder {
  id: number
  path: string
  freeSpace: number
}

export interface LidarrSystemStatus {
  version: string
  appName: string
}

export interface LidarrAddArtistOptions {
  monitor: 'all' | 'future' | 'missing' | 'existing' | 'first' | 'latest' | 'none'
  monitored: boolean
  searchForMissingAlbums: boolean
}

export interface MigrationResult {
  artist: string
  status: 'added' | 'skipped' | 'failed' | 'exists'
  message?: string
  matchedName?: string
  lidarrId?: number
  lookupResults?: number
}
