/**
 * Strategy API handlers
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Get strategies for a portfolio
 */
export declare function listStrategies(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get strategy by ID
 */
export declare function getStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Create strategy
 */
export declare function createStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Update strategy
 */
export declare function updateStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Delete strategy
 */
export declare function deleteStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Toggle strategy enabled status
 */
export declare function toggleStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Test strategy on a symbol
 */
export declare function testStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Execute strategy (generate signals and optionally execute trades)
 */
export declare function executeStrategy(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=strategies.handler.d.ts.map