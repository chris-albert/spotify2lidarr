export interface SpotifyPaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
  href: string
}

export interface SpotifyError {
  error: {
    status: number
    message: string
  }
}

export interface SpotifyUser {
  id: string
  display_name: string
  email?: string
  country?: string
  product?: string
  images: Array<{
    url: string
    height: number | null
    width: number | null
  }>
}
