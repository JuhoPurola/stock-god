/**
 * Stock Universe Service - Fetch and populate tradeable stocks
 */

import { alpacaClient, type AlpacaAsset } from '../integrations/alpaca/client.js';
import { fmpClient, type FMPStockScreenerResult } from '../integrations/fmp/client.js';
import { StockRepository } from '../repositories/stock.repository.js';
import { logger } from '../utils/logger.js';
import type { Stock } from '@stock-picker/shared';
import { SMALL_CAP_STOCKS } from '../data/small-cap-stocks.js';

export class StockUniverseService {
  private stockRepo: StockRepository;

  constructor() {
    this.stockRepo = new StockRepository();
  }

  /**
   * Populate database with curated small & micro cap stocks
   * No API required - uses pre-vetted list of real US stocks
   */
  async populateCuratedSmallCaps(): Promise<{
    total: number;
    added: number;
    updated: number;
    smallCap: number;
    microCap: number;
    sectors: Record<string, number>;
  }> {
    logger.info(`Populating database with ${SMALL_CAP_STOCKS.length} curated small cap stocks`);

    let added = 0;
    let updated = 0;
    let smallCap = 0;
    let microCap = 0;
    const sectors: Record<string, number> = {};

    for (const stock of SMALL_CAP_STOCKS) {
      try {
        // Count by category
        if (stock.marketCap >= 300_000_000) {
          smallCap++;
        } else {
          microCap++;
        }

        // Track sectors
        sectors[stock.sector] = (sectors[stock.sector] || 0) + 1;

        const existingStock = await this.stockRepo.findBySymbol(stock.symbol);

        await this.stockRepo.upsert({
          symbol: stock.symbol,
          name: stock.name,
          exchange: stock.exchange,
          tradable: true,
          sector: stock.sector,
          industry: undefined, // Industry not included in curated list
          marketCap: stock.marketCap,
        });

        if (existingStock) {
          updated++;
        } else {
          added++;
        }
      } catch (error) {
        logger.error(`Failed to upsert stock ${stock.symbol}`, error);
      }
    }

    const result = {
      total: SMALL_CAP_STOCKS.length,
      added,
      updated,
      smallCap,
      microCap,
      sectors,
    };

    logger.info('Curated small cap stock population complete', result);

    return result;
  }

  /**
   * Fetch small and micro cap stocks from FMP and populate database
   * This is the primary method for getting US small cap stocks
   */
  async fetchSmallCapStocksFromFMP(): Promise<{
    total: number;
    added: number;
    updated: number;
    smallCap: number;
    microCap: number;
    marketCapRange: { min: number; max: number };
  }> {
    logger.info('Fetching small & micro cap stocks from FMP...');

    // Get all stocks with market cap between $50M and $2B
    const stocks = await fmpClient.getSmallToMicroCapStocks();

    logger.info(`Fetched ${stocks.length} small/micro cap stocks from FMP`);

    // Filter for US exchanges only
    const usStocks = stocks.filter((stock) => {
      return (
        stock.isActivelyTrading &&
        !stock.isEtf &&
        stock.country === 'US' &&
        ['NASDAQ', 'NYSE', 'AMEX'].includes(stock.exchangeShortName)
      );
    });

    logger.info(`Filtered to ${usStocks.length} US small/micro cap stocks`);

    // Count by market cap category
    let smallCap = 0; // $300M - $2B
    let microCap = 0; // $50M - $300M
    let minCap = Number.MAX_VALUE;
    let maxCap = 0;

    // Upsert stocks to database
    let added = 0;
    let updated = 0;

    for (const stock of usStocks) {
      try {
        // Update statistics
        if (stock.marketCap >= 300_000_000) {
          smallCap++;
        } else {
          microCap++;
        }
        minCap = Math.min(minCap, stock.marketCap);
        maxCap = Math.max(maxCap, stock.marketCap);

        const existingStock = await this.stockRepo.findBySymbol(stock.symbol);

        await this.stockRepo.upsert({
          symbol: stock.symbol,
          name: stock.companyName,
          exchange: stock.exchangeShortName,
          tradable: stock.isActivelyTrading,
          sector: stock.sector,
          industry: stock.industry,
          marketCap: stock.marketCap,
        });

        if (existingStock) {
          updated++;
        } else {
          added++;
        }
      } catch (error) {
        logger.error(`Failed to upsert stock ${stock.symbol}`, error);
      }
    }

    const result = {
      total: usStocks.length,
      added,
      updated,
      smallCap,
      microCap,
      marketCapRange: { min: minCap, max: maxCap },
    };

    logger.info('Small cap stock population complete', result);

    return result;
  }

