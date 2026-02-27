/**
 * Diagnostics endpoint - check system status without full backtest
 */
import { createApiResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';
/**
 * Check price data availability
 */
export async function checkDiagnostics(event) {
    try {
        logger.info('Running diagnostics...');
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        const diagnostics = {
            symbols: {},
            summary: {
                totalSymbols: symbols.length,
                symbolsWithData: 0,
                totalPricePoints: 0,
            }
        };
        // Check each symbol
        for (const symbol of symbols) {
            const result = await query(`SELECT COUNT(*) as count,
                MIN(timestamp) as earliest,
                MAX(timestamp) as latest
         FROM stock_prices
         WHERE symbol = $1
           AND timestamp >= $2
           AND timestamp <= $3`, [symbol, startDate, endDate]);
            const row = result.rows[0];
            const count = parseInt(row?.count || '0');
            diagnostics.symbols[symbol] = {
                hasData: count > 0,
                dataPoints: count,
                earliest: row?.earliest || null,
                latest: row?.latest || null,
            };
            if (count > 0) {
                diagnostics.summary.symbolsWithData++;
                diagnostics.summary.totalPricePoints += count;
            }
        }
        // Check if stock records exist
        const stocksResult = await query(`SELECT symbol FROM stocks WHERE symbol = ANY($1)`, [symbols]);
        diagnostics.stocksInDatabase = stocksResult.rows.map(r => r.symbol);
        logger.info('Diagnostics complete', diagnostics);
        return createApiResponse(200, {
            success: true,
            diagnostics,
            message: diagnostics.summary.symbolsWithData === 0
                ? 'No price data found - database may need seeding'
                : `Found data for ${diagnostics.summary.symbolsWithData}/${diagnostics.summary.totalSymbols} symbols`
        });
    }
    catch (error) {
        logger.error('Diagnostics failed:', error);
        return createApiResponse(500, {
            success: false,
            error: 'Diagnostics failed',
            message: error.message,
            details: error.stack,
        });
    }
}
//# sourceMappingURL=demo-diagnostics.handler.js.map