/**
 * Stock API handlers
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * List all tradable stocks
 */
export declare function listStocks(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Search stocks
 */
export declare function searchStocks(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get stock by symbol
 */
export declare function getStock(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get current quote for a stock
 */
export declare function getQuote(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get price history for a stock
 */
export declare function getPriceHistory(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=stocks.handler.d.ts.map