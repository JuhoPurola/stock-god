/**
 * Backtest Service - Simulates strategy performance on historical data
 */
import type { BacktestConfig, StrategyPerformance, Strategy as StrategyConfig } from '@stock-picker/shared';
/**
 * Backtest Engine
 */
export declare class BacktestService {
    /**
     * Run a backtest for a strategy
     */
    runBacktest(backtestId: string, config: BacktestConfig, strategyConfig: StrategyConfig, options?: {
        skipDatabaseRecording?: boolean;
    }): Promise<StrategyPerformance>;
    /**
     * Load historical price data for symbols
     */
    private loadHistoricalPrices;
    /**
     * Get sorted list of trading days
     */
    private getTradingDays;
    /**
     * Update position prices with current market prices
     */
    private updatePositionPrices;
    /**
     * Generate trading signals from strategy
     */
    private generateSignals;
    /**
     * Execute a simulated trade in the backtest
     */
    private executeBacktestTrade;
    /**
     * Record backtest trade in database
     */
    private recordBacktestTrade;
    /**
     * Calculate daily snapshot
     */
    private calculateSnapshot;
    /**
     * Calculate performance metrics
     */
    private calculatePerformanceMetrics;
}
export declare const backtestService: BacktestService;
//# sourceMappingURL=backtest.service.d.ts.map