/**
 * @file Rate Limiter
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-07
 * 
 * Simple in-memory rate limiter to prevent API abuse
 * 
 * IMPORTANT:
 * - Keep memory usage reasonable
 * - Use sliding window algorithm for accurate rate limiting
 * 
 * Functionality:
 * - Request rate limiting
 * - Different limits for different operations
 * - Sliding window algorithm
 */

interface RateLimitOptions {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests per window
}

interface RateLimitBucket {
  timestamps: number[];  // Array of request timestamps
  blockedUntil?: number; // Timestamp until which requests are blocked
}

export class RateLimiter {
  private limits: Map<string, RateLimitOptions> = new Map();
  private buckets: Map<string, RateLimitBucket> = new Map();
  
  /**
   * Create a new rate limiter
   */
  constructor() {
    // Set default limits for different operations
    this.setLimit('default', { windowMs: 60000, maxRequests: 120 });  // 120 requests per minute
    this.setLimit('contract', { windowMs: 60000, maxRequests: 60 });  // 60 contract calls per minute
    this.setLimit('transaction', { windowMs: 60000, maxRequests: 20 }); // 20 transactions per minute
    
    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }
  
  /**
   * Set a rate limit for a specific operation
   * @param operation Operation name
   * @param options Rate limit options
   */
  public setLimit(operation: string, options: RateLimitOptions): void {
    this.limits.set(operation, options);
  }
  
  /**
   * Check if an operation for a specific identity is rate limited
   * @param operation Operation name
   * @param identity Identity string (e.g., IP, user ID)
   * @returns True if the operation is allowed, false if rate limited
   */
  public isAllowed(operation: string, identity: string): boolean {
    const key = `${operation}:${identity}`;
    const limit = this.limits.get(operation) || this.limits.get('default')!;
    
    // Create bucket if it doesn't exist
    if (!this.buckets.has(key)) {
      this.buckets.set(key, { timestamps: [] });
    }
    
    const bucket = this.buckets.get(key)!;
    
    // Check if currently blocked
    if (bucket.blockedUntil && Date.now() < bucket.blockedUntil) {
      return false;
    }
    
    // Remove timestamps outside the current window
    const now = Date.now();
    const windowStart = now - limit.windowMs;
    bucket.timestamps = bucket.timestamps.filter(time => time >= windowStart);
    
    // Check if under the limit
    if (bucket.timestamps.length < limit.maxRequests) {
      bucket.timestamps.push(now);
      return true;
    }
    
    // Rate limited
    return false;
  }
  
  /**
   * Check if an operation is allowed and record it
   * @param operation Operation name
   * @param identity Identity string
   * @returns True if allowed, false if rate limited
   */
  public consume(operation: string, identity: string): boolean {
    if (this.isAllowed(operation, identity)) {
      return true;
    }
    
    // If not allowed, update the blocked until time
    const key = `${operation}:${identity}`;
    const bucket = this.buckets.get(key)!;
    const limit = this.limits.get(operation) || this.limits.get('default')!;
    
    // Block for the duration of the window
    bucket.blockedUntil = Date.now() + limit.windowMs;
    
    return false;
  }
  
  /**
   * Get remaining requests for an operation and identity
   * @param operation Operation name
   * @param identity Identity string
   * @returns Number of remaining requests in the current window
   */
  public getRemainingRequests(operation: string, identity: string): number {
    const key = `${operation}:${identity}`;
    const limit = this.limits.get(operation) || this.limits.get('default')!;
    
    if (!this.buckets.has(key)) {
      return limit.maxRequests;
    }
    
    const bucket = this.buckets.get(key)!;
    
    // Check if currently blocked
    if (bucket.blockedUntil && Date.now() < bucket.blockedUntil) {
      return 0;
    }
    
    // Remove timestamps outside the current window
    const now = Date.now();
    const windowStart = now - limit.windowMs;
    bucket.timestamps = bucket.timestamps.filter(time => time >= windowStart);
    
    return Math.max(0, limit.maxRequests - bucket.timestamps.length);
  }
  
  /**
   * Reset rate limit for an operation and identity
   * @param operation Operation name
   * @param identity Identity string
   */
  public reset(operation: string, identity: string): void {
    const key = `${operation}:${identity}`;
    this.buckets.delete(key);
  }
  
  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, bucket] of this.buckets.entries()) {
      const [operation] = key.split(':');
      const limit = this.limits.get(operation) || this.limits.get('default')!;
      
      // If bucket is empty or all timestamps are old, remove it
      const windowStart = now - limit.windowMs;
      bucket.timestamps = bucket.timestamps.filter(time => time >= windowStart);
      
      if (
        bucket.timestamps.length === 0 && 
        (!bucket.blockedUntil || bucket.blockedUntil < now)
      ) {
        this.buckets.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(); 