// ═══════════════════════════════════════════════════════════════════
// Simple in-memory cache with TTL for cost metrics
// Prevents file I/O on every request and hot-reload
// ═══════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL_MS = 60 * 1000 // 1 minute cache - balances freshness vs performance

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function invalidateCache(key: string): void {
  cache.delete(key)
}