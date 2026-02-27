/**
 * Analytics Service
 * Advanced portfolio performance metrics and risk analysis
 */

import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export interface PerformanceMetrics {
  portfolioId: string;
  periodStart: Date;
  periodEnd: Date;

  // Basic returns
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;

  // Risk metrics
  volatility: number;
  downsideDeviation: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;

  // Risk-adjusted returns
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;

  // Value at Risk
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;

  // Trading metrics
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
}

export class AnalyticsService {
  constructor(private pool: Pool) {}

  /**
   * Calculate comprehensive performance metrics for a portfolio
   */
  async calculatePortfolioMetrics(
    portfolioId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    logger.info('Calculating portfolio metrics', { portfolioId, startDate, endDate });

    // Get portfolio snapshots for the period
    const snapshots = await this.getPortfolioSnapshots(portfolioId, startDate, endDate);

    if (snapshots.length < 2) {
      throw new Error('Insufficient data for performance calculation (need at least 2 snapshots)');
    }

    // Get trades for the period
    const trades = await this.getPortfolioTrades(portfolioId, startDate, endDate);

    // Calculate daily returns
    const dailyReturns = this.calculateDailyReturns(snapshots);

    // Calculate all metrics
    const totalReturn = this.calculateTotalReturn(snapshots);
    const totalReturnPercent = this.calculateTotalReturnPercent(snapshots);
    const annualizedReturn = this.calculateAnnualizedReturn(totalReturnPercent, snapshots.length);
    const volatility = this.calculateVolatility(dailyReturns);
    const downsideDeviation = this.calculateDownsideDeviation(dailyReturns);
    const { maxDrawdown, maxDrawdownPercent } = this.calculateMaxDrawdown(snapshots);
    const sharpeRatio = this.calculateSharpeRatio(annualizedReturn, volatility);
    const sortinoRatio = this.calculateSortinoRatio(annualizedReturn, downsideDeviation);
    const calmarRatio = this.calculateCalmarRatio(annualizedReturn, maxDrawdownPercent);
    const { var95, var99 } = this.calculateVaR(dailyReturns);
    const { cvar95, cvar99 } = this.calculateCVaR(dailyReturns);
    const tradingMetrics = this.calculateTradingMetrics(trades);

    const metrics: PerformanceMetrics = {
      portfolioId,
      periodStart: startDate,
      periodEnd: endDate,
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      volatility,
      downsideDeviation,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      var95,
      var99,
      cvar95,
      cvar99,
      ...tradingMetrics,
    };

    logger.info('Portfolio metrics calculated', {
      portfolioId,
      sharpeRatio,
      sortinoRatio,
      maxDrawdownPercent,
    });

    return metrics;
  }

