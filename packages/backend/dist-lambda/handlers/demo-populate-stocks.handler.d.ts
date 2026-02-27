/**
 * Demo endpoint to populate database with small & micro cap US stocks
 * Uses curated list of real stocks (no API required)
 */
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Fetch small & micro cap stocks and populate database
 * POST /demo/populate-stocks
 *
 * Query params:
 * - source: 'curated' (default) | 'fmp' | 'alpaca' - which data source to use
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=demo-populate-stocks.handler.d.ts.map