/**
 * Demo setup handler - creates user, portfolio, and strategy
 */
import { createApiResponse, getUserId } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';
import { FactorType } from '@stock-picker/shared';
/**
 * Set up complete demo environment with user, portfolio, and strategy
 */
export async function handler(event) {
    try {
        logger.info('Setting up demo environment...');
        // Get authenticated user ID
        const userId = await getUserId(event);
        logger.info('Creating portfolio for authenticated user', { userId });
        logger.info('Demo user created/updated', { userId });
        // Create micro cap portfolio
        const portfolioResult = await query(`INSERT INTO portfolios (user_id, name, description, cash_balance, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, cash_balance`, [
            userId,
            'Micro Cap Winner Portfolio',
            'Top 10 micro-cap stocks with aggressive momentum strategy',
            50000
        ]);
        const portfolio = portfolioResult.rows[0];
        logger.info('Portfolio created/updated', { portfolioId: portfolio.id });
        // Create strategy
        const strategyConfig = {
            factors: [
                {
                    name: 'RSI',
                    type: FactorType.TECHNICAL,
                    weight: 0.4,
                    enabled: true,
                    params: { period: 10, oversold: 40, overbought: 60 },
                },
                {
                    name: 'MACD',
                    type: FactorType.TECHNICAL,
                    weight: 0.3,
                    enabled: true,
                    params: { fast: 8, slow: 17, signal: 6 },
                },
                {
                    name: 'MA_Crossover',
                    type: FactorType.TECHNICAL,
                    weight: 0.3,
                    enabled: true,
                    params: { short: 10, long: 20 },
                },
            ],
            riskManagement: {
                maxPositionSize: 0.20,
                stopLossPercent: 0.08,
                takeProfitPercent: 0.25,
                maxPositions: 5,
            },
            stockUniverse: [
                'AAOI', 'AVNW', 'BELFB', 'AOSL', 'ARLO',
                'ALRM', 'ARQT', 'APPS', 'AEIS', 'AMBA'
            ],
        };
        const strategyResult = await query(`INSERT INTO strategies (
        portfolio_id, name, description, factors, risk_management,
        stock_universe, enabled, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, name, enabled`, [
            portfolio.id,
            'Micro Cap Momentum',
            'Aggressive momentum strategy for micro caps',
            JSON.stringify(strategyConfig.factors),
            JSON.stringify(strategyConfig.riskManagement),
            strategyConfig.stockUniverse,
            true
        ]);
        const strategy = strategyResult.rows[0];
        logger.info('Strategy created/updated', { strategyId: strategy.id });
        return createApiResponse(200, {
            success: true,
            message: 'Demo environment setup complete',
            data: {
                userId,
                portfolio: {
                    id: portfolio.id,
                    name: portfolio.name,
                    cashBalance: portfolio.cash_balance,
                },
                strategy: {
                    id: strategy.id,
                    name: strategy.name,
                    enabled: strategy.enabled,
                    stocks: strategyConfig.stockUniverse.length,
                },
            },
            instructions: {
                frontend: 'Visit https://d18x5273m9nt2k.cloudfront.net',
                apiHeader: 'Add header: x-user-id: demo-user-1',
                portfolioId: portfolio.id,
                strategyId: strategy.id,
            },
        });
    }
    catch (error) {
        logger.error('Demo setup failed:', error);
        return createApiResponse(500, {
            success: false,
            error: 'Failed to set up demo environment',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=demo-setup.handler.js.map