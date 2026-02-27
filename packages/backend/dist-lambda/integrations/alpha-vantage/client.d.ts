/**
 * Alpha Vantage API client for market data
 */
/**
 * Daily time series data point
 */
export interface AlphaVantageDailyData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
/**
 * Alpha Vantage API client
 */
export declare class AlphaVantageClient {
    private client;
    private isDemoMode;
    private initialized;
    private initPromise;
    private lastCallTime;
    private callCount;
    private readonly RATE_LIMIT_CALLS;
    private readonly RATE_LIMIT_WINDOW;
    constructor();
    /**
     * Initialize the client with credentials
     */
    private initialize;
    /**
     * Rate limiting - wait if needed
     */
    private rateLimit;
    /**
     * Handle Alpha Vantage API errors
     */
    private handleError;
    /**
     * Get daily time series data for a symbol
     * @param symbol Stock symbol
     * @param outputSize 'compact' (100 days) or 'full' (20+ years)
     */
    getDailyTimeSeries(symbol: string, outputSize?: 'compact' | 'full'): Promise<AlphaVantageDailyData[]>;
    /**
     * Get adjusted daily time series (includes stock splits and dividends)
     */
    getDailyAdjusted(symbol: string, outputSize?: 'compact' | 'full'): Promise<AlphaVantageDailyData[]>;
}
export declare const alphaVantageClient: AlphaVantageClient;
//# sourceMappingURL=client.d.ts.map