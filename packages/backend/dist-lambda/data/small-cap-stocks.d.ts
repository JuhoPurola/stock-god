/**
 * Curated list of US Small Cap and Micro Cap stocks
 * Market Cap: $50M - $2B
 * Exchanges: NASDAQ, NYSE, AMEX
 */
export interface SmallCapStock {
    symbol: string;
    name: string;
    exchange: string;
    sector: string;
    marketCap: number;
}
/**
 * Real small cap and micro cap US stocks
 * Data curated from public sources (2026)
 */
export declare const SMALL_CAP_STOCKS: SmallCapStock[];
//# sourceMappingURL=small-cap-stocks.d.ts.map