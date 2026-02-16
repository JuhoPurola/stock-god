/**
 * Portfolio repository - database access layer
 */

import type {
  Portfolio,
  PortfolioWithStats,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from '@stock-picker/shared';
import { query, transaction } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import type pg from 'pg';

export class PortfolioRepository {
  /**
   * Create a new portfolio
   */
  async create(
    userId: string,
    data: CreatePortfolioRequest
  ): Promise<Portfolio> {
    const result = await query<Portfolio>(
      `INSERT INTO portfolios (user_id, name, description, cash_balance, trading_mode)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, data.name, data.description, data.initialCash, data.tradingMode]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create portfolio');
    }

    return this.mapToPortfolio(result.rows[0]);
  }

  /**
   * Get portfolio by ID
   */
  async findById(id: string): Promise<Portfolio | null> {
    const result = await query<Portfolio>(
      'SELECT * FROM portfolios WHERE id = $1',
      [id]
    );

    return result.rows[0] ? this.mapToPortfolio(result.rows[0]) : null;
  }

  /**
   * Get portfolio by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<Portfolio> {
    const portfolio = await this.findById(id);
    if (!portfolio) {
      throw new NotFoundError('Portfolio', id);
    }
    return portfolio;
  }

  /**
   * Get portfolio with statistics
   */
  async findByIdWithStats(id: string): Promise<PortfolioWithStats | null> {
    const result = await query<any>(
      `SELECT
        p.*,
        COALESCE(SUM(pos.market_value), 0) AS positions_value,
        p.cash_balance + COALESCE(SUM(pos.market_value), 0) AS total_value,
        COALESCE(SUM(pos.unrealized_pnl), 0) AS unrealized_pnl,
        CASE
          WHEN p.cash_balance + COALESCE(SUM(pos.market_value), 0) > 0
          THEN (COALESCE(SUM(pos.unrealized_pnl), 0) / (p.cash_balance + COALESCE(SUM(pos.market_value), 0))) * 100
          ELSE 0
        END AS unrealized_pnl_percent,
        COUNT(pos.id) AS position_count
      FROM portfolios p
      LEFT JOIN positions pos ON p.id = pos.portfolio_id
      WHERE p.id = $1
      GROUP BY p.id`,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];

    // Get today's return from snapshots
    const snapshotResult = await query<any>(
      `SELECT daily_return, daily_return_percent
       FROM portfolio_snapshots
       WHERE portfolio_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [id]
    );

    const snapshot = snapshotResult.rows[0];

    return {
      ...this.mapToPortfolio(row),
      totalValue: parseFloat(row.total_value) || 0,
      positionsValue: parseFloat(row.positions_value) || 0,
      unrealizedPnL: parseFloat(row.unrealized_pnl) || 0,
      unrealizedPnLPercent: parseFloat(row.unrealized_pnl_percent) || 0,
      positionCount: parseInt(row.position_count) || 0,
      dayReturn: snapshot ? (parseFloat(snapshot.daily_return) || 0) : 0,
      dayReturnPercent: snapshot ? (parseFloat(snapshot.daily_return_percent) || 0) : 0,
    };
  }

  /**
   * Get all portfolios for a user
   */
  async findByUserId(userId: string): Promise<Portfolio[]> {
    const result = await query<Portfolio>(
      'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map((row) => this.mapToPortfolio(row));
  }

  /**
   * Get all portfolios with stats for a user
   */
  async findByUserIdWithStats(userId: string): Promise<PortfolioWithStats[]> {
    const result = await query<any>(
      `SELECT
        p.*,
        COALESCE(SUM(pos.market_value), 0) AS positions_value,
        p.cash_balance + COALESCE(SUM(pos.market_value), 0) AS total_value,
        COALESCE(SUM(pos.unrealized_pnl), 0) AS unrealized_pnl,
        CASE
          WHEN p.cash_balance + COALESCE(SUM(pos.market_value), 0) > 0
          THEN (COALESCE(SUM(pos.unrealized_pnl), 0) / (p.cash_balance + COALESCE(SUM(pos.market_value), 0))) * 100
          ELSE 0
        END AS unrealized_pnl_percent,
        COUNT(pos.id) AS position_count
      FROM portfolios p
      LEFT JOIN positions pos ON p.id = pos.portfolio_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...this.mapToPortfolio(row),
      totalValue: parseFloat(row.total_value) || 0,
      positionsValue: parseFloat(row.positions_value) || 0,
      unrealizedPnL: parseFloat(row.unrealized_pnl) || 0,
      unrealizedPnLPercent: parseFloat(row.unrealized_pnl_percent) || 0,
      positionCount: parseInt(row.position_count) || 0,
      dayReturn: 0, // Could be loaded from snapshots if needed
      dayReturnPercent: 0,
    }));
  }

  /**
   * Update portfolio
   */
  async update(
    id: string,
    data: UpdatePortfolioRequest
  ): Promise<Portfolio> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.tradingMode !== undefined) {
      updates.push(`trading_mode = $${paramIndex++}`);
      values.push(data.tradingMode);
    }

    if (updates.length === 0) {
      return this.findByIdOrThrow(id);
    }

    values.push(id);

    const result = await query<Portfolio>(
      `UPDATE portfolios
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new NotFoundError('Portfolio', id);
    }

    return this.mapToPortfolio(result.rows[0]);
  }

  /**
   * Update cash balance
   */
  async updateCashBalance(
    id: string,
    amount: number,
    client?: pg.PoolClient
  ): Promise<void> {
    const queryFn = client ? client.query.bind(client) : query;

    await queryFn(
      'UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE id = $2',
      [amount, id]
    );
  }

  /**
   * Delete portfolio
   */
  async delete(id: string): Promise<void> {
    const result = await query('DELETE FROM portfolios WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Portfolio', id);
    }
  }

  /**
   * Get all active portfolios with enabled strategies (for scheduled execution)
   */
  async findActivePortfolios(): Promise<
    Array<{ portfolio: Portfolio; strategyIds: string[] }>
  > {
    const result = await query<any>(
      `SELECT
        p.*,
        ARRAY_AGG(s.id) FILTER (WHERE s.enabled = true) AS strategy_ids
      FROM portfolios p
      INNER JOIN strategies s ON p.id = s.portfolio_id
      WHERE s.enabled = true
      GROUP BY p.id`
    );

    return result.rows.map((row) => ({
      portfolio: this.mapToPortfolio(row),
      strategyIds: row.strategy_ids || [],
    }));
  }

  /**
   * Map database row to Portfolio object
   */
  private mapToPortfolio(row: any): Portfolio {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      cashBalance: parseFloat(row.cash_balance) || 0,
      tradingMode: row.trading_mode,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
