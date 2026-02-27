/**
 * Strategy repository - database access layer
 */
import { query } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
export class StrategyRepository {
    /**
     * Create a new strategy
     */
    async create(data) {
        const result = await query(`INSERT INTO strategies (
        portfolio_id, name, description, factors,
        risk_management, stock_universe, enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`, [
            data.portfolioId,
            data.name,
            data.description,
            JSON.stringify(data.factors),
            JSON.stringify(data.riskManagement),
            data.stockUniverse,
            data.enabled,
        ]);
        if (!result.rows[0]) {
            throw new Error('Failed to create strategy');
        }
        return this.mapToStrategy(result.rows[0]);
    }
    /**
     * Get strategy by ID
     */
    async findById(id) {
        const result = await query('SELECT * FROM strategies WHERE id = $1', [id]);
        return result.rows[0] ? this.mapToStrategy(result.rows[0]) : null;
    }
    /**
     * Get strategy by ID or throw
     */
    async findByIdOrThrow(id) {
        const strategy = await this.findById(id);
        if (!strategy) {
            throw new NotFoundError('Strategy', id);
        }
        return strategy;
    }
    /**
     * Get all strategies for a portfolio
     */
    async findByPortfolioId(portfolioId) {
        const result = await query('SELECT * FROM strategies WHERE portfolio_id = $1 ORDER BY created_at DESC', [portfolioId]);
        return result.rows.map((row) => this.mapToStrategy(row));
    }
    /**
     * Get enabled strategies for a portfolio
     */
    async findEnabledByPortfolioId(portfolioId) {
        const result = await query('SELECT * FROM strategies WHERE portfolio_id = $1 AND enabled = true', [portfolioId]);
        return result.rows.map((row) => this.mapToStrategy(row));
    }
    /**
     * Update strategy
     */
    async update(id, data) {
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (data.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(data.description);
        }
        if (data.factors !== undefined) {
            updates.push(`factors = $${paramIndex++}`);
            values.push(JSON.stringify(data.factors));
        }
        if (data.riskManagement !== undefined) {
            updates.push(`risk_management = $${paramIndex++}`);
            values.push(JSON.stringify(data.riskManagement));
        }
        if (data.stockUniverse !== undefined) {
            updates.push(`stock_universe = $${paramIndex++}`);
            values.push(data.stockUniverse);
        }
        if (data.enabled !== undefined) {
            updates.push(`enabled = $${paramIndex++}`);
            values.push(data.enabled);
        }
        if (updates.length === 0) {
            return this.findByIdOrThrow(id);
        }
        values.push(id);
        const result = await query(`UPDATE strategies
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`, values);
        if (!result.rows[0]) {
            throw new NotFoundError('Strategy', id);
        }
        return this.mapToStrategy(result.rows[0]);
    }
    /**
     * Delete strategy
     */
    async delete(id) {
        const result = await query('DELETE FROM strategies WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            throw new NotFoundError('Strategy', id);
        }
    }
    /**
     * Toggle strategy enabled status
     */
    async toggleEnabled(id) {
        const result = await query(`UPDATE strategies
       SET enabled = NOT enabled
       WHERE id = $1
       RETURNING *`, [id]);
        if (!result.rows[0]) {
            throw new NotFoundError('Strategy', id);
        }
        return this.mapToStrategy(result.rows[0]);
    }
    /**
     * Map database row to Strategy object
     */
    mapToStrategy(row) {
        return {
            id: row.id,
            portfolioId: row.portfolio_id,
            name: row.name,
            description: row.description,
            factors: row.factors,
            riskManagement: row.risk_management,
            stockUniverse: row.stock_universe,
            enabled: row.enabled,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
//# sourceMappingURL=strategy.repository.js.map