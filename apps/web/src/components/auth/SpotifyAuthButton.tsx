import { useState } from 'react'
import { SpotifyAuth } from '@/lib/services/spotify/SpotifyAuth'
import { CredentialsStore } from '@/lib/storage/CredentialsStore'
import { useAuth } from '@/hooks/useAuth'

interface SpotifyAuthButtonProps {
  className?: string
}

export default function SpotifyAuthButton({
  className = '',
}: SpotifyAuthButtonProps) {
  const { spotifyConnected, spotifyUserId, disconnectSpotify } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showClientIdModal, setShowClientIdModal] = useState(false)
  const [clientIdInput, setClientIdInput] = useState('')

  const handleConnect = async () => {
    const clientId = CredentialsStore.getSpotifyClientId()
    if (!clientId) {
      setShowClientIdModal(true)
      return
    }

    try {
      setIsLoading(true)
      await SpotifyAuth.initiateAuth()
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      setIsLoading(false)
      alert('Failed to connect to Spotify. Please try again.')
    }
  }

  const handleSaveClientId = async () => {
    if (!clientIdInput.trim()) {
      alert('Please enter a valid Client ID')
      return
    }

    CredentialsStore.saveSpotifyClientId(clientIdInput.trim())
    setShowClientIdModal(false)
    setClientIdInput('')

    try {
      setIsLoading(true)
      await SpotifyAuth.initiateAuth()
    } catch (error) {
      console.error('Failed to initiate auth:', error)
      setIsLoading(false)
      alert('Failed to connect to Spotify. Please try again.')
    }
  }

  const handleDisconnect = () => {
    if (
      confirm(
        'Are you sure you want to disconnect your Spotify account? This will clear all extracted data.'
      )
    ) {
      disconnectSpotify()
    }
  }

  if (spotifyConnected) {
    return (
      <div
        className={`flex items-center gap-3 bg-spotify-green/10 border border-spotify-green/20 rounded-lg p-4 ${className}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">&#x2705;</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Spotify Connected
            </span>
          </div>
          {spotifyUserId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">User ID: {spotifyUserId}</p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`px-6 py-3 bg-spotify-green text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Connect Spotify</span>
          </>
        )}
      </button>

      {showClientIdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Enter Spotify Client ID
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To connect to Spotify, you need to provide your Spotify Developer App Client ID.
              You can create one at{' '}
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-spotify-green hover:underline"
              >
                developer.spotify.com/dashboard
              </a>
            </p>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="Enter your Spotify Client ID"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-spotify-green"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveClientId()
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClientIdModal(false)
                  setClientIdInput('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClientId}
                className="flex-1 px-4 py-2 bg-spotify-green text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
