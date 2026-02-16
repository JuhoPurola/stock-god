/**
 * Backtest API handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BacktestRepository } from '../repositories/backtest.repository.js';
import { StrategyRepository } from '../repositories/strategy.repository.js';
import { backtestService } from '../services/backtest.service.js';
import { createApiResponse, parseBody, getUserId, getPathParam } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { BacktestStatus, createBacktestSchema } from '@stock-picker/shared';

const backtestRepo = new BacktestRepository();
const strategyRepo = new StrategyRepository();

/**
 * Create and run a new backtest
 */
export async function createBacktest(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = parseBody(event, createBacktestSchema);

    // Validate config
    if (!body.config) {
      return createApiResponse(400, { error: 'Backtest config is required' });
    }

    if (!body.config.strategyId) {
      return createApiResponse(400, { error: 'Strategy ID is required' });
    }

    // Verify strategy exists and user has access
    const strategy = await strategyRepo.findById(body.config.strategyId);
    if (!strategy) {
      return createApiResponse(404, { error: 'Strategy not found' });
    }

    // Create backtest record
    const backtest = await backtestRepo.create(userId, body);

    logger.info('Backtest created', { backtestId: backtest.id, userId });

    // Run backtest asynchronously (in real implementation, use Step Functions or SQS)
    // For now, run it synchronously with error handling
    setImmediate(async () => {
      try {
        const performance = await backtestService.runBacktest(
          backtest.id,
          backtest.config,
          strategy
        );

        await backtestRepo.updatePerformance(backtest.id, performance);
        logger.info('Backtest completed successfully', { backtestId: backtest.id });
      } catch (error: any) {
        logger.error('Backtest execution failed', { backtestId: backtest.id, error });
        await backtestRepo.updateStatus(
          backtest.id,
          BacktestStatus.FAILED,
          error.message
        );
      }
    });

    return createApiResponse(201, { backtest });
  } catch (error) {
    logger.error('Create backtest error', error);
    return createApiResponse(500, {
      error: 'Failed to create backtest',
    });
  }
}

/**
 * Get backtest by ID
 */
export async function getBacktest(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const backtestId = getPathParam(event, 'id');
    const backtest = await backtestRepo.findById(backtestId);

    if (!backtest) {
      return createApiResponse(404, { error: 'Backtest not found' });
    }

    return createApiResponse(200, { backtest });
  } catch (error) {
    logger.error('Get backtest error', error);
    return createApiResponse(500, {
      error: 'Failed to get backtest',
    });
  }
}

/**
 * List backtests for user
 */
export async function listBacktests(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const limit = parseInt(event.queryStringParameters?.limit || '50');

    const backtests = await backtestRepo.findByUserId(userId, limit);

    return createApiResponse(200, { backtests });
  } catch (error) {
    logger.error('List backtests error', error);
    return createApiResponse(500, {
      error: 'Failed to list backtests',
    });
  }
}

/**
 * List backtests for a portfolio
 */
export async function listPortfolioBacktests(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = getPathParam(event, 'portfolioId');
    const backtests = await backtestRepo.findByPortfolioId(portfolioId);

    return createApiResponse(200, { backtests });
  } catch (error) {
    logger.error('List portfolio backtests error', error);
    return createApiResponse(500, {
      error: 'Failed to list backtests',
    });
  }
}

/**
 * Get backtest trades
 */
export async function getBacktestTrades(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const backtestId = getPathParam(event, 'id');

    // Verify backtest exists
    const backtest = await backtestRepo.findById(backtestId);
    if (!backtest) {
      return createApiResponse(404, { error: 'Backtest not found' });
    }

    const trades = await backtestRepo.findTradesByBacktestId(backtestId);

    return createApiResponse(200, { trades });
  } catch (error) {
    logger.error('Get backtest trades error', error);
    return createApiResponse(500, {
      error: 'Failed to get backtest trades',
    });
  }
}

/**
 * Delete backtest
 */
export async function deleteBacktest(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const backtestId = getPathParam(event, 'id');

    // Verify backtest exists
    const backtest = await backtestRepo.findById(backtestId);
    if (!backtest) {
      return createApiResponse(404, { error: 'Backtest not found' });
    }

    await backtestRepo.delete(backtestId);

    logger.info('Backtest deleted', { backtestId });

    return createApiResponse(200, {
      message: 'Backtest deleted successfully',
    });
  } catch (error) {
    logger.error('Delete backtest error', error);
    return createApiResponse(500, {
      error: 'Failed to delete backtest',
    });
  }
}
