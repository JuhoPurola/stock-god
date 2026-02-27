/**
 * Alpaca API client wrapper
 */
import axios from 'axios';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../utils/errors.js';
import { OrderStatus } from '@stock-picker/shared';
import { rateLimiterService } from '../../services/rate-limiter.service.js';
// Cached credentials
let cachedCredentials = null;
/**
 * Fetch Alpaca credentials from Secrets Manager
 */
async function getAlpacaCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }
    const secretArn = process.env.ALPACA_SECRET_ARN;
    if (!secretArn) {
        logger.warn('ALPACA_SECRET_ARN not configured, using demo mode');
        return null;
    }
    try {
        const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'eu-west-1' });
        const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
        if (!response.SecretString) {
            throw new Error('Secret value is empty');
        }
        const parsed = JSON.parse(response.SecretString);
        // Check for placeholder values - use demo mode if found
        if (!parsed.apiKey || !parsed.apiSecret ||
            parsed.apiKey.includes('PLACEHOLDER') ||
            parsed.apiSecret.includes('PLACEHOLDER')) {
            logger.warn('Placeholder Alpaca credentials detected, using demo mode');
            return null;
        }
        cachedCredentials = parsed;
        logger.info('Alpaca credentials loaded from Secrets Manager');
        return cachedCredentials;
    }
    catch (error) {
        logger.error('Failed to load Alpaca credentials from Secrets Manager', error);
        return null;
    }
}
/**
 * Alpaca API client
 */
