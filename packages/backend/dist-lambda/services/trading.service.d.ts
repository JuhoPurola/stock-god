/**
 * Trading service - handles trade execution via Alpaca
 */
import type { Trade, Signal } from '@stock-picker/shared';
import { OrderSide, OrderType } from '@stock-picker/shared';
export declare class TradingService {
    private portfolioRepo;
    private positionRepo;
    private tradeRepo;
    private stockRepo;
    /**
     * Execute a trade (manual or signal-based)
     */
    executeTrade(portfolioId: string, symbol: string, side: OrderSide, quantity: number, orderType?: OrderType, limitPrice?: number, stopPrice?: number, strategyId?: string, signal?: Signal): Promise<Trade>;
    /**
     * Execute trades from signals
     */
    executeSignals(portfolioId: string, strategyId: string, signals: Signal[]): Promise<Trade[]>;
    /**
     * Update position after trade execution
     */
    private updatePositionAfterTrade;
    /**
     * Sync positions with Alpaca
     */
    syncPositions(portfolioId: string): Promise<void>;
    /**
     * Check order status and update trade
     */
    checkOrderStatus(tradeId: string): Promise<Trade>;
}
//# sourceMappingURL=trading.service.d.ts.map