#!/usr/bin/env node
/**
 * Script to populate stocks table with common trading symbols
 */
import { query } from '../config/database.js';
// Popular stocks for trading
const STOCKS = [
    // Tech Giants
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    // Finance
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', sector: 'Financial Services' },
    // Healthcare
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', sector: 'Healthcare' },
    // Consumer
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', sector: 'Consumer Defensive' },
    { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', sector: 'Consumer Cyclical' },
    // Industrial/Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', sector: 'Energy' },
    { symbol: 'BA', name: 'The Boeing Company', exchange: 'NYSE', sector: 'Industrials' },
    // Communication
    { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE', sector: 'Communication Services' },
    { symbol: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', sector: 'Communication Services' },
    // Semiconductors
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    // Retail
    { symbol: 'HD', name: 'The Home Depot Inc.', exchange: 'NYSE', sector: 'Consumer Cyclical' },
    { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', sector: 'Consumer Defensive' },
    // Software/Cloud
    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', sector: 'Technology' },
];
async function main() {
    console.log('📊 Populating stocks table...\n');
    try {
        // Insert stocks with ON CONFLICT to handle duplicates
        let inserted = 0;
        let updated = 0;
        for (const stock of STOCKS) {
            try {
                const result = await query(`
          INSERT INTO stocks (symbol, name, exchange, sector)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (symbol) DO UPDATE SET
            name = EXCLUDED.name,
            exchange = EXCLUDED.exchange,
            sector = EXCLUDED.sector,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `, [stock.symbol, stock.name, stock.exchange, stock.sector || null]);
                if (result.rows[0].inserted) {
                    inserted++;
                    console.log(`✅ Inserted ${stock.symbol} - ${stock.name}`);
                }
                else {
                    updated++;
                    console.log(`🔄 Updated ${stock.symbol} - ${stock.name}`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to insert ${stock.symbol}: ${error.message}`);
            }
        }
        console.log(`\n📈 Summary:`);
        console.log(`  Inserted: ${inserted}`);
        console.log(`  Updated: ${updated}`);
        console.log(`  Total: ${STOCKS.length}`);
        // Verify total count
        const countResult = await query('SELECT COUNT(*) as count FROM stocks');
        console.log(`\n✅ Total stocks in database: ${countResult.rows[0].count}`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=populate-stocks.js.map