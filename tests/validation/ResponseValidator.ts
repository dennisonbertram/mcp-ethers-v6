/**
 * @file ResponseValidator.ts
 * @description MCP response validation utilities
 */

import { CallToolResult, ListToolsResult, ListResourcesResult, ListPromptsResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Validation result for a single check
 */
export interface ValidationResult {
  valid: boolean;
  field?: string;
  expected?: any;
  actual?: any;
  message?: string;
  errors?: ValidationResult[];
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Allow additional properties not in schema */
  allowAdditionalProperties?: boolean;
  /** Strict type checking */
  strictTypes?: boolean;
  /** Check for required fields */
  checkRequired?: boolean;
  /** Validate nested objects */
  validateNested?: boolean;
  /** Custom validators */
  customValidators?: Record<string, (value: any) => ValidationResult>;
}

/**
 * Response validator for MCP responses
 */
export class ResponseValidator {
  private options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      allowAdditionalProperties: true,
      strictTypes: true,
      checkRequired: true,
      validateNested: true,
      ...options
    };
  }

  /**
   * Validates a tool call response
   */
  validateToolResponse(response: any): ValidationResult {
    if (!response) {
      return {
        valid: false,
        message: 'Response is null or undefined'
      };
    }

    const errors: ValidationResult[] = [];

    // Check for required fields
    if (!('content' in response) && !('isError' in response)) {
      errors.push({
        valid: false,
        field: 'content/isError',
        message: 'Response must have either content or isError field'
      });
    }

    // Validate content array if present
    if ('content' in response) {
      if (!Array.isArray(response.content)) {
        errors.push({
          valid: false,
          field: 'content',
          expected: 'array',
          actual: typeof response.content,
          message: 'Content must be an array'
        });
      } else {
        // Validate each content item
        response.content.forEach((item: any, index: number) => {
          const itemValidation = this.validateContentItem(item);
          if (!itemValidation.valid) {
            errors.push({
              valid: false,
              field: `content[${index}]`,
              message: itemValidation.message,
              errors: itemValidation.errors
            });
          }
        });
      }
    }

    // Validate isError field if present
    if ('isError' in response && typeof response.isError !== 'boolean') {
      errors.push({
        valid: false,
        field: 'isError',
        expected: 'boolean',
        actual: typeof response.isError,
        message: 'isError must be a boolean'
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a content item
   */
  private validateContentItem(item: any): ValidationResult {
    if (!item || typeof item !== 'object') {
      return {
        valid: false,
        message: 'Content item must be an object'
      };
    }

    // Check for type field
    if (!('type' in item)) {
      return {
        valid: false,
        field: 'type',
        message: 'Content item must have a type field'
      };
    }

    // Validate based on type
    switch (item.type) {
      case 'text':
        return this.validateTextContent(item);
      case 'image':
        return this.validateImageContent(item);
      case 'resource':
        return this.validateResourceContent(item);
      case 'resource_link':
        return this.validateResourceLinkContent(item);
      default:
        if (!this.options.allowAdditionalProperties) {
          return {
            valid: false,
            field: 'type',
            actual: item.type,
            message: `Unknown content type: ${item.type}`
          };
        }
        return { valid: true };
    }
  }

  /**
   * Validates text content
   */
  private validateTextContent(item: any): ValidationResult {
    if (!('text' in item)) {
      return {
        valid: false,
        field: 'text',
        message: 'Text content must have a text field'
      };
    }

    if (typeof item.text !== 'string') {
      return {
        valid: false,
        field: 'text',
        expected: 'string',
        actual: typeof item.text,
        message: 'Text field must be a string'
      };
    }

    return { valid: true };
  }

  /**
   * Validates image content
   */
  private validateImageContent(item: any): ValidationResult {
    if (!('data' in item) && !('url' in item)) {
      return {
        valid: false,
        message: 'Image content must have either data or url field'
      };
    }

    if ('mimeType' in item && typeof item.mimeType !== 'string') {
      return {
        valid: false,
        field: 'mimeType',
        expected: 'string',
        actual: typeof item.mimeType,
        message: 'mimeType must be a string'
      };
    }

    return { valid: true };
  }

  /**
   * Validates resource content
   */
  private validateResourceContent(item: any): ValidationResult {
    if (!('resource' in item)) {
      return {
        valid: false,
        field: 'resource',
        message: 'Resource content must have a resource field'
      };
    }

    const resource = item.resource;
    if (!resource || typeof resource !== 'object') {
      return {
        valid: false,
        field: 'resource',
        message: 'Resource must be an object'
      };
    }

    // Validate resource properties
    if (!('uri' in resource)) {
      return {
        valid: false,
        field: 'resource.uri',
        message: 'Resource must have a uri field'
      };
    }

    return { valid: true };
  }

  /**
   * Validates resource link content
   */
  private validateResourceLinkContent(item: any): ValidationResult {
    if (!('uri' in item)) {
      return {
        valid: false,
        field: 'uri',
        message: 'Resource link must have a uri field'
      };
    }

    if (typeof item.uri !== 'string') {
      return {
        valid: false,
        field: 'uri',
        expected: 'string',
        actual: typeof item.uri,
        message: 'URI must be a string'
      };
    }

    return { valid: true };
  }

  /**
   * Validates a list tools response
   */
  validateListToolsResponse(response: any): ValidationResult {
    if (!response) {
      return {
        valid: false,
        message: 'Response is null or undefined'
      };
    }

    const errors: ValidationResult[] = [];

    // Check for tools array
    if (!('tools' in response)) {
      errors.push({
        valid: false,
        field: 'tools',
        message: 'Response must have a tools field'
      });
    } else if (!Array.isArray(response.tools)) {
      errors.push({
        valid: false,
        field: 'tools',
        expected: 'array',
        actual: typeof response.tools,
        message: 'Tools must be an array'
      });
    } else {
      // Validate each tool
      response.tools.forEach((tool: any, index: number) => {
        const toolValidation = this.validateTool(tool);
        if (!toolValidation.valid) {
          errors.push({
            valid: false,
            field: `tools[${index}]`,
            message: toolValidation.message,
            errors: toolValidation.errors
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a tool definition
   */
  private validateTool(tool: any): ValidationResult {
    if (!tool || typeof tool !== 'object') {
      return {
        valid: false,
        message: 'Tool must be an object'
      };
    }

    const errors: ValidationResult[] = [];

    // Check required fields
    if (!('name' in tool)) {
      errors.push({
        valid: false,
        field: 'name',
        message: 'Tool must have a name field'
      });
    } else if (typeof tool.name !== 'string') {
      errors.push({
        valid: false,
        field: 'name',
        expected: 'string',
        actual: typeof tool.name,
        message: 'Tool name must be a string'
      });
    }

    if (!('description' in tool)) {
      errors.push({
        valid: false,
        field: 'description',
        message: 'Tool must have a description field'
      });
    }

    // Validate input schema if present
    if ('inputSchema' in tool && tool.inputSchema !== null) {
      if (typeof tool.inputSchema !== 'object') {
        errors.push({
          valid: false,
          field: 'inputSchema',
          expected: 'object',
          actual: typeof tool.inputSchema,
          message: 'Input schema must be an object'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a list resources response
   */
  validateListResourcesResponse(response: any): ValidationResult {
    if (!response) {
      return {
        valid: false,
        message: 'Response is null or undefined'
      };
    }

    const errors: ValidationResult[] = [];

    // Check for resources array
    if (!('resources' in response)) {
      errors.push({
        valid: false,
        field: 'resources',
        message: 'Response must have a resources field'
      });
    } else if (!Array.isArray(response.resources)) {
      errors.push({
        valid: false,
        field: 'resources',
        expected: 'array',
        actual: typeof response.resources,
        message: 'Resources must be an array'
      });
    } else {
      // Validate each resource
      response.resources.forEach((resource: any, index: number) => {
        const resourceValidation = this.validateResource(resource);
        if (!resourceValidation.valid) {
          errors.push({
            valid: false,
            field: `resources[${index}]`,
            message: resourceValidation.message,
            errors: resourceValidation.errors
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a resource definition
   */
  private validateResource(resource: any): ValidationResult {
    if (!resource || typeof resource !== 'object') {
      return {
        valid: false,
        message: 'Resource must be an object'
      };
    }

    const errors: ValidationResult[] = [];

    // Check required fields
    if (!('uri' in resource)) {
      errors.push({
        valid: false,
        field: 'uri',
        message: 'Resource must have a uri field'
      });
    } else if (typeof resource.uri !== 'string') {
      errors.push({
        valid: false,
        field: 'uri',
        expected: 'string',
        actual: typeof resource.uri,
        message: 'Resource uri must be a string'
      });
    }

    if (!('name' in resource)) {
      errors.push({
        valid: false,
        field: 'name',
        message: 'Resource must have a name field'
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a list prompts response
   */
  validateListPromptsResponse(response: any): ValidationResult {
    if (!response) {
      return {
        valid: false,
        message: 'Response is null or undefined'
      };
    }

    const errors: ValidationResult[] = [];

    // Check for prompts array
    if (!('prompts' in response)) {
      errors.push({
        valid: false,
        field: 'prompts',
        message: 'Response must have a prompts field'
      });
    } else if (!Array.isArray(response.prompts)) {
      errors.push({
        valid: false,
        field: 'prompts',
        expected: 'array',
        actual: typeof response.prompts,
        message: 'Prompts must be an array'
      });
    } else {
      // Validate each prompt
      response.prompts.forEach((prompt: any, index: number) => {
        const promptValidation = this.validatePrompt(prompt);
        if (!promptValidation.valid) {
          errors.push({
            valid: false,
            field: `prompts[${index}]`,
            message: promptValidation.message,
            errors: promptValidation.errors
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates a prompt definition
   */
  private validatePrompt(prompt: any): ValidationResult {
    if (!prompt || typeof prompt !== 'object') {
      return {
        valid: false,
        message: 'Prompt must be an object'
      };
    }

    const errors: ValidationResult[] = [];

    // Check required fields
    if (!('name' in prompt)) {
      errors.push({
        valid: false,
        field: 'name',
        message: 'Prompt must have a name field'
      });
    } else if (typeof prompt.name !== 'string') {
      errors.push({
        valid: false,
        field: 'name',
        expected: 'string',
        actual: typeof prompt.name,
        message: 'Prompt name must be a string'
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates MCP protocol compliance
   */
  validateProtocolCompliance(response: any): ValidationResult {
    const errors: ValidationResult[] = [];

    // Check JSON-RPC structure if applicable
    if ('jsonrpc' in response) {
      if (response.jsonrpc !== '2.0') {
        errors.push({
          valid: false,
          field: 'jsonrpc',
          expected: '2.0',
          actual: response.jsonrpc,
          message: 'Invalid JSON-RPC version'
        });
      }

      // Check for id in responses (not notifications)
      if ('result' in response || 'error' in response) {
        if (!('id' in response)) {
          errors.push({
            valid: false,
            field: 'id',
            message: 'Response must have an id field'
          });
        }
      }

      // Check for mutual exclusivity of result and error
      if ('result' in response && 'error' in response) {
        errors.push({
          valid: false,
          message: 'Response cannot have both result and error fields'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Creates a custom validator function
   */
  static createCustomValidator(
    fn: (value: any) => boolean,
    message: string = 'Custom validation failed'
  ): (value: any) => ValidationResult {
    return (value: any) => ({
      valid: fn(value),
      message: fn(value) ? undefined : message
    });
  }

  /**
   * Combines multiple validators
   */
  static combineValidators(
    ...validators: Array<(value: any) => ValidationResult>
  ): (value: any) => ValidationResult {
    return (value: any) => {
      const errors: ValidationResult[] = [];
      
      for (const validator of validators) {
        const result = validator(value);
        if (!result.valid) {
          errors.push(result);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    };
  }
}