  /**
   * Fetch all tradeable stocks from Alpaca and populate database
   * Returns count of stocks added/updated
   */
  async fetchAndPopulateStocks(): Promise<{
    total: number;
    added: number;
    updated: number;
    exchanges: Record<string, number>;
  }> {
    logger.info('Fetching tradeable stocks from Alpaca...');

    // Get all active tradeable assets
    const assets = await alpacaClient.getAssets('active');

    logger.info(`Fetched ${assets.length} assets from Alpaca`);

    // Filter for US stocks only (exclude crypto, forex, etc.)
    const usStocks = assets.filter((asset) => {
      return (
        asset.class === 'us_equity' &&
        asset.tradable &&
        asset.status === 'active' &&
        // Filter for major US exchanges
        ['NASDAQ', 'NYSE', 'AMEX', 'ARCA', 'BATS'].includes(asset.exchange)
      );
    });

    logger.info(`Filtered to ${usStocks.length} US stocks`);

    // Group by exchange for statistics
    const exchanges: Record<string, number> = {};
    usStocks.forEach((asset) => {
      exchanges[asset.exchange] = (exchanges[asset.exchange] || 0) + 1;
    });

    // Upsert stocks to database
    let added = 0;
    let updated = 0;

    for (const asset of usStocks) {
      try {
        const existingStock = await this.stockRepo.findBySymbol(asset.symbol);

        await this.stockRepo.upsert({
          symbol: asset.symbol,
          name: asset.name,
          exchange: asset.exchange,
          tradable: asset.tradable,
          // We don't have market cap from Alpaca - set to undefined for now
          // TODO: Fetch from another source (Alpha Vantage, Financial Modeling Prep, etc.)
          sector: undefined,
          industry: undefined,
          marketCap: undefined,
        });

        if (existingStock) {
          updated++;
        } else {
          added++;
        }
      } catch (error) {
        logger.error(`Failed to upsert stock ${asset.symbol}`, error);
      }
    }

    logger.info('Stock population complete', {
      total: usStocks.length,
      added,
      updated,
      exchanges,
    });

    return {
      total: usStocks.length,
      added,
      updated,
      exchanges,
    };
  }

  /**
   * Get stocks filtered by market cap range
   * Market cap categories:
   * - Large cap: > $10B
   * - Mid cap: $2B - $10B
   * - Small cap: $300M - $2B
   * - Micro cap: $50M - $300M
   * - Nano cap: < $50M
   */
  async getStocksByMarketCap(
    minMarketCap?: number,
    maxMarketCap?: number,
    limit: number = 1000
  ): Promise<Stock[]> {
    // For now, just return all tradeable stocks
    // TODO: Filter by market cap once we have that data
    return this.stockRepo.findTradable(limit);
  }

  /**
   * Get small cap stocks (market cap between $300M and $2B)
   */
  async getSmallCapStocks(limit: number = 1000): Promise<Stock[]> {
    const minCap = 300_000_000; // $300M
    const maxCap = 2_000_000_000; // $2B
    return this.getStocksByMarketCap(minCap, maxCap, limit);
  }

  /**
   * Get micro cap stocks (market cap between $50M and $300M)
   */
  async getMicroCapStocks(limit: number = 1000): Promise<Stock[]> {
    const minCap = 50_000_000; // $50M
    const maxCap = 300_000_000; // $300M
    return this.getStocksByMarketCap(minCap, maxCap, limit);
  }
}

export const stockUniverseService = new StockUniverseService();
