/**
 * @file Test Assertions
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-06-28
 * 
 * Assertion utilities for MCP test client
 * 
 * IMPORTANT:
 * - Keep assertions simple and focused
 * - Include descriptive error messages
 * 
 * Functionality:
 * - Basic assertions for test values
 * - MCP response assertions
 */

import { logger } from "../../../utils/logger.js";

/**
 * Assert that a condition is true
 * 
 * @param condition The condition to check
 * @param message Error message if assertion fails
 */
export function assert(condition: boolean, message: string): void {
  if (!condition) {
    logger.error(`Assertion failed: ${message}`);
    throw new Error(message);
  }
}

/**
 * Assert that two values are equal
 * 
 * @param actual The actual value
 * @param expected The expected value
 * @param message Error message if assertion fails
 */
export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    const errorMessage = `${message}. Expected ${expected}, but got ${actual}`;
    logger.error(`Assertion failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Assert that a string contains a specific substring
 * 
 * @param actual The string to check
 * @param expectedSubstring The substring to look for
 * @param message Error message if assertion fails
 */
export function assertContains(actual: string, expectedSubstring: string, message: string): void {
  if (!actual.includes(expectedSubstring)) {
    const errorMessage = `${message}. Expected "${actual}" to contain "${expectedSubstring}"`;
    logger.error(`Assertion failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Assert that a value is not null or undefined
 * 
 * @param value The value to check
 * @param message Error message if assertion fails
 */
export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    const errorMessage = `${message}. Expected value to be defined, but got ${value}`;
    logger.error(`Assertion failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Assert that a MCP tool response is successful
 * 
 * @param response The MCP tool response
 * @param message Error message if assertion fails
 */
export function assertToolSuccess(response: any, message: string): void {
  assertDefined(response, `${message} - Response is undefined`);
  assert(!response.isError, `${message} - Got error: ${JSON.stringify(response)}`);
  assertDefined(response.content, `${message} - Response has no content`);
  assert(Array.isArray(response.content), `${message} - Response content is not an array`);
}

/**
 * Assert that a MCP tool response contains text
 * 
 * @param response The MCP tool response
 * @param expectedText The text to look for in the response
 * @param message Error message if assertion fails
 */
export function assertToolResponseContains(response: any, expectedText: string, message: string): void {
  assertToolSuccess(response, message);
  
  const hasExpectedText = response.content.some((item: any) => 
    item.type === 'text' && item.text && item.text.includes(expectedText)
  );
  
  assert(hasExpectedText, `${message} - Response does not contain text "${expectedText}"`);
} 