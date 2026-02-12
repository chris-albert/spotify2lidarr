import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SpotifyAuth } from '@/lib/services/spotify/SpotifyAuth'
import { SpotifyClient } from '@/lib/services/spotify/SpotifyClient'
import SpotifyAuthButton from '@/components/auth/SpotifyAuthButton'
import LidarrConnectForm from '@/components/lidarr/LidarrConnectForm'
import { useLidarrStore } from '@/store/lidarrStore'

function HomePage() {
  const navigate = useNavigate()
  const {
    initializeAuth,
    spotifyConnected,
    setSpotifyTokens,
    setSpotifyUserId,
  } = useAuth()
  const lidarrConnected = useLidarrStore((s) => s.connected)
  const [oauthStatus, setOauthStatus] = useState<string | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const provider = sessionStorage.getItem('oauth_provider')

    if (code && provider === 'spotify') {
      handleOAuthCallback(code)
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    } else if (error) {
      setOauthError(`Authentication failed: ${error}`)
      sessionStorage.removeItem('oauth_provider')
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    } else {
      initializeAuth()
    }
  }, [])

  const handleOAuthCallback = async (code: string) => {
    try {
      setOauthStatus('Connecting to Spotify...')
      const tokens = await SpotifyAuth.handleCallback(code)
      setSpotifyTokens(tokens)

      setOauthStatus('Fetching Spotify profile...')
      const user = await SpotifyClient.getCurrentUser()
      setSpotifyUserId(user.id)

      setOauthStatus('Spotify connected!')
      setTimeout(() => setOauthStatus(null), 2000)
    } catch (err) {
      console.error('OAuth callback error:', err)
      setOauthError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      sessionStorage.removeItem('oauth_provider')
      initializeAuth()
    }
  }

  const handleStartExtraction = () => {
    if (spotifyConnected) {
      navigate({ to: '/extract' })
    }
  }

  if (oauthStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#x1f510;</div>
          <h2 className="text-xl font-bold mb-2">{oauthStatus}</h2>
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto">
        {oauthError && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{oauthError}</p>
            <button
              onClick={() => setOauthError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 pb-1 bg-gradient-to-r from-spotify-green to-lidarr-orange bg-clip-text text-transparent">
            Spotify to Lidarr
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Import your followed artists and saved albums from Spotify directly into your Lidarr instance
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">&#x1f3b5;</div>
            <h3 className="text-lg font-semibold mb-2">Artist Import</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Import your followed Spotify artists directly into Lidarr via MusicBrainz lookup
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">&#x1f4bf;</div>
            <h3 className="text-lg font-semibold mb-2">Album Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your saved albums are extracted and matched for import with configurable monitoring
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">&#x26a1;</div>
            <h3 className="text-lg font-semibold mb-2">Direct Push</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Artists are added directly to Lidarr via its REST API - no manual work needed
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Get Started</h2>
          <div className="space-y-8">
            {/* Step 1: Spotify */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-spotify-green text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect Spotify</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Authorize access to your Spotify account to extract your library
                </p>
                <SpotifyAuthButton className="w-full md:w-auto" />
              </div>
            </div>

            {/* Step 2: Lidarr */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-lidarr-orange text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect Lidarr</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Enter your Lidarr instance URL and API key
                </p>
                <LidarrConnectForm className="max-w-md" />
              </div>
            </div>

            {/* Step 3: Extract */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Extract & Import</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  Extract your Spotify library and import artists into Lidarr
                </p>
                <button
                  onClick={handleStartExtraction}
                  disabled={!spotifyConnected}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {spotifyConnected ? 'Start Extraction' : 'Connect Spotify First'}
                </button>
                {spotifyConnected && !lidarrConnected && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Tip: Connect Lidarr first to import artists directly
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: HomePage,
})
