import { useCallback } from 'react'
import { useLidarrStore } from '@/store/lidarrStore'
import { useMigrationStore } from '@/store/migrationStore'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import { LidarrClient } from '@/lib/services/lidarr/LidarrClient'
import type { SpotifyArtist, LidarrArtist, MigrationResult } from '@spotify2lidarr/types'
import { normalizeString } from '@/lib/utils/stringUtils'

export function useLidarr() {
  const lidarrStore = useLidarrStore()
  const migrationStore = useMigrationStore()

  const connect = useCallback(async (url: string, apiKey: string) => {
    CredentialsStore.saveLidarrUrl(url)
    CredentialsStore.saveLidarrApiKey(apiKey)
    lidarrStore.setConnection(url, apiKey)

    const status = await LidarrClient.testConnection()
    lidarrStore.setConnected(true, status.version)

    const [qualityProfiles, metadataProfiles, rootFolders] = await Promise.all([
      LidarrClient.getQualityProfiles(),
      LidarrClient.getMetadataProfiles(),
      LidarrClient.getRootFolders(),
    ])

    lidarrStore.setProfiles(qualityProfiles, metadataProfiles, rootFolders)

    // Fetch existing artists to detect duplicates
    const existingArtists = await LidarrClient.getArtists()
    lidarrStore.setExistingArtistIds(
      existingArtists.map((a) => a.foreignArtistId)
    )

    return status
  }, [lidarrStore])

  const disconnect = useCallback(() => {
    CredentialsStore.clearLidarrCredentials()
    lidarrStore.disconnect()
  }, [lidarrStore])

  const importArtists = useCallback(async (
    spotifyArtists: SpotifyArtist[],
    selectedIds: Set<string>
  ) => {
    const toImport = spotifyArtists.filter((a) => selectedIds.has(a.id))
    migrationStore.startMigration(toImport.length)

    const {
      selectedQualityProfileId,
      selectedMetadataProfileId,
      selectedRootFolder,
      monitorOption,
      searchForMissing,
      existingArtistIds,
    } = useLidarrStore.getState()

    if (!selectedQualityProfileId || !selectedMetadataProfileId || !selectedRootFolder) {
      migrationStore.setError('Please configure quality profile, metadata profile, and root folder')
      return
    }

    for (let i = 0; i < toImport.length; i++) {
      const artist = toImport[i]
      migrationStore.updateProgress(i + 1, artist.name)

      try {
        // Search for artist in Lidarr's MusicBrainz lookup
        const results = await LidarrClient.lookupArtist(artist.name)

        if (results.length === 0) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'failed',
            message: 'Not found in MusicBrainz',
          })
          continue
        }

        // Pick best match by normalized name
        const bestMatch = findBestMatch(artist.name, results)

        if (!bestMatch) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'failed',
            message: 'No close match found',
          })
          continue
        }

        // Check if already in Lidarr
        if (existingArtistIds.includes(bestMatch.foreignArtistId)) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'exists',
            message: 'Already in Lidarr',
          })
          continue
        }

        // Add to Lidarr
        const added = await LidarrClient.addArtist(bestMatch, {
          qualityProfileId: selectedQualityProfileId,
          metadataProfileId: selectedMetadataProfileId,
          rootFolderPath: selectedRootFolder,
          monitored: true,
          addOptions: {
            monitor: monitorOption,
            monitored: true,
            searchForMissingAlbums: searchForMissing,
          },
        })

        migrationStore.addResult({
          artist: artist.name,
          status: 'added',
          lidarrId: added.id,
        })

        // Update existing IDs to prevent duplicates in same run
        useLidarrStore.getState().setExistingArtistIds([
          ...useLidarrStore.getState().existingArtistIds,
          bestMatch.foreignArtistId,
        ])
      } catch (error) {
        migrationStore.addResult({
          artist: artist.name,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    migrationStore.completeMigration()
  }, [migrationStore])

  return {
    ...lidarrStore,
    connect,
    disconnect,
    importArtists,
    migrationResults: migrationStore.results,
    migrationProgress: migrationStore.progress,
    isMigrating: migrationStore.isMigrating,
    migrationComplete: migrationStore.migrationComplete,
    migrationError: migrationStore.error,
    resetMigration: migrationStore.reset,
  }
}

function findBestMatch(
  spotifyName: string,
  lidarrResults: LidarrArtist[]
): LidarrArtist | null {
  const normalized = normalizeString(spotifyName)

  // First: try exact normalized match
  const exact = lidarrResults.find(
    (r) => normalizeString(r.artistName) === normalized
  )
  if (exact) return exact

  // Second: try starts-with or contains
  const partial = lidarrResults.find(
    (r) =>
      normalizeString(r.artistName).includes(normalized) ||
      normalized.includes(normalizeString(r.artistName))
  )
  if (partial) return partial

  // Fallback: return first result (Lidarr's best guess)
  return lidarrResults[0] || null
}
