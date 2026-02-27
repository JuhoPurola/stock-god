/**
 * Backtest API handlers
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Create and run a new backtest
 */
export declare function createBacktest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get backtest by ID
 */
export declare function getBacktest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * List backtests for user
 */
export declare function listBacktests(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * List backtests for a portfolio
 */
export declare function listPortfolioBacktests(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Get backtest trades
 */
export declare function getBacktestTrades(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
/**
 * Delete backtest
 */
export declare function deleteBacktest(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=backtests.handler.d.ts.map