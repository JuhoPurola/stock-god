/**
 * Financial Modeling Prep API client
 * Free tier: 250 requests/day
 * https://financialmodelingprep.com/developer/docs/
 */
export interface FMPStock {
    symbol: string;
    name: string;
    price: number;
    exchange: string;
    exchangeShortName: string;
    type: string;
}
export interface FMPStockScreenerResult {
    symbol: string;
    companyName: string;
    marketCap: number;
    sector: string;
    industry: string;
    beta: number;
    price: number;
    lastAnnualDividend: number;
    volume: number;
    exchange: string;
    exchangeShortName: string;
    country: string;
    isEtf: boolean;
    isActivelyTrading: boolean;
}
export declare class FMPClient {
    private client;
    private apiKey;
    private initialized;
    private initPromise;
    constructor(apiKey?: string);
    /**
     * Initialize the client with API key from Secrets Manager (lazy loading)
     */
    private initialize;
    private handleError;
    /**
     * Get all available stocks
     */
    getStockList(): Promise<FMPStock[]>;
    /**
     * Get stocks using stock screener with filters
     * Market cap ranges:
     * - Small cap: $300M - $2B
     * - Micro cap: $50M - $300M
     * - Nano cap: < $50M
     */
    screenStocks(params: {
        marketCapMoreThan?: number;
        marketCapLowerThan?: number;
        limit?: number;
        exchange?: string;
    }): Promise<FMPStockScreenerResult[]>;
    /**
     * Get small cap stocks ($300M - $2B)
     */
    getSmallCapStocks(limit?: number): Promise<FMPStockScreenerResult[]>;
    /**
     * Get micro cap stocks ($50M - $300M)
     */
    getMicroCapStocks(limit?: number): Promise<FMPStockScreenerResult[]>;
    /**
     * Get all small to micro cap stocks
     */
    getSmallToMicroCapStocks(): Promise<FMPStockScreenerResult[]>;
    /**
     * Get historical daily prices for a symbol
     * @param symbol Stock symbol
     * @param from Start date (YYYY-MM-DD) - optional, defaults to 100 days ago
     * @param to End date (YYYY-MM-DD) - optional, defaults to today
     */
    getHistoricalPrices(symbol: string, from?: string, to?: string): Promise<Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        adjClose: number;
        volume: number;
    }>>;
}
export declare const fmpClient: FMPClient;
//# sourceMappingURL=client.d.ts.map