/**
 * Trade API handlers
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Get trades for a portfolio
 */
export declare function listTrades(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get trade by ID
 */
export declare function getTrade(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Execute a manual trade
 */
export declare function executeTrade(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Check order status
 */
export declare function checkOrderStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=trades.handler.d.ts.map