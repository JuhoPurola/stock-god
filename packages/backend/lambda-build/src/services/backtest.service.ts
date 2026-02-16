/**
 * Backtest Service - Simulates strategy performance on historical data
 */

import { logger } from '../utils/logger.js';
import type {
  Backtest,
  BacktestConfig,
  BacktestPortfolioState,
  BacktestPosition,
  BacktestSnapshot,
  BacktestTrade,
  StrategyPerformance,
  Signal,
  OrderSide,
} from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';
import { query } from '../config/database.js';

/**
 * Backtest Engine
 */
export class BacktestService {
  /**
   * Run a backtest for a strategy
   */
  async runBacktest(
    backtestId: string,
    config: BacktestConfig,
    strategyConfig: any
  ): Promise<StrategyPerformance> {
    logger.info('Starting backtest', {
      backtestId,
      startDate: config.startDate,
      endDate: config.endDate,
    });

    try {
      // Initialize portfolio state
      const portfolioState: BacktestPortfolioState = {
        cash: config.initialCash,
        positions: new Map(),
        totalValue: config.initialCash,
        dailyReturns: [],
        trades: [],
      };

      // Load historical price data
      const priceData = await this.loadHistoricalPrices(
        strategyConfig.stockUniverse,
        config.startDate,
        config.endDate
      );

      // Get trading days (sorted dates)
      const tradingDays = this.getTradingDays(priceData);
      const snapshots: BacktestSnapshot[] = [];

      logger.info('Loaded price data', {
        symbols: strategyConfig.stockUniverse.length,
        tradingDays: tradingDays.length,
      });

      // Iterate through each trading day
      for (const date of tradingDays) {
        // Update position prices with current day's prices
        this.updatePositionPrices(portfolioState, priceData, date);

        // Generate signals from strategy
        const signals = await this.generateSignals(
          strategyConfig,
          priceData,
          date
        );

        // Execute trades based on signals
        for (const signal of signals) {
          await this.executeBacktestTrade(
            backtestId,
            portfolioState,
            signal,
            priceData,
            date,
            config
          );
        }

        // Calculate daily snapshot
        const snapshot = this.calculateSnapshot(portfolioState, date);
        snapshots.push(snapshot);
      }

      // Calculate final performance metrics
      const performance = this.calculatePerformanceMetrics(
        snapshots,
        portfolioState,
        config.initialCash
      );

      logger.info('Backtest completed', {
        backtestId,
        totalTrades: portfolioState.trades.length,
        finalValue: portfolioState.totalValue,
      });

      return performance;
    } catch (error) {
      logger.error('Backtest failed', { backtestId, error });
      throw error;
    }
  }

  /**
   * Load historical price data for symbols
   */
  private async loadHistoricalPrices(
    symbols: string[],
    startDate: string,
    endDate: string
  ): Promise<Map<string, Map<string, number>>> {
    const priceData = new Map<string, Map<string, number>>();

    for (const symbol of symbols) {
      const result = await query(
        `
        SELECT date, close
        FROM stock_prices
        WHERE symbol = $1
          AND date >= $2
          AND date <= $3
        ORDER BY date ASC
      `,
        [symbol, startDate, endDate]
      );

      const symbolPrices = new Map<string, number>();
      for (const row of result.rows) {
        symbolPrices.set(row.date.toISOString().split('T')[0], parseFloat(row.close));
      }

      priceData.set(symbol, symbolPrices);
    }

    return priceData;
  }

  /**
   * Get sorted list of trading days
   */
  private getTradingDays(
    priceData: Map<string, Map<string, number>>
  ): string[] {
    const datesSet = new Set<string>();

    // Collect all unique dates from all symbols
    for (const symbolPrices of priceData.values()) {
      for (const date of symbolPrices.keys()) {
        datesSet.add(date);
      }
    }

    // Sort dates chronologically
    return Array.from(datesSet).sort();
  }

  /**
   * Update position prices with current market prices
   */
  private updatePositionPrices(
    portfolioState: BacktestPortfolioState,
    priceData: Map<string, Map<string, number>>,
    date: string
  ): void {
    let positionsValue = 0;

    for (const [symbol, position] of portfolioState.positions) {
      const symbolPrices = priceData.get(symbol);
      if (symbolPrices) {
        const currentPrice = symbolPrices.get(date);
        if (currentPrice) {
          position.currentPrice = currentPrice;
          position.marketValue = position.quantity * currentPrice;
          position.unrealizedPnL = position.marketValue - position.costBasis;
          positionsValue += position.marketValue;
        }
      }
    }

    portfolioState.totalValue = portfolioState.cash + positionsValue;
  }

  /**
   * Generate trading signals from strategy (simplified for now)
   */
  private async generateSignals(
    strategyConfig: any,
    priceData: Map<string, Map<string, number>>,
    date: string
  ): Promise<Signal[]> {
    // TODO: Implement actual strategy evaluation
    // For now, return empty signals
    // This would normally evaluate factors and generate buy/sell signals
    return [];
  }

