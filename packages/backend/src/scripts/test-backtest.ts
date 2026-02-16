/**
 * Test script to run a backtest and verify the integration
 */

import { backtestService } from '../services/backtest.service.js';
import { FactorType, TradingMode } from '@stock-picker/shared';
import type { BacktestConfig, Strategy } from '@stock-picker/shared';
import { logger } from '../utils/logger.js';

async function runTestBacktest() {
  logger.info('Starting backtest integration test...');

  // Create a test strategy configuration
  const testStrategy: Strategy = {
    id: 'test-strategy-1',
    portfolioId: 'test-portfolio-1',
    name: 'Test Momentum Strategy',
    description: 'Testing momentum strategy with RSI and MACD factors',
    factors: [
      {
        name: 'RSI',
        type: FactorType.TECHNICAL,
        weight: 0.5,
        enabled: true,
        params: {
          period: 14,
          overbought: 70,
          oversold: 30,
        },
      },
      {
        name: 'MACD',
        type: FactorType.TECHNICAL,
        weight: 0.5,
        enabled: true,
        params: {
          fast: 12,
          slow: 26,
          signal: 9,
        },
      },
    ],
    riskManagement: {
      maxPositionSize: 0.2, // 20% per position
      maxPositions: 5,
      stopLossPercent: 0.05, // 5% stop loss
      takeProfitPercent: 0.15, // 15% take profit
    },
    stockUniverse: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'], // Test with 5 popular stocks
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create backtest configuration
  const backtestConfig: BacktestConfig = {
    strategyId: 'test-strategy-1',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCash: 100000, // $100k starting capital
    commission: 1.0, // $1 per trade
    slippage: 0.001, // 0.1% slippage
  };

  try {
    logger.info('Running backtest...', {
      strategy: testStrategy.name,
      period: `${backtestConfig.startDate} to ${backtestConfig.endDate}`,
      initialCash: backtestConfig.initialCash,
    });

    const performance = await backtestService.runBacktest(
      'test-backtest-1',
      backtestConfig,
      testStrategy
    );

    // Log results
    logger.info('Backtest completed successfully!', {
      totalReturn: performance.totalReturn?.toFixed(2),
      totalReturnPercent: performance.totalReturnPercent?.toFixed(2) + '%',
      sharpeRatio: performance.sharpeRatio?.toFixed(2),
      maxDrawdown: performance.maxDrawdown?.toFixed(2) + '%',
      totalTrades: performance.totalTrades,
      winRate: performance.winRate?.toFixed(2) + '%',
      profitFactor: performance.profitFactor?.toFixed(2),
      averageWin: performance.averageWin?.toFixed(2),
      averageLoss: performance.averageLoss?.toFixed(2),
    });

    console.log('\n=== BACKTEST RESULTS ===');
    console.log(`Strategy: ${testStrategy.name}`);
    console.log(`Period: ${backtestConfig.startDate} to ${backtestConfig.endDate}`);
    console.log(`Initial Capital: $${backtestConfig.initialCash.toLocaleString()}`);
    console.log('\n--- Performance Metrics ---');
    console.log(`Total Return: $${performance.totalReturn?.toFixed(2) || 0}`);
    console.log(`Total Return %: ${performance.totalReturnPercent?.toFixed(2) || 0}%`);
    console.log(`Sharpe Ratio: ${performance.sharpeRatio?.toFixed(2) || 0}`);
    console.log(`Max Drawdown: ${performance.maxDrawdown?.toFixed(2) || 0}%`);
    console.log('\n--- Trading Statistics ---');
    console.log(`Total Trades: ${performance.totalTrades || 0}`);
    console.log(`Winning Trades: ${performance.winningTrades || 0}`);
    console.log(`Losing Trades: ${performance.losingTrades || 0}`);
    console.log(`Win Rate: ${performance.winRate?.toFixed(2) || 0}%`);
    console.log(`Profit Factor: ${performance.profitFactor?.toFixed(2) || 0}`);
    console.log(`Average Win: $${performance.averageWin?.toFixed(2) || 0}`);
    console.log(`Average Loss: $${performance.averageLoss?.toFixed(2) || 0}`);
    console.log(`Avg Trade Return: $${performance.avgTradeReturn?.toFixed(2) || 0}`);
    console.log('\n========================\n');

    return performance;
  } catch (error) {
    logger.error('Backtest failed:', error);
    console.error('\n❌ Backtest failed:', error);
    throw error;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTestBacktest()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { runTestBacktest };
