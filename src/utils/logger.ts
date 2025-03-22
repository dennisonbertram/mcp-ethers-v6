/**
 * @file Logging System
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-07
 * 
 * A simple structured logging system
 * 
 * IMPORTANT:
 * - Keep consistent log formats
 * - Follow log level guidelines
 * - Never use console.log as it blocks MCP in stdio mode
 * - Always use process.stderr for logging
 * 
 * Functionality:
 * - Multiple log levels
 * - Structured logging
 * - Log formatting
 */

import { config } from '../config/config.js';

// Log levels with numeric values for comparison
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Convert string log level to enum value
function getLogLevelValue(level: string): LogLevel {
  switch (level.toLowerCase()) {
    case 'error': return LogLevel.ERROR;
    case 'warn': return LogLevel.WARN;
    case 'info': return LogLevel.INFO;
    case 'debug': return LogLevel.DEBUG;
    default: return LogLevel.INFO;
  }
}

// Current log level from configuration
const CURRENT_LOG_LEVEL = getLogLevelValue(config.LOG_LEVEL);

// Format a log message with timestamp and metadata
function formatLogMessage(level: string, message: string, metadata?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metadataStr}`;
}

// Check if a log level should be printed
function shouldLog(level: LogLevel): boolean {
  return level <= CURRENT_LOG_LEVEL;
}

// Write to stderr - safe for MCP in stdio mode
function writeToStderr(message: string): void {
  process.stderr.write(message + '\n');
}

// Logger object with methods for each log level
export const logger = {
  error(message: string, metadata?: Record<string, any>): void {
    if (shouldLog(LogLevel.ERROR)) {
      writeToStderr(formatLogMessage('error', message, metadata));
    }
  },
  
  warn(message: string, metadata?: Record<string, any>): void {
    if (shouldLog(LogLevel.WARN)) {
      writeToStderr(formatLogMessage('warn', message, metadata));
    }
  },
  
  info(message: string, metadata?: Record<string, any>): void {
    if (shouldLog(LogLevel.INFO)) {
      writeToStderr(formatLogMessage('info', message, metadata));
    }
  },
  
  debug(message: string, metadata?: Record<string, any>): void {
    if (shouldLog(LogLevel.DEBUG)) {
      writeToStderr(formatLogMessage('debug', message, metadata));
    }
  },
  
  // Log an error object with appropriate formatting
  logError(error: unknown, context: string): void {
    if (!shouldLog(LogLevel.ERROR)) return;
    
    if (error instanceof Error) {
      this.error(`${context}: ${error.message}`, {
        name: error.name,
        stack: error.stack,
      });
    } else if (typeof error === 'string') {
      this.error(`${context}: ${error}`);
    } else {
      this.error(`${context}: Unknown error`, { error });
    }
  }
}; 