/**
 * Demo endpoint to backtest the Small Cap Alpha Hunter strategy
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from '../utils/api.utils.js';
import { backtestService } from '../services/backtest.service.js';
import { logger } from '../utils/logger.js';
import type { Strategy, FactorType, BacktestConfig } from '@stock-picker/shared';
import { FactorType as FactorTypeEnum } from '@stock-picker/shared';
import { randomUUID } from 'crypto';

/**
 * Run backtest with Small Cap Alpha Hunter strategy
 * POST /demo/alpha-backtest
 *
 * Query params:
 * - startDate: Start date (default: 2024-01-01)
 * - endDate: End date (default: 2024-12-31)
 * - initialCash: Starting capital (default: 100000)
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Running Small Cap Alpha Hunter backtest');

    // Parse query parameters
    const startDate = event.queryStringParameters?.startDate || '2024-01-01';
    const endDate = event.queryStringParameters?.endDate || '2024-12-31';
    const initialCash = parseInt(
      event.queryStringParameters?.initialCash || '100000'
    );

    // Define Small Cap Alpha Hunter strategy
    // Note: The actual scoring logic is in SmallCapAlphaStrategy class
    // These factors are just placeholders to satisfy the config structure
    // SmallCapAlphaStrategy overrides generateSignals and doesn't use these
    const alphaStrategy: Strategy = {
      id: randomUUID(),
      name: 'Small Cap Alpha Hunter',
      portfolioId: 'demo',
      enabled: true,
      factors: [
        {
          name: 'RSI',
          type: FactorTypeEnum.TECHNICAL,
          weight: 0.2,
          enabled: false, // Disabled - strategy has custom logic
          params: {
            period: 14,
            oversold: 30,
          },
        },
        {
          name: 'MACD',
          type: FactorTypeEnum.TECHNICAL,
          weight: 0.2,
          enabled: false, // Disabled - strategy has custom logic
          params: {
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
          },
        },
        {
          name: 'MA_Crossover',
          type: FactorTypeEnum.TECHNICAL,
          weight: 0.2,
          enabled: false, // Disabled - strategy has custom logic
          params: {
            shortPeriod: 20,
            longPeriod: 50,
          },
        },
      ],
      riskManagement: {
        maxPositionSize: 0.15, // 15% max per position
        stopLossPercent: 0.10, // 10% stop loss
        takeProfitPercent: 0.30, // 30% take profit
        maxPositions: 5, // Max 5 positions
      },
      stockUniverse: [
        // Small cap tech
        'AAOI', 'AEIS', 'ALRM', 'AMBA', 'AOSL', 'APPS', 'ARLO', 'AVNW',
        // Healthcare small caps
        'ADMA', 'AKRO', 'ALEC', 'ALLO', 'ALPN', 'ALVO', 'ANAB',
        // Financials
        'ABCB', 'ABTX', 'AFBI', 'ALRS', 'AMTB',
        // Industrials
        'AAON', 'ACHR', 'AIR', 'ALG', 'ARCB', 'ASTE',
        // Energy
        'AROC', 'CDEV', 'CRC', 'GPRE', 'HPK', 'NOG',
        // Consumer
        'BOOT', 'CAKE', 'CAL', 'CRMT', 'DBI',
        // Materials
        'CENX', 'CSTE', 'HAYN',
        // Utilities
        'AMPS', 'NWE', 'SJW',
        // Real Estate
        'AIV', 'CLDT', 'GTY',
        // Communications
        'GOGO', 'IMAX', 'SHEN',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Backtest configuration
    const backtestConfig: BacktestConfig = {
      strategyId: alphaStrategy.id,
      startDate,
      endDate,
      initialCash,
      commission: 1.0,
      slippage: 0.001,
    };

    // Run backtest (skip database recording for demo)
    const backtestId = randomUUID();
    const performance = await backtestService.runBacktest(
      backtestId,
      backtestConfig,
      alphaStrategy,
      { skipDatabaseRecording: true }
    );

    logger.info('Small Cap Alpha Hunter backtest complete', {
      totalReturn: performance.totalReturn,
      trades: performance.totalTrades,
      winRate: performance.winRate,
    });

    return createApiResponse(200, {
      message: 'Small Cap Alpha Hunter backtest complete',
      strategy: {
        name: alphaStrategy.name,
        description: 'Multi-factor combined strategy with 5 scoring factors',
        factors: alphaStrategy.factors.map(f => f.name),
      },
      backtest: {
        period: `${startDate} to ${endDate}`,
        initialCash,
        performance,
      },
      interpretation: {
        performance: (performance.totalReturn ?? 0) > 0.20 ? 'Excellent' :
                     (performance.totalReturn ?? 0) > 0.10 ? 'Good' :
                     (performance.totalReturn ?? 0) > 0 ? 'Positive' : 'Needs work',
        tradingActivity: performance.totalTrades > 100 ? 'Very Active' :
                        performance.totalTrades > 50 ? 'Active' :
                        performance.totalTrades > 20 ? 'Moderate' : 'Conservative',
        consistency: performance.winRate > 0.60 ? 'Highly consistent' :
                    performance.winRate > 0.50 ? 'Consistent' :
                    performance.winRate > 0.40 ? 'Moderate' : 'Needs improvement',
      },
    });
  } catch (error) {
    logger.error('Failed to run Small Cap Alpha Hunter backtest', error);
    return createApiResponse(500, {
      error: 'Failed to run backtest',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
