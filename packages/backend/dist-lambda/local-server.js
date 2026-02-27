/**
 * Local development server using Express
 */
import express from 'express';
import { testConnection } from './config/database.js';
import { logger } from './utils/logger.js';
import * as portfolioHandlers from './handlers/portfolios.handler.js';
import * as strategyHandlers from './handlers/strategies.handler.js';
import * as tradeHandlers from './handlers/trades.handler.js';
import * as stockHandlers from './handlers/stocks.handler.js';
import * as backtestHandlers from './handlers/backtests.handler.js';
const app = express();
const PORT = process.env.API_PORT || 3000;
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
// Request logging
app.use((req, res, next) => {
    logger.info('Request', {
        method: req.method,
        path: req.path,
        query: req.query,
    });
    next();
});
// Convert Express request to Lambda event format
function toLambdaEvent(req) {
    return {
        httpMethod: req.method,
        path: req.path,
        pathParameters: req.params,
        queryStringParameters: req.query,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : null,
        requestContext: {
            authorizer: {},
        },
    };
}
// Convert Lambda result to Express response
function fromLambdaResult(res, result) {
    if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
            res.header(key, value);
        });
    }
    res.status(result.statusCode);
    if (result.body) {
        res.send(JSON.parse(result.body));
    }
    else {
        res.end();
    }
}
// Helper to wrap Lambda handlers
function wrapHandler(handler) {
    return async (req, res) => {
        try {
            const event = toLambdaEvent(req);
            const result = await handler(event);
            fromLambdaResult(res, result);
        }
        catch (error) {
            logger.error('Handler error', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
// Portfolio routes
app.get('/portfolios', wrapHandler(portfolioHandlers.listPortfolios));
app.get('/portfolios/:id', wrapHandler(portfolioHandlers.getPortfolio));
app.post('/portfolios', wrapHandler(portfolioHandlers.createPortfolio));
app.put('/portfolios/:id', wrapHandler(portfolioHandlers.updatePortfolio));
app.delete('/portfolios/:id', wrapHandler(portfolioHandlers.deletePortfolio));
app.get('/portfolios/:id/positions', wrapHandler(portfolioHandlers.getPortfolioPositions));
app.delete('/portfolios/:id/positions/:symbol', wrapHandler(portfolioHandlers.deletePosition));
// Strategy routes
app.get('/portfolios/:portfolioId/strategies', wrapHandler(strategyHandlers.listStrategies));
app.get('/strategies/:id', wrapHandler(strategyHandlers.getStrategy));
app.post('/strategies', wrapHandler(strategyHandlers.createStrategy));
app.put('/strategies/:id', wrapHandler(strategyHandlers.updateStrategy));
app.delete('/strategies/:id', wrapHandler(strategyHandlers.deleteStrategy));
app.post('/strategies/:id/toggle', wrapHandler(strategyHandlers.toggleStrategy));
app.post('/strategies/:id/test', wrapHandler(strategyHandlers.testStrategy));
app.post('/strategies/:id/execute', wrapHandler(strategyHandlers.executeStrategy));
// Trade routes
app.get('/portfolios/:portfolioId/trades', wrapHandler(tradeHandlers.listTrades));
app.get('/trades/:id', wrapHandler(tradeHandlers.getTrade));
app.post('/trades', wrapHandler(tradeHandlers.executeTrade));
app.post('/trades/:id/check-status', wrapHandler(tradeHandlers.checkOrderStatus));
// Stock routes
app.get('/stocks', wrapHandler(stockHandlers.listStocks));
app.get('/stocks/search', wrapHandler(stockHandlers.searchStocks));
app.get('/stocks/:symbol', wrapHandler(stockHandlers.getStock));
app.get('/stocks/:symbol/quote', wrapHandler(stockHandlers.getQuote));
app.get('/stocks/:symbol/prices', wrapHandler(stockHandlers.getPriceHistory));
// Backtest routes
app.post('/backtests', wrapHandler(backtestHandlers.createBacktest));
app.get('/backtests', wrapHandler(backtestHandlers.listBacktests));
app.get('/backtests/:id', wrapHandler(backtestHandlers.getBacktest));
app.get('/backtests/:id/trades', wrapHandler(backtestHandlers.getBacktestTrades));
app.delete('/backtests/:id', wrapHandler(backtestHandlers.deleteBacktest));
app.get('/portfolios/:portfolioId/backtests', wrapHandler(backtestHandlers.listPortfolioBacktests));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Start server
async function start() {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
            logger.info('Available endpoints:');
            logger.info('  GET    /health');
            logger.info('  GET    /portfolios');
            logger.info('  POST   /portfolios');
            logger.info('  GET    /portfolios/:id');
            logger.info('  PUT    /portfolios/:id');
            logger.info('  DELETE /portfolios/:id');
            logger.info('  GET    /portfolios/:id/positions');
            logger.info('  GET    /portfolios/:portfolioId/strategies');
            logger.info('  POST   /strategies');
            logger.info('  GET    /strategies/:id');
            logger.info('  POST   /strategies/:id/execute');
            logger.info('  POST   /trades');
            logger.info('  GET    /stocks/search?q=AAPL');
        });
    }
    catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=local-server.js.map