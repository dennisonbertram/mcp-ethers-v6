/**
 * @file Silent Logger
 * @version 1.0.0
 * @status STABLE
 * @lastModified 2024-06-17
 * 
 * A no-op logger that doesn't output to console
 * Used to replace console.log calls in the MCP server
 * 
 * IMPORTANT:
 * - This logger does nothing - it just provides an API
 *   that matches the normal logger but suppresses output
 */

// Silent logger object with methods for each log level
export const silentLogger = {
  error(message: string, metadata?: Record<string, any>): void {
    // No-op
  },
  
  warn(message: string, metadata?: Record<string, any>): void {
    // No-op
  },
  
  info(message: string, metadata?: Record<string, any>): void {
    // No-op
  },
  
  debug(message: string, metadata?: Record<string, any>): void {
    // No-op
  },
  
  // Log an error object with appropriate formatting (no-op)
  logError(error: unknown, context: string): void {
    // No-op
  }
}; 