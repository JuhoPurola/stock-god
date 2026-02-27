/**
 * Financial Modeling Prep API client
 * Free tier: 250 requests/day
 * https://financialmodelingprep.com/developer/docs/
 */

import axios, { type AxiosInstance } from 'axios';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../utils/errors.js';

// Cached credentials
let cachedApiKey: string | null = null;

/**
 * Fetch FMP API key from Secrets Manager
 */
async function getFMPApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const secretArn = process.env.FMP_SECRET_ARN || 'stock-picker/production/fmp';

  try {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-west-1' });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('FMP secret value is empty');
    }

    const parsed = JSON.parse(response.SecretString);
    const apiKey = parsed.apiKey || 'demo';
    cachedApiKey = apiKey;

    logger.info('FMP API key loaded from Secrets Manager');
    return apiKey;
  } catch (error) {
    logger.error('Failed to load FMP API key from Secrets Manager', error);
    // Fall back to demo key
    return 'demo';
  }
}

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

export class FMPClient {
  private client: AxiosInstance;
  private apiKey: string;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(apiKey?: string) {
    // Will be initialized on first use
    this.apiKey = apiKey || 'demo';

    this.client = axios.create({
      baseURL: 'https://financialmodelingprep.com/api/v3',
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Initialize the client with API key from Secrets Manager (lazy loading)
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If already initializing, wait for that to complete
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      this.apiKey = await getFMPApiKey();

      // Update default params with API key
      this.client.defaults.params = {
        apikey: this.apiKey,
      };

      this.initialized = true;
      logger.info('FMP client initialized');
    })();

    return this.initPromise;
  }

  private handleError(error: any): never {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status;

    logger.error('FMP API error', {
      status,
      message,
      data: error.response?.data,
    });

    throw new ExternalServiceError('Financial Modeling Prep', message, {
      status,
      data: error.response?.data,
    });
  }

  /**
   * Get all available stocks
   */
  async getStockList(): Promise<FMPStock[]> {
    await this.initialize();

    try {
      const response = await this.client.get<FMPStock[]>('/stock/list');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch stock list', error);
      throw error;
    }
  }

  /**
   * Get stocks using stock screener with filters
   * Market cap ranges:
   * - Small cap: $300M - $2B
   * - Micro cap: $50M - $300M
   * - Nano cap: < $50M
   */
  async screenStocks(params: {
    marketCapMoreThan?: number;
    marketCapLowerThan?: number;
    limit?: number;
    exchange?: string;
  }): Promise<FMPStockScreenerResult[]> {
    await this.initialize();

    try {
      const response = await this.client.get<FMPStockScreenerResult[]>('/stock-screener', {
        params: {
          marketCapMoreThan: params.marketCapMoreThan,
          marketCapLowerThan: params.marketCapLowerThan,
          limit: params.limit || 1000,
          exchange: params.exchange,
          isActivelyTrading: true,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to screen stocks', error);
      throw error;
    }
  }

  /**
   * Get small cap stocks ($300M - $2B)
   */
  async getSmallCapStocks(limit: number = 1000): Promise<FMPStockScreenerResult[]> {
    return this.screenStocks({
      marketCapMoreThan: 300_000_000,
      marketCapLowerThan: 2_000_000_000,
      limit,
    });
  }

  /**
   * Get micro cap stocks ($50M - $300M)
   */
  async getMicroCapStocks(limit: number = 1000): Promise<FMPStockScreenerResult[]> {
    return this.screenStocks({
      marketCapMoreThan: 50_000_000,
      marketCapLowerThan: 300_000_000,
      limit,
    });
  }

  /**
   * Get all small to micro cap stocks
   */
  async getSmallToMicroCapStocks(): Promise<FMPStockScreenerResult[]> {
    // Get stocks with market cap between $50M and $2B
    return this.screenStocks({
      marketCapMoreThan: 50_000_000,
      marketCapLowerThan: 2_000_000_000,
      limit: 5000, // Get more results
    });
  }

  /**
   * Get historical daily prices for a symbol
   * @param symbol Stock symbol
   * @param from Start date (YYYY-MM-DD) - optional, defaults to 100 days ago
   * @param to End date (YYYY-MM-DD) - optional, defaults to today
   */
  async getHistoricalPrices(
    symbol: string,
    from?: string,
    to?: string
  ): Promise<Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjClose: number;
    volume: number;
  }>> {
    await this.initialize();

    try {
      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await this.client.get(`/historical-price-full/${symbol}`, {
        params,
      });

      // FMP returns data in format: { symbol: "AAPL", historical: [...] }
      const historical = response.data?.historical || [];

      logger.info('Fetched historical prices from FMP', {
        symbol,
        dataPoints: historical.length,
      });

      return historical;
    } catch (error) {
      logger.error('Failed to fetch historical prices from FMP', { symbol, error });
      throw error;
    }
  }

  /**
   * Get batch quotes for multiple symbols
   */
  async getBatchQuotes(symbols: string[]): Promise<Array<{
    symbol: string;
    price: number;
    change: number;
    changesPercentage: number;
  }>> {
    await this.initialize();

    if (symbols.length === 0) {
      return [];
    }

    try {
      // FMP supports comma-separated symbols in the quote endpoint
      const symbolsParam = symbols.join(',');
      const response = await this.client.get(`/quote/${symbolsParam}`);

      logger.info('Fetched batch quotes from FMP', {
        symbolCount: symbols.length,
        resultCount: response.data?.length || 0,
      });

      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch batch quotes from FMP', { symbols, error });
      throw error;
    }
  }
}

// Export singleton instance
export const fmpClient = new FMPClient();
