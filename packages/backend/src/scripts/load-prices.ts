#!/usr/bin/env node
/**
 * Script to load historical price data
 *
 * Usage:
 *   pnpm run load-prices -- --symbol AAPL
 *   pnpm run load-prices -- --symbols AAPL,GOOGL,MSFT
 *   pnpm run load-prices -- --all
 *   pnpm run load-prices -- --sample AAPL
 *   pnpm run load-prices -- --sample-all
 */

import { priceDataService } from '../services/price-data.service.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface Options {
  symbol?: string;
  symbols?: string[];
  all?: boolean;
  sample?: string;
  sampleAll?: boolean;
  full?: boolean; // Use full history (20+ years) vs compact (100 days)
}

async function parseArgs(): Promise<Options> {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--symbol':
        if (!nextArg) {
          throw new Error('--symbol requires a value');
        }
        options.symbol = nextArg;
        i++;
        break;
      case '--symbols':
        if (!nextArg) {
          throw new Error('--symbols requires a value');
        }
        options.symbols = nextArg.split(',').map((s) => s.trim().toUpperCase());
        i++;
        break;
      case '--all':
        options.all = true;
        break;
      case '--sample':
        if (!nextArg) {
          throw new Error('--sample requires a value');
        }
        options.sample = nextArg;
        i++;
        break;
      case '--sample-all':
        options.sampleAll = true;
        break;
      case '--full':
        options.full = true;
        break;
    }
  }

  return options;
}

async function getAllSymbols(): Promise<string[]> {
  const result = await query('SELECT symbol FROM stocks ORDER BY symbol');
  return result.rows.map((row) => row.symbol);
}

async function main() {
  console.log('📊 Price Data Loader\n');

  try {
    const options = await parseArgs();

    if (!options.symbol && !options.symbols && !options.all && !options.sample && !options.sampleAll) {
      console.log('Usage:');
      console.log('  Load single symbol:    pnpm run load-prices -- --symbol AAPL');
      console.log('  Load multiple symbols: pnpm run load-prices -- --symbols AAPL,GOOGL,MSFT');
      console.log('  Load all symbols:      pnpm run load-prices -- --all');
      console.log('  Full history (20y):    pnpm run load-prices -- --symbol AAPL --full');
      console.log('  Generate sample data:  pnpm run load-prices -- --sample AAPL');
      console.log('  Sample for all stocks: pnpm run load-prices -- --sample-all');
      process.exit(1);
    }

    // Sample data generation
    if (options.sample) {
      console.log(`Generating sample data for ${options.sample}...`);
      const count = await priceDataService.generateSamplePrices(options.sample, 365);
      console.log(`✅ Generated ${count} days of sample data for ${options.sample}`);
      process.exit(0);
    }

    if (options.sampleAll) {
      const symbols = await getAllSymbols();
      console.log(`Generating sample data for ${symbols.length} symbols...`);

      for (const symbol of symbols) {
        try {
          const count = await priceDataService.generateSamplePrices(symbol, 365);
          console.log(`✅ ${symbol}: Generated ${count} days`);
        } catch (error: any) {
          console.error(`❌ ${symbol}: ${error.message}`);
        }
      }

      console.log('\n✅ Sample data generation complete');
      process.exit(0);
    }

    // Real data loading from Alpha Vantage
    const outputSize = options.full ? 'full' : 'compact';
    let symbolsToLoad: string[] = [];

    if (options.symbol) {
      symbolsToLoad = [options.symbol.toUpperCase()];
    } else if (options.symbols) {
      symbolsToLoad = options.symbols;
    } else if (options.all) {
      symbolsToLoad = await getAllSymbols();
    }

    console.log(`Loading ${outputSize} historical data for ${symbolsToLoad.length} symbol(s)...`);
    console.log(`Symbols: ${symbolsToLoad.join(', ')}\n`);

    if (symbolsToLoad.length > 10) {
      console.log('⚠️  Note: Loading many symbols may take a while due to rate limits');
      console.log('⚠️  Alpha Vantage free tier: 5 calls/minute, 500 calls/day\n');
    }

    const results = await priceDataService.loadBulkHistoricalPrices(
      symbolsToLoad,
      outputSize
    );

    // Print results
    console.log('\n📈 Results:\n');
    const successful = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    successful.forEach((result) => {
      console.log(`✅ ${result.symbol}: ${result.count} data points loaded`);
    });

    if (failed.length > 0) {
      console.log('\n❌ Failed:\n');
      failed.forEach((result) => {
        console.log(`  ${result.symbol}: ${result.error}`);
      });
    }

    console.log(`\n📊 Summary: ${successful.length} successful, ${failed.length} failed`);

    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
