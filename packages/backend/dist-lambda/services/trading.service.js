/**
 * Trading service - handles trade execution via Alpaca
 */
import { OrderStatus, OrderSide, OrderType } from '@stock-picker/shared';
import { alpacaClient } from '../integrations/alpaca/client.js';
import { PortfolioRepository, PositionRepository, TradeRepository, StockRepository, } from '../repositories/index.js';
import { transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import * as websocketService from './websocket.service.js';
export class TradingService {
    portfolioRepo = new PortfolioRepository();
    positionRepo = new PositionRepository();
    tradeRepo = new TradeRepository();
    stockRepo = new StockRepository();
    /**
     * Execute a trade (manual or signal-based)
     */
    async executeTrade(portfolioId, symbol, side, quantity, orderType = OrderType.MARKET, limitPrice, stopPrice, strategyId, signal) {
        // Validate portfolio
        const portfolio = await this.portfolioRepo.findByIdOrThrow(portfolioId);
        // Validate stock exists
        const stock = await this.stockRepo.findBySymbol(symbol);
        if (!stock) {
            throw new ValidationError(`Stock ${symbol} not found`);
        }
        if (!stock.tradable) {
            throw new ValidationError(`Stock ${symbol} is not tradable`);
        }
        // Get current price
        const quote = await alpacaClient.getLatestQuote(symbol);
        const currentPrice = (quote.ask_price + quote.bid_price) / 2;
        // Validate sufficient funds for buy orders
        if (side === OrderSide.BUY) {
            const estimatedCost = quantity * currentPrice;
            if (portfolio.cashBalance < estimatedCost) {
                throw new ValidationError(`Insufficient funds. Need $${estimatedCost.toFixed(2)}, have $${portfolio.cashBalance.toFixed(2)}`);
            }
        }
        // Validate sufficient position for sell orders
        if (side === OrderSide.SELL) {
            const position = await this.positionRepo.findByPortfolioAndSymbol(portfolioId, symbol);
            if (!position || position.quantity < quantity) {
                throw new ValidationError(`Insufficient position. Need ${quantity} shares, have ${position?.quantity || 0}`);
            }
        }
        // Execute trade in transaction
        return transaction(async (client) => {
            // Create trade record
            const trade = await this.tradeRepo.create(portfolioId, strategyId, symbol, side, quantity, currentPrice, orderType, OrderStatus.PENDING, signal, undefined, client);
            try {
                // Submit order to Alpaca
                let alpacaOrder;
                switch (orderType) {
                    case OrderType.MARKET:
                        alpacaOrder = await alpacaClient.submitMarketOrder(symbol, side, quantity);
                        break;
                    case 'limit':
                        if (!limitPrice) {
                            throw new ValidationError('Limit price required for limit orders');
                        }
                        alpacaOrder = await alpacaClient.submitLimitOrder(symbol, side, quantity, limitPrice);
                        break;
                    case 'stop':
                        if (!stopPrice) {
                            throw new ValidationError('Stop price required for stop orders');
                        }
                        alpacaOrder = await alpacaClient.submitStopOrder(symbol, side, quantity, stopPrice);
                        break;
                    case 'stop_limit':
                        if (!limitPrice || !stopPrice) {
                            throw new ValidationError('Limit and stop price required for stop-limit orders');
                        }
                        alpacaOrder = await alpacaClient.submitStopLimitOrder(symbol, side, quantity, stopPrice, limitPrice);
                        break;
                    default:
                        throw new ValidationError(`Unsupported order type: ${orderType}`);
                }
                // Update trade with broker order ID
                await this.tradeRepo.updateBrokerOrderId(trade.id, alpacaOrder.id, client);
                // For market orders, assume immediate execution
                // In production, would poll Alpaca for order status
                if (orderType === OrderType.MARKET) {
                    const filledPrice = alpacaOrder.filled_avg_price
                        ? parseFloat(alpacaOrder.filled_avg_price)
                        : currentPrice;
                    // Update position
                    await this.updatePositionAfterTrade(portfolioId, symbol, side, quantity, filledPrice, client);
                    // Update portfolio cash
                    const cashChange = side === 'buy' ? -quantity * filledPrice : quantity * filledPrice;
                    await this.portfolioRepo.updateCashBalance(portfolioId, cashChange, client);
                    // Mark trade as filled
                    await this.tradeRepo.updateStatus(trade.id, OrderStatus.FILLED, new Date(), client);
                }
                else {
                    // Update status to submitted for non-market orders
                    await this.tradeRepo.updateStatus(trade.id, OrderStatus.SUBMITTED, undefined, client);
                }
                logger.info('Trade executed successfully', {
                    tradeId: trade.id,
                    brokerOrderId: alpacaOrder.id,
                    symbol,
                    side,
                    quantity,
                });
                // Calculate executed price (use filled price from broker or fallback to current price)
                const filledPrice = alpacaOrder.filled_avg_price
                    ? parseFloat(alpacaOrder.filled_avg_price)
                    : currentPrice;
                // Return updated trade with the changes we made
                const updatedTrade = {
                    ...trade,
                    brokerOrderId: alpacaOrder.id,
                    status: orderType === OrderType.MARKET ? OrderStatus.FILLED : OrderStatus.SUBMITTED,
                    executedAt: orderType === OrderType.MARKET ? new Date() : undefined,
                    executedPrice: orderType === OrderType.MARKET ? filledPrice : undefined,
                };
                // Broadcast trade execution via WebSocket (non-blocking)
                if (websocketService.isWebSocketEnabled()) {
                    websocketService.sendTradeExecuted(portfolioId, updatedTrade).catch(err => logger.error('Failed to broadcast trade execution', err));
                }
                return updatedTrade;
            }
            catch (error) {
                // Update trade status to rejected
                await this.tradeRepo.updateStatus(trade.id, OrderStatus.REJECTED, undefined, client);
                logger.error('Trade execution failed', { tradeId: trade.id, error });
                throw error;
            }
        });
    }
    /**
     * Execute trades from signals
     */
    async executeSignals(portfolioId, strategyId, signals) {
        const portfolio = await this.portfolioRepo.findByIdOrThrow(portfolioId);
        const trades = [];
        for (const signal of signals) {
            try {
                // Skip HOLD signals
                if (signal.type === 'HOLD') {
                    continue;
                }
                // Determine order side
                const side = signal.type === 'BUY' ? OrderSide.BUY : OrderSide.SELL;
                // Calculate position size for buy orders
                let quantity;
                if (side === OrderSide.BUY) {
                    const quote = await alpacaClient.getLatestQuote(signal.symbol);
                    const currentPrice = (quote.ask_price + quote.bid_price) / 2;
                    // Get strategy risk management config
                    // For now, use a simple 10% position size
                    const maxPositionSize = portfolio.cashBalance * 0.1;
                    quantity = Math.floor(maxPositionSize / currentPrice);
                    if (quantity === 0) {
                        logger.warn('Insufficient funds for position', {
                            symbol: signal.symbol,
                            maxPositionSize,
                            currentPrice,
                        });
                        continue;
                    }
                }
                else {
                    // For sell orders, sell entire position
                    const position = await this.positionRepo.findByPortfolioAndSymbol(portfolioId, signal.symbol);
                    if (!position) {
                        logger.warn('No position to sell', { symbol: signal.symbol });
                        continue;
                    }
                    quantity = position.quantity;
                }
                // Execute trade
                const trade = await this.executeTrade(portfolioId, signal.symbol, side, quantity, OrderType.MARKET, undefined, undefined, strategyId, signal);
                trades.push(trade);
            }
            catch (error) {
                logger.error('Failed to execute signal', {
                    signal,
                    error,
                });
                // Continue with other signals even if one fails
            }
        }
        return trades;
    }
    /**
     * Update position after trade execution
     */
    async updatePositionAfterTrade(portfolioId, symbol, side, quantity, price, client) {
        const quantityChange = side === OrderSide.BUY ? quantity : -quantity;
        return this.positionRepo.updateAfterTrade(portfolioId, symbol, quantityChange, price, client);
    }
    /**
     * Sync positions with Alpaca
     */
    async syncPositions(portfolioId) {
        const portfolio = await this.portfolioRepo.findByIdOrThrow(portfolioId);
        // Get positions from Alpaca
        const alpacaPositions = await alpacaClient.getPositions();
        // Update each position in database
        for (const alpacaPos of alpacaPositions) {
            const quantity = parseInt(alpacaPos.qty);
            const avgPrice = parseFloat(alpacaPos.avg_entry_price);
            const currentPrice = parseFloat(alpacaPos.current_price);
            await this.positionRepo.upsert(portfolioId, alpacaPos.symbol, quantity, avgPrice, currentPrice);
        }
        // Get account and update cash balance
        const account = await alpacaClient.getAccount();
        const cashBalance = parseFloat(account.cash);
        await this.portfolioRepo.update(portfolioId, {});
        // Note: Would need to add cash balance update method or use direct query
    }
    /**
     * Check order status and update trade
     */
    async checkOrderStatus(tradeId) {
        const trade = await this.tradeRepo.findByIdOrThrow(tradeId);
        if (!trade.brokerOrderId) {
            throw new ValidationError('Trade has no broker order ID');
        }
        // Get order from Alpaca
        const alpacaOrder = await alpacaClient.getOrder(trade.brokerOrderId);
        // Map status
        const status = alpacaClient.mapOrderStatus(alpacaOrder.status);
        // Update trade if status changed
        if (status !== trade.status) {
            const executedAt = alpacaOrder.filled_at ? new Date(alpacaOrder.filled_at) : undefined;
            await this.tradeRepo.updateStatus(trade.id, status, executedAt);
            // If filled, update position and cash
            if (status === OrderStatus.FILLED && alpacaOrder.filled_avg_price) {
                const filledPrice = parseFloat(alpacaOrder.filled_avg_price);
                const filledQty = parseFloat(alpacaOrder.filled_qty);
                await transaction(async (client) => {
                    await this.updatePositionAfterTrade(trade.portfolioId, trade.symbol, trade.side, filledQty, filledPrice, client);
                    const cashChange = trade.side === OrderSide.BUY
                        ? -filledQty * filledPrice
                        : filledQty * filledPrice;
                    await this.portfolioRepo.updateCashBalance(trade.portfolioId, cashChange, client);
                });
            }
        }
        return this.tradeRepo.findByIdOrThrow(tradeId);
    }
}
//# sourceMappingURL=trading.service.js.map