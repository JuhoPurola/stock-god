/**
 * Strategy service - handles strategy execution and signal generation
 */
import type { Signal } from '@stock-picker/shared';
export declare class StrategyService {
    private strategyRepo;
    private stockRepo;
    /**
     * Generate signals for a strategy
     */
    generateSignals(strategyId: string): Promise<Signal[]>;
    /**
     * Test a strategy on a single symbol
     */
    testStrategy(strategyId: string, symbol: string): Promise<Signal>;
    /**
     * Get evaluation context for a symbol
     */
    private getEvaluationContext;
    /**
     * Execute all enabled strategies for a portfolio
     */
    executePortfolioStrategies(portfolioId: string): Promise<{
        strategyId: string;
        signals: Signal[];
    }[]>;
}
//# sourceMappingURL=strategy.service.d.ts.map