/**
 * Portfolio Snapshot Handler
 * Creates end-of-day snapshots for portfolio performance tracking
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Portfolio snapshot job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  const shouldRun = await jobMonitoring.shouldJobRun('portfolio_snapshot');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('portfolio_snapshot');

  try {
    const portfolioRepo = new PortfolioRepository();

    // Get all portfolios
    const result = await pool.query(`
      SELECT id, name, user_id
      FROM portfolios
      ORDER BY id
    `);

    const portfolios = result.rows;

    if (portfolios.length === 0) {
      logger.info('No portfolios to snapshot');
      await jobMonitoring.logJobComplete(executionId, {
        snapshotsCreated: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No portfolios to snapshot',
          snapshotsCreated: 0,
        }),
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    // Create snapshot for each portfolio
    for (const portfolio of portfolios) {
      try {
        logger.info('Creating portfolio snapshot', {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
        });

        // Get portfolio with current stats
        const portfolioWithStats = await portfolioRepo.findByIdWithStats(portfolio.id);

        if (!portfolioWithStats) {
          logger.warn('Portfolio not found', { portfolioId: portfolio.id });
          continue;
        }

        // Get yesterday's snapshot for comparison
        const previousSnapshot = await pool.query(
          `SELECT total_value
           FROM portfolio_snapshots
           WHERE portfolio_id = $1
           ORDER BY timestamp DESC
           LIMIT 1`,
          [portfolio.id]
        );

        const previousValue = previousSnapshot.rows[0]?.total_value || portfolioWithStats.totalValue;
        const dailyReturn = portfolioWithStats.totalValue - previousValue;
        const dailyReturnPercent =
          previousValue > 0 ? (dailyReturn / previousValue) * 100 : 0;

        // Create snapshot (try with position_count, fallback without if column doesn't exist)
        try {
          await pool.query(
            `INSERT INTO portfolio_snapshots (
              portfolio_id,
              timestamp,
              total_value,
              cash_balance,
              positions_value,
              position_count,
              daily_return,
              daily_return_percent
            )
            VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
            ON CONFLICT (portfolio_id, timestamp) DO UPDATE
            SET total_value = $2,
                cash_balance = $3,
                positions_value = $4,
                position_count = $5,
                daily_return = $6,
                daily_return_percent = $7`,
            [
              portfolio.id,
              portfolioWithStats.totalValue,
              portfolioWithStats.cashBalance,
              portfolioWithStats.positionsValue,
              portfolioWithStats.positionCount,
              dailyReturn,
              dailyReturnPercent,
            ]
          );
        } catch (error: any) {
          // Fallback: Create snapshot without position_count if column doesn't exist
          if (error.message?.includes('position_count')) {
            await pool.query(
              `INSERT INTO portfolio_snapshots (
                portfolio_id,
                timestamp,
                total_value,
                cash_balance,
                positions_value,
                daily_return,
                daily_return_percent
              )
              VALUES ($1, NOW(), $2, $3, $4, $5, $6)
              ON CONFLICT (portfolio_id, timestamp) DO UPDATE
              SET total_value = $2,
                  cash_balance = $3,
                  positions_value = $4,
                  daily_return = $5,
                  daily_return_percent = $6`,
              [
                portfolio.id,
                portfolioWithStats.totalValue,
                portfolioWithStats.cashBalance,
                portfolioWithStats.positionsValue,
                dailyReturn,
                dailyReturnPercent,
              ]
            );
          } else {
            throw error;
          }
        }

        successCount++;

        logger.info('Portfolio snapshot created', {
          portfolioId: portfolio.id,
          totalValue: portfolioWithStats.totalValue,
          dailyReturn,
          dailyReturnPercent,
        });
      } catch (error: any) {
        const errorMsg = `Portfolio ${portfolio.id} (${portfolio.name}): ${error.message}`;
        errors.push(errorMsg);
        logger.error('Failed to create portfolio snapshot', {
          portfolioId: portfolio.id,
          error,
        });
        // Continue with other portfolios
      }
    }

    const metadata = {
      portfoliosTotal: portfolios.length,
      snapshotsCreated: successCount,
      snapshotsFailed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Portfolio snapshot complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Portfolio snapshot completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Portfolio snapshot job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Portfolio snapshot failed',
        error: error.message,
      }),
    };
  }
};
