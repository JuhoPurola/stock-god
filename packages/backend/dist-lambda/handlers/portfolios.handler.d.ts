/**
 * Portfolio API handlers
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Get all portfolios for user
 */
export declare function listPortfolios(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get portfolio by ID
 */
export declare function getPortfolio(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Create portfolio
 */
export declare function createPortfolio(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Update portfolio
 */
export declare function updatePortfolio(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Delete portfolio
 */
export declare function deletePortfolio(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get portfolio positions
 */
export declare function getPortfolioPositions(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Delete a position
 */
export declare function deletePosition(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=portfolios.handler.d.ts.map