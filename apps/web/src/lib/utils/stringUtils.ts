/**
 * String utility functions for matching
 */

export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0))

  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[len1][len2]
}

export function stringSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)

  if (normalized1 === normalized2) return 1
  if (normalized1.length === 0 || normalized2.length === 0) return 0

  const maxLength = Math.max(normalized1.length, normalized2.length)
  const distance = levenshteinDistance(normalized1, normalized2)

  return 1 - distance / maxLength
}

export function cleanTrackTitle(title: string): string {
  const variations = [
    /\s*\(remaster(ed)?\)/gi,
    /\s*\(.*?remaster.*?\)/gi,
    /\s*\(radio edit\)/gi,
    /\s*\(live\)/gi,
    /\s*\(.*?version\)/gi,
    /\s*-\s*remaster(ed)?/gi,
    /\s*\[.*?\]/g,
  ]

  let cleaned = title
  variations.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '')
  })

  return cleaned.trim()
}
