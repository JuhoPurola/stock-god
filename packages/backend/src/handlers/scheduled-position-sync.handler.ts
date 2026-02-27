/**
 * Position Sync Handler
 * Syncs portfolio positions with broker to ensure database accuracy
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { TradingService } from '../services/trading.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Position sync job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  const shouldRun = await jobMonitoring.shouldJobRun('position_sync');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('position_sync');

  try {
    const portfolioRepo = new PortfolioRepository();
    const tradingService = new TradingService();

    // Get all active portfolios (paper or live trading mode)
    const result = await pool.query(`
      SELECT id, name, trading_mode
      FROM portfolios
      WHERE trading_mode IN ('paper', 'live')
    `);

    const portfolios = result.rows;

    if (portfolios.length === 0) {
      logger.info('No active portfolios to sync');
      await jobMonitoring.logJobComplete(executionId, {
        portfoliosSynced: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No active portfolios to sync',
          portfoliosSynced: 0,
        }),
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    // Sync each portfolio
    for (const portfolio of portfolios) {
      try {
        logger.info('Syncing portfolio positions', {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
        });

        await tradingService.syncPositions(portfolio.id);
        successCount++;

        logger.info('Portfolio positions synced', {
          portfolioId: portfolio.id,
        });
      } catch (error: any) {
        const errorMsg = `Portfolio ${portfolio.id} (${portfolio.name}): ${error.message}`;
        errors.push(errorMsg);
        logger.error('Failed to sync portfolio positions', {
          portfolioId: portfolio.id,
          error,
        });
        // Continue with other portfolios
      }
    }

    const metadata = {
      portfoliosSynced: successCount,
      portfoliosFailed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Position sync complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Position sync completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Position sync job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Position sync failed',
        error: error.message,
      }),
    };
  }
};
