/**
 * @file Metrics Collection System
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-07
 * 
 * Simple metrics collection for monitoring performance
 * 
 * IMPORTANT:
 * - Keep metrics collection lightweight
 * - Use consistent naming conventions
 * 
 * Functionality:
 * - Request counting
 * - Timing measurements
 * - Error tracking
 */

interface MetricValue {
  count: number;
  sum: number;
  min: number;
  max: number;
  last: number;
}

interface ErrorMetric {
  count: number;
  last: Error | string;
  lastTime: number;
}

export class Metrics {
  private static instance: Metrics;
  
  private counters: Map<string, number> = new Map();
  private timers: Map<string, MetricValue> = new Map();
  private errors: Map<string, ErrorMetric> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  private constructor() {}
  
  public static getInstance(): Metrics {
    if (!Metrics.instance) {
      Metrics.instance = new Metrics();
    }
    return Metrics.instance;
  }
  
  /**
   * Increment a counter metric
   * @param name Metric name
   * @param amount Amount to increment (default: 1)
   */
  public incrementCounter(name: string, amount = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + amount);
  }
  
  /**
   * Get the current value of a counter
   * @param name Metric name
   * @returns Current counter value
   */
  public getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  /**
   * Start timing an operation
   * @param name Metric name
   */
  public startTimer(name: string): void {
    this.startTimes.set(name, Date.now());
  }
  
  /**
   * End timing an operation and record the duration
   * @param name Metric name
   * @returns Duration in milliseconds
   */
  public endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (startTime === undefined) {
      return 0;
    }
    
    const duration = Date.now() - startTime;
    this.recordTime(name, duration);
    this.startTimes.delete(name);
    return duration;
  }
  
  /**
   * Record a time measurement directly
   * @param name Metric name
   * @param duration Duration in milliseconds
   */
  public recordTime(name: string, duration: number): void {
    const current = this.timers.get(name) || { count: 0, sum: 0, min: Number.MAX_VALUE, max: 0, last: 0 };
    
    current.count += 1;
    current.sum += duration;
    current.min = Math.min(current.min, duration);
    current.max = Math.max(current.max, duration);
    current.last = duration;
    
    this.timers.set(name, current);
  }
  
  /**
   * Get timing statistics for a metric
   * @param name Metric name
   * @returns Timing statistics
   */
  public getTimer(name: string): { avg: number; min: number; max: number; count: number; last: number } | null {
    const timer = this.timers.get(name);
    if (!timer) {
      return null;
    }
    
    return {
      avg: timer.count > 0 ? timer.sum / timer.count : 0,
      min: timer.min,
      max: timer.max,
      count: timer.count,
      last: timer.last
    };
  }
  
  /**
   * Record an error
   * @param category Error category
   * @param error Error object or message
   */
  public recordError(category: string, error: Error | string): void {
    const current = this.errors.get(category) || { count: 0, last: '', lastTime: 0 };
    
    current.count += 1;
    current.last = error;
    current.lastTime = Date.now();
    
    this.errors.set(category, current);
  }
  
  /**
   * Get error statistics for a category
   * @param category Error category
   * @returns Error statistics
   */
  public getErrorStats(category: string): { count: number; last: Error | string; lastTime: number } | null {
    return this.errors.get(category) || null;
  }
  
  /**
   * Reset all metrics
   */
  public reset(): void {
    this.counters.clear();
    this.timers.clear();
    this.errors.clear();
    this.startTimes.clear();
  }
  
  /**
   * Get a snapshot of all metrics
   * @returns Metrics snapshot
   */
  public getSnapshot(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      timers: Object.fromEntries(this.timers),
      errors: Object.fromEntries(this.errors),
    };
  }
}

// Export singleton instance
export const metrics = Metrics.getInstance();

// Helper function to time an async function call
export async function timeAsync<T>(
  name: string, 
  fn: () => Promise<T>
): Promise<T> {
  metrics.startTimer(name);
  try {
    return await fn();
  } finally {
    metrics.endTimer(name);
  }
}

// Helper function to track a call to a specific API
export function trackApiCall(method: string): void {
  metrics.incrementCounter(`api.${method}`);
} 