export class AlpacaClient {
    client;
    dataClient;
    isDemoMode;
    initialized = false;
    initPromise = null;
    constructor() {
        // Initialize with empty clients - will be configured on first use
        this.client = axios.create();
        this.dataClient = axios.create();
        this.isDemoMode = true; // Start in demo mode until credentials are loaded
    }
    /**
     * Initialize the client with credentials (lazy loading)
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        // If already initializing, wait for that to complete
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = (async () => {
            const credentials = await getAlpacaCredentials();
            if (!credentials) {
                this.isDemoMode = true;
                logger.warn('Running in demo mode - using simulated prices. Configure Alpaca credentials in Secrets Manager for live trading.');
                this.initialized = true;
                return;
            }
            this.isDemoMode = false;
            logger.info('Alpaca client initialized with live credentials');
            // Trading API client
            this.client = axios.create({
                baseURL: credentials.baseUrl,
                headers: {
                    'APCA-API-KEY-ID': credentials.apiKey,
                    'APCA-API-SECRET-KEY': credentials.apiSecret,
                },
            });
            // Data API client (different base URL)
            this.dataClient = axios.create({
                baseURL: 'https://data.alpaca.markets',
                headers: {
                    'APCA-API-KEY-ID': credentials.apiKey,
                    'APCA-API-SECRET-KEY': credentials.apiSecret,
                },
            });
            // Add response interceptors for error handling
            this.client.interceptors.response.use((response) => response, (error) => this.handleError(error));
            this.dataClient.interceptors.response.use((response) => response, (error) => this.handleError(error));
            this.initialized = true;
        })();
        return this.initPromise;
    }
    /**
     * Handle Alpaca API errors
     */
    handleError(error) {
        const message = error.response?.data?.message || error.message;
        const status = error.response?.status;
        logger.error('Alpaca API error', {
            status,
            message,
            data: error.response?.data,
        });
        throw new ExternalServiceError('Alpaca', message, {
            status,
            data: error.response?.data,
        });
    }
    /**
     * Get account information
     */
    async getAccount() {
        await this.initialize();
        if (this.isDemoMode) {
            throw new Error('Account information not available in demo mode');
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get('/v2/account');
            await rateLimiterService.recordRequest('alpaca', '/v2/account', true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/account', false);
            throw error;
        }
    }
    /**
     * Submit a market order
     */
    async submitMarketOrder(symbol, side, quantity) {
        await this.initialize();
        // Demo mode: return simulated order
        if (this.isDemoMode) {
            const order = this.getSimulatedOrder(symbol, side, quantity, 'market');
            logger.info('Demo market order submitted', {
                orderId: order.id,
                symbol,
                side,
                quantity,
            });
            return order;
        }
        // Check rate limit before making request
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.post('/v2/orders', {
                symbol,
                qty: quantity,
                side,
                type: 'market',
                time_in_force: 'day',
            });
            // Record successful request
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            logger.info('Market order submitted', {
                orderId: response.data.id,
                symbol,
                side,
                quantity,
            });
            return response.data;
        }
        catch (error) {
            // Record failed request
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Submit a limit order
     */
    async submitLimitOrder(symbol, side, quantity, limitPrice) {
        await this.initialize();
        if (this.isDemoMode) {
            const order = this.getSimulatedOrder(symbol, side, quantity, 'limit', limitPrice);
            logger.info('Demo limit order submitted', {
                orderId: order.id,
                symbol,
                side,
                quantity,
                limitPrice,
            });
            return order;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.post('/v2/orders', {
                symbol,
                qty: quantity,
                side,
                type: 'limit',
                time_in_force: 'day',
                limit_price: limitPrice.toFixed(2),
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            logger.info('Limit order submitted', {
                orderId: response.data.id,
                symbol,
                side,
                quantity,
                limitPrice,
            });
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Submit a stop order
     */
    async submitStopOrder(symbol, side, quantity, stopPrice) {
        await this.initialize();
        if (this.isDemoMode) {
            const order = this.getSimulatedOrder(symbol, side, quantity, 'stop', undefined, stopPrice);
            logger.info('Demo stop order submitted', {
                orderId: order.id,
                symbol,
                side,
                quantity,
                stopPrice,
            });
            return order;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.post('/v2/orders', {
                symbol,
                qty: quantity,
                side,
                type: 'stop',
                time_in_force: 'day',
                stop_price: stopPrice.toFixed(2),
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            logger.info('Stop order submitted', {
                orderId: response.data.id,
                symbol,
                side,
                quantity,
                stopPrice,
            });
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Submit a stop-limit order
     */
    async submitStopLimitOrder(symbol, side, quantity, stopPrice, limitPrice) {
        await this.initialize();
        if (this.isDemoMode) {
            const order = this.getSimulatedOrder(symbol, side, quantity, 'stop_limit', limitPrice, stopPrice);
            logger.info('Demo stop-limit order submitted', {
                orderId: order.id,
                symbol,
                side,
                quantity,
                stopPrice,
                limitPrice,
            });
            return order;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.post('/v2/orders', {
                symbol,
                qty: quantity,
                side,
                type: 'stop_limit',
                time_in_force: 'day',
                stop_price: stopPrice.toFixed(2),
                limit_price: limitPrice.toFixed(2),
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            logger.info('Stop-limit order submitted', {
                orderId: response.data.id,
                symbol,
                side,
                quantity,
                stopPrice,
                limitPrice,
            });
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Get order by ID
     */
    async getOrder(orderId) {
        await this.initialize();
        if (this.isDemoMode) {
            throw new Error('Order retrieval not available in demo mode');
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get(`/v2/orders/${orderId}`);
            await rateLimiterService.recordRequest('alpaca', `/v2/orders/${orderId}`, true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', `/v2/orders/${orderId}`, false);
            throw error;
        }
    }
    /**
     * Get all orders
     */
    async getOrders(status) {
        await this.initialize();
        if (this.isDemoMode) {
            return []; // Return empty array in demo mode
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get('/v2/orders', {
                params: { status: status || 'open' },
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Cancel an order
     */
    async cancelOrder(orderId) {
        await this.initialize();
        if (this.isDemoMode) {
            logger.info('Demo order cancelled', { orderId });
            return;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            await this.client.delete(`/v2/orders/${orderId}`);
            await rateLimiterService.recordRequest('alpaca', `/v2/orders/${orderId}`, true);
            logger.info('Order cancelled', { orderId });
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', `/v2/orders/${orderId}`, false);
            throw error;
        }
    }
    /**
     * Cancel all orders
     */
    async cancelAllOrders() {
        await this.initialize();
        if (this.isDemoMode) {
            logger.info('All demo orders cancelled');
            return;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            await this.client.delete('/v2/orders');
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', true);
            logger.info('All orders cancelled');
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/orders', false);
            throw error;
        }
    }
    /**
     * Get all positions
     */
    async getPositions() {
        await this.initialize();
        if (this.isDemoMode) {
            return []; // Return empty array in demo mode
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get('/v2/positions');
            await rateLimiterService.recordRequest('alpaca', '/v2/positions', true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/positions', false);
            throw error;
        }
    }
    /**
     * Get position for a symbol
     */
    async getPosition(symbol) {
        await this.initialize();
        if (this.isDemoMode) {
            return null; // No positions in demo mode
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get(`/v2/positions/${symbol}`);
            await rateLimiterService.recordRequest('alpaca', `/v2/positions/${symbol}`, true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', `/v2/positions/${symbol}`, error.response?.status !== 404);
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Close a position
     */
    async closePosition(symbol) {
        await this.initialize();
        if (this.isDemoMode) {
            const order = this.getSimulatedOrder(symbol, 'sell', 0, 'market');
            logger.info('Demo position closed', { symbol });
            return order;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.delete(`/v2/positions/${symbol}`);
            await rateLimiterService.recordRequest('alpaca', `/v2/positions/${symbol}`, true);
            logger.info('Position closed', { symbol });
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', `/v2/positions/${symbol}`, false);
            throw error;
        }
    }
    /**
     * Close all positions
     */
    async closeAllPositions() {
        await this.initialize();
        if (this.isDemoMode) {
            logger.info('All demo positions closed');
            return [];
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.delete('/v2/positions');
            await rateLimiterService.recordRequest('alpaca', '/v2/positions', true);
            logger.info('All positions closed');
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/positions', false);
            throw error;
        }
    }
    /**
     * Get latest quote for a symbol
     */
    async getLatestQuote(symbol) {
        await this.initialize();
        // Demo mode: return simulated prices
        if (this.isDemoMode) {
            return this.getSimulatedQuote(symbol);
        }
        // Check rate limit before making request
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.dataClient.get(`/v2/stocks/${symbol}/quotes/latest`);
            // Record successful request
            await rateLimiterService.recordRequest('alpaca', `/v2/stocks/${symbol}/quotes/latest`, true);
            return response.data.quote;
        }
        catch (error) {
            // Record failed request
            await rateLimiterService.recordRequest('alpaca', `/v2/stocks/${symbol}/quotes/latest`, false);
            throw error;
        }
    }
    /**
     * Generate simulated quote for demo mode
     */
    getSimulatedQuote(symbol) {
        // Use symbol hash to generate consistent but varied prices
        const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const basePrice = 50 + (hash % 400); // Price between $50-$450
        const spread = basePrice * 0.001; // 0.1% spread
        return {
            symbol,
            ask_price: basePrice + spread / 2,
            ask_size: 100,
            bid_price: basePrice - spread / 2,
            bid_size: 100,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Generate simulated order for demo mode
     */
    getSimulatedOrder(symbol, side, quantity, orderType, limitPrice, stopPrice) {
        const now = new Date().toISOString();
        const orderId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const quote = this.getSimulatedQuote(symbol);
        const fillPrice = side === 'buy' ? quote.ask_price : quote.bid_price;
        return {
            id: orderId,
            client_order_id: orderId,
            created_at: now,
            updated_at: now,
            submitted_at: now,
            filled_at: now, // Immediately fill in demo mode
            asset_id: `demo_asset_${symbol}`,
            symbol,
            asset_class: 'us_equity',
            qty: quantity.toString(),
            filled_qty: quantity.toString(),
            filled_avg_price: fillPrice.toString(),
            order_class: '',
            order_type: orderType,
            type: orderType,
            side,
            time_in_force: 'day',
            limit_price: limitPrice?.toString(),
            stop_price: stopPrice?.toString(),
            status: 'filled', // Immediately fill in demo mode
            extended_hours: false,
        };
    }
    /**
     * Get latest quotes for multiple symbols
     */
    async getLatestQuotes(symbols) {
        await this.initialize();
        // Demo mode: return simulated quotes for all symbols
        if (this.isDemoMode) {
            const quotes = {};
            for (const symbol of symbols) {
                quotes[symbol] = this.getSimulatedQuote(symbol);
            }
            return quotes;
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.dataClient.get('/v2/stocks/quotes/latest', {
                params: { symbols: symbols.join(',') },
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/stocks/quotes/latest', true);
            return response.data.quotes;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/stocks/quotes/latest', false);
            throw error;
        }
    }
    /**
     * Get all tradeable assets
     */
    async getAssets(status = 'active') {
        await this.initialize();
        if (this.isDemoMode) {
            // Return a small demo set in demo mode
            return [];
        }
        await rateLimiterService.waitForRateLimit('alpaca');
        try {
            const response = await this.client.get('/v2/assets', {
                params: {
                    status,
                    asset_class: 'us_equity',
                },
            });
            await rateLimiterService.recordRequest('alpaca', '/v2/assets', true);
            return response.data;
        }
        catch (error) {
            await rateLimiterService.recordRequest('alpaca', '/v2/assets', false);
            throw error;
        }
    }
    /**
     * Map Alpaca order status to our OrderStatus
     */
    mapOrderStatus(alpacaStatus) {
        const statusMap = {
            new: OrderStatus.SUBMITTED,
            accepted: OrderStatus.SUBMITTED,
            pending_new: OrderStatus.PENDING,
            accepted_for_bidding: OrderStatus.SUBMITTED,
            stopped: OrderStatus.PENDING,
            rejected: OrderStatus.REJECTED,
            suspended: OrderStatus.PENDING,
            calculated: OrderStatus.PENDING,
            filled: OrderStatus.FILLED,
            done_for_day: OrderStatus.FILLED,
            canceled: OrderStatus.CANCELLED,
            expired: OrderStatus.CANCELLED,
            replaced: OrderStatus.CANCELLED,
            pending_cancel: OrderStatus.PENDING,
            pending_replace: OrderStatus.PENDING,
            partially_filled: OrderStatus.PARTIALLY_FILLED,
        };
        return statusMap[alpacaStatus.toLowerCase()] || OrderStatus.PENDING;
    }
}
// Export singleton instance
export const alpacaClient = new AlpacaClient();
//# sourceMappingURL=client.js.map