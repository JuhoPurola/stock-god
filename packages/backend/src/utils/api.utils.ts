/**
 * API utility functions
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { ZodSchema } from 'zod';
import { ValidationError } from './errors.js';
import { getUserIdFromEvent } from '../middleware/auth.middleware.js';

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
 * Get user ID from event (validates Auth0 token and auto-creates user)
 */
export async function getUserId(event: APIGatewayProxyEvent): Promise<string> {
  const userId = await getUserIdFromEvent(event);

  if (!userId) {
    throw new ValidationError('Authentication required', [{
      message: 'No valid authentication token found',
      path: ['authorization']
    }]);
  }

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
