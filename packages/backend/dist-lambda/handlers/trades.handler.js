/**
 * Trade API handlers
 */
import { TradeRepository } from '../repositories/index.js';
import { TradingService } from '../services/index.js';
import { createApiResponse, parseBody, getPathParam, getQueryParam } from '../utils/api.utils.js';
import { executeTradeSchema } from '@stock-picker/shared';
import { logger } from '../utils/logger.js';
const tradeRepo = new TradeRepository();
const tradingService = new TradingService();
/**
 * Get trades for a portfolio
 */
export async function listTrades(event) {
    try {
        const portfolioId = getPathParam(event, 'portfolioId');
        const limit = parseInt(getQueryParam(event, 'limit', '100') || '100');
        const trades = await tradeRepo.findByPortfolioIdWithDetails(portfolioId, limit);
        return createApiResponse(200, { trades });
    }
    catch (error) {
        logger.error('List trades error', error);
        return createApiResponse(500, {
            error: 'Failed to list trades',
        });
    }
}
/**
 * Get trade by ID
 */
export async function getTrade(event) {
    try {
        const tradeId = getPathParam(event, 'id');
        const trade = await tradeRepo.findById(tradeId);
        if (!trade) {
            return createApiResponse(404, { error: 'Trade not found' });
        }
        return createApiResponse(200, { trade });
    }
    catch (error) {
        logger.error('Get trade error', error);
        return createApiResponse(500, {
            error: 'Failed to get trade',
        });
    }
}
/**
 * Execute a manual trade
 */
export async function executeTrade(event) {
    try {
        const body = parseBody(event, executeTradeSchema);
        const trade = await tradingService.executeTrade(body.portfolioId, body.symbol, body.side, body.quantity, body.orderType, body.limitPrice);
        logger.info('Manual trade executed', { tradeId: trade.id });
        return createApiResponse(201, { trade });
    }
    catch (error) {
        logger.error('Execute trade error', error);
        // Return validation errors with details
        if (error.statusCode === 400 || error.name === 'ValidationError') {
            return createApiResponse(400, {
                error: error.message,
                details: error.details,
            });
        }
        // Return user-friendly error message
        return createApiResponse(500, {
            error: 'Failed to execute trade',
            message: error.message || 'An unexpected error occurred',
        });
    }
}
/**
 * Check order status
 */
export async function checkOrderStatus(event) {
    try {
        const tradeId = getPathParam(event, 'id');
        const trade = await tradingService.checkOrderStatus(tradeId);
        return createApiResponse(200, { trade });
    }
    catch (error) {
        logger.error('Check order status error', error);
        return createApiResponse(500, {
            error: 'Failed to check order status',
        });
    }
}
//# sourceMappingURL=trades.handler.js.map