/**
 * Custom micro cap backtest with optimized aggressive strategy
 */
import { createApiResponse } from '../utils/api.utils.js';
import { backtestService } from '../services/backtest.service.js';
import { logger } from '../utils/logger.js';
import { FactorType } from '@stock-picker/shared';
import { randomUUID } from 'crypto';
/**
 * Run backtest with Micro Cap Winner strategy
 * Optimized for synthetic data with lower thresholds
 */
export async function handler(event) {
    try {
        logger.info('Running Micro Cap Winner backtest');
        // Parse query parameters
        const initialCash = parseInt(event.queryStringParameters?.initialCash || '50000');
        // Define Micro Cap Winner strategy with aggressive parameters
        const microCapStrategy = {
            id: randomUUID(),
            name: 'Micro Cap Winner',
            portfolioId: 'demo',
            enabled: true,
            description: 'Aggressive momentum strategy optimized for micro caps',
            factors: [
                {
                    name: 'RSI',
                    type: FactorType.TECHNICAL,
                    weight: 0.4, // 40% weight
                    enabled: true,
                    params: {
                        period: 10, // Shorter period for faster signals
                        oversold: 40, // More relaxed thresholds
                        overbought: 60,
                    },
                },
                {
                    name: 'MACD',
                    type: FactorType.TECHNICAL,
                    weight: 0.3, // 30% weight
                    enabled: true,
                    params: {
                        fast: 8, // Faster MACD
                        slow: 17,
                        signal: 6,
                    },
                },
                {
                    name: 'MA_Crossover',
                    type: FactorType.TECHNICAL,
                    weight: 0.3, // 30% weight
                    enabled: true,
                    params: {
                        short: 10, // Shorter MAs for more signals
                        long: 20,
                    },
                },
            ],
            riskManagement: {
                maxPositionSize: 0.20, // 20% per position (aggressive)
                stopLossPercent: 0.08, // 8% stop loss (tighter)
                takeProfitPercent: 0.25, // 25% take profit
                maxPositions: 5, // Hold up to 5 stocks
            },
            // Top 10 micro cap stocks we seeded
            stockUniverse: [
                'AAOI', // $85M - Applied Optoelectronics
                'AVNW', // $125M - Aviat Networks
                'BELFB', // $145M - Bel Fuse
                'AOSL', // $180M - Alpha & Omega Semiconductor
                'ARLO', // $195M - Arlo Technologies
                'ALRM', // $250M - Alarm.com
                'ARQT', // $265M - Arcutis Biotherapeutics
                'APPS', // $275M - Digital Turbine
                'AEIS', // $280M - Advanced Energy
                'AMBA', // $290M - Ambarella
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Backtest configuration
        const backtestConfig = {
            strategyId: microCapStrategy.id,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            initialCash,
            commission: 0.5, // Lower commission for micro caps
            slippage: 0.002, // 0.2% slippage
        };
        logger.info('Starting Micro Cap Winner backtest...', {
            strategy: microCapStrategy.name,
            stocks: microCapStrategy.stockUniverse.length,
            period: `${backtestConfig.startDate} to ${backtestConfig.endDate}`,
            initialCash,
        });
        // Run backtest
        const backtestId = randomUUID();
        const performance = await backtestService.runBacktest(backtestId, backtestConfig, microCapStrategy, { skipDatabaseRecording: true });
        logger.info('Micro Cap Winner backtest complete', {
            totalReturn: performance.totalReturn,
            trades: performance.totalTrades,
            winRate: performance.winRate,
        });
        // Calculate additional metrics
        const finalValue = initialCash + (performance.totalReturn || 0);
        const roi = ((finalValue - initialCash) / initialCash) * 100;
        return createApiResponse(200, {
            success: true,
            portfolio: {
                name: 'Micro Cap Winner Portfolio',
                strategy: microCapStrategy.name,
                universe: microCapStrategy.stockUniverse,
                stockCount: microCapStrategy.stockUniverse.length,
            },
            backtest: {
                period: '2024-01-01 to 2024-12-31',
                initialCash: `$${initialCash.toLocaleString()}`,
                finalValue: `$${finalValue.toFixed(2)}`,
                commission: backtestConfig.commission,
            },
            performance: {
                totalReturn: `$${(performance.totalReturn || 0).toFixed(2)}`,
                roi: `${roi.toFixed(2)}%`,
                sharpeRatio: (performance.sharpeRatio || 0).toFixed(2),
                maxDrawdown: `${(performance.maxDrawdown || 0).toFixed(2)}%`,
                totalTrades: performance.totalTrades || 0,
                winningTrades: performance.winningTrades || 0,
                losingTrades: performance.losingTrades || 0,
                winRate: `${((performance.winRate || 0) * 100).toFixed(1)}%`,
                profitFactor: (performance.profitFactor || 0).toFixed(2),
                averageWin: `$${(performance.averageWin || 0).toFixed(2)}`,
                averageLoss: `$${Math.abs(performance.averageLoss || 0).toFixed(2)}`,
            },
            strategy: {
                name: microCapStrategy.name,
                factors: microCapStrategy.factors.map(f => ({
                    name: f.name,
                    weight: `${(f.weight * 100).toFixed(0)}%`,
                    enabled: f.enabled,
                    params: f.params,
                })),
                riskManagement: {
                    maxPositionSize: `${(microCapStrategy.riskManagement.maxPositionSize * 100)}%`,
                    stopLoss: `${((microCapStrategy.riskManagement.stopLossPercent || 0) * 100)}%`,
                    takeProfit: `${((microCapStrategy.riskManagement.takeProfitPercent || 0) * 100)}%`,
                    maxPositions: microCapStrategy.riskManagement.maxPositions,
                },
            },
            interpretation: {
                outcome: roi > 20 ? '🏆 Excellent' :
                    roi > 10 ? '✅ Good' :
                        roi > 0 ? '👍 Positive' : '❌ Loss',
                tradingStyle: (performance.totalTrades || 0) > 100 ? 'Very Active' :
                    (performance.totalTrades || 0) > 50 ? 'Active' :
                        (performance.totalTrades || 0) > 20 ? 'Moderate' : 'Conservative',
                reliability: (performance.winRate || 0) > 0.55 ? 'Highly Reliable' :
                    (performance.winRate || 0) > 0.45 ? 'Reliable' :
                        (performance.winRate || 0) > 0.35 ? 'Moderate' : 'Needs Work',
            },
        });
    }
    catch (error) {
        logger.error('Failed to run Micro Cap Winner backtest', error);
        return createApiResponse(500, {
            success: false,
            error: 'Failed to run backtest',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=demo-micro-cap-backtest.handler.js.map