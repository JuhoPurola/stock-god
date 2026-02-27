/**
 * Portfolio repository - database access layer
 */
import type { Portfolio, PortfolioWithStats, CreatePortfolioRequest, UpdatePortfolioRequest } from '@stock-picker/shared';
import type pg from 'pg';
export declare class PortfolioRepository {
    /**
     * Create a new portfolio
     */
    create(userId: string, data: CreatePortfolioRequest): Promise<Portfolio>;
    /**
     * Get portfolio by ID
     */
    findById(id: string): Promise<Portfolio | null>;
    /**
     * Get portfolio by ID or throw
     */
    findByIdOrThrow(id: string): Promise<Portfolio>;
    /**
     * Get portfolio with statistics
     */
    findByIdWithStats(id: string): Promise<PortfolioWithStats | null>;
    /**
     * Get all portfolios for a user
     */
    findByUserId(userId: string): Promise<Portfolio[]>;
    /**
     * Get all portfolios with stats for a user
     */
    findByUserIdWithStats(userId: string): Promise<PortfolioWithStats[]>;
    /**
     * Update portfolio
     */
    update(id: string, data: UpdatePortfolioRequest): Promise<Portfolio>;
    /**
     * Update cash balance
     */
    updateCashBalance(id: string, amount: number, client?: pg.PoolClient): Promise<void>;
    /**
     * Delete portfolio
     */
    delete(id: string): Promise<void>;
    /**
     * Get all active portfolios with enabled strategies (for scheduled execution)
     */
    findActivePortfolios(): Promise<Array<{
        portfolio: Portfolio;
        strategyIds: string[];
    }>>;
    /**
     * Map database row to Portfolio object
     */
    private mapToPortfolio;
}
//# sourceMappingURL=portfolio.repository.d.ts.map