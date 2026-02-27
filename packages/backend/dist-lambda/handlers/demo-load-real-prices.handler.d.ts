/**
 * Demo endpoint to load real historical price data for small cap stocks
 * with intelligent rate limiting and progress tracking
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Load real historical prices from Alpha Vantage with smart batching
 * POST /demo/load-real-prices
 *
 * Query params:
 * - batchSize: Number of symbols to load per call (default: 5, max: 5 for free tier)
 * - outputSize: 'compact' (100 days) or 'full' (20+ years) - default: compact
 * - force: Force reload even if data exists (default: false)
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=demo-load-real-prices.handler.d.ts.map