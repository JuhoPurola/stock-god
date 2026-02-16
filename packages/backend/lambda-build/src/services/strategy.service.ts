/**
 * Strategy service - handles strategy execution and signal generation
 */

import type {
  Strategy as StrategyConfig,
  Signal,
  EvaluationContext,
  PriceBar,
} from '@stock-picker/shared';
import { MomentumStrategy } from '@stock-picker/algorithm-engine';
import { StrategyRepository, StockRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import { NotFoundError } from '../utils/errors.js';

export class StrategyService {
  private strategyRepo = new StrategyRepository();
  private stockRepo = new StockRepository();

  /**
   * Generate signals for a strategy
   */
  async generateSignals(strategyId: string): Promise<Signal[]> {
    const strategyConfig = await this.strategyRepo.findByIdOrThrow(strategyId);

    if (!strategyConfig.enabled) {
      throw new Error('Strategy is disabled');
    }

    // Create strategy instance
    const strategy = new MomentumStrategy(strategyConfig);

    // Generate signals for stock universe
    const signals = await strategy.generateSignals(
      strategyConfig.stockUniverse,
      (symbol) => this.getEvaluationContext(symbol)
    );

    logger.info('Generated signals', {
      strategyId,
      symbolCount: strategyConfig.stockUniverse.length,
      signalCount: signals.length,
      buySignals: signals.filter((s) => s.type === 'BUY').length,
      sellSignals: signals.filter((s) => s.type === 'SELL').length,
      holdSignals: signals.filter((s) => s.type === 'HOLD').length,
    });

    return signals;
  }

  /**
   * Test a strategy on a single symbol
   */
  async testStrategy(strategyId: string, symbol: string): Promise<Signal> {
    const strategyConfig = await this.strategyRepo.findByIdOrThrow(strategyId);

    // Create strategy instance
    const strategy = new MomentumStrategy(strategyConfig);

    // Generate signal for single symbol
    const context = await this.getEvaluationContext(symbol);
    const signals = await strategy.generateSignals([symbol], async () => context);

    if (signals.length === 0) {
      throw new Error('Failed to generate signal');
    }

    return signals[0]!;
  }

  /**
   * Get evaluation context for a symbol
   */
  private async getEvaluationContext(symbol: string): Promise<EvaluationContext> {
    // Get historical prices (last 200 days for indicators)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 200);

    const historicalPrices = await this.stockRepo.getPriceHistory(
      symbol,
      startDate,
      endDate
    );

    if (historicalPrices.length === 0) {
      throw new NotFoundError(`Price data for ${symbol}`);
    }

    // Get latest price
    const latestPrice = historicalPrices[historicalPrices.length - 1];
    if (!latestPrice) {
      throw new NotFoundError(`Latest price for ${symbol}`);
    }

    return {
      symbol,
      timestamp: new Date(),
      currentPrice: latestPrice.close,
      historicalPrices,
      // Technical indicators could be pre-calculated and cached
      // For now, factors will calculate them on-demand
    };
  }

  /**
   * Execute all enabled strategies for a portfolio
   */
  async executePortfolioStrategies(portfolioId: string): Promise<{
    strategyId: string;
    signals: Signal[];
  }[]> {
    const strategies = await this.strategyRepo.findEnabledByPortfolioId(
      portfolioId
    );

    const results: Array<{ strategyId: string; signals: Signal[] }> = [];

    for (const strategy of strategies) {
      try {
        const signals = await this.generateSignals(strategy.id);
        results.push({
          strategyId: strategy.id,
          signals,
        });
      } catch (error) {
        logger.error('Failed to execute strategy', {
          strategyId: strategy.id,
          error,
        });
      }
    }

    return results;
  }
}
