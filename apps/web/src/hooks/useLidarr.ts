import { useCallback } from 'react'
import { useLidarrStore } from '@/store/lidarrStore'
import { useMigrationStore } from '@/store/migrationStore'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import { LidarrClient } from '@/lib/services/lidarr/LidarrClient'
import { MusicBrainzClient, type MusicBrainzArtist } from '@/lib/services/musicbrainz/MusicBrainzClient'
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
      // Add delay between artists to avoid overwhelming Lidarr's metadata API
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 2000))
      }
      const artist = toImport[i]
      migrationStore.updateProgress(i + 1, artist.name)

      try {
        // Search MusicBrainz directly (bypasses flaky api.lidarr.audio)
        let mbResults: MusicBrainzArtist[]
        try {
          mbResults = await MusicBrainzClient.searchArtist(artist.name)
        } catch (lookupError) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'failed',
            message: `MusicBrainz lookup failed: ${lookupError instanceof Error ? lookupError.message : 'Unknown error'}`,
          })
          continue
        }

        if (mbResults.length === 0) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'failed',
            message: `No results found in MusicBrainz for "${artist.name}"`,
            lookupResults: 0,
          })
          continue
        }

        // Pick best match by normalized name
        const bestMatch = findBestMbMatch(artist.name, mbResults)

        if (!bestMatch) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'failed',
            message: `${mbResults.length} results but no close match. Top result: "${mbResults[0]?.name}"`,
            lookupResults: mbResults.length,
          })
          continue
        }

        // Check if already in Lidarr
        if (existingArtistIds.includes(bestMatch.id)) {
          migrationStore.addResult({
            artist: artist.name,
            status: 'exists',
            message: `Already in Lidarr as "${bestMatch.name}"`,
            matchedName: bestMatch.name,
          })
          continue
        }

        // Add to Lidarr using MusicBrainz ID
        try {
          const added = await LidarrClient.addArtistByMbId(bestMatch.id, bestMatch.name, {
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
            matchedName: bestMatch.name,
            lidarrId: added.id,
            message: `Added as "${bestMatch.name}"`,
          })
        } catch (addError) {
          const msg = addError instanceof Error ? addError.message : 'Unknown error'
          if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
            migrationStore.addResult({
              artist: artist.name,
              status: 'exists',
              matchedName: bestMatch.name,
              message: `Lidarr: ${msg}`,
            })
          } else {
            migrationStore.addResult({
              artist: artist.name,
              status: 'failed',
              matchedName: bestMatch.name,
              message: `Add failed: ${msg}`,
            })
          }
          continue
        }

        // Update existing IDs to prevent duplicates in same run
        useLidarrStore.getState().setExistingArtistIds([
          ...useLidarrStore.getState().existingArtistIds,
          bestMatch.id,
        ])
      } catch (error) {
        migrationStore.addResult({
          artist: artist.name,
          status: 'failed',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

function findBestMbMatch(
  spotifyName: string,
  mbResults: MusicBrainzArtist[]
): MusicBrainzArtist | null {
  const normalized = normalizeString(spotifyName)

  // First: try exact normalized match
  const exact = mbResults.find(
    (r) => normalizeString(r.name) === normalized
  )
  if (exact) return exact

  // Second: try starts-with or contains
  const partial = mbResults.find(
    (r) =>
      normalizeString(r.name).includes(normalized) ||
      normalized.includes(normalizeString(r.name))
  )
  if (partial) return partial

  // Fallback: return top result if score is high enough (>80)
  if (mbResults[0] && mbResults[0].score > 80) return mbResults[0]

  return null
}
