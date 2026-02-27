/**
 * Strategy repository - database access layer
 */
import type { Strategy, CreateStrategyRequest, UpdateStrategyRequest } from '@stock-picker/shared';
export declare class StrategyRepository {
    /**
     * Create a new strategy
     */
    create(data: CreateStrategyRequest): Promise<Strategy>;
    /**
     * Get strategy by ID
     */
    findById(id: string): Promise<Strategy | null>;
    /**
     * Get strategy by ID or throw
     */
    findByIdOrThrow(id: string): Promise<Strategy>;
    /**
     * Get all strategies for a portfolio
     */
    findByPortfolioId(portfolioId: string): Promise<Strategy[]>;
    /**
     * Get enabled strategies for a portfolio
     */
    findEnabledByPortfolioId(portfolioId: string): Promise<Strategy[]>;
    /**
     * Update strategy
     */
    update(id: string, data: UpdateStrategyRequest): Promise<Strategy>;
    /**
     * Delete strategy
     */
    delete(id: string): Promise<void>;
    /**
     * Toggle strategy enabled status
     */
    toggleEnabled(id: string): Promise<Strategy>;
    /**
     * Map database row to Strategy object
     */
    private mapToStrategy;
}
//# sourceMappingURL=strategy.repository.d.ts.map