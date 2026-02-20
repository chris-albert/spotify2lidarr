#!/usr/bin/env bash
set -euo pipefail

# Unmonitor all albums in Lidarr, clearing the Wanted list.
#
# Usage:
#   ./scripts/unmonitor-all-albums.sh <lidarr_url> <api_key>
#
# Example:
#   ./scripts/unmonitor-all-albums.sh http://localhost:8686 abc123

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

echo "Fetching all albums..."
ALBUMS=$(curl -sf "${BASE}/album?apikey=${API_KEY}")

TOTAL=$(echo "$ALBUMS" | jq 'length')
MONITORED=$(echo "$ALBUMS" | jq '[.[] | select(.monitored == true)] | length')

echo "Found ${TOTAL} total albums, ${MONITORED} currently monitored."

if [[ "$MONITORED" -eq 0 ]]; then
  echo "Nothing to do — no monitored albums."
  exit 0
fi

read -rp "Unmonitor all ${MONITORED} albums? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo "Unmonitoring albums..."
UPDATED=0

echo "$ALBUMS" | jq -c '.[] | select(.monitored == true)' | while read -r album; do
  id=$(echo "$album" | jq '.id')
  title=$(echo "$album" | jq -r '.title')
  payload=$(echo "$album" | jq '.monitored = false')

  if curl -sf -X PUT "${BASE}/album/${id}?apikey=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null; then
    echo "  Unmonitored: ${title}"
  else
    echo "  FAILED: ${title} (id=${id})"
  fi
done

echo "Done."
