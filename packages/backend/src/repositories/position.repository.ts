/**
 * Position repository - database access layer
 */

import type { Position, PositionWithDetails, Stock } from '@stock-picker/shared';
import { query, transaction } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import type pg from 'pg';

export class PositionRepository {
  /**
   * Create or update position
   */
  async upsert(
    portfolioId: string,
    symbol: string,
    quantity: number,
    averagePrice: number,
    currentPrice: number,
    client?: pg.PoolClient
  ): Promise<Position> {
    const marketValue = quantity * currentPrice;
    const costBasis = quantity * averagePrice;
    const unrealizedPnL = marketValue - costBasis;
    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

    const queryFn = client ? client.query.bind(client) : query;

    const result = await queryFn<any>(
      `INSERT INTO positions (
        portfolio_id, symbol, quantity, average_price, current_price,
        market_value, cost_basis, unrealized_pnl, unrealized_pnl_percent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (portfolio_id, symbol)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        average_price = EXCLUDED.average_price,
        current_price = EXCLUDED.current_price,
        market_value = EXCLUDED.market_value,
        cost_basis = EXCLUDED.cost_basis,
        unrealized_pnl = EXCLUDED.unrealized_pnl,
        unrealized_pnl_percent = EXCLUDED.unrealized_pnl_percent,
        updated_at = NOW()
      RETURNING *`,
      [
        portfolioId,
        symbol,
        quantity,
        averagePrice,
        currentPrice,
        marketValue,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to upsert position');
    }

    return this.mapToPosition(result.rows[0]);
  }

  /**
   * Get position by portfolio and symbol
   */
  async findByPortfolioAndSymbol(
    portfolioId: string,
    symbol: string
  ): Promise<Position | null> {
    const result = await query<any>(
      'SELECT * FROM positions WHERE portfolio_id = $1 AND symbol = $2',
      [portfolioId, symbol]
    );

    return result.rows[0] ? this.mapToPosition(result.rows[0]) : null;
  }

  /**
   * Get all positions for a portfolio
   */
  async findByPortfolioId(portfolioId: string): Promise<Position[]> {
    const result = await query<any>(
      'SELECT * FROM positions WHERE portfolio_id = $1 ORDER BY market_value DESC',
      [portfolioId]
    );

    return result.rows.map((row) => this.mapToPosition(row));
  }

  /**
   * Get positions with stock details
   */
  async findByPortfolioIdWithDetails(
    portfolioId: string
  ): Promise<PositionWithDetails[]> {
    const result = await query<any>(
      `SELECT
        p.*,
        s.name as stock_name,
        s.exchange,
        s.sector,
        s.industry,
        s.market_cap,
        s.tradable
      FROM positions p
      INNER JOIN stocks s ON p.symbol = s.symbol
      WHERE p.portfolio_id = $1
      ORDER BY p.market_value DESC`,
      [portfolioId]
    );

    return result.rows.map((row) => {
      const position = this.mapToPosition(row);
      const stock: Stock = {
        symbol: row.symbol,
        name: row.stock_name,
        exchange: row.exchange,
        sector: row.sector,
        industry: row.industry,
        marketCap: row.market_cap ? parseInt(row.market_cap) : undefined,
        tradable: row.tradable,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      return {
        ...position,
        stock,
        dayChange: 0, // Would need previous day price to calculate
        dayChangePercent: 0,
      };
    });
  }

  /**
   * Update position prices
   */
  async updatePrices(
    portfolioId: string,
    symbol: string,
    currentPrice: number,
    client?: pg.PoolClient
  ): Promise<Position | null> {
    const queryFn = client ? client.query.bind(client) : query;

    const result = await queryFn<any>(
      `UPDATE positions
       SET
         current_price = $1,
         market_value = quantity * $1,
         unrealized_pnl = (quantity * $1) - cost_basis,
         unrealized_pnl_percent = CASE
           WHEN cost_basis > 0 THEN (((quantity * $1) - cost_basis) / cost_basis) * 100
           ELSE 0
         END,
         updated_at = NOW()
       WHERE portfolio_id = $2 AND symbol = $3
       RETURNING *`,
      [currentPrice, portfolioId, symbol]
    );

    return result.rows[0] ? this.mapToPosition(result.rows[0]) : null;
  }

  /**
   * Update position after trade
   */
  async updateAfterTrade(
    portfolioId: string,
    symbol: string,
    quantityChange: number,
    price: number,
    client?: pg.PoolClient
  ): Promise<Position | null> {
    const queryFn = client ? client.query.bind(client) : query;

    // Get current position
    const currentResult = await queryFn<any>(
      'SELECT * FROM positions WHERE portfolio_id = $1 AND symbol = $2',
      [portfolioId, symbol]
    );

    const current = currentResult.rows[0];

    if (!current && quantityChange <= 0) {
      // Can't sell if no position
      return null;
    }

    if (!current) {
      // Create new position (buy)
      return this.upsert(portfolioId, symbol, quantityChange, price, price, client);
    }

    const currentQuantity = parseInt(current.quantity);
    const currentAvgPrice = parseFloat(current.average_price);
    const newQuantity = currentQuantity + quantityChange;

    if (newQuantity < 0) {
      // Can't sell more than we have
      return null;
    }

    if (newQuantity === 0) {
      // Close position
      await queryFn(
        'DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2',
        [portfolioId, symbol]
      );
      return null;
    }

    // Calculate new average price
    let newAvgPrice: number;
    if (quantityChange > 0) {
      // Buying more - weighted average
      const totalCost =
        currentQuantity * currentAvgPrice + quantityChange * price;
      newAvgPrice = totalCost / newQuantity;
    } else {
      // Selling - keep same average price
      newAvgPrice = currentAvgPrice;
    }

    return this.upsert(portfolioId, symbol, newQuantity, newAvgPrice, price, client);
  }

  /**
   * Delete position
   */
  async delete(portfolioId: string, symbol: string): Promise<void> {
    await query(
      'DELETE FROM positions WHERE portfolio_id = $1 AND symbol = $2',
      [portfolioId, symbol]
    );
  }

  /**
   * Map database row to Position object
   */
  private mapToPosition(row: any): Position {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      symbol: row.symbol,
      quantity: parseInt(row.quantity) || 0,
      averagePrice: parseFloat(row.average_price) || 0,
      currentPrice: parseFloat(row.current_price) || 0,
      marketValue: parseFloat(row.market_value) || 0,
      costBasis: parseFloat(row.cost_basis) || 0,
      unrealizedPnL: parseFloat(row.unrealized_pnl) || 0,
      unrealizedPnLPercent: parseFloat(row.unrealized_pnl_percent) || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