  /**
   * Save metrics to database
   */
  async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    await this.pool.query(
      `INSERT INTO portfolio_performance_metrics (
        portfolio_id, period_start, period_end,
        total_return, total_return_percent, annualized_return,
        volatility, downside_deviation, max_drawdown, max_drawdown_percent,
        sharpe_ratio, sortino_ratio, calmar_ratio,
        var_95, var_99, cvar_95, cvar_99,
        total_trades, win_rate, profit_factor, average_trade
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (portfolio_id, period_start, period_end) DO UPDATE
      SET total_return = $4,
          total_return_percent = $5,
          annualized_return = $6,
          volatility = $7,
          downside_deviation = $8,
          max_drawdown = $9,
          max_drawdown_percent = $10,
          sharpe_ratio = $11,
          sortino_ratio = $12,
          calmar_ratio = $13,
          var_95 = $14,
          var_99 = $15,
          cvar_95 = $16,
          cvar_99 = $17,
          total_trades = $18,
          win_rate = $19,
          profit_factor = $20,
          average_trade = $21`,
      [
        metrics.portfolioId,
        metrics.periodStart,
        metrics.periodEnd,
        metrics.totalReturn,
        metrics.totalReturnPercent,
        metrics.annualizedReturn,
        metrics.volatility,
        metrics.downsideDeviation,
        metrics.maxDrawdown,
        metrics.maxDrawdownPercent,
        metrics.sharpeRatio,
        metrics.sortinoRatio,
        metrics.calmarRatio,
        metrics.var95,
        metrics.var99,
        metrics.cvar95,
        metrics.cvar99,
        metrics.totalTrades,
        metrics.winRate,
        metrics.profitFactor,
        metrics.averageTrade,
      ]
    );
  }

  /**
   * Get portfolio snapshots for a period
   */
  private async getPortfolioSnapshots(
    portfolioId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ timestamp: Date; totalValue: number }>> {
    const result = await this.pool.query(
      `SELECT timestamp, total_value AS "totalValue"
       FROM portfolio_snapshots
       WHERE portfolio_id = $1
         AND timestamp >= $2
         AND timestamp <= $3
       ORDER BY timestamp ASC`,
      [portfolioId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      timestamp: new Date(row.timestamp),
      totalValue: parseFloat(row.totalValue),
    }));
  }

  /**
   * Get portfolio trades for a period
   */
  private async getPortfolioTrades(
    portfolioId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ pnl: number; status: string }>> {
    const result = await this.pool.query(
      `SELECT
         (price - executed_price) * quantity AS pnl,
         status
       FROM trades
       WHERE portfolio_id = $1
         AND executed_at >= $2
         AND executed_at <= $3
         AND status = 'filled'
       ORDER BY executed_at ASC`,
      [portfolioId, startDate, endDate]
    );

    return result.rows.map((row) => ({
      pnl: parseFloat(row.pnl) || 0,
      status: row.status,
    }));
  }

  /**
   * Calculate daily returns from snapshots
   */
  private calculateDailyReturns(
    snapshots: Array<{ timestamp: Date; totalValue: number }>
  ): number[] {
    const returns: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = snapshots[i - 1]!.totalValue;
      const currValue = snapshots[i]!.totalValue;

      if (prevValue > 0) {
        const dailyReturn = (currValue - prevValue) / prevValue;
        returns.push(dailyReturn);
      }
    }

    return returns;
  }

  /**
   * Calculate total return in dollars
   */
  private calculateTotalReturn(
    snapshots: Array<{ timestamp: Date; totalValue: number }>
  ): number {
    if (snapshots.length < 2) return 0;
    const initialValue = snapshots[0]!.totalValue;
    const finalValue = snapshots[snapshots.length - 1]!.totalValue;
    return finalValue - initialValue;
  }

  /**
   * Calculate total return as percentage
   */
  private calculateTotalReturnPercent(
    snapshots: Array<{ timestamp: Date; totalValue: number }>
  ): number {
    if (snapshots.length < 2) return 0;
    const initialValue = snapshots[0]!.totalValue;
    const finalValue = snapshots[snapshots.length - 1]!.totalValue;

    if (initialValue === 0) return 0;
    return ((finalValue - initialValue) / initialValue) * 100;
  }

  /**
   * Calculate annualized return
   */
  private calculateAnnualizedReturn(totalReturnPercent: number, days: number): number {
    if (days === 0) return 0;
    const years = days / 365;
    return Math.pow(1 + totalReturnPercent / 100, 1 / years) - 1;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / returns.length;
    const dailyVolatility = Math.sqrt(variance);

    // Annualize volatility
    return dailyVolatility * Math.sqrt(252); // 252 trading days
  }

  /**
   * Calculate downside deviation (volatility of negative returns)
   */
  private calculateDownsideDeviation(returns: number[]): number {
    if (returns.length < 2) return 0;

    const negativeReturns = returns.filter((r) => r < 0);
    if (negativeReturns.length === 0) return 0;

    const mean = negativeReturns.reduce((sum, r) => sum + r, 0) / negativeReturns.length;
    const squaredDiffs = negativeReturns.map((r) => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / negativeReturns.length;
    const dailyDownsideDeviation = Math.sqrt(variance);

    // Annualize downside deviation
    return dailyDownsideDeviation * Math.sqrt(252);
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(
    snapshots: Array<{ timestamp: Date; totalValue: number }>
  ): { maxDrawdown: number; maxDrawdownPercent: number } {
    if (snapshots.length < 2) {
      return { maxDrawdown: 0, maxDrawdownPercent: 0 };
    }

    let maxValue = snapshots[0]!.totalValue;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const snapshot of snapshots) {
      if (snapshot.totalValue > maxValue) {
        maxValue = snapshot.totalValue;
      }

      const drawdown = maxValue - snapshot.totalValue;
      const drawdownPercent = maxValue > 0 ? (drawdown / maxValue) * 100 : 0;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    return { maxDrawdown, maxDrawdownPercent };
  }

  /**
   * Calculate Sharpe Ratio (risk-adjusted return)
   * Assumes risk-free rate of 2% (can be parameterized)
   */
  private calculateSharpeRatio(annualizedReturn: number, volatility: number): number {
    if (volatility === 0) return 0;
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    return (annualizedReturn - riskFreeRate) / volatility;
  }

  /**
   * Calculate Sortino Ratio (like Sharpe but uses downside deviation)
   */
  private calculateSortinoRatio(
    annualizedReturn: number,
    downsideDeviation: number
  ): number {
    if (downsideDeviation === 0) return 0;
    const riskFreeRate = 0.02;
    return (annualizedReturn - riskFreeRate) / downsideDeviation;
  }

  /**
   * Calculate Calmar Ratio (return / max drawdown)
   */
  private calculateCalmarRatio(
    annualizedReturn: number,
    maxDrawdownPercent: number
  ): number {
    if (maxDrawdownPercent === 0) return 0;
    return (annualizedReturn * 100) / maxDrawdownPercent;
  }

  /**
   * Calculate Value at Risk (VaR) at 95% and 99% confidence
   */
  private calculateVaR(returns: number[]): { var95: number; var99: number } {
    if (returns.length < 2) {
      return { var95: 0, var99: 0 };
    }

    const sortedReturns = [...returns].sort((a, b) => a - b);

    // VaR at 95% confidence (5th percentile)
    const var95Index = Math.floor(returns.length * 0.05);
    const var95 = sortedReturns[var95Index] || 0;

    // VaR at 99% confidence (1st percentile)
    const var99Index = Math.floor(returns.length * 0.01);
    const var99 = sortedReturns[var99Index] || 0;

    return { var95, var99 };
  }

  /**
   * Calculate Conditional Value at Risk (CVaR / Expected Shortfall)
   */
  private calculateCVaR(returns: number[]): { cvar95: number; cvar99: number } {
    if (returns.length < 2) {
      return { cvar95: 0, cvar99: 0 };
    }

    const sortedReturns = [...returns].sort((a, b) => a - b);

    // CVaR at 95%: average of worst 5% returns
    const cvar95Count = Math.floor(returns.length * 0.05);
    const cvar95Returns = sortedReturns.slice(0, cvar95Count);
    const cvar95 = cvar95Returns.length > 0
      ? cvar95Returns.reduce((sum, r) => sum + r, 0) / cvar95Returns.length
      : 0;

    // CVaR at 99%: average of worst 1% returns
    const cvar99Count = Math.floor(returns.length * 0.01);
    const cvar99Returns = sortedReturns.slice(0, cvar99Count);
    const cvar99 = cvar99Returns.length > 0
      ? cvar99Returns.reduce((sum, r) => sum + r, 0) / cvar99Returns.length
      : 0;

    return { cvar95, cvar99 };
  }

  /**
   * Calculate trading metrics (win rate, profit factor, etc.)
   */
  private calculateTradingMetrics(
    trades: Array<{ pnl: number; status: string }>
  ): {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    averageTrade: number;
  } {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        averageTrade: 0,
      };
    }

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const winRate = (winningTrades.length / trades.length) * 100;

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const averageTrade = totalPnL / trades.length;

    return {
      totalTrades: trades.length,
      winRate,
      profitFactor,
      averageTrade,
    };
  }
}
