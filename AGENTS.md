# AGENTS.md

Guidelines for AI agents working on this codebase.

## Project Overview

Spotify2Lidarr is a client-side React SPA that migrates a user's Spotify library into Lidarr. It's a pnpm monorepo managed by Turbo with three workspaces: `apps/web` (the app), `packages/types` (shared types), and `packages/config` (shared Tailwind/TypeScript config).

## Commands

```bash
pnpm install              # Install dependencies
pnpm run dev              # Start dev server on http://localhost:5174/spotify2lidarr/
pnpm run build            # TypeScript compile + Vite build
pnpm run type-check       # Type check without emitting
pnpm run lint             # ESLint
```

There are no tests in this project currently.

## Architecture

### Monorepo Layout

- `apps/web/` - React SPA (Vite, TailwindCSS, TanStack Router, Zustand)
- `packages/types/` - Shared TypeScript types for Spotify, Lidarr, and migration results
- `packages/config/` - Shared Tailwind base config and TypeScript base config
- `scripts/` - Standalone bash utility scripts for Lidarr operations

### Key Directories in `apps/web/src/`

- `routes/` - Page components using TanStack file-based routing. The app has four routes: `/` (home/setup), `/auth/spotify` (OAuth callback), `/extract` (pull Spotify data), `/review` (select artists and import)
- `hooks/` - `useLidarr.ts` contains the core import logic including MusicBrainz matching and album monitoring. `useAuth.ts` handles Spotify OAuth.
- `lib/services/` - API clients: `SpotifyClient.ts`, `LidarrClient.ts`, `MusicBrainzClient.ts`. Each has its own rate limiter.
- `lib/storage/` - `CredentialsStore.ts` (localStorage for URLs/keys), `TokenStore.ts` (Spotify OAuth tokens), `IndexedDBStorage.ts` (Zustand middleware for large datasets)
- `lib/utils/` - `rateLimiter.ts` (queue-based rate limiting), `stringUtils.ts` (normalization, Levenshtein distance, similarity), `pkce.ts` (OAuth PKCE helpers)
- `store/` - Zustand stores: `authStore`, `lidarrStore`, `extractionStore`, `migrationStore`, `themeStore`. Most persist to localStorage; migration results persist to IndexedDB.
- `components/` - Reusable UI components: `Header`, `SpotifyAuthButton`, `LidarrConnectForm`

### Data Flow

1. User authenticates with Spotify (PKCE OAuth) and connects Lidarr (URL + API key)
2. Extraction fetches followed artists and saved albums from Spotify API (paginated, rate-limited)
3. On import, each artist is searched on MusicBrainz directly (not Lidarr's metadata proxy)
4. Best match is found via normalized string similarity (Levenshtein distance)
5. Artist is added to Lidarr using the MusicBrainz ID
6. For "savedAlbumsOnly" mode: after adding, albums are polled and only Spotify-saved albums are selectively monitored via fuzzy matching (85% threshold)

### Important Patterns

- **No backend** - Everything runs client-side. API calls go directly from the browser to Spotify, MusicBrainz, and Lidarr.
- **Rate limiting** - Three separate rate limiters: Spotify (6 req/s), Lidarr (1 req/s), MusicBrainz (1 req/s). Defined in `lib/utils/rateLimiter.ts`.
- **Retry logic** - `LidarrClient` retries on 5xx errors and network failures with exponential backoff (3s base, max 3 retries).
- **String matching** - `normalizeString()` strips special chars and lowercases. `stringSimilarity()` returns 0-1 score using Levenshtein distance. Used for both artist and album matching.
- **State persistence** - Zustand stores use `persist` middleware. Most use localStorage; `migrationStore` uses IndexedDB via custom middleware because migration results can be large.

### Build & Routing

- Vite base path is `/spotify2lidarr/`
- TanStack Router uses hash-based history for SPA deployment
- Code splitting: `react-vendor`, `router`, and main app chunks
- Only env var: `VITE_REDIRECT_URI` (optional, defaults to `window.location.origin`)

## Style Guidelines

- TypeScript strict mode
- Functional React components with hooks
- Zustand for state (no Redux, no Context for global state)
- TailwindCSS utility classes for styling, dark mode via `dark:` variants
- Path aliases: `@/` maps to `apps/web/src/`, `@spotify2lidarr/types` maps to the types package
- API clients are static classes with static methods
- Types shared between workspaces go in `packages/types/src/`
