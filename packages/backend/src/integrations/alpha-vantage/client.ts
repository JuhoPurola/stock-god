/**
 * Alpha Vantage API client for market data
 */

import axios, { type AxiosInstance } from 'axios';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../utils/errors.js';

interface AlphaVantageCredentials {
  apiKey: string;
}

// Cached credentials
let cachedCredentials: AlphaVantageCredentials | null = null;

/**
 * Fetch Alpha Vantage credentials from Secrets Manager
 */
async function getAlphaVantageCredentials(): Promise<AlphaVantageCredentials | null> {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const secretArn = process.env.ALPHA_VANTAGE_SECRET_ARN;
  if (!secretArn) {
    logger.warn('ALPHA_VANTAGE_SECRET_ARN not configured, using demo mode');
    return null;
  }

  try {
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-west-1' });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    cachedCredentials = JSON.parse(response.SecretString);
    logger.info('Alpha Vantage credentials loaded from Secrets Manager');
    return cachedCredentials;
  } catch (error) {
    logger.error('Failed to load Alpha Vantage credentials from Secrets Manager', error);
    return null;
  }
}

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
export class AlphaVantageClient {
  private client: AxiosInstance;
  private isDemoMode: boolean;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private lastCallTime: number = 0;
  private callCount: number = 0;
  private readonly RATE_LIMIT_CALLS = 5; // 5 calls per minute for free tier
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.alphavantage.co',
      timeout: 10000,
    });
    this.isDemoMode = true;
  }

  /**
   * Initialize the client with credentials
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const credentials = await getAlphaVantageCredentials();

      if (!credentials) {
        this.isDemoMode = true;
        logger.warn('Running in demo mode - Alpha Vantage integration disabled');
        this.initialized = true;
        return;
      }

      this.isDemoMode = false;
      logger.info('Alpha Vantage client initialized with API key');
      this.initialized = true;
    })();

    return this.initPromise;
  }

  /**
   * Rate limiting - wait if needed
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    // Reset counter if window expired
    if (timeSinceLastCall > this.RATE_LIMIT_WINDOW) {
      this.callCount = 0;
    }

    // If we've hit the limit, wait until window expires
    if (this.callCount >= this.RATE_LIMIT_CALLS) {
      const waitTime = this.RATE_LIMIT_WINDOW - timeSinceLastCall;
      if (waitTime > 0) {
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.callCount = 0;
      }
    }

    this.lastCallTime = Date.now();
    this.callCount++;
  }

  /**
   * Handle Alpha Vantage API errors
   */
  private handleError(error: any): never {
    const message = error.response?.data?.['Error Message'] || error.message;
    const status = error.response?.status;

    logger.error('Alpha Vantage API error', {
      status,
      message,
      data: error.response?.data,
    });

    throw new ExternalServiceError('Alpha Vantage', message, {
      status,
      data: error.response?.data,
    });
  }

  /**
   * Get daily time series data for a symbol
   * @param symbol Stock symbol
   * @param outputSize 'compact' (100 days) or 'full' (20+ years)
   */
  async getDailyTimeSeries(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<AlphaVantageDailyData[]> {
    await this.initialize();

    if (this.isDemoMode) {
      logger.warn('Alpha Vantage in demo mode, returning empty data');
      return [];
    }

    await this.rateLimit();

    try {
      const credentials = await getAlphaVantageCredentials();
      if (!credentials) {
        throw new Error('Alpha Vantage credentials not available');
      }

      const response = await this.client.get('/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: outputSize,
          apikey: credentials.apiKey,
        },
      });

      // Log full response for debugging
      logger.info('Alpha Vantage response received', {
        symbol,
        hasData: !!response.data,
        keys: Object.keys(response.data || {}),
      });

      // Check for API error messages
      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        // Rate limit message
        logger.warn('Alpha Vantage rate limit warning', { note: response.data['Note'] });
        throw new Error('Rate limit exceeded');
      }

      if (response.data['Information']) {
        logger.warn('Alpha Vantage information message', { info: response.data['Information'] });
        throw new Error(response.data['Information']);
      }

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        logger.error('Unexpected response format from Alpha Vantage', {
          symbol,
          responseKeys: Object.keys(response.data || {}),
          sampleData: JSON.stringify(response.data).substring(0, 500),
        });
        throw new Error('Invalid response format from Alpha Vantage');
      }

      // Convert to array format
      const data: AlphaVantageDailyData[] = [];
      for (const [date, values] of Object.entries(timeSeries as Record<string, any>)) {
        data.push({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        });
      }

      logger.info('Retrieved daily time series', {
        symbol,
        dataPoints: data.length,
      });

      return data;
    } catch (error: any) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      this.handleError(error);
    }
  }

  /**
   * Get adjusted daily time series (includes stock splits and dividends)
   */
  async getDailyAdjusted(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ): Promise<AlphaVantageDailyData[]> {
    await this.initialize();

    if (this.isDemoMode) {
      logger.warn('Alpha Vantage in demo mode, returning empty data');
      return [];
    }

    await this.rateLimit();

    try {
      const credentials = await getAlphaVantageCredentials();
      if (!credentials) {
        throw new Error('Alpha Vantage credentials not available');
      }

      const response = await this.client.get('/query', {
        params: {
          function: 'TIME_SERIES_DAILY_ADJUSTED',
          symbol,
          outputsize: outputSize,
          apikey: credentials.apiKey,
        },
      });

      // Log full response for debugging
      logger.info('Alpha Vantage response received', {
        symbol,
        hasData: !!response.data,
        keys: Object.keys(response.data || {}),
      });

      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        logger.warn('Alpha Vantage rate limit warning', { note: response.data['Note'] });
        throw new Error('Rate limit exceeded');
      }

      if (response.data['Information']) {
        logger.warn('Alpha Vantage information message', { info: response.data['Information'] });
        throw new Error(response.data['Information']);
      }

      // Try different possible keys for adjusted data
      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        logger.error('Unexpected response format from Alpha Vantage', {
          symbol,
          responseKeys: Object.keys(response.data || {}),
          sampleData: JSON.stringify(response.data).substring(0, 500),
        });
        throw new Error('Invalid response format from Alpha Vantage');
      }

      const data: AlphaVantageDailyData[] = [];
      for (const [date, values] of Object.entries(timeSeries as Record<string, any>)) {
        data.push({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['5. adjusted close']), // Use adjusted close
          volume: parseInt(values['6. volume']),
        });
      }

      logger.info('Retrieved daily adjusted time series', {
        symbol,
        dataPoints: data.length,
      });

      return data;
    } catch (error: any) {
      if (error instanceof ExternalServiceError) {
        throw error;
      }
      this.handleError(error);
    }
  }
}

// Export singleton instance
export const alphaVantageClient = new AlphaVantageClient();
