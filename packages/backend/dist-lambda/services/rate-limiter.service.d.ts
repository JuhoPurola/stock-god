/**
 * Rate Limiter Service - Enforce API rate limits
 *
 * Hard limits:
 * - Alpaca Paper Trading: 200 requests/minute
 * - Alpha Vantage Free Tier: 5 requests/minute, 500 requests/day
 */
export interface RateLimitConfig {
    service: 'alpaca' | 'alpha_vantage';
    requestsPerMinute: number;
    requestsPerDay?: number;
}
export declare class RateLimiterService {
    private static readonly LIMITS;
    /**
     * Check if request is allowed under rate limits
     * Returns true if allowed, false if rate limit exceeded
     */
    checkRateLimit(service: 'alpaca' | 'alpha_vantage'): Promise<boolean>;
    /**
     * Record an API request
     */
    recordRequest(service: 'alpaca' | 'alpha_vantage', endpoint: string, success?: boolean): Promise<void>;
    /**
     * Get request count for a service since a given time
     */
    private getRequestCount;
    /**
     * Wait until rate limit allows request (with exponential backoff)
     * Returns immediately if allowed, or throws after max retries
     */
    waitForRateLimit(service: 'alpaca' | 'alpha_vantage', maxRetries?: number): Promise<void>;
    /**
     * Get current rate limit status
     */
    getStatus(service: 'alpaca' | 'alpha_vantage'): Promise<{
        service: string;
        minuteUsage: number;
        minuteLimit: number;
        dayUsage?: number;
        dayLimit?: number;
    }>;
    /**
     * Clean up old rate limit records (keep last 7 days)
     */
    cleanup(): Promise<number>;
}
export declare const rateLimiterService: RateLimiterService;
//# sourceMappingURL=rate-limiter.service.d.ts.map