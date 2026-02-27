/**
 * Demo endpoint to populate database with small & micro cap US stocks
 * Uses curated list of real stocks (no API required)
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from '../utils/api.utils.js';
import { stockUniverseService } from '../services/stock-universe.service.js';
import { logger } from '../utils/logger.js';

/**
 * Fetch small & micro cap stocks and populate database
 * POST /demo/populate-stocks
 *
 * Query params:
 * - source: 'curated' (default) | 'fmp' | 'alpaca' - which data source to use
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const source = event.queryStringParameters?.source || 'curated';

    if (source === 'curated') {
      logger.info('Starting small cap stock population from curated list');
      const result = await stockUniverseService.populateCuratedSmallCaps();

      return createApiResponse(200, {
        message: 'Small cap stock population complete',
        source: 'Curated List',
        result,
        note: 'Includes 200+ US small cap ($300M-$2B) and micro cap ($50M-$300M) stocks from NASDAQ, NYSE, and AMEX',
      });
    } else if (source === 'fmp') {
      logger.info('Starting small cap stock population from FMP');
      const result = await stockUniverseService.fetchSmallCapStocksFromFMP();

      return createApiResponse(200, {
        message: 'Small cap stock population complete',
        source: 'Financial Modeling Prep',
        result,
      });
    } else {
      logger.info('Starting stock population from Alpaca');
      const result = await stockUniverseService.fetchAndPopulateStocks();

      return createApiResponse(200, {
        message: 'Stock population complete',
        source: 'Alpaca',
        result,
      });
    }
  } catch (error) {
    logger.error('Failed to populate stocks', error);
    return createApiResponse(500, {
      error: 'Failed to populate stocks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
