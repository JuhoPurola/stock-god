/**
 * Setup test data for backtest testing
 */
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
async function setupTestData() {
    logger.info('Setting up test data...');
    try {
        // Create test user
        await query(`INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`, ['test-user-1', 'test@example.com', 'Test User']);
        logger.info('✓ Test user created');
        // Create test portfolio
        await query(`INSERT INTO portfolios (id, user_id, name, description, cash_balance, trading_mode, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`, ['test-portfolio-1', 'test-user-1', 'Test Momentum Portfolio', 'For testing backtests', 100000, 'paper']);
        logger.info('✓ Test portfolio created');
        // Create test strategy
        const factors = [
            {
                name: 'RSI',
                type: 'technical',
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
                type: 'technical',
                weight: 0.5,
                enabled: true,
                params: {
                    fast: 12,
                    slow: 26,
                    signal: 9,
                },
            },
        ];
        const riskManagement = {
            maxPositionSize: 0.2,
            maxPositions: 5,
            stopLossPercent: 0.05,
            takeProfitPercent: 0.15,
        };
        const stockUniverse = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        await query(`INSERT INTO strategies (id, portfolio_id, name, description, factors, risk_management, stock_universe, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         factors = $5::jsonb,
         risk_management = $6::jsonb,
         stock_universe = $7,
         updated_at = NOW()`, [
            'test-strategy-1',
            'test-portfolio-1',
            'Momentum Test Strategy',
            'RSI and MACD momentum strategy for testing',
            JSON.stringify(factors),
            JSON.stringify(riskManagement),
            stockUniverse,
            true,
        ]);
        logger.info('✓ Test strategy created');
        // Verify
        const result = await query(`SELECT
        (SELECT COUNT(*) FROM users WHERE id = 'test-user-1') as users,
        (SELECT COUNT(*) FROM portfolios WHERE id = 'test-portfolio-1') as portfolios,
        (SELECT COUNT(*) FROM strategies WHERE id = 'test-strategy-1') as strategies`);
        console.log('\n=== Test Data Setup Complete ===');
        console.log('Users:', result.rows[0].users);
        console.log('Portfolios:', result.rows[0].portfolios);
        console.log('Strategies:', result.rows[0].strategies);
        console.log('\nTest IDs:');
        console.log('  User ID: test-user-1');
        console.log('  Portfolio ID: test-portfolio-1');
        console.log('  Strategy ID: test-strategy-1');
        console.log('================================\n');
    }
    catch (error) {
        logger.error('Failed to setup test data:', error);
        throw error;
    }
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupTestData()
        .then(() => {
        console.log('✅ Setup complete');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    });
}
export { setupTestData };
//# sourceMappingURL=setup-test-data.js.map