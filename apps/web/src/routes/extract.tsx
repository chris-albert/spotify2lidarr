import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SpotifyClient } from '@/lib/services/spotify/SpotifyClient'
import { useExtractionStore } from '@/store/extractionStore'
import type { SpotifyArtist, SpotifyAlbum } from '@spotify2lidarr/types'

function ExtractionPage() {
  const navigate = useNavigate()
  const { spotifyConnected } = useAuth()
  const { setResults, startExtraction, completeExtraction, setError } = useExtractionStore()

  const [isExtracting, setIsExtracting] = useState(false)
  const [currentStage, setCurrentStage] = useState<string>('')
  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [error, setLocalError] = useState<string | null>(null)
  const [extractedArtists, setExtractedArtists] = useState<SpotifyArtist[]>([])
  const [extractedAlbums, setExtractedAlbums] = useState<SpotifyAlbum[]>([])

  useEffect(() => {
    if (!spotifyConnected) {
      navigate({ to: '/' })
    }
  }, [spotifyConnected, navigate])

  const handleExtract = async () => {
    try {
      setIsExtracting(true)
      setLocalError(null)
      startExtraction()

      const { artists, albums } = await SpotifyClient.extractArtistsAndAlbums(
        (stage) => {
          if (stage === 'artists') setCurrentStage('Extracting followed artists...')
          else if (stage === 'albums') setCurrentStage('Extracting saved albums...')
          else if (stage === 'complete') setCurrentStage('Extraction complete!')
        },
        (_stage, current, total) => {
          setProgress({ current, total })
        }
      )

      setExtractedArtists(artists)
      setExtractedAlbums(albums)
      setResults(artists, albums)
      completeExtraction()
      setCurrentStage(`Found ${artists.length} artists and ${albums.length} albums!`)
      setProgress(null)

      setTimeout(() => {
        navigate({ to: '/review' })
      }, 1500)
    } catch (err) {
      console.error('Extraction failed:', err)
      const message = err instanceof Error ? err.message : 'Extraction failed'
      setLocalError(message)
      setError(message)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Extract Spotify Library</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isExtracting ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click below to extract your followed artists and saved albums from Spotify.
              </p>

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-800 dark:text-blue-300 text-sm">
                  <strong>What gets extracted:</strong> Followed artists and saved albums.
                  These will be matched against MusicBrainz via Lidarr for import.
                </p>
              </div>

              {extractedArtists.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-300 text-sm">
                    Previous extraction: {extractedArtists.length} artists, {extractedAlbums.length} albums.{' '}
                    <button
                      onClick={() => navigate({ to: '/review' })}
                      className="underline font-medium"
                    >
                      Go to Review
                    </button>
                  </p>
                </div>
              )}

              <button
                onClick={handleExtract}
                className="w-full px-6 py-4 bg-spotify-green text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold text-lg"
              >
                Extract Artists & Albums
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">&#x1f3b5;</div>
              <h2 className="text-xl font-semibold mb-2">{currentStage}</h2>
              {progress && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                    <span>
                      {progress.total > 0
                        ? ((progress.current / progress.total) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300 bg-spotify-green"
                      style={{
                        width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/extract')({
  component: ExtractionPage,
})
