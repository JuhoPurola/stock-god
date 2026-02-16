/**
 * Portfolio API handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PortfolioRepository, PositionRepository } from '../repositories/index.js';
import { createApiResponse, parseBody, getUserId } from '../utils/api.utils.js';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
} from '@stock-picker/shared';
import { logger } from '../utils/logger.js';

const portfolioRepo = new PortfolioRepository();
const positionRepo = new PositionRepository();

/**
 * Get all portfolios for user
 */
export async function listPortfolios(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const portfolios = await portfolioRepo.findByUserIdWithStats(userId);

    return createApiResponse(200, { portfolios });
  } catch (error) {
    logger.error('List portfolios error', error);
    return createApiResponse(500, {
      error: 'Failed to list portfolios',
    });
  }
}

/**
 * Get portfolio by ID
 */
export async function getPortfolio(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = event.pathParameters?.id;
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID required' });
    }

    const portfolio = await portfolioRepo.findByIdWithStats(portfolioId);
    if (!portfolio) {
      return createApiResponse(404, { error: 'Portfolio not found' });
    }

    return createApiResponse(200, { portfolio });
  } catch (error) {
    logger.error('Get portfolio error', error);
    return createApiResponse(500, {
      error: 'Failed to get portfolio',
    });
  }
}

/**
 * Create portfolio
 */
export async function createPortfolio(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = parseBody(event, createPortfolioSchema);

    const portfolio = await portfolioRepo.create(userId, body);

    logger.info('Portfolio created', { portfolioId: portfolio.id, userId });

    return createApiResponse(201, { portfolio });
  } catch (error) {
    logger.error('Create portfolio error', error);
    return createApiResponse(500, {
      error: 'Failed to create portfolio',
    });
  }
}

/**
 * Update portfolio
 */
export async function updatePortfolio(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = event.pathParameters?.id;
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID required' });
    }

    const body = parseBody(event, updatePortfolioSchema);
    const portfolio = await portfolioRepo.update(portfolioId, body);

    logger.info('Portfolio updated', { portfolioId });

    return createApiResponse(200, { portfolio });
  } catch (error) {
    logger.error('Update portfolio error', error);
    return createApiResponse(500, {
      error: 'Failed to update portfolio',
    });
  }
}

/**
 * Delete portfolio
 */
export async function deletePortfolio(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = event.pathParameters?.id;
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID required' });
    }

    await portfolioRepo.delete(portfolioId);

    logger.info('Portfolio deleted', { portfolioId });

    return createApiResponse(204, null);
  } catch (error) {
    logger.error('Delete portfolio error', error);
    return createApiResponse(500, {
      error: 'Failed to delete portfolio',
    });
  }
}

/**
 * Get portfolio positions
 */
export async function getPortfolioPositions(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = event.pathParameters?.id;
    if (!portfolioId) {
      return createApiResponse(400, { error: 'Portfolio ID required' });
    }

    const positions = await positionRepo.findByPortfolioIdWithDetails(portfolioId);

    return createApiResponse(200, { positions });
  } catch (error) {
    logger.error('Get portfolio positions error', error);
    return createApiResponse(500, {
      error: 'Failed to get positions',
    });
  }
}

/**
 * Delete a position
 */
export async function deletePosition(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const portfolioId = event.pathParameters?.id;
    const symbol = event.pathParameters?.symbol;

    if (!portfolioId || !symbol) {
      return createApiResponse(400, {
        error: 'Portfolio ID and symbol required',
      });
    }

    // Verify portfolio exists and user has access
    await portfolioRepo.findByIdOrThrow(portfolioId);

    // Check if position exists
    const position = await positionRepo.findByPortfolioAndSymbol(
      portfolioId,
      symbol
    );

    if (!position) {
      return createApiResponse(404, { error: 'Position not found' });
    }

    // Delete the position
    await positionRepo.delete(portfolioId, symbol);

    logger.info('Position deleted', { portfolioId, symbol });

    return createApiResponse(200, {
      message: 'Position deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete position error', error);

    if (error.statusCode === 404) {
      return createApiResponse(404, { error: error.message });
    }

    return createApiResponse(500, {
      error: 'Failed to delete position',
      message: error.message,
    });
  }
}
