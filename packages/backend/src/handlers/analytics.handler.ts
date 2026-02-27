/**
 * Analytics API Handler
 * Endpoints for advanced portfolio performance metrics
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AnalyticsService } from '../services/analytics.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { getPool } from '../config/database';
import { createApiResponse, errorResponse, getPathParam, getQueryParam, getUserId } from '../utils/api.utils';
import { logger } from '../utils/logger.js';

/**
 * GET /portfolios/:portfolioId/analytics/performance
 * Get comprehensive performance metrics for a portfolio
 */
export async function getPortfolioPerformance(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { portfolioId } = event.pathParameters || {};
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID is required' });
    }

    const { startDate, endDate, period } = event.queryStringParameters || {};

    // Determine date range
    let start: Date;
    let end: Date = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (period) {
      // Predefined periods: 1M, 3M, 6M, 1Y, YTD, ALL
      end = new Date();
      switch (period) {
        case '1M':
          start = new Date();
          start.setMonth(start.getMonth() - 1);
          break;
        case '3M':
          start = new Date();
          start.setMonth(start.getMonth() - 3);
          break;
        case '6M':
          start = new Date();
          start.setMonth(start.getMonth() - 6);
          break;
        case '1Y':
          start = new Date();
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'YTD':
          start = new Date(new Date().getFullYear(), 0, 1);
          break;
        case 'ALL':
          start = new Date(2020, 0, 1); // Start from 2020
          break;
        default:
          return createApiResponse(400, { error: 'Invalid period. Use: 1M, 3M, 6M, 1Y, YTD, ALL' });
      }
    } else {
      // Default to last 30 days
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    logger.info('Getting portfolio performance', { portfolioId, start, end });

    const pool = await getPool();
    const portfolioRepo = new PortfolioRepository();
    const analyticsService = new AnalyticsService(pool);

    // Verify portfolio exists
    await portfolioRepo.findByIdOrThrow(portfolioId);

    // Calculate metrics
    const metrics = await analyticsService.calculatePortfolioMetrics(
      portfolioId,
      start,
      end
    );

    return createApiResponse(200, {
      portfolioId,
      period: { start, end },
      metrics,
    });
  } catch (err: any) {
    logger.error('Failed to get portfolio performance', err);
    return errorResponse(err.message);
  }
}

/**
 * GET /portfolios/:portfolioId/analytics/metrics
 * Get cached performance metrics from database
 */
export async function getCachedMetrics(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { portfolioId } = event.pathParameters || {};
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID is required' });
    }

    const pool = await getPool();

    const result = await pool.query(
      `SELECT
        period_start AS "periodStart",
        period_end AS "periodEnd",
        total_return AS "totalReturn",
        total_return_percent AS "totalReturnPercent",
        annualized_return AS "annualizedReturn",
        volatility,
        downside_deviation AS "downsideDeviation",
        max_drawdown AS "maxDrawdown",
        max_drawdown_percent AS "maxDrawdownPercent",
        sharpe_ratio AS "sharpeRatio",
        sortino_ratio AS "sortinoRatio",
        calmar_ratio AS "calmarRatio",
        var_95 AS "var95",
        var_99 AS "var99",
        cvar_95 AS "cvar95",
        cvar_99 AS "cvar99",
        total_trades AS "totalTrades",
        win_rate AS "winRate",
        profit_factor AS "profitFactor",
        average_trade AS "averageTrade",
        calculation_date AS "calculationDate"
       FROM portfolio_performance_metrics
       WHERE portfolio_id = $1
       ORDER BY calculation_date DESC
       LIMIT 10`,
      [portfolioId]
    );

    return createApiResponse(200, {
      portfolioId,
      metrics: result.rows.map((row) => ({
        ...row,
        periodStart: new Date(row.periodStart),
        periodEnd: new Date(row.periodEnd),
        calculationDate: new Date(row.calculationDate),
      })),
    });
  } catch (err: any) {
    logger.error('Failed to get cached metrics', err);
    return errorResponse(err.message);
  }
}

/**
 * POST /portfolios/:portfolioId/analytics/calculate
 * Trigger calculation and caching of performance metrics
 */
export async function calculateAndSaveMetrics(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { portfolioId } = event.pathParameters || {};
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID is required' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return createApiResponse(400, { error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    logger.info('Calculating and saving metrics', { portfolioId, start, end });

    const pool = await getPool();
    const portfolioRepo = new PortfolioRepository();
    const analyticsService = new AnalyticsService(pool);

    // Verify portfolio exists
    await portfolioRepo.findByIdOrThrow(portfolioId);

    // Calculate metrics
    const metrics = await analyticsService.calculatePortfolioMetrics(
      portfolioId,
      start,
      end
    );

    // Save to database
    await analyticsService.saveMetrics(metrics);

    logger.info('Metrics calculated and saved', { portfolioId });

    return createApiResponse(200, {
      message: 'Metrics calculated and saved successfully',
      portfolioId,
      metrics,
    });
  } catch (err: any) {
    logger.error('Failed to calculate and save metrics', err);
    return errorResponse(err.message);
  }
}

/**
 * GET /portfolios/:portfolioId/analytics/summary
 * Get summary of key performance indicators
 */
export async function getPerformanceSummary(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { portfolioId } = event.pathParameters || {};
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID is required' });
    }

    const pool = await getPool();
    const portfolioRepo = new PortfolioRepository();

    // Verify portfolio exists and get current stats
    const portfolio = await portfolioRepo.findByIdWithStats(portfolioId);
    if (!portfolio) {
      return createApiResponse(404, { error: 'Portfolio not found' });
    }

    // Get most recent metrics
    const metricsResult = await pool.query(
      `SELECT
        sharpe_ratio AS "sharpeRatio",
        sortino_ratio AS "sortinoRatio",
        max_drawdown_percent AS "maxDrawdownPercent",
        win_rate AS "winRate",
        profit_factor AS "profitFactor",
        total_trades AS "totalTrades"
       FROM portfolio_performance_metrics
       WHERE portfolio_id = $1
       ORDER BY calculation_date DESC
       LIMIT 1`,
      [portfolioId]
    );

    const metrics = metricsResult.rows[0] || null;

    return createApiResponse(200, {
      portfolioId,
      currentValue: portfolio.totalValue,
      totalReturn: portfolio.totalValue - portfolio.cashBalance,
      cashBalance: portfolio.cashBalance,
      positionsValue: portfolio.positionsValue,
      positionCount: portfolio.positionCount,
      unrealizedPnL: portfolio.unrealizedPnL,
      unrealizedPnLPercent: portfolio.unrealizedPnLPercent,
      dayReturn: portfolio.dayReturn,
      dayReturnPercent: portfolio.dayReturnPercent,
      metrics,
    });
  } catch (err: any) {
    logger.error('Failed to get performance summary', err);
    return errorResponse(err.message);
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { path, httpMethod } = event;

  // Route based on path and method
  if (path.includes('/analytics/performance') && httpMethod === 'GET') {
    return getPortfolioPerformance(event);
  } else if (path.includes('/analytics/metrics') && httpMethod === 'GET') {
    return getCachedMetrics(event);
  } else if (path.includes('/analytics/calculate') && httpMethod === 'POST') {
    return calculateAndSaveMetrics(event);
  } else if (path.includes('/analytics/summary') && httpMethod === 'GET') {
    return getPerformanceSummary(event);
  }

  return createApiResponse(404, { error: 'Not found' });
};
