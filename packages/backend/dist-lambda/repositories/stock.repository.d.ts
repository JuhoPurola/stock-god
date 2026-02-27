/**
 * Stock repository - database access layer
 */
import type { Stock, PriceBar } from '@stock-picker/shared';
export declare class StockRepository {
    /**
     * Get stock by symbol
     */
    findBySymbol(symbol: string): Promise<Stock | null>;
    /**
     * Search stocks by name or symbol
     */
    search(searchTerm: string, limit?: number): Promise<Stock[]>;
    /**
     * Get all tradable stocks
     */
    findTradable(limit?: number): Promise<Stock[]>;
    /**
     * Get stocks by sector
     */
    findBySector(sector: string, limit?: number): Promise<Stock[]>;
    /**
     * Upsert stock
     */
    upsert(stock: Omit<Stock, 'createdAt' | 'updatedAt'>): Promise<Stock>;
    /**
     * Get price history for a symbol
     */
    getPriceHistory(symbol: string, startDate: Date, endDate: Date): Promise<PriceBar[]>;
    /**
     * Get latest price for a symbol
     */
    getLatestPrice(symbol: string): Promise<PriceBar | null>;
    /**
     * Insert price bar
     */
    insertPrice(priceBar: Omit<PriceBar, 'timestamp'> & {
        timestamp: Date;
    }): Promise<void>;
    /**
     * Bulk insert price bars
     */
    bulkInsertPrices(priceBars: Array<Omit<PriceBar, 'timestamp'> & {
        timestamp: Date;
    }>): Promise<void>;
    /**
     * Map database row to Stock object
     */
    private mapToStock;
    /**
     * Map database row to PriceBar object
     */
    private mapToPriceBar;
}
//# sourceMappingURL=stock.repository.d.ts.map