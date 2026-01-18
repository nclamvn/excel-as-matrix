// =============================================================================
// LRU CACHE — Least Recently Used Cache with O(1) operations
// =============================================================================

/**
 * High-performance LRU cache using Map's insertion order
 * - O(1) get, set, delete operations
 * - Automatic eviction of least recently used items
 * - Optional TTL (time-to-live) support
 * - Statistics tracking for cache hit/miss rates
 */
export class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private readonly maxSize: number;
  private readonly ttl: number | null;

  // Statistics
  private hits = 0;
  private misses = 0;

  /**
   * Create a new LRU cache
   * @param maxSize Maximum number of items (default: 10000)
   * @param ttlMs Time-to-live in milliseconds (optional, null = no expiry)
   */
  constructor(maxSize = 10000, ttlMs: number | null = null) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL expiration
    if (this.ttl !== null && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Move to end (most recently used) by re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.value;
  }

  /**
   * Set a value in the cache
   * Evicts least recently used items if at capacity
   */
  set(key: K, value: V): void {
    // Delete existing entry to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    // Insert new entry at end (most recently used)
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.ttl !== null && Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a predicate
   * Useful for invalidating related entries
   */
  deleteMatching(predicate: (key: K) => boolean): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (predicate(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get all keys (for debugging/iteration)
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * Prune expired entries (for TTL-enabled caches)
   */
  prune(): number {
    if (this.ttl === null) return 0;

    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        pruned++;
      }
    }

    return pruned;
  }
}

/**
 * Create a memoization wrapper using LRU cache
 * Useful for expensive function calls
 */
export function memoizeWithLRU<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: {
    maxSize?: number;
    ttlMs?: number | null;
    keyFn?: (...args: Args) => string;
  } = {}
): (...args: Args) => Result {
  const {
    maxSize = 1000,
    ttlMs = null,
    keyFn = (...args: Args) => JSON.stringify(args),
  } = options;

  const cache = new LRUCache<string, Result>(maxSize, ttlMs);

  return (...args: Args): Result => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export default LRUCache;
