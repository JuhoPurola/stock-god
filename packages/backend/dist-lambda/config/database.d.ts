/**
 * Database configuration and connection pool
 */
import pg from 'pg';
/**
 * Get PostgreSQL connection pool (lazy initialization)
 */
export declare function getPool(): Promise<pg.Pool>;
export declare const pool: import("pg").Pool;
/**
 * Test database connection
 */
export declare function testConnection(): Promise<boolean>;
/**
 * Execute a query with error handling
 */
export declare function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>>;
/**
 * Execute a transaction
 */
export declare function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T>;
/**
 * Close all database connections
 */
export declare function closePool(): Promise<void>;
//# sourceMappingURL=database.d.ts.map