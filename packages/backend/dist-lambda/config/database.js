/**
 * Database configuration and connection pool
 */
import pg from 'pg';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../utils/logger.js';
const { Pool } = pg;
// For Lambda, we'll initialize the pool lazily after fetching secrets
let poolInstance = null;
let poolInitPromise = null;
async function initializePool() {
    if (poolInstance) {
        return poolInstance;
    }
    // If already initializing, wait for that
    if (poolInitPromise) {
        return poolInitPromise;
    }
    poolInitPromise = (async () => {
        // Check if we have DATABASE_URL (local development)
        if (process.env.DATABASE_URL) {
            poolInstance = new Pool({
                connectionString: process.env.DATABASE_URL,
                max: 20, // Higher for local dev server
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });
            return poolInstance;
        }
        // In Lambda, fetch credentials from Secrets Manager
        const secretArn = process.env.DATABASE_SECRET_ARN;
        const dbHost = process.env.DATABASE_HOST;
        if (!secretArn || !dbHost) {
            // Fallback to localhost for development
            logger.warn('No DATABASE_SECRET_ARN or DATABASE_HOST, using localhost');
            poolInstance = new Pool({
                connectionString: 'postgresql://stock_picker:dev_password@localhost:5432/stock_picker',
                max: 20, // Higher for local dev
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            });
            return poolInstance;
        }
        try {
            const secretsClient = new SecretsManagerClient({});
            const response = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
            const secret = JSON.parse(response.SecretString);
            poolInstance = new Pool({
                host: dbHost,
                port: 5432,
                user: secret.username,
                password: secret.password,
                database: 'stock_picker',
                max: 2, // Reduced for Lambda - avoid connection exhaustion
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000, // Reduced to fail faster and avoid API Gateway timeout
                ssl: { rejectUnauthorized: false },
            });
            logger.info('Database pool initialized from Secrets Manager');
            return poolInstance;
        }
        catch (error) {
            logger.error('Failed to initialize database pool', error);
            throw error;
        }
    })();
    return poolInitPromise;
}
/**
 * Get PostgreSQL connection pool (lazy initialization)
 */
export async function getPool() {
    return initializePool();
}
// For backwards compatibility, export a pool getter
export const pool = new Proxy({}, {
    get: (target, prop) => {
        throw new Error('Use getPool() instead of accessing pool directly');
    },
});
/**
 * Test database connection
 */
export async function testConnection() {
    try {
        const pool = await getPool();
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('Database connection test successful');
        return true;
    }
    catch (error) {
        logger.error('Database connection test failed', error);
        return false;
    }
}
/**
 * Execute a query with error handling
 */
export async function query(text, params) {
    const start = Date.now();
    try {
        logger.info('Getting pool for query', { text: text.substring(0, 50) });
        const pool = await getPool();
        logger.info('Pool acquired, executing query');
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        logger.info('Query executed', { duration, rows: result.rowCount });
        return result;
    }
    catch (error) {
        logger.error('Query error', { text, error });
        throw error;
    }
}
/**
 * Execute a transaction
 */
export async function transaction(callback) {
    const pool = await getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
/**
 * Close all database connections
 */
export async function closePool() {
    const pool = await getPool();
    await pool.end();
    logger.info('Database pool closed');
}
//# sourceMappingURL=database.js.map