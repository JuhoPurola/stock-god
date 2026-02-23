/**
 * Rate Limiter Service - Enforce API rate limits
 *
 * Hard limits:
 * - Alpaca Paper Trading: 200 requests/minute
 * - Alpha Vantage Free Tier: 5 requests/minute, 500 requests/day
 */

import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface RateLimitConfig {
  service: 'alpaca' | 'alpha_vantage';
  requestsPerMinute: number;
  requestsPerDay?: number;
}

export class RateLimiterService {
  private static readonly LIMITS: Record<string, RateLimitConfig> = {
    alpaca: {
      service: 'alpaca',
      requestsPerMinute: 200,
    },
    alpha_vantage: {
      service: 'alpha_vantage',
      requestsPerMinute: 5,
      requestsPerDay: 500,
    },
  };

  /**
   * Check if request is allowed under rate limits
   * Returns true if allowed, false if rate limit exceeded
   */
  async checkRateLimit(service: 'alpaca' | 'alpha_vantage'): Promise<boolean> {
    const config = RateLimiterService.LIMITS[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    const now = new Date();

    // Check minute limit
    const minuteLimit = await this.getRequestCount(
      service,
      new Date(now.getTime() - 60000) // Last minute
    );

    if (minuteLimit >= config.requestsPerMinute) {
      logger.warn(`Rate limit exceeded for ${service}`, {
        service,
        limit: config.requestsPerMinute,
        current: minuteLimit,
        window: 'minute',
      });
      return false;
    }

    // Check daily limit if applicable
    if (config.requestsPerDay) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const dayLimit = await this.getRequestCount(service, dayStart);

      if (dayLimit >= config.requestsPerDay) {
        logger.warn(`Daily rate limit exceeded for ${service}`, {
          service,
          limit: config.requestsPerDay,
          current: dayLimit,
          window: 'day',
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Record an API request
   */
  async recordRequest(
    service: 'alpaca' | 'alpha_vantage',
    endpoint: string,
    success: boolean = true
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO api_rate_limits (service, endpoint, request_time, success)
         VALUES ($1, $2, NOW(), $3)`,
        [service, endpoint, success]
      );
    } catch (error) {
      // Don't fail the request if rate limit recording fails
      logger.error('Failed to record API rate limit', { service, endpoint, error });
    }
  }

  /**
   * Get request count for a service since a given time
   */
  private async getRequestCount(
    service: string,
    since: Date
  ): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM api_rate_limits
       WHERE service = $1
       AND request_time >= $2`,
      [service, since]
    );

    return parseInt(result.rows[0]?.count || '0');
  }

  /**
   * Wait until rate limit allows request (with exponential backoff)
   * Returns immediately if allowed, or throws after max retries
   */
  async waitForRateLimit(
    service: 'alpaca' | 'alpha_vantage',
    maxRetries: number = 3
  ): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const allowed = await this.checkRateLimit(service);

      if (allowed) {
        return;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt) * 1000;

      logger.info(`Rate limit exceeded, waiting ${delayMs}ms`, {
        service,
        attempt: attempt + 1,
        maxRetries,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error(
      `Rate limit exceeded for ${service} after ${maxRetries} retries`
    );
  }

  /**
   * Get current rate limit status
   */
  async getStatus(service: 'alpaca' | 'alpha_vantage'): Promise<{
    service: string;
    minuteUsage: number;
    minuteLimit: number;
    dayUsage?: number;
    dayLimit?: number;
  }> {
    const config = RateLimiterService.LIMITS[service];
    if (!config) {
      throw new Error(`Unknown service: ${service}`);
    }

    const now = new Date();

    const minuteUsage = await this.getRequestCount(
      service,
      new Date(now.getTime() - 60000)
    );

    const status: any = {
      service,
      minuteUsage,
      minuteLimit: config.requestsPerMinute,
    };

    if (config.requestsPerDay) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      status.dayUsage = await this.getRequestCount(service, dayStart);
      status.dayLimit = config.requestsPerDay;
    }

    return status;
  }

  /**
   * Clean up old rate limit records (keep last 7 days)
   */
  async cleanup(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await query(
      `DELETE FROM api_rate_limits
       WHERE request_time < $1`,
      [sevenDaysAgo]
    );

    logger.info('Cleaned up old rate limit records', {
      deleted: result.rowCount,
    });

    return result.rowCount || 0;
  }
}

export const rateLimiterService = new RateLimiterService();
