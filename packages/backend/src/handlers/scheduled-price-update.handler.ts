/**
 * Price Update Handler
 * Fetches latest quotes for active symbols and checks price alerts
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { alpacaClient } from '../integrations/alpaca/client.js';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Price update job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  const shouldRun = await jobMonitoring.shouldJobRun('price_update');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('price_update');

  try {
    // Get all unique symbols from active positions and enabled strategies
    const result = await pool.query(`
      SELECT DISTINCT symbol
      FROM (
        SELECT symbol FROM positions
        UNION
        SELECT UNNEST(stock_universe) AS symbol
        FROM strategies
        WHERE enabled = true
      ) AS active_symbols
    `);

    const symbols = result.rows.map((row) => row.symbol);

    if (symbols.length === 0) {
      logger.info('No active symbols to update');
      await jobMonitoring.logJobComplete(executionId, {
        symbolsUpdated: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No active symbols to update',
          symbolsUpdated: 0,
        }),
      };
    }

    logger.info('Fetching prices for symbols', { symbolCount: symbols.length });

    // Batch fetch quotes (Alpaca supports up to 100 symbols per request)
    const batchSize = 100;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      try {
        // Fetch quotes for batch
        const quotes = await Promise.all(
          batch.map(async (symbol) => {
            try {
              const quote = await alpacaClient.getLatestQuote(symbol);
              return { symbol, quote, success: true };
            } catch (error: any) {
              logger.warn('Failed to fetch quote', { symbol, error: error.message });
              return { symbol, error: error.message, success: false };
            }
          })
        );

        // Update prices in database
        for (const result of quotes) {
          if (result.success && result.quote) {
            try {
              const currentPrice = (result.quote.ask_price + result.quote.bid_price) / 2;

              await pool.query(
                `INSERT INTO stock_prices (symbol, timestamp, open, high, low, close, volume)
                 VALUES ($1, NOW(), $2, $2, $2, $2, 0)
                 ON CONFLICT (symbol, timestamp) DO UPDATE
                 SET close = $2`,
                [result.symbol, currentPrice]
              );

              successCount++;
            } catch (error: any) {
              errors.push(`${result.symbol}: ${error.message}`);
            }
          } else if (!result.success) {
            errors.push(`${result.symbol}: ${result.error}`);
          }
        }
      } catch (error: any) {
        const errorMsg = `Batch ${i / batchSize + 1}: ${error.message}`;
        errors.push(errorMsg);
        logger.error('Failed to process price batch', { batch, error });
      }
    }

    // TODO: Check price alerts and trigger notifications
    // This would involve checking price_alerts table and comparing current prices
    // with alert conditions, then creating alerts via AlertService

    const metadata = {
      symbolsTotal: symbols.length,
      symbolsUpdated: successCount,
      symbolsFailed: errors.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors in metadata
    };

    logger.info('Price update complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Price update completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Price update job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Price update failed',
        error: error.message,
      }),
    };
  }
};
