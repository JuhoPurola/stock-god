/**
 * Price Data Service - Load and store historical stock prices
 */
export declare class PriceDataService {
    /**
     * Load historical prices for a symbol and store in database
     */
    loadHistoricalPrices(symbol: string, outputSize?: 'compact' | 'full'): Promise<number>;
    /**
     * Load historical prices from FMP and store in database
     */
    loadHistoricalPricesFromFMP(symbol: string, fromDate?: string, toDate?: string): Promise<number>;
    /**
     * Load historical prices for multiple symbols from FMP
     */
    loadBulkHistoricalPricesFromFMP(symbols: string[], fromDate?: string, toDate?: string): Promise<{
        symbol: string;
        count: number;
        error?: string;
    }[]>;
    /**
     * Load historical prices for multiple symbols
     */
    loadBulkHistoricalPrices(symbols: string[], outputSize?: 'compact' | 'full'): Promise<{
        symbol: string;
        count: number;
        error?: string;
    }[]>;
    /**
     * Get date range of available prices for a symbol
     */
    getPriceRange(symbol: string): Promise<{
        startDate: Date;
        endDate: Date;
        count: number;
    } | null>;
    /**
     * Get symbols that need price data updates
     */
    getSymbolsNeedingUpdate(maxAge?: number): Promise<string[]>;
    /**
     * Generate sample price data for testing (when Alpha Vantage not available)
     */
    generateSamplePrices(symbol: string, days?: number): Promise<number>;
    /**
     * Generate sample price data for a specific date range
     */
    generateSamplePricesForDateRange(symbol: string, startDate: Date, endDate: Date): Promise<number>;
}
export declare const priceDataService: PriceDataService;
//# sourceMappingURL=price-data.service.d.ts.map