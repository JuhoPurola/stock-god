/**
 * Stock Universe Service - Fetch and populate tradeable stocks
 */
import type { Stock } from '@stock-picker/shared';
export declare class StockUniverseService {
    private stockRepo;
    constructor();
    /**
     * Populate database with curated small & micro cap stocks
     * No API required - uses pre-vetted list of real US stocks
     */
    populateCuratedSmallCaps(): Promise<{
        total: number;
        added: number;
        updated: number;
        smallCap: number;
        microCap: number;
        sectors: Record<string, number>;
    }>;
    /**
     * Fetch small and micro cap stocks from FMP and populate database
     * This is the primary method for getting US small cap stocks
     */
    fetchSmallCapStocksFromFMP(): Promise<{
        total: number;
        added: number;
        updated: number;
        smallCap: number;
        microCap: number;
        marketCapRange: {
            min: number;
            max: number;
        };
    }>;
    /**
     * Fetch all tradeable stocks from Alpaca and populate database
     * Returns count of stocks added/updated
     */
    fetchAndPopulateStocks(): Promise<{
        total: number;
        added: number;
        updated: number;
        exchanges: Record<string, number>;
    }>;
    /**
     * Get stocks filtered by market cap range
     * Market cap categories:
     * - Large cap: > $10B
     * - Mid cap: $2B - $10B
     * - Small cap: $300M - $2B
     * - Micro cap: $50M - $300M
     * - Nano cap: < $50M
     */
    getStocksByMarketCap(minMarketCap?: number, maxMarketCap?: number, limit?: number): Promise<Stock[]>;
    /**
     * Get small cap stocks (market cap between $300M and $2B)
     */
    getSmallCapStocks(limit?: number): Promise<Stock[]>;
    /**
     * Get micro cap stocks (market cap between $50M and $300M)
     */
    getMicroCapStocks(limit?: number): Promise<Stock[]>;
}
export declare const stockUniverseService: StockUniverseService;
//# sourceMappingURL=stock-universe.service.d.ts.map