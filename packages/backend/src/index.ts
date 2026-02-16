/**
 * @stock-picker/backend
 * Backend API and Lambda handlers
 */

// Repositories
export * from './repositories/index.js';

// Services
export * from './services/index.js';

// Handlers
export * as portfolioHandlers from './handlers/portfolios.handler.js';
export * as strategyHandlers from './handlers/strategies.handler.js';
export * as tradeHandlers from './handlers/trades.handler.js';
export * as stockHandlers from './handlers/stocks.handler.js';

// Integrations
export { alpacaClient } from './integrations/alpaca/client.js';

// Config
export { pool, query, transaction, closePool } from './config/database.js';

// Utils
export { logger } from './utils/logger.js';
export * from './utils/errors.js';
export * from './utils/api.utils.js';
