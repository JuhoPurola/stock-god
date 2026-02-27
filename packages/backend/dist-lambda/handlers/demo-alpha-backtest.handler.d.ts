/**
 * Demo endpoint to backtest the Small Cap Alpha Hunter strategy
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Run backtest with Small Cap Alpha Hunter strategy
 * POST /demo/alpha-backtest
 *
 * Query params:
 * - startDate: Start date (default: 2024-01-01)
 * - endDate: End date (default: 2024-12-31)
 * - initialCash: Starting capital (default: 100000)
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=demo-alpha-backtest.handler.d.ts.map