/**
 * API utility functions
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { ZodSchema } from 'zod';
import { ValidationError } from './errors.js';

/**
 * Create API Gateway response
 */
export function createApiResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

/**
 * Parse and validate request body
 */
export function parseBody<T>(
  event: APIGatewayProxyEvent,
  schema: ZodSchema<T>
): T {
  if (!event.body) {
    throw new ValidationError('Request body is required');
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body);
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.errors);
  }

  return result.data;
}

/**
 * Get user ID from event (from authorizer or claims)
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  // In production, this would come from Cognito authorizer
  // For development, use a demo user ID
  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.headers?.['x-user-id'] ||
    event.headers?.['X-User-Id'] || // Case-insensitive headers
    '00000000-0000-0000-0000-000000000001'; // Demo user

  return userId;
}

/**
 * Get query parameter
 */
export function getQueryParam(
  event: APIGatewayProxyEvent,
  name: string,
  defaultValue?: string
): string | undefined {
  return event.queryStringParameters?.[name] || defaultValue;
}

/**
 * Get path parameter
 */
export function getPathParam(
  event: APIGatewayProxyEvent,
  name: string
): string {
  const value = event.pathParameters?.[name];
  if (!value) {
    throw new ValidationError(`Path parameter '${name}' is required`);
  }
  return value;
}

/**
 * Error response helper
 */
export function errorResponse(error: any): APIGatewayProxyResult {
  if (error.statusCode) {
    return createApiResponse(error.statusCode, {
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  // Default to 500 for unknown errors
  return createApiResponse(500, {
    error: 'Internal server error',
    message: error.message,
  });
}
