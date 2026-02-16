/**
 * Demo seed endpoint - populate database with sample price data
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { priceDataService } from '../services/price-data.service.js';
import { query } from '../config/database.js';

/**
 * Seed sample price data for demo stocks
 */
export async function seedDemoData(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Starting demo data seeding...');

    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    // Generate data for 2024 (entire year)
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1; // ~365 days

    const results: any[] = [];

    for (const symbol of symbols) {
      try {
        logger.info(`Generating 2024 sample prices for ${symbol}...`);
        const count = await priceDataService.generateSamplePricesForDateRange(symbol, startDate, endDate);
        results.push({
          symbol,
          success: true,
          dataPoints: count,
        });
        logger.info(`✅ ${symbol}: Generated ${count} days of 2024 sample data`);
      } catch (error: any) {
        logger.error(`Failed to generate data for ${symbol}:`, error);
        results.push({
          symbol,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    logger.info('Demo data seeding complete', {
      successful: successful.length,
      failed: failed.length,
    });

    return createApiResponse(200, {
      success: true,
      message: `Seeded ${successful.length}/${symbols.length} stocks with sample data`,
      results,
      summary: {
        totalSymbols: symbols.length,
        successful: successful.length,
        failed: failed.length,
        totalDataPoints: successful.reduce((sum, r) => sum + r.dataPoints, 0),
      }
    });
  } catch (error: any) {
    logger.error('Demo seeding failed:', error);
    return createApiResponse(500, {
      success: false,
      error: 'Seeding failed',
      message: error.message,
      details: error.stack,
    });
  }
}
