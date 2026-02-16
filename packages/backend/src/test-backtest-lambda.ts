/**
 * Lambda handler for testing backtest directly
 * This bypasses API Gateway and authentication for testing purposes
 */

import { backtestService } from './services/backtest.service.js';
import { query } from './config/database.js';
import { FactorType } from '@stock-picker/shared';
import type { BacktestConfig, Strategy } from '@stock-picker/shared';
import { logger } from './utils/logger.js';

export async function handler(event: any) {
  try {
    logger.info('Direct backtest test started');

    // Step 1: Create test data if it doesn't exist
    logger.info('Setting up test data...');

    await query(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      ['test-user-1', 'test@example.com', 'Test User']
    );

    await query(
      `INSERT INTO portfolios (id, user_id, name, description, cash_balance, trading_mode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      ['test-portfolio-1', 'test-user-1', 'Test Portfolio', 'For testing', 100000, 'paper']
    );

    // Step 2: Create strategy
    const strategy: Strategy = {
      id: 'test-strategy-1',
      portfolioId: 'test-portfolio-1',
      name: 'Momentum Test Strategy',
      description: 'RSI and MACD for testing',
      factors: [
        {
          name: 'RSI',
          type: FactorType.TECHNICAL,
          weight: 0.5,
          enabled: true,
          params: { period: 14, overbought: 70, oversold: 30 },
        },
        {
          name: 'MACD',
          type: FactorType.TECHNICAL,
          weight: 0.5,
          enabled: true,
          params: { fast: 12, slow: 26, signal: 9 },
        },
      ],
      riskManagement: {
        maxPositionSize: 0.2,
        maxPositions: 5,
        stopLossPercent: 0.05,
        takeProfitPercent: 0.15,
      },
      stockUniverse: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await query(
      `INSERT INTO strategies (id, portfolio_id, name, description, factors, risk_management, stock_universe, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         factors = $5::jsonb,
         risk_management = $6::jsonb,
         updated_at = NOW()`,
      [
        strategy.id,
        strategy.portfolioId,
        strategy.name,
        strategy.description,
        JSON.stringify(strategy.factors),
        JSON.stringify(strategy.riskManagement),
        strategy.stockUniverse,
        strategy.enabled,
      ]
    );

    logger.info('Test data setup complete');

    // Step 3: Run backtest
    const backtestConfig: BacktestConfig = {
      strategyId: 'test-strategy-1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      initialCash: 100000,
      commission: 1.0,
      slippage: 0.001,
    };

    logger.info('Starting backtest...');
    const performance = await backtestService.runBacktest(
      'test-backtest-direct',
      backtestConfig,
      strategy
    );

    // Step 4: Return results
    const results = {
      success: true,
      backtest: {
        strategy: strategy.name,
        period: `${backtestConfig.startDate} to ${backtestConfig.endDate}`,
        initialCash: backtestConfig.initialCash,
      },
      performance: {
        totalReturn: performance.totalReturn?.toFixed(2),
        totalReturnPercent: performance.totalReturnPercent?.toFixed(2) + '%',
        sharpeRatio: performance.sharpeRatio?.toFixed(2),
        maxDrawdown: performance.maxDrawdown?.toFixed(2) + '%',
        totalTrades: performance.totalTrades,
        winningTrades: performance.winningTrades,
        losingTrades: performance.losingTrades,
        winRate: performance.winRate?.toFixed(2) + '%',
        profitFactor: performance.profitFactor?.toFixed(2),
        averageWin: performance.averageWin?.toFixed(2),
        averageLoss: performance.averageLoss?.toFixed(2),
      },
    };

    logger.info('Backtest completed successfully', results);

    return {
      statusCode: 200,
      body: JSON.stringify(results, null, 2),
    };
  } catch (error: any) {
    logger.error('Backtest test failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}
