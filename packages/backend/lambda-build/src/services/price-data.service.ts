/**
 * Price Data Service - Load and store historical stock prices
 */

import { alphaVantageClient } from '../integrations/alpha-vantage/client.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class PriceDataService {
  /**
   * Load historical prices for a symbol and store in database
   */
  async loadHistoricalPrices(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<number> {
    logger.info('Loading historical prices', { symbol, outputSize });

    try {
      // Get data from Alpha Vantage
      const data = await alphaVantageClient.getDailyAdjusted(symbol, outputSize);

      if (data.length === 0) {
        logger.warn('No data returned for symbol', { symbol });
        return 0;
      }

      // Check if symbol exists in stocks table
      const stockCheck = await query(
        'SELECT symbol FROM stocks WHERE symbol = $1',
        [symbol]
      );

      if (stockCheck.rows.length === 0) {
        logger.warn('Symbol not found in stocks table', { symbol });
        throw new Error(`Symbol ${symbol} not found in database. Add it to stocks table first.`);
      }

      // Delete existing prices for this symbol (to handle updates)
      await query('DELETE FROM stock_prices WHERE symbol = $1', [symbol]);

      // Batch insert prices
      const values: any[] = [];
      const placeholders: string[] = [];

      data.forEach((price, index) => {
        const offset = index * 6;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
        );
        values.push(
          symbol,
          price.date,
          price.open,
          price.high,
          price.low,
          price.close,
          price.volume
        );
      });

      if (placeholders.length > 0) {
        const insertQuery = `
          INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
          VALUES ${placeholders.join(', ')}
          ON CONFLICT (symbol, date) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume,
            updated_at = NOW()
        `;

        await query(insertQuery, values);
      }

      logger.info('Historical prices loaded successfully', {
        symbol,
        dataPoints: data.length,
      });

      return data.length;
    } catch (error) {
      logger.error('Failed to load historical prices', { symbol, error });
      throw error;
    }
  }

  /**
   * Load historical prices for multiple symbols
   */
  async loadBulkHistoricalPrices(
    symbols: string[],
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<{ symbol: string; count: number; error?: string }[]> {
    logger.info('Loading bulk historical prices', {
      symbolCount: symbols.length,
      outputSize,
    });

    const results: { symbol: string; count: number; error?: string }[] = [];

    for (const symbol of symbols) {
      try {
        const count = await this.loadHistoricalPrices(symbol, outputSize);
        results.push({ symbol, count });

        // Small delay between requests to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        logger.error('Failed to load prices for symbol', {
          symbol,
          error: error.message,
        });
        results.push({ symbol, count: 0, error: error.message });
      }
    }

    logger.info('Bulk historical prices load complete', {
      total: symbols.length,
      successful: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
    });

    return results;
  }

  /**
   * Get date range of available prices for a symbol
   */
  async getPriceRange(symbol: string): Promise<{ startDate: Date; endDate: Date; count: number } | null> {
    const result = await query(
      `
      SELECT
        MIN(date) as start_date,
        MAX(date) as end_date,
        COUNT(*) as count
      FROM stock_prices
      WHERE symbol = $1
    `,
      [symbol]
    );

    if (result.rows.length === 0 || !result.rows[0].start_date) {
      return null;
    }

    return {
      startDate: new Date(result.rows[0].start_date),
      endDate: new Date(result.rows[0].end_date),
      count: parseInt(result.rows[0].count),
    };
  }

  /**
   * Get symbols that need price data updates
   */
  async getSymbolsNeedingUpdate(maxAge: number = 7): Promise<string[]> {
    // Find symbols in stocks table that either:
    // 1. Have no price data
    // 2. Have price data older than maxAge days

    const result = await query(
      `
      SELECT s.symbol
      FROM stocks s
      LEFT JOIN (
        SELECT symbol, MAX(date) as latest_date
        FROM stock_prices
        GROUP BY symbol
      ) sp ON s.symbol = sp.symbol
      WHERE sp.symbol IS NULL
        OR sp.latest_date < CURRENT_DATE - INTERVAL '${maxAge} days'
      ORDER BY s.symbol
    `
    );

    return result.rows.map((row) => row.symbol);
  }

  /**
   * Generate sample price data for testing (when Alpha Vantage not available)
   */
  async generateSamplePrices(symbol: string, days: number = 365): Promise<number> {
    logger.info('Generating sample prices', { symbol, days });

    // Check if symbol exists
    const stockCheck = await query(
      'SELECT symbol FROM stocks WHERE symbol = $1',
      [symbol]
    );

    if (stockCheck.rows.length === 0) {
      throw new Error(`Symbol ${symbol} not found in database`);
    }

    // Delete existing prices
    await query('DELETE FROM stock_prices WHERE symbol = $1', [symbol]);

    // Generate prices using random walk
    const values: any[] = [];
    const placeholders: string[] = [];
    let price = 100 + Math.random() * 100; // Start between $100-$200

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random daily change (-3% to +3%)
      const change = (Math.random() - 0.5) * 6;
      price = price * (1 + change / 100);

      // Generate OHLC
      const open = price * (0.99 + Math.random() * 0.02);
      const close = price * (0.99 + Math.random() * 0.02);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (0.98 + Math.random() * 0.02);
      const volume = Math.floor(1000000 + Math.random() * 5000000);

      const offset = (days - 1 - i) * 6;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
      );
      values.push(symbol, dateStr, open, high, low, close, volume);
    }

    const insertQuery = `
      INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES ${placeholders.join(', ')}
    `;

    await query(insertQuery, values);

    logger.info('Sample prices generated', { symbol, days });
    return days;
  }
}

export const priceDataService = new PriceDataService();
