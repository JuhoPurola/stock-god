/**
 * API utility functions
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { ZodSchema } from 'zod';
/**
 * Create API Gateway response
 */
export declare function createApiResponse(statusCode: number, body: any): APIGatewayProxyResult;
/**
 * Parse and validate request body
 */
export declare function parseBody<T>(event: APIGatewayProxyEvent, schema: ZodSchema<T>): T;
/**
 * Get user ID from event (validates Auth0 token and auto-creates user)
 */
export declare function getUserId(event: APIGatewayProxyEvent): Promise<string>;
/**
 * Get query parameter
 */
export declare function getQueryParam(event: APIGatewayProxyEvent, name: string, defaultValue?: string): string | undefined;
/**
 * Get path parameter
 */
export declare function getPathParam(event: APIGatewayProxyEvent, name: string): string;
/**
 * Error response helper
 */
export declare function errorResponse(error: any): APIGatewayProxyResult;
//# sourceMappingURL=api.utils.d.ts.map