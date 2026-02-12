/**
 * RateLimiter - Queue-based API rate limiting
 */

type QueuedOperation<T> = () => Promise<T>

export class RateLimiter {
  private queue: Array<{
    operation: QueuedOperation<any>
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  private processing = false
  private lastExecutionTime = 0

  constructor(
    private requestsPerSecond: number,
    private burstSize: number = 1
  ) {}

  async execute<T>(operation: QueuedOperation<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastExecution = now - this.lastExecutionTime
      const minInterval = 1000 / this.requestsPerSecond
      const delay = Math.max(0, minInterval - timeSinceLastExecution)

      if (delay > 0) {
        await this.sleep(delay)
      }

      const burst = this.queue.splice(0, this.burstSize)

      await Promise.all(
        burst.map(async ({ operation, resolve, reject }) => {
          try {
            const result = await operation()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
      )

      this.lastExecutionTime = Date.now()
    }

    this.processing = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  getQueueLength(): number {
    return this.queue.length
  }

  clearQueue(): void {
    this.queue = []
  }
}

export const spotifyRateLimiter = new RateLimiter(6, 3)
export const lidarrRateLimiter = new RateLimiter(1, 1)
export const musicbrainzRateLimiter = new RateLimiter(1, 1)
