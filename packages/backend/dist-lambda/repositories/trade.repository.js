/**
 * Trade repository - database access layer
 */
import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
export class TradeRepository {
    /**
     * Create a new trade
     */
    async create(portfolioId, strategyId, symbol, side, quantity, price, orderType, status, signal, brokerOrderId, client) {
        const amount = quantity * price;
        const queryFn = client ? client.query.bind(client) : query;
        const result = await queryFn(`INSERT INTO trades (
        portfolio_id, strategy_id, symbol, side, quantity, price,
        amount, order_type, status, signal, broker_order_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`, [
            portfolioId,
            strategyId || null,
            symbol,
            side,
            quantity,
            price,
            amount,
            orderType,
            status,
            signal ? JSON.stringify(signal) : null,
            brokerOrderId || null,
        ]);
        if (!result.rows[0]) {
            throw new Error('Failed to create trade');
        }
        return this.mapToTrade(result.rows[0]);
    }
    /**
     * Get trade by ID
     */
    async findById(id) {
        const result = await query('SELECT * FROM trades WHERE id = $1', [id]);
        return result.rows[0] ? this.mapToTrade(result.rows[0]) : null;
    }
    /**
     * Get trade by ID or throw
     */
    async findByIdOrThrow(id) {
        const trade = await this.findById(id);
        if (!trade) {
            throw new NotFoundError('Trade', id);
        }
        return trade;
    }
    /**
     * Get trade by broker order ID
     */
    async findByBrokerOrderId(brokerOrderId) {
        const result = await query('SELECT * FROM trades WHERE broker_order_id = $1', [brokerOrderId]);
        return result.rows[0] ? this.mapToTrade(result.rows[0]) : null;
    }
    /**
     * Get all trades for a portfolio
     */
    async findByPortfolioId(portfolioId, limit = 100) {
        const result = await query(`SELECT * FROM trades
       WHERE portfolio_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [portfolioId, limit]);
        return result.rows.map((row) => this.mapToTrade(row));
    }
    /**
     * Get trades with details (including portfolio and strategy names)
     */
    async findByPortfolioIdWithDetails(portfolioId, limit = 100) {
        const result = await query(`SELECT
        t.*,
        p.name as portfolio_name,
        s.name as strategy_name,
        st.close as current_price
      FROM trades t
      INNER JOIN portfolios p ON t.portfolio_id = p.id
      LEFT JOIN strategies s ON t.strategy_id = s.id
      LEFT JOIN LATERAL (
        SELECT close FROM stock_prices
        WHERE symbol = t.symbol
        ORDER BY timestamp DESC
        LIMIT 1
      ) st ON true
      WHERE t.portfolio_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2`, [portfolioId, limit]);
        return result.rows.map((row) => {
            const trade = this.mapToTrade(row);
            const currentPrice = row.current_price ? parseFloat(row.current_price) : undefined;
            // Calculate P&L if trade is filled
            let pnl;
            if (trade.status === 'filled' && currentPrice) {
                if (trade.side === 'buy') {
                    pnl = trade.quantity * (currentPrice - trade.price);
                }
                else {
                    pnl = trade.quantity * (trade.price - currentPrice);
                }
            }
            return {
                ...trade,
                portfolioName: row.portfolio_name,
                strategyName: row.strategy_name,
                currentPrice,
                pnl,
            };
        });
    }
    /**
     * Get trades for a strategy
     */
    async findByStrategyId(strategyId, limit = 100) {
        const result = await query(`SELECT * FROM trades
       WHERE strategy_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [strategyId, limit]);
        return result.rows.map((row) => this.mapToTrade(row));
    }
    /**
     * Get trades for a symbol
     */
    async findBySymbol(portfolioId, symbol, limit = 50) {
        const result = await query(`SELECT * FROM trades
       WHERE portfolio_id = $1 AND symbol = $2
       ORDER BY created_at DESC
       LIMIT $3`, [portfolioId, symbol, limit]);
        return result.rows.map((row) => this.mapToTrade(row));
    }
    /**
     * Update trade status
     */
    async updateStatus(id, status, executedAt, client) {
        const queryFn = client ? client.query.bind(client) : query;
        const result = await queryFn(`UPDATE trades
       SET status = $1, executed_at = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`, [status, executedAt || null, id]);
        if (!result.rows[0]) {
            throw new NotFoundError('Trade', id);
        }
        return this.mapToTrade(result.rows[0]);
    }
    /**
     * Update trade with broker order ID
     */
    async updateBrokerOrderId(id, brokerOrderId, client) {
        const queryFn = client ? client.query.bind(client) : query;
        const result = await queryFn(`UPDATE trades
       SET broker_order_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`, [brokerOrderId, id]);
        if (!result.rows[0]) {
            throw new NotFoundError('Trade', id);
        }
        return this.mapToTrade(result.rows[0]);
    }
    /**
     * Get pending trades
     */
    async findPending(portfolioId) {
        const queryText = portfolioId
            ? `SELECT * FROM trades
         WHERE status IN ('pending', 'submitted')
         AND portfolio_id = $1
         ORDER BY created_at ASC`
            : `SELECT * FROM trades
         WHERE status IN ('pending', 'submitted')
         ORDER BY created_at ASC`;
        const params = portfolioId ? [portfolioId] : [];
        const result = await query(queryText, params);
        return result.rows.map((row) => this.mapToTrade(row));
    }
    /**
     * Map database row to Trade object
     */
    mapToTrade(row) {
        return {
            id: row.id,
            portfolioId: row.portfolio_id,
            strategyId: row.strategy_id,
            symbol: row.symbol,
            side: row.side,
            quantity: parseInt(row.quantity),
            price: parseFloat(row.price),
            amount: parseFloat(row.amount),
            orderType: row.order_type,
            status: row.status,
            signal: row.signal,
            brokerOrderId: row.broker_order_id,
            executedAt: row.executed_at ? new Date(row.executed_at) : undefined,
            commission: row.commission ? parseFloat(row.commission) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
//# sourceMappingURL=trade.repository.js.map