/**
 * Position repository - database access layer
 */
import type { Position, PositionWithDetails } from '@stock-picker/shared';
import type pg from 'pg';
export declare class PositionRepository {
    /**
     * Create or update position
     */
    upsert(portfolioId: string, symbol: string, quantity: number, averagePrice: number, currentPrice: number, client?: pg.PoolClient): Promise<Position>;
    /**
     * Get position by portfolio and symbol
     */
    findByPortfolioAndSymbol(portfolioId: string, symbol: string): Promise<Position | null>;
    /**
     * Get all positions for a portfolio
     */
    findByPortfolioId(portfolioId: string): Promise<Position[]>;
    /**
     * Get positions with stock details
     */
    findByPortfolioIdWithDetails(portfolioId: string): Promise<PositionWithDetails[]>;
    /**
     * Update position prices
     */
    updatePrices(portfolioId: string, symbol: string, currentPrice: number, client?: pg.PoolClient): Promise<Position | null>;
    /**
     * Update position after trade
     */
    updateAfterTrade(portfolioId: string, symbol: string, quantityChange: number, price: number, client?: pg.PoolClient): Promise<Position | null>;
    /**
     * Delete position
     */
    delete(portfolioId: string, symbol: string): Promise<void>;
    /**
     * Map database row to Position object
     */
    private mapToPosition;
}
//# sourceMappingURL=position.repository.d.ts.map