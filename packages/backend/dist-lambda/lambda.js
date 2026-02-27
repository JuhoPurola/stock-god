/**
 * Lambda handler for API Gateway
 */
import { logger } from './utils/logger.js';
import * as portfolioHandlers from './handlers/portfolios.handler.js';
import * as strategyHandlers from './handlers/strategies.handler.js';
import * as tradeHandlers from './handlers/trades.handler.js';
import * as stockHandlers from './handlers/stocks.handler.js';
import * as backtestHandlers from './handlers/backtests.handler.js';
import * as demoBacktestHandlers from './handlers/demo-backtest.handler.js';
import * as demoDiagnosticsHandlers from './handlers/demo-diagnostics.handler.js';
import * as demoSeedHandlers from './handlers/demo-seed.handler.js';
import * as demoPopulateStocksHandlers from './handlers/demo-populate-stocks.handler.js';
import * as demoAlphaBacktestHandlers from './handlers/demo-alpha-backtest.handler.js';
import * as demoLoadRealPricesHandlers from './handlers/demo-load-real-prices.handler.js';
import * as demoMicroCapBacktestHandlers from './handlers/demo-micro-cap-backtest.handler.js';
import * as demoSetupHandlers from './handlers/demo-setup.handler.js';
import * as demoMigrateUserHandlers from './handlers/demo-migrate-user.handler.js';
// WebSocket handlers are exported separately
export { handleConnect, handleDisconnect, handleMessage, } from './handlers/websocket.handler.js';
// Route handlers map
const routes = {
    'GET /health': {
        handler: async () => ({
            statusCode: 200,
            body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        }),
    },
    'GET /portfolios': { handler: portfolioHandlers.listPortfolios },
    'POST /portfolios': { handler: portfolioHandlers.createPortfolio },
    'GET /portfolios/{id}': { handler: portfolioHandlers.getPortfolio },
    'PUT /portfolios/{id}': { handler: portfolioHandlers.updatePortfolio },
    'DELETE /portfolios/{id}': { handler: portfolioHandlers.deletePortfolio },
    'GET /portfolios/{id}/positions': { handler: portfolioHandlers.getPortfolioPositions },
    'DELETE /portfolios/{id}/positions/{symbol}': { handler: portfolioHandlers.deletePosition },
    'GET /portfolios/{id}/trades': { handler: tradeHandlers.listTrades },
    'GET /portfolios/{portfolioId}/strategies': { handler: strategyHandlers.listStrategies },
    'POST /strategies': { handler: strategyHandlers.createStrategy },
    'GET /strategies/{id}': { handler: strategyHandlers.getStrategy },
    'PUT /strategies/{id}': { handler: strategyHandlers.updateStrategy },
    'DELETE /strategies/{id}': { handler: strategyHandlers.deleteStrategy },
    'POST /strategies/{id}/toggle': { handler: strategyHandlers.toggleStrategy },
    'POST /strategies/{id}/execute': { handler: strategyHandlers.executeStrategy },
    'POST /strategies/{id}/test': { handler: strategyHandlers.testStrategy },
    'POST /trades': { handler: tradeHandlers.executeTrade },
    'GET /trades/{id}': { handler: tradeHandlers.getTrade },
    'POST /trades/{id}/check-status': { handler: tradeHandlers.checkOrderStatus },
    'GET /stocks': { handler: stockHandlers.listStocks },
    'GET /stocks/search': { handler: stockHandlers.searchStocks },
    'GET /stocks/{symbol}': { handler: stockHandlers.getStock },
    'GET /stocks/{symbol}/quote': { handler: stockHandlers.getQuote },
    'GET /stocks/{symbol}/prices': { handler: stockHandlers.getPriceHistory },
    'POST /backtests': { handler: backtestHandlers.createBacktest },
    'GET /backtests': { handler: backtestHandlers.listBacktests },
    'GET /backtests/{id}': { handler: backtestHandlers.getBacktest },
    'GET /backtests/{id}/trades': { handler: backtestHandlers.getBacktestTrades },
    'DELETE /backtests/{id}': { handler: backtestHandlers.deleteBacktest },
    'GET /portfolios/{portfolioId}/backtests': { handler: backtestHandlers.listPortfolioBacktests },
    'POST /demo/backtest': { handler: demoBacktestHandlers.runDemoBacktest },
    'GET /demo/diagnostics': { handler: demoDiagnosticsHandlers.checkDiagnostics },
    'POST /demo/seed': { handler: demoSeedHandlers.seedDemoData },
    'POST /demo/populate-stocks': { handler: demoPopulateStocksHandlers.handler },
    'POST /demo/alpha-backtest': { handler: demoAlphaBacktestHandlers.handler },
    'POST /demo/load-real-prices': { handler: demoLoadRealPricesHandlers.handler },
    'POST /demo/micro-cap-backtest': { handler: demoMicroCapBacktestHandlers.handler },
    'POST /demo/setup': { handler: demoSetupHandlers.handler },
    'POST /demo/migrate-user': { handler: demoMigrateUserHandlers.handler },
};
// Extract path parameters from URL based on route template
const extractPathParameters = (path, routeTemplate) => {
    const pathParts = path.split('/').filter(Boolean);
    const templateParts = routeTemplate.split('/').filter(Boolean);
    const params = {};
    for (let i = 0; i < templateParts.length; i++) {
        const templatePart = templateParts[i];
        const pathPart = pathParts[i];
        if (templatePart && pathPart && templatePart.startsWith('{') && templatePart.endsWith('}')) {
            const paramName = templatePart.slice(1, -1);
            params[paramName] = pathPart;
        }
    }
    return params;
};
// Match route with path parameters
const matchRoute = (method, path) => {
    const routeKey = `${method} ${path}`;
    // Try exact match first
    if (routes[routeKey]) {
        return { route: routeKey, pathParameters: {} };
    }
    // Try pattern matching for routes with path parameters
    for (const route of Object.keys(routes)) {
        const parts = route.split(' ');
        const routeMethod = parts[0];
        const routePath = parts[1];
        if (!routePath || routeMethod !== method) {
            continue;
        }
        // Convert route pattern to regex (e.g., "/portfolios/{id}" => "/portfolios/[^/]+")
        const routePattern = routePath.replace(/\{[^}]+\}/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        if (regex.test(path)) {
            const pathParameters = extractPathParameters(path, routePath);
            return { route, pathParameters };
        }
    }
    return null;
};
// Add CORS headers to response
const addCorsHeaders = (response) => {
    return {
        ...response,
        headers: {
            ...response.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        },
    };
};
// Export Lambda handler
export const handler = async (event, context) => {
    // Don't wait for empty event loop (allows database connections to persist)
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const method = event.httpMethod;
        const path = event.path || '/';
        logger.info('Request received', { method, path });
        // Handle OPTIONS for CORS preflight
        if (method === 'OPTIONS') {
            return addCorsHeaders({
                statusCode: 200,
                body: '',
            });
        }
        // Find matching route
        const match = matchRoute(method, path);
        if (match) {
            const route = routes[match.route];
            if (route && route.handler) {
                // Inject extracted path parameters into event
                if (Object.keys(match.pathParameters).length > 0) {
                    event.pathParameters = { ...event.pathParameters, ...match.pathParameters };
                }
                const result = await route.handler(event);
                return addCorsHeaders(result);
            }
        }
        // Route not found
        return addCorsHeaders({
            statusCode: 404,
            body: JSON.stringify({ message: 'Not Found', path, method }),
        });
    }
    catch (error) {
        logger.error('Handler error', { error });
        return addCorsHeaders({
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        });
    }
};
//# sourceMappingURL=lambda.js.map