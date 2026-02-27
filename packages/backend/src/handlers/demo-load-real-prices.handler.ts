/**
 * Demo endpoint to load real historical price data for small cap stocks
 * with intelligent rate limiting and progress tracking
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from '../utils/api.utils.js';
import { priceDataService } from '../services/price-data.service.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

/**
 * Load real historical prices from Alpha Vantage with smart batching
 * POST /demo/load-real-prices
 *
 * Query params:
 * - batchSize: Number of symbols to load per call (default: 5, max: 5 for free tier)
 * - outputSize: 'compact' (100 days) or 'full' (20+ years) - default: compact
 * - force: Force reload even if data exists (default: false)
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Loading real historical price data with rate limiting');

    // Small cap universe from Alpha Hunter strategy
    const smallCapUniverse = [
      'AAOI', 'AEIS', 'ALRM', 'AMBA', 'AOSL', 'APPS', 'ARLO', 'AVNW',
      'ADMA', 'AKRO', 'ALEC', 'ALLO', 'ALPN', 'ALVO', 'ANAB',
      'ABCB', 'ABTX', 'AFBI', 'ALRS', 'AMTB',
      'AAON', 'ACHR', 'AIR', 'ALG', 'ARCB', 'ASTE',
      'AROC', 'CDEV', 'CRC', 'GPRE', 'HPK', 'NOG',
      'BOOT', 'CAKE', 'CAL', 'CRMT', 'DBI',
      'CENX', 'CSTE', 'HAYN',
      'AMPS', 'NWE', 'SJW',
      'AIV', 'CLDT', 'GTY',
      'GOGO', 'IMAX', 'SHEN',
    ];

    // Parse parameters
    const batchSize = Math.min(parseInt(event.queryStringParameters?.batchSize || '5'), 5);
    const outputSize = (event.queryStringParameters?.outputSize || 'compact') as 'compact' | 'full';
    const force = event.queryStringParameters?.force === 'true';

    // Check which symbols already have data (unless force reload)
    let symbolsToLoad = smallCapUniverse;
    let alreadyLoaded: string[] = [];

    if (!force) {
      const result = await query(`
        SELECT DISTINCT symbol
        FROM stock_prices
        WHERE symbol = ANY($1)
        GROUP BY symbol
        HAVING COUNT(*) > 50
      `, [smallCapUniverse]);

      alreadyLoaded = result.rows.map(row => row.symbol);
      symbolsToLoad = smallCapUniverse.filter(s => !alreadyLoaded.includes(s));

      logger.info('Progress check', {
        total: smallCapUniverse.length,
        alreadyLoaded: alreadyLoaded.length,
        remaining: symbolsToLoad.length,
      });
    }

    if (symbolsToLoad.length === 0) {
      return createApiResponse(200, {
        message: 'All stocks already have price data',
        progress: {
          total: smallCapUniverse.length,
          completed: smallCapUniverse.length,
          remaining: 0,
          percentComplete: 100,
        },
        note: 'Use ?force=true to reload data',
      });
    }

    // Take only the first batch to respect rate limits
    const batchToLoad = symbolsToLoad.slice(0, batchSize);
    const remainingAfterBatch = symbolsToLoad.length - batchToLoad.length;

    logger.info('Starting batch load from Alpha Vantage', {
      batchSize: batchToLoad.length,
      remaining: remainingAfterBatch,
      outputSize,
    });

    // Load prices from Alpha Vantage with rate limiting
    const results = await priceDataService.loadBulkHistoricalPrices(
      batchToLoad,
      outputSize
    );

    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    const totalCompleted = alreadyLoaded.length + successful.length;

    logger.info('Batch load complete', {
      loaded: successful.length,
      failed: failed.length,
      totalCompleted,
      remaining: remainingAfterBatch,
    });

    const percentComplete = Math.round((totalCompleted / smallCapUniverse.length) * 100);

    return createApiResponse(200, {
      message: remainingAfterBatch > 0
        ? `Batch complete. ${remainingAfterBatch} stocks remaining.`
        : 'All stocks loaded successfully!',
      batch: {
        loaded: batchToLoad,
        successful: successful.length,
        failed: failed.length,
        dataPoints: successful.reduce((sum, r) => sum + r.count, 0),
      },
      progress: {
        total: smallCapUniverse.length,
        completed: totalCompleted,
        remaining: remainingAfterBatch,
        percentComplete,
      },
      results: results,
      nextSteps: remainingAfterBatch > 0
        ? `Call this endpoint again to load the next batch of ${Math.min(batchSize, remainingAfterBatch)} stocks. Estimated time: ${Math.ceil(remainingAfterBatch / batchSize)} more calls (1 minute apart).`
        : 'All stocks loaded! Run the backtest now with real data.',
      rateLimitInfo: {
        batchSize: batchSize,
        callsPerMinute: 5,
        recommendedWaitBetweenCalls: '60 seconds',
        dailyLimit: 500,
      },
    });
  } catch (error) {
    logger.error('Failed to load real price data', error);
    return createApiResponse(500, {
      error: 'Failed to load real price data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
