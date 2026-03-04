/**
 * Price Update Handler
 * Fetches latest quotes for active symbols and checks price alerts
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { AlertService } from '../services/alert.service';
import { alpacaClient } from '../integrations/alpaca/client.js';
import { logger } from '../utils/logger.js';
import { AlertType } from '@stock-picker/shared';
import { Pool } from 'pg';

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

    // Check price alerts and trigger notifications
    await checkPriceAlerts(pool, symbols);

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

/**
 * Check price alerts and trigger notifications
 */
async function checkPriceAlerts(pool: Pool, symbols: string[]): Promise<void> {
  try {
    // Get active price alerts for the updated symbols
    const alertsResult = await pool.query(
      `SELECT pa.*, s.name as stock_name, sp.close as current_price
       FROM price_alerts pa
       JOIN stocks s ON pa.symbol = s.symbol
       LEFT JOIN LATERAL (
         SELECT close FROM stock_prices
         WHERE symbol = pa.symbol
         ORDER BY timestamp DESC LIMIT 1
       ) sp ON true
       WHERE pa.active = true
         AND pa.triggered = false
         AND pa.symbol = ANY($1::text[])`,
      [symbols]
    );

    const alertService = new AlertService();
    let triggeredCount = 0;

    for (const alert of alertsResult.rows) {
      const { id, user_id, symbol, condition, target_price, percent_change, current_price, stock_name } = alert;

      if (!current_price) continue;

      let shouldTrigger = false;
      let message = '';

      // Check if alert condition is met
      if (condition === 'above' && target_price && current_price >= target_price) {
        shouldTrigger = true;
        message = `${stock_name} (${symbol}) is now $${current_price.toFixed(2)}, above your target of $${target_price.toFixed(2)}`;
      } else if (condition === 'below' && target_price && current_price <= target_price) {
        shouldTrigger = true;
        message = `${stock_name} (${symbol}) is now $${current_price.toFixed(2)}, below your target of $${target_price.toFixed(2)}`;
      } else if (condition === 'percent_change' && percent_change) {
        // Get price from 24h ago
        const dayAgoResult = await pool.query(
          `SELECT close FROM stock_prices
           WHERE symbol = $1
             AND timestamp >= NOW() - INTERVAL '24 hours'
           ORDER BY timestamp ASC LIMIT 1`,
          [symbol]
        );

        if (dayAgoResult.rows.length > 0) {
          const oldPrice = parseFloat(dayAgoResult.rows[0].close);
          const actualChange = ((current_price - oldPrice) / oldPrice) * 100;

          if (Math.abs(actualChange) >= Math.abs(percent_change)) {
            shouldTrigger = true;
            message = `${stock_name} (${symbol}) has changed ${actualChange >= 0 ? '+' : ''}${actualChange.toFixed(2)}% in 24 hours (now $${current_price.toFixed(2)})`;
          }
        }
      }

      if (shouldTrigger) {
        // Create alert notification
        await alertService.createAlert({
          userId: user_id,
          type: AlertType.PRICE_ALERT,
          title: `Price Alert: ${symbol}`,
          message,
          severity: 'info',
          metadata: {
            symbol,
            currentPrice: current_price,
            targetPrice: target_price,
            condition,
            percentChange: percent_change,
          },
        });

        // Mark price alert as triggered
        await pool.query(
          `UPDATE price_alerts
           SET triggered = true, triggered_at = NOW()
           WHERE id = $1`,
          [id]
        );

        triggeredCount++;
        logger.info('Price alert triggered', { alertId: id, symbol, userId: user_id });
      }
    }

    logger.info('Price alert check complete', {
      alertsChecked: alertsResult.rows.length,
      alertsTriggered: triggeredCount,
    });
  } catch (error: any) {
    logger.error('Failed to check price alerts', error);
    // Don't throw - allow price update to succeed even if alert checking fails
  }
}
