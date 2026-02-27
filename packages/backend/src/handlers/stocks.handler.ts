/**
 * Stock API handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StockRepository } from '../repositories/index.js';
import { alpacaClient } from '../integrations/alpaca/client.js';
import { createApiResponse, getQueryParam, getPathParam } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';

const stockRepo = new StockRepository();

/**
 * List all tradable stocks
 */
export async function listStocks(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const limit = parseInt(getQueryParam(event, 'limit', '100') || '100');
    const stocks = await stockRepo.findTradable(limit);

    return createApiResponse(200, { stocks });
  } catch (error) {
    logger.error('List stocks error', error);
    return createApiResponse(500, {
      error: 'Failed to list stocks',
    });
  }
}

/**
 * Search stocks
 */
export async function searchStocks(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const query = getQueryParam(event, 'q', '');
    const limit = parseInt(getQueryParam(event, 'limit', '10') || '10');

    if (!query) {
      return createApiResponse(400, { error: 'Query parameter "q" required' });
    }

    const stocks = await stockRepo.search(query, limit);

    return createApiResponse(200, { stocks });
  } catch (error) {
    logger.error('Search stocks error', error);
    return createApiResponse(500, {
      error: 'Failed to search stocks',
    });
  }
}

/**
 * Get stock by symbol
 */
export async function getStock(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const symbol = getPathParam(event, 'symbol');
    const stock = await stockRepo.findBySymbol(symbol);

    if (!stock) {
      return createApiResponse(404, { error: 'Stock not found' });
    }

    return createApiResponse(200, { stock });
  } catch (error) {
    logger.error('Get stock error', error);
    return createApiResponse(500, {
      error: 'Failed to get stock',
    });
  }
}

/**
 * Get current quote for a stock
 */
export async function getQuote(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const symbol = getPathParam(event, 'symbol');

    // Verify stock exists
    const stock = await stockRepo.findBySymbol(symbol);
    if (!stock) {
      return createApiResponse(404, { error: 'Stock not found' });
    }

    // Get latest quote from Alpaca (or demo mode)
    const quote = await alpacaClient.getLatestQuote(symbol);

    logger.info('Quote fetched', { symbol, quote });

    const currentPrice = (quote.ask_price + quote.bid_price) / 2;

    return createApiResponse(200, {
      symbol,
      currentPrice,
      askPrice: quote.ask_price,
      bidPrice: quote.bid_price,
      timestamp: quote.timestamp,
    });
  } catch (error) {
    logger.error('Get quote error', error);
    return createApiResponse(500, {
      error: 'Failed to get quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get price history for a stock
 */
export async function getPriceHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const symbol = getPathParam(event, 'symbol');
    const startDate = getQueryParam(event, 'startDate');
    const endDate = getQueryParam(event, 'endDate');

    if (!startDate || !endDate) {
      return createApiResponse(400, {
        error: 'startDate and endDate query parameters required',
      });
    }

    const prices = await stockRepo.getPriceHistory(
      symbol,
      new Date(startDate),
      new Date(endDate)
    );

    return createApiResponse(200, { symbol, prices });
  } catch (error) {
    logger.error('Get price history error', error);
    return createApiResponse(500, {
      error: 'Failed to get price history',
    });
  }
}
