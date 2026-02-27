/**
 * Backtest Repository - Database operations for backtests
 */
import type { Backtest, BacktestTrade, CreateBacktestRequest, StrategyPerformance } from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';
export declare class BacktestRepository {
    /**
     * Create a new backtest
     */
    create(userId: string, data: CreateBacktestRequest): Promise<Backtest>;
    /**
     * Find backtest by ID
     */
    findById(id: string): Promise<Backtest | null>;
    /**
     * Find all backtests for a user
     */
    findByUserId(userId: string, limit?: number): Promise<Backtest[]>;
    /**
     * Find backtests for a portfolio (via config)
     */
    findByPortfolioId(portfolioId: string): Promise<Backtest[]>;
    /**
     * Update backtest status
     */
    updateStatus(id: string, status: BacktestStatus, error?: string): Promise<void>;
    /**
     * Update backtest performance
     */
    updatePerformance(id: string, performance: StrategyPerformance): Promise<void>;
    /**
     * Get backtest trades
     */
    findTradesByBacktestId(backtestId: string): Promise<BacktestTrade[]>;
    /**
     * Delete a backtest
     */
    delete(id: string): Promise<void>;
    /**
     * Map database row to Backtest
     */
    private mapToBacktest;
    /**
     * Map database row to BacktestTrade
     */
    private mapToBacktestTrade;
}
//# sourceMappingURL=backtest.repository.d.ts.map