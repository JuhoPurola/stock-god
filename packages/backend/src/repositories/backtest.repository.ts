/**
 * Backtest Repository - Database operations for backtests
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type {
  Backtest,
  BacktestTrade,
  BacktestConfig,
  CreateBacktestRequest,
  StrategyPerformance,
} from '@stock-picker/shared';
import { BacktestStatus } from '@stock-picker/shared';

export class BacktestRepository {
  /**
   * Create a new backtest
   */
  async create(userId: string, data: CreateBacktestRequest): Promise<Backtest> {
    const result = await query(
      `
      INSERT INTO backtests (user_id, name, config, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [userId, data.name || null, JSON.stringify(data.config), BacktestStatus.RUNNING]
    );

    return this.mapToBacktest(result.rows[0]);
  }

  /**
   * Find backtest by ID
   */
  async findById(id: string): Promise<Backtest | null> {
    const result = await query(
      `
      SELECT * FROM backtests WHERE id = $1
    `,
      [id]
    );

    return result.rows[0] ? this.mapToBacktest(result.rows[0]) : null;
  }

  /**
   * Find all backtests for a user
   */
  async findByUserId(userId: string, limit: number = 50): Promise<Backtest[]> {
    const result = await query(
      `
      SELECT * FROM backtests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
      [userId, limit]
    );

    return result.rows.map((row) => this.mapToBacktest(row));
  }

  /**
   * Find backtests for a portfolio (via config)
   */
  async findByPortfolioId(portfolioId: string): Promise<Backtest[]> {
    const result = await query(
      `
      SELECT * FROM backtests
      WHERE config->>'portfolioId' = $1
      ORDER BY created_at DESC
    `,
      [portfolioId]
    );

    return result.rows.map((row) => this.mapToBacktest(row));
  }

  /**
   * Update backtest status
   */
  async updateStatus(
    id: string,
    status: BacktestStatus,
    error?: string
  ): Promise<void> {
    await query(
      `
      UPDATE backtests
      SET status = $1,
          error = $2,
          completed_at = CASE
            WHEN $1 IN ('completed', 'failed') THEN NOW()
            ELSE completed_at
          END
      WHERE id = $3
    `,
      [status, error || null, id]
    );
  }

  /**
   * Update backtest performance
   */
  async updatePerformance(
    id: string,
    performance: StrategyPerformance
  ): Promise<void> {
    await query(
      `
      UPDATE backtests
      SET performance = $1,
          status = $2,
          completed_at = NOW()
      WHERE id = $3
    `,
      [JSON.stringify(performance), BacktestStatus.COMPLETED, id]
    );
  }

  /**
   * Get backtest trades
   */
  async findTradesByBacktestId(backtestId: string): Promise<BacktestTrade[]> {
    const result = await query(
      `
      SELECT * FROM backtest_trades
      WHERE backtest_id = $1
      ORDER BY timestamp ASC
    `,
      [backtestId]
    );

    return result.rows.map((row) => this.mapToBacktestTrade(row));
  }

  /**
   * Delete a backtest
   */
  async delete(id: string): Promise<void> {
    await query('DELETE FROM backtests WHERE id = $1', [id]);
    logger.info('Backtest deleted', { backtestId: id });
  }

  /**
   * Map database row to Backtest
   */
  private mapToBacktest(row: any): Backtest {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      config: row.config as BacktestConfig,
      status: row.status as BacktestStatus,
      performance: row.performance as StrategyPerformance | null,
      error: row.error,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    };
  }

  /**
   * Map database row to BacktestTrade
   */
  private mapToBacktestTrade(row: any): BacktestTrade {
    return {
      id: row.id.toString(),
      backtestId: row.backtest_id,
      timestamp: new Date(row.timestamp),
      symbol: row.symbol,
      side: row.side,
      quantity: parseInt(row.quantity),
      price: parseFloat(row.price),
      amount: parseFloat(row.amount),
      signal: row.signal,
      pnl: row.pnl ? parseFloat(row.pnl) : null,
      createdAt: new Date(row.created_at),
    };
  }
}
