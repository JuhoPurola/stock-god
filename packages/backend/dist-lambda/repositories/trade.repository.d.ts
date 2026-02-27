/**
 * Trade repository - database access layer
 */
import type { Trade, TradeWithDetails, OrderSide, OrderType, OrderStatus, Signal } from '@stock-picker/shared';
import type pg from 'pg';
export declare class TradeRepository {
    /**
     * Create a new trade
     */
    create(portfolioId: string, strategyId: string | undefined, symbol: string, side: OrderSide, quantity: number, price: number, orderType: OrderType, status: OrderStatus, signal?: Signal, brokerOrderId?: string, client?: pg.PoolClient): Promise<Trade>;
    /**
     * Get trade by ID
     */
    findById(id: string): Promise<Trade | null>;
    /**
     * Get trade by ID or throw
     */
    findByIdOrThrow(id: string): Promise<Trade>;
    /**
     * Get trade by broker order ID
     */
    findByBrokerOrderId(brokerOrderId: string): Promise<Trade | null>;
    /**
     * Get all trades for a portfolio
     */
    findByPortfolioId(portfolioId: string, limit?: number): Promise<Trade[]>;
    /**
     * Get trades with details (including portfolio and strategy names)
     */
    findByPortfolioIdWithDetails(portfolioId: string, limit?: number): Promise<TradeWithDetails[]>;
    /**
     * Get trades for a strategy
     */
    findByStrategyId(strategyId: string, limit?: number): Promise<Trade[]>;
    /**
     * Get trades for a symbol
     */
    findBySymbol(portfolioId: string, symbol: string, limit?: number): Promise<Trade[]>;
    /**
     * Update trade status
     */
    updateStatus(id: string, status: OrderStatus, executedAt?: Date, client?: pg.PoolClient): Promise<Trade>;
    /**
     * Update trade with broker order ID
     */
    updateBrokerOrderId(id: string, brokerOrderId: string, client?: pg.PoolClient): Promise<Trade>;
    /**
     * Get pending trades
     */
    findPending(portfolioId?: string): Promise<Trade[]>;
    /**
     * Map database row to Trade object
     */
    private mapToTrade;
}
//# sourceMappingURL=trade.repository.d.ts.map