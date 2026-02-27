/**
 * Scheduled Analytics Handler
 * Daily calculation of portfolio performance metrics
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Analytics calculation job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  const shouldRun = await jobMonitoring.shouldJobRun('analytics_calculation');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('analytics_calculation');

  try {
    const analyticsService = new AnalyticsService(pool);

    // Get all portfolios
    const result = await pool.query(`
      SELECT id, name
      FROM portfolios
      ORDER BY id
    `);

    const portfolios = result.rows;

    if (portfolios.length === 0) {
      logger.info('No portfolios to calculate analytics for');
      await jobMonitoring.logJobComplete(executionId, {
        portfoliosProcessed: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No portfolios to process',
          portfoliosProcessed: 0,
        }),
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    // Calculate metrics for each portfolio
    // Use different time periods: 30 days, 90 days, 1 year
    const periods = [
      { days: 30, name: '30D' },
      { days: 90, name: '90D' },
      { days: 365, name: '1Y' },
    ];

    for (const portfolio of portfolios) {
      for (const period of periods) {
        try {
          logger.info('Calculating analytics', {
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            period: period.name,
          });

          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - period.days);

          // Calculate metrics
          const metrics = await analyticsService.calculatePortfolioMetrics(
            portfolio.id,
            startDate,
            endDate
          );

          // Save metrics to database
          await analyticsService.saveMetrics(metrics);

          successCount++;

          logger.info('Analytics calculated and saved', {
            portfolioId: portfolio.id,
            period: period.name,
            sharpeRatio: metrics.sharpeRatio,
            maxDrawdownPercent: metrics.maxDrawdownPercent,
          });
        } catch (error: any) {
          const errorMsg = `Portfolio ${portfolio.id} (${portfolio.name}) - ${period.name}: ${error.message}`;
          errors.push(errorMsg);
          logger.error('Failed to calculate analytics', {
            portfolioId: portfolio.id,
            period: period.name,
            error,
          });
          // Continue with other portfolios/periods
        }
      }
    }

    const metadata = {
      portfoliosTotal: portfolios.length,
      periodsPerPortfolio: periods.length,
      calculationsSuccessful: successCount,
      calculationsFailed: errors.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors
    };

    logger.info('Analytics calculation complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Analytics calculation completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Analytics calculation job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Analytics calculation failed',
        error: error.message,
      }),
    };
  }
};
