/**
 * Stock repository - database access layer
 */
import { query } from '../config/database.js';
export class StockRepository {
    /**
     * Get stock by symbol
     */
    async findBySymbol(symbol) {
        const result = await query('SELECT * FROM stocks WHERE symbol = $1', [symbol.toUpperCase()]);
        return result.rows[0] ? this.mapToStock(result.rows[0]) : null;
    }
    /**
     * Search stocks by name or symbol
     */
    async search(searchTerm, limit = 10) {
        const searchQuery = `%${searchTerm.toUpperCase()}%`;
        const result = await query(`SELECT * FROM stocks
       WHERE (symbol ILIKE $1 OR name ILIKE $1)
       AND tradable = true
       ORDER BY
         CASE
           WHEN symbol = $2 THEN 1
           WHEN symbol LIKE $1 THEN 2
           WHEN name LIKE $1 THEN 3
           ELSE 4
         END,
         market_cap DESC NULLS LAST
       LIMIT $3`, [searchQuery, searchTerm.toUpperCase(), limit]);
        return result.rows.map((row) => this.mapToStock(row));
    }
    /**
     * Get all tradable stocks
     */
    async findTradable(limit = 100) {
        const result = await query(`SELECT * FROM stocks
       WHERE tradable = true
       ORDER BY market_cap DESC NULLS LAST
       LIMIT $1`, [limit]);
        return result.rows.map((row) => this.mapToStock(row));
    }
    /**
     * Get stocks by sector
     */
    async findBySector(sector, limit = 50) {
        const result = await query(`SELECT * FROM stocks
       WHERE sector = $1 AND tradable = true
       ORDER BY market_cap DESC NULLS LAST
       LIMIT $2`, [sector, limit]);
        return result.rows.map((row) => this.mapToStock(row));
    }
    /**
     * Upsert stock
     */
    async upsert(stock) {
        const result = await query(`INSERT INTO stocks (symbol, name, exchange, sector, industry, market_cap, tradable)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (symbol)
       DO UPDATE SET
         name = EXCLUDED.name,
         exchange = EXCLUDED.exchange,
         sector = EXCLUDED.sector,
         industry = EXCLUDED.industry,
         market_cap = EXCLUDED.market_cap,
         tradable = EXCLUDED.tradable,
         updated_at = NOW()
       RETURNING *`, [
            stock.symbol,
            stock.name,
            stock.exchange,
            stock.sector,
            stock.industry,
            stock.marketCap,
            stock.tradable,
        ]);
        if (!result.rows[0]) {
            throw new Error('Failed to upsert stock');
        }
        return this.mapToStock(result.rows[0]);
    }
    /**
     * Get price history for a symbol
     */
    async getPriceHistory(symbol, startDate, endDate) {
        const result = await query(`SELECT * FROM stock_prices
       WHERE symbol = $1
       AND timestamp >= $2
       AND timestamp <= $3
       ORDER BY timestamp ASC`, [symbol, startDate, endDate]);
        return result.rows.map((row) => this.mapToPriceBar(row));
    }
    /**
     * Get latest price for a symbol
     */
    async getLatestPrice(symbol) {
        const result = await query(`SELECT * FROM stock_prices
       WHERE symbol = $1
       ORDER BY timestamp DESC
       LIMIT 1`, [symbol]);
        return result.rows[0] ? this.mapToPriceBar(result.rows[0]) : null;
    }
    /**
     * Insert price bar
     */
    async insertPrice(priceBar) {
        await query(`INSERT INTO stock_prices (symbol, timestamp, open, high, low, close, volume)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (symbol, timestamp) DO NOTHING`, [
            priceBar.symbol,
            priceBar.timestamp,
            priceBar.open,
            priceBar.high,
            priceBar.low,
            priceBar.close,
            priceBar.volume,
        ]);
    }
    /**
     * Bulk insert price bars
     */
    async bulkInsertPrices(priceBars) {
        if (priceBars.length === 0)
            return;
        const values = priceBars
            .map((bar, i) => `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5}, $${i * 7 + 6}, $${i * 7 + 7})`)
            .join(', ');
        const params = priceBars.flatMap((bar) => [
            bar.symbol,
            bar.timestamp,
            bar.open,
            bar.high,
            bar.low,
            bar.close,
            bar.volume,
        ]);
        await query(`INSERT INTO stock_prices (symbol, timestamp, open, high, low, close, volume)
       VALUES ${values}
       ON CONFLICT (symbol, timestamp) DO NOTHING`, params);
    }
    /**
     * Map database row to Stock object
     */
    mapToStock(row) {
        return {
            symbol: row.symbol,
            name: row.name,
            exchange: row.exchange,
            sector: row.sector,
            industry: row.industry,
            marketCap: row.market_cap ? parseInt(row.market_cap) : undefined,
            tradable: row.tradable,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    /**
     * Map database row to PriceBar object
     */
    mapToPriceBar(row) {
        return {
            symbol: row.symbol,
            timestamp: new Date(row.timestamp),
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            volume: parseInt(row.volume),
        };
    }
}
//# sourceMappingURL=stock.repository.js.map