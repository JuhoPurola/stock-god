/**
 * Strategy API handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { Trade } from '@stock-picker/shared';
import { StrategyRepository } from '../repositories/index.js';
import { StrategyService, TradingService } from '../services/index.js';
import { createApiResponse, parseBody, getPathParam } from '../utils/api.utils.js';
import {
  createStrategySchema,
  updateStrategySchema,
} from '@stock-picker/shared';
import { logger } from '../utils/logger.js';

const strategyRepo = new StrategyRepository();
const strategyService = new StrategyService();
const tradingService = new TradingService();

/**
 * Get strategies for a portfolio
 */
export async function listStrategies(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = getPathParam(event, 'portfolioId');
    const strategies = await strategyRepo.findByPortfolioId(portfolioId);

    return createApiResponse(200, { strategies });
  } catch (error) {
    logger.error('List strategies error', error);
    return createApiResponse(500, {
      error: 'Failed to list strategies',
    });
  }
}

/**
 * Get strategy by ID
 */
export async function getStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    const strategy = await strategyRepo.findById(strategyId);

    if (!strategy) {
      return createApiResponse(404, { error: 'Strategy not found' });
    }

    return createApiResponse(200, { strategy });
  } catch (error) {
    logger.error('Get strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to get strategy',
    });
  }
}

/**
 * Create strategy
 */
export async function createStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const body = parseBody(event, createStrategySchema);
    const strategy = await strategyRepo.create(body);

    logger.info('Strategy created', { strategyId: strategy.id });

    return createApiResponse(201, { strategy });
  } catch (error: any) {
    logger.error('Create strategy error', error);

    // Return validation errors with details
    if (error.statusCode === 400) {
      return createApiResponse(400, {
        error: error.message,
        details: error.details,
      });
    }

    return createApiResponse(500, {
      error: 'Failed to create strategy',
      message: error.message,
    });
  }
}

/**
 * Update strategy
 */
export async function updateStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    const body = parseBody(event, updateStrategySchema);
    const strategy = await strategyRepo.update(strategyId, body);

    logger.info('Strategy updated', { strategyId });

    return createApiResponse(200, { strategy });
  } catch (error) {
    logger.error('Update strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to update strategy',
    });
  }
}

/**
 * Delete strategy
 */
export async function deleteStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    await strategyRepo.delete(strategyId);

    logger.info('Strategy deleted', { strategyId });

    return createApiResponse(204, null);
  } catch (error) {
    logger.error('Delete strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to delete strategy',
    });
  }
}

/**
 * Toggle strategy enabled status
 */
export async function toggleStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    const strategy = await strategyRepo.toggleEnabled(strategyId);

    logger.info('Strategy toggled', { strategyId, enabled: strategy.enabled });

    return createApiResponse(200, { strategy });
  } catch (error) {
    logger.error('Toggle strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to toggle strategy',
    });
  }
}

/**
 * Test strategy on a symbol
 */
export async function testStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    const body = JSON.parse(event.body || '{}');
    const symbol = body.symbol;

    if (!symbol) {
      return createApiResponse(400, { error: 'Symbol required' });
    }

    const signal = await strategyService.testStrategy(strategyId, symbol);

    return createApiResponse(200, { signal });
  } catch (error) {
    logger.error('Test strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to test strategy',
    });
  }
}

/**
 * Execute strategy (generate signals and optionally execute trades)
 */
export async function executeStrategy(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const strategyId = getPathParam(event, 'id');
    const body = JSON.parse(event.body || '{}');
    const executeTrades = body.executeTrades === true;

    // Generate signals
    const signals = await strategyService.generateSignals(strategyId);

    // Optionally execute trades
    let trades: Trade[] = [];
    if (executeTrades) {
      const strategy = await strategyRepo.findByIdOrThrow(strategyId);
      trades = await tradingService.executeSignals(
        strategy.portfolioId,
        strategyId,
        signals
      );
    }

    return createApiResponse(200, {
      signals,
      trades: executeTrades ? trades : undefined,
    });
  } catch (error) {
    logger.error('Execute strategy error', error);
    return createApiResponse(500, {
      error: 'Failed to execute strategy',
    });
  }
}