  /**
   * Execute a simulated trade in the backtest
   */
  private async executeBacktestTrade(
    backtestId: string,
    portfolioState: BacktestPortfolioState,
    signal: Signal,
    priceData: Map<string, Map<string, number>>,
    date: string,
    config: BacktestConfig
  ): Promise<void> {
    const symbolPrices = priceData.get(signal.symbol);
    if (!symbolPrices) return;

    const currentPrice = symbolPrices.get(date);
    if (!currentPrice) return;

    // Apply slippage
    const executionPrice =
      signal.action === 'buy'
        ? currentPrice * (1 + config.slippage)
        : currentPrice * (1 - config.slippage);

    // Calculate quantity (for now, use fixed amount)
    const tradeAmount = portfolioState.cash * 0.1; // 10% of cash
    const quantity = Math.floor(tradeAmount / executionPrice);

    if (quantity === 0) return;

    const side: OrderSide = signal.action === 'buy' ? 'buy' : 'sell';
    const amount = quantity * executionPrice + config.commission;

    if (side === 'buy') {
      if (amount > portfolioState.cash) return; // Not enough cash

      // Update cash
      portfolioState.cash -= amount;

      // Update or create position
      const existingPosition = portfolioState.positions.get(signal.symbol);
      if (existingPosition) {
        const newTotalCost =
          existingPosition.costBasis + quantity * executionPrice;
        const newTotalQuantity = existingPosition.quantity + quantity;
        existingPosition.quantity = newTotalQuantity;
        existingPosition.averagePrice = newTotalCost / newTotalQuantity;
        existingPosition.costBasis = newTotalCost;
        existingPosition.currentPrice = executionPrice;
        existingPosition.marketValue = newTotalQuantity * executionPrice;
        existingPosition.unrealizedPnL =
          existingPosition.marketValue - existingPosition.costBasis;
      } else {
        portfolioState.positions.set(signal.symbol, {
          symbol: signal.symbol,
          quantity,
          averagePrice: executionPrice,
          currentPrice: executionPrice,
          costBasis: quantity * executionPrice,
          marketValue: quantity * executionPrice,
          unrealizedPnL: 0,
        });
      }

      // Record trade
      await this.recordBacktestTrade(
        backtestId,
        date,
        signal,
        side,
        quantity,
        executionPrice,
        amount,
        null
      );
    } else {
      // Sell
      const position = portfolioState.positions.get(signal.symbol);
      if (!position || position.quantity < quantity) return; // Not enough shares

      const pnl =
        (executionPrice - position.averagePrice) * quantity - config.commission;

      // Update cash
      portfolioState.cash += quantity * executionPrice - config.commission;

      // Update position
      position.quantity -= quantity;
      position.marketValue = position.quantity * executionPrice;
      position.costBasis -= quantity * position.averagePrice;
      position.unrealizedPnL = position.marketValue - position.costBasis;

      if (position.quantity === 0) {
        portfolioState.positions.delete(signal.symbol);
      }

      // Record trade
      await this.recordBacktestTrade(
        backtestId,
        date,
        signal,
        side,
        quantity,
        executionPrice,
        amount,
        pnl
      );
    }
  }

  /**
   * Record backtest trade in database
   */
  private async recordBacktestTrade(
    backtestId: string,
    date: string,
    signal: Signal,
    side: OrderSide,
    quantity: number,
    price: number,
    amount: number,
    pnl: number | null
  ): Promise<void> {
    await query(
      `
      INSERT INTO backtest_trades (
        backtest_id, timestamp, symbol, side, quantity, price, amount, signal, pnl
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
      [
        backtestId,
        date,
        signal.symbol,
        side,
        quantity,
        price,
        amount,
        JSON.stringify(signal),
        pnl,
      ]
    );
  }

  /**
   * Calculate daily snapshot
   */
  private calculateSnapshot(
    portfolioState: BacktestPortfolioState,
    date: string
  ): BacktestSnapshot {
    let positionsValue = 0;
    for (const position of portfolioState.positions.values()) {
      positionsValue += position.marketValue;
    }

    const totalValue = portfolioState.cash + positionsValue;
    const previousValue =
      portfolioState.dailyReturns.length > 0
        ? portfolioState.dailyReturns[portfolioState.dailyReturns.length - 1]
        : totalValue;
    const dailyReturn = totalValue - previousValue;

    portfolioState.dailyReturns.push(totalValue);

    return {
      date: new Date(date),
      cash: portfolioState.cash,
      positionsValue,
      totalValue,
      dailyReturn,
      cumulativeReturn: totalValue - portfolioState.dailyReturns[0],
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    snapshots: BacktestSnapshot[],
    portfolioState: BacktestPortfolioState,
    initialCash: number
  ): StrategyPerformance {
    if (snapshots.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        profitFactor: 0,
        totalTrades: 0,
        avgTradeReturn: 0,
      };
    }

    const finalValue = snapshots[snapshots.length - 1].totalValue;
    const totalReturn = finalValue - initialCash;
    const totalReturnPercent = (totalReturn / initialCash) * 100;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = snapshots[0].totalValue;
    for (const snapshot of snapshots) {
      if (snapshot.totalValue > peak) {
        peak = snapshot.totalValue;
      }
      const drawdown = ((peak - snapshot.totalValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate Sharpe ratio (simplified - assumes daily returns)
    const returns = snapshots.map((s) => s.dailyReturn);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Win rate and profit factor from trades
    // TODO: Calculate from actual trade records
    const totalTrades = portfolioState.trades.length;

    return {
      totalReturn,
      totalReturnPercent,
      sharpeRatio,
      maxDrawdown,
      winRate: 0, // TODO
      profitFactor: 0, // TODO
      totalTrades,
      avgTradeReturn: totalTrades > 0 ? totalReturn / totalTrades : 0,
    };
  }
}

export const backtestService = new BacktestService();
