# Spotify2Lidarr

Migrate your Spotify library to [Lidarr](https://lidarr.audio). Import followed artists and saved albums directly into your Lidarr instance with smart matching via [MusicBrainz](https://musicbrainz.org).

## Features

- **Spotify OAuth (PKCE)** - Securely connect your Spotify account with no backend required
- **Artist import** - Bulk-import your followed Spotify artists into Lidarr
- **Saved Albums Only mode** - Monitor only the albums you've actually saved in Spotify, not every album by an artist
- **MusicBrainz matching** - Artist lookups go directly through MusicBrainz for reliable matching with fuzzy string similarity
- **Duplicate detection** - Skips artists already in your Lidarr library
- **Rate limiting** - Built-in throttling for Spotify, Lidarr, and MusicBrainz APIs
- **Retry with backoff** - Automatic retries with exponential backoff for Lidarr API errors
- **Dark mode** - Automatic theme support

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- A running [Lidarr](https://lidarr.audio/) instance accessible from your browser
- A [Spotify Developer](https://developer.spotify.com/dashboard) application (for the Client ID)

## Setup

### 1. Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add a redirect URI: `http://localhost:5174/spotify2lidarr/`
4. Copy the **Client ID**

### 2. Lidarr

You'll need your Lidarr instance URL and API key. Find the API key in Lidarr under **Settings > General > Security**.

### 3. Install & Run

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:5174/spotify2lidarr/](http://localhost:5174/spotify2lidarr/)

## Usage

1. **Connect Spotify** - Enter your Spotify Client ID and authorize
2. **Connect Lidarr** - Enter your Lidarr URL and API key
3. **Extract** - Pull your followed artists and saved albums from Spotify
4. **Review & Import** - Select artists, choose a monitor option, and import

### Monitor Options

| Option | Behavior |
|--------|----------|
| Saved Albums Only | Only monitor albums you saved in Spotify |
| All Albums | Monitor every album by the artist |
| Future Albums Only | Monitor new releases going forward |
| Missing Albums | Monitor albums not yet downloaded |
| First / Latest | Monitor the first or latest album |
| None | Add artist without monitoring anything |

## Project Structure

```
spotify2lidarr/
├── apps/web/              # React SPA (Vite + TailwindCSS)
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # React hooks (import logic, auth)
│       ├── lib/           # API clients, storage, utilities
│       ├── routes/        # Pages (TanStack Router)
│       └── store/         # Zustand state stores
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── config/            # Shared Tailwind & TypeScript config
└── scripts/               # Lidarr utility scripts
```

## Scripts

```bash
pnpm run dev          # Start dev server
pnpm run build        # Production build (output: apps/web/dist/)
pnpm run type-check   # TypeScript type checking
pnpm run lint         # ESLint
pnpm run clean        # Remove build artifacts
```

### Utility Scripts

Standalone bash scripts for bulk Lidarr operations. Both require `jq` and `curl`.

```bash
# Unmonitor all albums (clear the Wanted list)
./scripts/unmonitor-all-albums.sh <lidarr_url> <api_key>

# Unmonitor artists with no monitored albums and no imported tracks
./scripts/unmonitor-empty-artists.sh <lidarr_url> <api_key>
```

## Tech Stack

- **React 18** + **TypeScript** - UI
- **Vite 5** - Build tool
- **TailwindCSS** - Styling
- **TanStack Router** - File-based routing
- **Zustand** - State management
- **Turbo** - Monorepo orchestration
- **pnpm** - Package management

## Architecture Notes

- Entirely client-side - no backend server needed
- Spotify tokens stored in `localStorage`, auto-refreshed on expiry
- Lidarr credentials stored in `localStorage`
- Migration results persisted to IndexedDB (survives page refreshes)
- Artist matching uses normalized Levenshtein distance with an 85% similarity threshold for fuzzy album matching
- MusicBrainz is queried directly instead of through Lidarr's metadata proxy for reliability
