/**
 * Migrate portfolio from old user to Auth0 user
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createApiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const email = event.queryStringParameters?.email;
    const action = event.queryStringParameters?.action;

    if (!email) {
      return createApiResponse(400, { error: 'Email parameter required' });
    }

    // Handle seed-prices action
    if (action === 'seed-prices') {
      logger.info('Seeding price data for micro cap stocks');

      const stocks = ['AAOI', 'AVNW', 'BELFB', 'AOSL', 'ARLO', 'ALRM', 'ARQT', 'APPS', 'AEIS', 'AMBA'];
      const daysBack = 90;
      let recordsAdded = 0;

      for (const symbol of stocks) {
        let price = 10.00; // Start at $10

        for (let i = daysBack; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);

          // Random walk: -2% to +2% daily change
          const change = (Math.random() - 0.5) * 0.04;
          price = price * (1 + change);

          const open = price * (1 + (Math.random() - 0.5) * 0.02);
          const close = price;
          const high = Math.max(open, close) * (1 + Math.random() * 0.01);
          const low = Math.min(open, close) * (1 - Math.random() * 0.01);
          const volume = Math.floor(1000000 + Math.random() * 5000000);

          await query(
            `INSERT INTO stock_prices (symbol, timestamp, open, high, low, close, volume)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (symbol, timestamp) DO NOTHING`,
            [symbol, date.toISOString(), open.toFixed(4), high.toFixed(4), low.toFixed(4), close.toFixed(4), volume]
          );
          recordsAdded++;
        }
      }

      return createApiResponse(200, {
        success: true,
        message: `Seeded ${recordsAdded} price records for ${stocks.length} stocks`,
        stocks: stocks.length,
        days: daysBack + 1,
        records: recordsAdded
      });
    }

    // Handle rebalance action
    if (action === 'rebalance') {
      logger.info('Rebalancing portfolio', { email });

      // Find portfolio
      const portfolioResult = await query(
        `SELECT p.id FROM portfolios p
         JOIN users u ON p.user_id = u.id
         WHERE u.email = $1 AND p.name = 'Micro Cap Winner Portfolio'
         LIMIT 1`,
        [email]
      );

      if (portfolioResult.rows.length === 0) {
        return createApiResponse(404, { error: 'Portfolio not found' });
      }

      const portfolioId = portfolioResult.rows[0].id;

      // Update to 80% invested / 20% cash
      await query(
        'UPDATE portfolios SET cash_balance = 10000, updated_at = NOW() WHERE id = $1',
        [portfolioId]
      );

      await query(
        `UPDATE positions
         SET quantity = 400,
             cost_basis = 4000.00,
             market_value = 4000.00,
             updated_at = NOW()
         WHERE portfolio_id = $1`,
        [portfolioId]
      );

      return createApiResponse(200, {
        success: true,
        message: 'Portfolio rebalanced to 80% invested / 20% cash',
        allocation: {
          cash: '$10,000 (20%)',
          invested: '$40,000 (80%)',
          perStock: '400 shares @ $10 = $4,000 each'
        }
      });
    }

    logger.info('Setting up portfolio for user', { email });

    // Try to find existing Auth0 user by email
    const auth0User = await query(
      'SELECT id, email FROM users WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    let userId: string;

    if (auth0User.rows.length === 0) {
      // User doesn't exist - create with Auth0 format ID
      logger.info('User not found, creating Auth0 user', { email });

      // Generate Auth0-style ID (auth0|<random>)
      // In production, this would come from the actual Auth0 token
      // For now, use a predictable format for the demo
      const auth0Id = `auth0|699d6abd87b15d3634e6ce0c`; // The ID from the logs

      const createResult = await query(
        'INSERT INTO users (id, email, name, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT (id) DO NOTHING RETURNING id',
        [auth0Id, email, 'User']
      );

      userId = createResult.rows.length > 0 ? createResult.rows[0].id : auth0Id;
      logger.info('User created', { userId });
    } else {
      userId = auth0User.rows[0].id;
      logger.info('Using existing user', { userId });
    }

    // Check if portfolio already exists for this user
    const existingPortfolio = await query(
      `SELECT id, name FROM portfolios WHERE user_id = $1 AND name = 'Micro Cap Winner Portfolio'`,
      [userId]
    );

    if (existingPortfolio.rows.length > 0) {
      const portfolioId = existingPortfolio.rows[0].id;

      // First, ensure all stocks exist in the stocks table
      const stocksData = [
        { symbol: 'AAOI', name: 'Applied Optoelectronics Inc.', marketCap: 85000000 },
        { symbol: 'AVNW', name: 'Aviat Networks Inc.', marketCap: 125000000 },
        { symbol: 'BELFB', name: 'Bel Fuse Inc. Class B', marketCap: 145000000 },
        { symbol: 'AOSL', name: 'Alpha and Omega Semiconductor Ltd.', marketCap: 180000000 },
        { symbol: 'ARLO', name: 'Arlo Technologies Inc.', marketCap: 195000000 },
        { symbol: 'ALRM', name: 'Alarm.com Holdings Inc.', marketCap: 250000000 },
        { symbol: 'ARQT', name: 'Arcutis Biotherapeutics Inc.', marketCap: 265000000 },
        { symbol: 'APPS', name: 'Digital Turbine Inc.', marketCap: 275000000 },
        { symbol: 'AEIS', name: 'Advanced Energy Industries Inc.', marketCap: 280000000 },
        { symbol: 'AMBA', name: 'Ambarella Inc.', marketCap: 290000000 }
      ];

      // Insert stocks if they don't exist
      for (const stock of stocksData) {
        await query(
          `INSERT INTO stocks (symbol, name, exchange, sector, industry, market_cap, tradable)
           VALUES ($1, $2, 'NASDAQ', 'Technology', 'Various', $3, true)
           ON CONFLICT (symbol) DO NOTHING`,
          [stock.symbol, stock.name, stock.marketCap]
        );
      }

      // Add positions if they don't exist
      const stocksToAdd = stocksData.map(s => s.symbol);
      let positionsAdded = 0;

      for (const symbol of stocksToAdd) {
        const quantity = 100;
        const avgPrice = 10.00;
        const costBasis = quantity * avgPrice;

        const result = await query(
          `INSERT INTO positions (portfolio_id, symbol, quantity, average_price, current_price, cost_basis, market_value, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (portfolio_id, symbol) DO NOTHING
           RETURNING id`,
          [portfolioId, symbol, quantity, avgPrice, avgPrice, costBasis, costBasis]
        );
        if (result.rows.length > 0) positionsAdded++;
      }

      return createApiResponse(200, {
        success: true,
        message: `Portfolio exists, added ${positionsAdded} positions`,
        portfolio: existingPortfolio.rows[0],
        positionsAdded,
      });
    }

    // Create new portfolio
    const portfolioResult = await query(
      `INSERT INTO portfolios (user_id, name, description, cash_balance, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, cash_balance`,
      [
        userId,
        'Micro Cap Winner Portfolio',
        'Top 10 micro-cap stocks with aggressive momentum strategy',
        50000
      ]
    );

    const portfolio = portfolioResult.rows[0];

    // Create strategy
    const strategyConfig = {
      factors: [
        { name: 'RSI', type: 'technical', weight: 0.4, enabled: true, params: { period: 10, oversold: 40, overbought: 60 } },
        { name: 'MACD', type: 'technical', weight: 0.3, enabled: true, params: { fast: 8, slow: 17, signal: 6 } },
        { name: 'MA_Crossover', type: 'technical', weight: 0.3, enabled: true, params: { short: 10, long: 20 } }
      ],
      riskManagement: {
        maxPositionSize: 0.20,
        stopLossPercent: 0.08,
        takeProfitPercent: 0.25,
        maxPositions: 5
      },
      stockUniverse: ['AAOI', 'AVNW', 'BELFB', 'AOSL', 'ARLO', 'ALRM', 'ARQT', 'APPS', 'AEIS', 'AMBA']
    };

    const strategyResult = await query(
      `INSERT INTO strategies (
        portfolio_id, name, description, factors, risk_management,
        stock_universe, enabled, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, name, enabled`,
      [
        portfolio.id,
        'Micro Cap Momentum',
        'Aggressive momentum strategy for micro caps',
        JSON.stringify(strategyConfig.factors),
        JSON.stringify(strategyConfig.riskManagement),
        strategyConfig.stockUniverse,
        true
      ]
    );

    // First, ensure all stocks exist
    const stocksData = [
      { symbol: 'AAOI', name: 'Applied Optoelectronics Inc.', marketCap: 85000000 },
      { symbol: 'AVNW', name: 'Aviat Networks Inc.', marketCap: 125000000 },
      { symbol: 'BELFB', name: 'Bel Fuse Inc. Class B', marketCap: 145000000 },
      { symbol: 'AOSL', name: 'Alpha and Omega Semiconductor Ltd.', marketCap: 180000000 },
      { symbol: 'ARLO', name: 'Arlo Technologies Inc.', marketCap: 195000000 },
      { symbol: 'ALRM', name: 'Alarm.com Holdings Inc.', marketCap: 250000000 },
      { symbol: 'ARQT', name: 'Arcutis Biotherapeutics Inc.', marketCap: 265000000 },
      { symbol: 'APPS', name: 'Digital Turbine Inc.', marketCap: 275000000 },
      { symbol: 'AEIS', name: 'Advanced Energy Industries Inc.', marketCap: 280000000 },
      { symbol: 'AMBA', name: 'Ambarella Inc.', marketCap: 290000000 }
    ];

    for (const stock of stocksData) {
      await query(
        `INSERT INTO stocks (symbol, name, exchange, sector, industry, market_cap, tradable)
         VALUES ($1, $2, 'NASDAQ', 'Technology', 'Various', $3, true)
         ON CONFLICT (symbol) DO NOTHING`,
        [stock.symbol, stock.name, stock.marketCap]
      );
    }

    // Add initial positions for each stock (100 shares each at $10/share as demo)
    const stocksToAdd = strategyConfig.stockUniverse;
    for (const symbol of stocksToAdd) {
      const quantity = 100;
      const avgPrice = 10.00;
      const costBasis = quantity * avgPrice;

      await query(
        `INSERT INTO positions (portfolio_id, symbol, quantity, average_price, current_price, cost_basis, market_value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (portfolio_id, symbol) DO NOTHING`,
        [portfolio.id, symbol, quantity, avgPrice, avgPrice, costBasis, costBasis]
      );
    }

    logger.info('Portfolio and positions created successfully', {
      portfolioId: portfolio.id,
      userId: userId,
      email
    });

    return createApiResponse(200, {
      success: true,
      message: 'Portfolio created successfully',
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        cashBalance: portfolio.cash_balance,
        email: email,
      },
      userId: userId,
    });
  } catch (error) {
    logger.error('Migration failed', error);
    return createApiResponse(500, {
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
