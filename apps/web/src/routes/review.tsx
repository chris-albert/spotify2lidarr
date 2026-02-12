import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLidarr } from '@/hooks/useLidarr'
import { useExtractionStore } from '@/store/extractionStore'
import { useLidarrStore } from '@/store/lidarrStore'

function ReviewPage() {
  const navigate = useNavigate()
  const { spotifyConnected } = useAuth()
  const {
    connected: lidarrConnected,
    qualityProfiles,
    metadataProfiles,
    rootFolders,
    selectedQualityProfileId,
    selectedMetadataProfileId,
    selectedRootFolder,
    monitorOption,
    searchForMissing,
    setSelectedQualityProfileId,
    setSelectedMetadataProfileId,
    setSelectedRootFolder,
    setMonitorOption,
    setSearchForMissing,
    importArtists,
    migrationResults,
    migrationProgress,
    isMigrating,
    migrationComplete,
    migrationError,
    resetMigration,
  } = useLidarr()

  const { artists, albums, extractionComplete } = useExtractionStore()
  const existingArtistIds = useLidarrStore((s) => s.existingArtistIds)

  const [selectedArtistIds, setSelectedArtistIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'new' | 'existing'>('all')

  useEffect(() => {
    if (!spotifyConnected || !extractionComplete) {
      navigate({ to: '/' })
    }
  }, [spotifyConnected, extractionComplete, navigate])

  // Initialize selection with all artists
  useEffect(() => {
    if (artists.length > 0 && selectedArtistIds.size === 0) {
      setSelectedArtistIds(new Set(artists.map((a) => a.id)))
    }
  }, [artists])

  const filteredArtists = useMemo(() => {
    // We can't know which are "existing" without Lidarr lookup,
    // but we show all for selection
    return artists
  }, [artists, filter])

  const toggleArtist = (id: string) => {
    setSelectedArtistIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedArtistIds(new Set(artists.map((a) => a.id)))
  }

  const deselectAll = () => {
    setSelectedArtistIds(new Set())
  }

  const handleImport = async () => {
    if (!lidarrConnected) {
      alert('Please connect to Lidarr first (go to Home page)')
      return
    }
    resetMigration()
    await importArtists(artists, selectedArtistIds)
  }

  const stats = useMemo(() => {
    const added = migrationResults.filter((r) => r.status === 'added').length
    const skipped = migrationResults.filter((r) => r.status === 'skipped').length
    const exists = migrationResults.filter((r) => r.status === 'exists').length
    const failed = migrationResults.filter((r) => r.status === 'failed').length
    return { added, skipped, exists, failed }
  }, [migrationResults])

  return (
    <div className="container-custom py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Review & Import</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {artists.length} artists, {albums.length} albums extracted
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/extract' })}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Re-extract
          </button>
        </div>

        {migrationError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{migrationError}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Artist List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Artists</h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {selectedArtistIds.size} of {artists.length} selected for import
              </p>

              {/* Migration progress */}
              {isMigrating && migrationProgress && (
                <div className="mb-4 p-4 bg-lidarr-orange/10 border border-lidarr-orange/20 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">
                      Importing: {migrationProgress.currentItem}
                    </span>
                    <span>
                      {migrationProgress.current} / {migrationProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-lidarr-orange transition-all duration-300"
                      style={{
                        width: `${(migrationProgress.current / migrationProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Migration results summary */}
              {migrationComplete && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    Import Complete!
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.added}</div>
                      <div className="text-gray-600 dark:text-gray-400">Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.exists}</div>
                      <div className="text-gray-600 dark:text-gray-400">Existing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.skipped}</div>
                      <div className="text-gray-600 dark:text-gray-400">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                      <div className="text-gray-600 dark:text-gray-400">Failed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Artist list */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredArtists.map((artist) => {
                  const result = migrationResults.find((r) => r.artist === artist.name)
                  return (
                    <div
                      key={artist.id}
                      className={`rounded-lg ${
                        result?.status === 'failed'
                          ? 'bg-red-50 dark:bg-red-900/10'
                          : result?.status === 'added'
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : result?.status === 'exists'
                              ? 'bg-blue-50 dark:bg-blue-900/10'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedArtistIds.has(artist.id)}
                          onChange={() => toggleArtist(artist.id)}
                          disabled={isMigrating}
                          className="w-4 h-4 text-lidarr-orange rounded border-gray-300 focus:ring-lidarr-orange flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {artist.name}
                          </div>
                          {!result && artist.genres && artist.genres.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {artist.genres.slice(0, 3).join(', ')}
                            </div>
                          )}
                          {result && (
                            <div className={`text-xs mt-0.5 ${
                              result.status === 'failed'
                                ? 'text-red-600 dark:text-red-400'
                                : result.status === 'added'
                                  ? 'text-green-600 dark:text-green-400'
                                  : result.status === 'exists'
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {result.message}
                            </div>
                          )}
                        </div>
                        {result && (
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium flex-shrink-0 ${
                              result.status === 'added'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : result.status === 'exists'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : result.status === 'failed'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}
                          >
                            {result.status}
                          </span>
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>

              {/* Detailed failure log */}
              {migrationComplete && stats.failed > 0 && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Failed Imports ({stats.failed})
                  </h3>
                  <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                    {migrationResults
                      .filter((r) => r.status === 'failed')
                      .map((r, i) => (
                        <div key={i} className="flex gap-2 py-1 border-b border-red-100 dark:border-red-800/50 last:border-0">
                          <span className="font-medium text-red-900 dark:text-red-200 min-w-0 truncate flex-shrink-0">
                            {r.artist}
                          </span>
                          <span className="text-red-600 dark:text-red-400 truncate">
                            — {r.message}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Albums section */}
            {albums.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
                <h2 className="text-xl font-bold mb-4">Saved Albums</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {albums.length} albums from your Spotify library. Artists from these albums
                  will be included when importing artists above.
                </p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      {album.images?.[0] && (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {album.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {album.artists.map((a) => a.name).join(', ')} &middot; {album.release_date?.slice(0, 4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Lidarr config + Import button */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4">Lidarr Settings</h2>

              {!lidarrConnected ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Connect to Lidarr on the{' '}
                    <button
                      onClick={() => navigate({ to: '/' })}
                      className="underline font-medium"
                    >
                      Home page
                    </button>{' '}
                    to import artists.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quality Profile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quality Profile
                    </label>
                    <select
                      value={selectedQualityProfileId || ''}
                      onChange={(e) => setSelectedQualityProfileId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      {qualityProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Metadata Profile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Metadata Profile
                    </label>
                    <select
                      value={selectedMetadataProfileId || ''}
                      onChange={(e) => setSelectedMetadataProfileId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      {metadataProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Root Folder */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Root Folder
                    </label>
                    <select
                      value={selectedRootFolder || ''}
                      onChange={(e) => setSelectedRootFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      {rootFolders.map((f) => (
                        <option key={f.id} value={f.path}>
                          {f.path}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Monitor Option */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monitor
                    </label>
                    <select
                      value={monitorOption}
                      onChange={(e) => setMonitorOption(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value="all">All Albums</option>
                      <option value="future">Future Albums Only</option>
                      <option value="missing">Missing Albums</option>
                      <option value="existing">Existing Albums</option>
                      <option value="first">First Album</option>
                      <option value="latest">Latest Album</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  {/* Search for missing */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={searchForMissing}
                      onChange={(e) => setSearchForMissing(e.target.checked)}
                      className="w-4 h-4 text-lidarr-orange rounded border-gray-300 focus:ring-lidarr-orange"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Search for missing albums on add
                    </span>
                  </label>

                  {/* Import button */}
                  <button
                    onClick={handleImport}
                    disabled={isMigrating || selectedArtistIds.size === 0}
                    className="w-full px-6 py-3 bg-lidarr-orange text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold mt-4"
                  >
                    {isMigrating
                      ? 'Importing...'
                      : `Import ${selectedArtistIds.size} Artists to Lidarr`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})
