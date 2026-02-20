import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  LidarrQualityProfile,
  LidarrMetadataProfile,
  LidarrRootFolder,
  MonitorOption,
} from '@spotify2lidarr/types'

export interface LidarrState {
  // Connection
  url: string
  apiKey: string
  connected: boolean
  version: string | null

  // Config options fetched from Lidarr
  qualityProfiles: LidarrQualityProfile[]
  metadataProfiles: LidarrMetadataProfile[]
  rootFolders: LidarrRootFolder[]

  // User selections
  selectedQualityProfileId: number | null
  selectedMetadataProfileId: number | null
  selectedRootFolder: string | null
  monitorOption: MonitorOption
  searchForMissing: boolean

  // Existing library (MusicBrainz IDs already in Lidarr)
  existingArtistIds: string[]

  // Actions
  setConnection: (url: string, apiKey: string) => void
  setConnected: (connected: boolean, version?: string) => void
  setProfiles: (
    quality: LidarrQualityProfile[],
    metadata: LidarrMetadataProfile[],
    rootFolders: LidarrRootFolder[]
  ) => void
  setSelectedQualityProfileId: (id: number) => void
  setSelectedMetadataProfileId: (id: number) => void
  setSelectedRootFolder: (path: string) => void
  setMonitorOption: (option: LidarrState['monitorOption']) => void
  setSearchForMissing: (search: boolean) => void
  setExistingArtistIds: (ids: string[]) => void
  disconnect: () => void
}

export const useLidarrStore = create<LidarrState>()(
  persist(
    (set) => ({
      url: '',
      apiKey: '',
      connected: false,
      version: null,

      qualityProfiles: [],
      metadataProfiles: [],
      rootFolders: [],

      selectedQualityProfileId: null,
      selectedMetadataProfileId: null,
      selectedRootFolder: null,
      monitorOption: 'savedAlbumsOnly',
      searchForMissing: true,

      existingArtistIds: [],

      setConnection: (url, apiKey) =>
        set({ url, apiKey }),

      setConnected: (connected, version) =>
        set({ connected, version: version || null }),

      setProfiles: (quality, metadata, rootFolders) =>
        set({
          qualityProfiles: quality,
          metadataProfiles: metadata,
          rootFolders,
          selectedQualityProfileId: quality[0]?.id || null,
          selectedMetadataProfileId: metadata[0]?.id || null,
          selectedRootFolder: rootFolders[0]?.path || null,
        }),

      setSelectedQualityProfileId: (id) =>
        set({ selectedQualityProfileId: id }),

      setSelectedMetadataProfileId: (id) =>
        set({ selectedMetadataProfileId: id }),

      setSelectedRootFolder: (path) =>
        set({ selectedRootFolder: path }),

      setMonitorOption: (option) =>
        set({ monitorOption: option }),

      setSearchForMissing: (search) =>
        set({ searchForMissing: search }),

      setExistingArtistIds: (ids) =>
        set({ existingArtistIds: ids }),

      disconnect: () =>
        set({
          connected: false,
          version: null,
          qualityProfiles: [],
          metadataProfiles: [],
          rootFolders: [],
          selectedQualityProfileId: null,
          selectedMetadataProfileId: null,
          selectedRootFolder: null,
          existingArtistIds: [],
        }),
    }),
    {
      name: 'spotify2lidarr-lidarr',
      partialize: (state) => ({
        url: state.url,
        apiKey: state.apiKey,
        connected: state.connected,
        version: state.version,
        qualityProfiles: state.qualityProfiles,
        metadataProfiles: state.metadataProfiles,
        rootFolders: state.rootFolders,
        selectedQualityProfileId: state.selectedQualityProfileId,
        selectedMetadataProfileId: state.selectedMetadataProfileId,
        selectedRootFolder: state.selectedRootFolder,
        monitorOption: state.monitorOption,
        searchForMissing: state.searchForMissing,
        existingArtistIds: state.existingArtistIds,
      }),
    }
  )
)
