/**
 * Local script to run micro cap backtest
 * Run with: tsx scripts/run-micro-cap-backtest.ts
 */

import { Strategy, BacktestConfig, FactorType } from '@stock-picker/shared';
import { backtestService } from '../packages/backend/src/services/backtest.service.js';
import { randomUUID } from 'crypto';

async function runMicroCapBacktest() {
  console.log('🚀 Running Micro Cap Winner Backtest...\n');

  // Define optimized micro cap strategy
  const microCapStrategy: Strategy = {
    id: randomUUID(),
    name: 'Micro Cap Winner',
    portfolioId: 'local-demo',
    enabled: true,
    description: 'Aggressive momentum strategy optimized for micro caps',
    factors: [
      {
        name: 'RSI',
        type: FactorType.TECHNICAL,
        weight: 0.4,
        enabled: true,
        params: {
          period: 10,
          oversold: 40,
          overbought: 60,
        },
      },
      {
        name: 'MACD',
        type: FactorType.TECHNICAL,
        weight: 0.3,
        enabled: true,
        params: {
          fastPeriod: 8,
          slowPeriod: 17,
          signalPeriod: 6,
        },
      },
      {
        name: 'MA_Crossover',
        type: FactorType.TECHNICAL,
        weight: 0.3,
        enabled: true,
        params: {
          shortPeriod: 10,
          longPeriod: 20,
        },
      },
    ],
    riskManagement: {
      maxPositionSize: 0.20,
      stopLossPercent: 0.08,
      takeProfitPercent: 0.25,
      maxPositions: 5,
    },
    stockUniverse: [
      'AAOI',  // $85M
      'AVNW',  // $125M
      'BELFB', // $145M
      'AOSL',  // $180M
      'ARLO',  // $195M
      'ALRM',  // $250M
      'ARQT',  // $265M
      'APPS',  // $275M
      'AEIS',  // $280M
      'AMBA',  // $290M
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const backtestConfig: BacktestConfig = {
    strategyId: microCapStrategy.id,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCash: 50000,
    commission: 0.5,
    slippage: 0.002,
  };

  console.log('📊 Portfolio Configuration:');
  console.log('├── Name: Micro Cap Winner Portfolio');
  console.log('├── Stocks:', microCapStrategy.stockUniverse.length);
  console.log('├── Initial Capital: $50,000');
  console.log('├── Period: 2024-01-01 to 2024-12-31');
  console.log('└── Commission: $0.50/trade\n');

  console.log('⚙️  Strategy Parameters:');
  console.log('├── RSI (40%): period=10, oversold=40, overbought=60');
  console.log('├── MACD (30%): fast=8, slow=17, signal=6');
  console.log('├── MA Crossover (30%): short=10, long=20');
  console.log('└── Risk: 20% max position, 8% stop loss, 25% take profit\n');

  console.log('🔄 Running backtest...\n');

  try {
    const performance = await backtestService.runBacktest(
      randomUUID(),
      backtestConfig,
      microCapStrategy,
      { skipDatabaseRecording: true }
    );

    const finalValue = backtestConfig.initialCash + (performance.totalReturn || 0);
    const roi = ((finalValue - backtestConfig.initialCash) / backtestConfig.initialCash) * 100;

    console.log('✅ Backtest Complete!\n');
    console.log('═══════════════════════════════════════════════');
    console.log('📈 MICRO CAP WINNER PORTFOLIO - 2024 RESULTS');
    console.log('═══════════════════════════════════════════════\n');

    console.log('💰 Financial Performance:');
    console.log(`├── Initial Capital:     $${backtestConfig.initialCash.toLocaleString()}`);
    console.log(`├── Final Value:         $${finalValue.toFixed(2)}`);
    console.log(`├── Total Return:        $${(performance.totalReturn || 0).toFixed(2)}`);
    console.log(`└── ROI:                 ${roi.toFixed(2)}%`);
    console.log();

    console.log('📊 Trading Activity:');
    console.log(`├── Total Trades:        ${performance.totalTrades || 0}`);
    console.log(`├── Winning Trades:      ${performance.winningTrades || 0}`);
    console.log(`├── Losing Trades:       ${performance.losingTrades || 0}`);
    console.log(`└── Win Rate:            ${((performance.winRate || 0) * 100).toFixed(1)}%`);
    console.log();

    console.log('📉 Risk Metrics:');
    console.log(`├── Sharpe Ratio:        ${(performance.sharpeRatio || 0).toFixed(2)}`);
    console.log(`├── Max Drawdown:        ${(performance.maxDrawdown || 0).toFixed(2)}%`);
    console.log(`├── Profit Factor:       ${(performance.profitFactor || 0).toFixed(2)}`);
    console.log(`├── Average Win:         $${(performance.averageWin || 0).toFixed(2)}`);
    console.log(`└── Average Loss:        $${Math.abs(performance.averageLoss || 0).toFixed(2)}`);
    console.log();

    const outcome = roi > 20 ? '🏆 EXCELLENT' :
                    roi > 10 ? '✅ GOOD' :
                    roi > 0 ? '👍 POSITIVE' : '❌ LOSS';

    console.log(`🎯 Overall Assessment:   ${outcome}`);
    console.log();

    if (roi > 0) {
      console.log('💡 This portfolio shows positive returns! The strategy is profitable.');
    } else if (performance.totalTrades === 0) {
      console.log('💡 No trades generated. Consider lowering signal thresholds or adjusting');
      console.log('   factor parameters to generate more trading opportunities.');
    } else {
      console.log('💡 Strategy needs optimization. Try adjusting factor weights or risk');
      console.log('   management parameters to improve performance.');
    }

    console.log('\n═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Backtest failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMicroCapBacktest();
