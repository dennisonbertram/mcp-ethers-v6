/**
 * @file Cache System
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-07
 * 
 * Simple in-memory caching system with TTL support
 * 
 * IMPORTANT:
 * - Keep memory usage reasonable
 * - Provide clear invalidation mechanisms
 * 
 * Functionality:
 * - Time-based expiration
 * - Chainable API
 * - Cache invalidation
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
}

export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultOptions: CacheOptions = { ttl: 30000 }; // Default 30 seconds TTL

  constructor(options?: Partial<CacheOptions>) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param options Optional cache options
   * @returns this instance for chaining
   */
  set(key: string, value: T, options?: Partial<CacheOptions>): this {
    const opts = { ...this.defaultOptions, ...options };
    const expiry = Date.now() + opts.ttl;
    
    this.cache.set(key, { value, expiry });
    return this;
  }

  /**
   * Check if a key exists and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a key from the cache
   * @param key The cache key
   * @returns True if the key was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get a value from the cache, or compute and cache it if not found
   * @param key The cache key
   * @param factory Function to compute the value if not cached
   * @param options Optional cache options
   * @returns The cached or computed value
   */
  async getOrCompute(
    key: string, 
    factory: () => Promise<T>,
    options?: Partial<CacheOptions>
  ): Promise<T> {
    const cached = this.get(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Remove all expired entries from the cache
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}

// Create cache instances for different types of data
export const blockCache = new Cache<any>({ ttl: 10000 }); // 10 seconds
export const transactionCache = new Cache<any>({ ttl: 60000 }); // 1 minute
export const balanceCache = new Cache<string>({ ttl: 30000 }); // 30 seconds
export const contractCache = new Cache<any>({ ttl: 300000 }); // 5 minutes
export const ensCache = new Cache<string>({ ttl: 3600000 }); // 1 hour

// Helper to generate cache keys with network information
export function createCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  const filteredParts = parts.filter(part => part !== undefined);
  return `${prefix}:${filteredParts.join(':')}`;
}

// Cleanup expired cache entries periodically
setInterval(() => {
  blockCache.cleanup();
  transactionCache.cleanup();
  balanceCache.cleanup();
  contractCache.cleanup();
  ensCache.cleanup();
}, 60000); // Run cleanup every minute 