/**
 * Demo backtest handler - runs without requiring database setup
 */
import { backtestService } from '../services/backtest.service.js';
import { createApiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { FactorType } from '@stock-picker/shared';
import { randomUUID } from 'crypto';
/**
 * Run a demo backtest with hardcoded strategy
 */
export async function runDemoBacktest(event) {
    try {
        logger.info('Running demo backtest...');
        // Create demo strategy
        const demoStrategy = {
            id: 'demo-strategy-1',
            portfolioId: 'demo-portfolio-1',
            name: 'Demo Momentum Strategy',
            description: 'RSI and MACD momentum strategy for demonstration',
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
        // Create backtest config
        const backtestConfig = {
            strategyId: 'demo-strategy-1',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            initialCash: 100000,
            commission: 1.0,
            slippage: 0.001,
        };
        logger.info('Starting backtest execution...', {
            strategy: demoStrategy.name,
            period: `${backtestConfig.startDate} to ${backtestConfig.endDate}`,
        });
        // Run backtest (skip database recording for demo)
        const backtestId = randomUUID();
        const performance = await backtestService.runBacktest(backtestId, backtestConfig, demoStrategy, { skipDatabaseRecording: true });
        logger.info('Backtest completed successfully!', {
            totalReturn: performance.totalReturn,
            winRate: performance.winRate,
        });
        // Format results
        const results = {
            success: true,
            backtest: {
                name: 'Demo 2024 Momentum Backtest',
                strategy: demoStrategy.name,
                period: `${backtestConfig.startDate} to ${backtestConfig.endDate}`,
                initialCash: backtestConfig.initialCash,
                stockUniverse: demoStrategy.stockUniverse,
            },
            performance: {
                totalReturn: performance.totalReturn?.toFixed(2),
                totalReturnPercent: performance.totalReturnPercent?.toFixed(2) + '%',
                sharpeRatio: performance.sharpeRatio?.toFixed(2),
                maxDrawdown: performance.maxDrawdown?.toFixed(2) + '%',
                totalTrades: performance.totalTrades || 0,
                winningTrades: performance.winningTrades || 0,
                losingTrades: performance.losingTrades || 0,
                winRate: performance.winRate?.toFixed(2) + '%',
                profitFactor: performance.profitFactor?.toFixed(2),
                averageWin: '$' + (performance.averageWin?.toFixed(2) || '0'),
                averageLoss: '$' + (performance.averageLoss?.toFixed(2) || '0'),
            },
            timestamp: new Date().toISOString(),
        };
        return createApiResponse(200, results);
    }
    catch (error) {
        logger.error('Demo backtest failed:', error);
        return createApiResponse(500, {
            success: false,
            error: 'Backtest failed',
            message: error.message,
            details: error.stack,
        });
    }
}
//# sourceMappingURL=demo-backtest.handler.js.map