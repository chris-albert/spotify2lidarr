#!/usr/bin/env bash
set -euo pipefail

# Unmonitor artists that have no monitored albums AND no imported tracks.
#
# Usage:
#   ./scripts/unmonitor-empty-artists.sh <lidarr_url> <api_key>
#
# Example:
#   ./scripts/unmonitor-empty-artists.sh http://localhost:8686 abc123

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <lidarr_url> <api_key>"
  echo "Example: $0 http://localhost:8686 your-api-key"
  exit 1
fi

LIDARR_URL="${1%/}"
API_KEY="$2"
BASE="${LIDARR_URL}/api/v1"

# Verify connectivity
if ! curl -sf "${BASE}/system/status?apikey=${API_KEY}" > /dev/null 2>&1; then
  echo "Error: Cannot connect to Lidarr at ${LIDARR_URL}. Check URL and API key."
  exit 1
fi

echo "Fetching all artists..."
ARTISTS=$(curl -sf "${BASE}/artist?apikey=${API_KEY}")

echo "Fetching all albums..."
ALBUMS=$(curl -sf "${BASE}/album?apikey=${API_KEY}")

TOTAL=$(echo "$ARTISTS" | jq 'length')
MONITORED=$(echo "$ARTISTS" | jq '[.[] | select(.monitored == true)] | length')

echo "Found ${TOTAL} total artists, ${MONITORED} currently monitored."

# Build a list of artist IDs that have at least one monitored album
ARTISTS_WITH_MONITORED_ALBUMS=$(echo "$ALBUMS" | jq '[.[] | select(.monitored == true) | .artistId] | unique')

# Find monitored artists with no monitored albums AND no imported tracks (trackFileCount == 0 or missing)
CANDIDATES=$(echo "$ARTISTS" | jq --argjson has_albums "$ARTISTS_WITH_MONITORED_ALBUMS" '
  [.[] | select(
    .monitored == true
    and ([.id] | inside($has_albums) | not)
    and (.statistics.trackFileCount // 0) == 0
  )]
')

COUNT=$(echo "$CANDIDATES" | jq 'length')

if [[ "$COUNT" -eq 0 ]]; then
  echo "Nothing to do — all monitored artists have monitored albums or imported tracks."
  exit 0
fi

echo ""
echo "Artists to unmonitor (no monitored albums, no imported tracks):"
echo "$CANDIDATES" | jq -r '.[] | "  - \(.artistName)"'
echo ""

read -rp "Unmonitor these ${COUNT} artists? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Unmonitoring artists..."

echo "$CANDIDATES" | jq -c '.[]' | while read -r artist; do
  id=$(echo "$artist" | jq '.id')
  name=$(echo "$artist" | jq -r '.artistName')
  payload=$(echo "$artist" | jq '.monitored = false')

  if curl -sf -X PUT "${BASE}/artist/${id}?apikey=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null; then
    echo "  Unmonitored: ${name}"
  else
    echo "  FAILED: ${name} (id=${id})"
  fi
done

echo "Done."
