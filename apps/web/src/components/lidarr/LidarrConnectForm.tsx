import { useState } from 'react'
import { useLidarr } from '@/hooks/useLidarr'

interface LidarrConnectFormProps {
  className?: string
}

export default function LidarrConnectForm({
  className = '',
}: LidarrConnectFormProps) {
  const { connected, version, url, apiKey, connect, disconnect } = useLidarr()
  const [urlInput, setUrlInput] = useState(url || '')
  const [apiKeyInput, setApiKeyInput] = useState(apiKey || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!urlInput.trim() || !apiKeyInput.trim()) {
      setError('Please enter both URL and API key')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await connect(urlInput.trim(), apiKeyInput.trim())
    } catch (err) {
      console.error('Lidarr connection failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    if (confirm('Disconnect from Lidarr?')) {
      disconnect()
      setUrlInput('')
      setApiKeyInput('')
    }
  }

  if (connected) {
    return (
      <div
        className={`flex items-center gap-3 bg-lidarr-orange/10 border border-lidarr-orange/20 rounded-lg p-4 ${className}`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">&#x2705;</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Lidarr Connected
            </span>
          </div>
          {version && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version: {version}
            </p>
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
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lidarr URL
        </label>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="http://localhost:8686"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lidarr-orange"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
        </label>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder="Your Lidarr API key"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-lidarr-orange"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConnect()
          }}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Found in Lidarr under Settings &rarr; General &rarr; API Key
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full px-6 py-3 bg-lidarr-orange text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Testing Connection...</span>
          </>
        ) : (
          <span>Test Connection</span>
        )}
      </button>
    </div>
  )
}
