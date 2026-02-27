/**
 * Alpaca API client wrapper
 */
import type { OrderSide } from '@stock-picker/shared';
import { OrderStatus } from '@stock-picker/shared';
/**
 * Alpaca Order response
 */
export interface AlpacaOrder {
    id: string;
    client_order_id: string;
    created_at: string;
    updated_at: string;
    submitted_at: string;
    filled_at?: string;
    expired_at?: string;
    canceled_at?: string;
    failed_at?: string;
    replaced_at?: string;
    replaced_by?: string;
    replaces?: string;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional?: string;
    qty?: string;
    filled_qty: string;
    filled_avg_price?: string;
    order_class: string;
    order_type: string;
    type: string;
    side: string;
    time_in_force: string;
    limit_price?: string;
    stop_price?: string;
    status: string;
    extended_hours: boolean;
    legs?: AlpacaOrder[];
    trail_percent?: string;
    trail_price?: string;
    hwm?: string;
}
/**
 * Alpaca Position response
 */
export interface AlpacaPosition {
    asset_id: string;
    symbol: string;
    exchange: string;
    asset_class: string;
    avg_entry_price: string;
    qty: string;
    side: string;
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    unrealized_intraday_pl: string;
    unrealized_intraday_plpc: string;
    current_price: string;
    lastday_price: string;
    change_today: string;
}
/**
 * Alpaca Account response
 */
export interface AlpacaAccount {
    id: string;
    account_number: string;
    status: string;
    currency: string;
    buying_power: string;
    regt_buying_power: string;
    daytrading_buying_power: string;
    cash: string;
    portfolio_value: string;
    pattern_day_trader: boolean;
    trading_blocked: boolean;
    transfers_blocked: boolean;
    account_blocked: boolean;
    created_at: string;
    trade_suspended_by_user: boolean;
    multiplier: string;
    shorting_enabled: boolean;
    equity: string;
    last_equity: string;
    long_market_value: string;
    short_market_value: string;
    initial_margin: string;
    maintenance_margin: string;
    last_maintenance_margin: string;
    sma: string;
    daytrade_count: number;
}
/**
 * Alpaca Market Data - Latest Quote
 */
export interface AlpacaQuote {
    symbol: string;
    ask_price: number;
    ask_size: number;
    bid_price: number;
    bid_size: number;
    timestamp: string;
}
/**
 * Alpaca Asset (tradeable stock)
 */
export interface AlpacaAsset {
    id: string;
    class: string;
    exchange: string;
    symbol: string;
    name: string;
    status: string;
    tradable: boolean;
    marginable: boolean;
    shortable: boolean;
    easy_to_borrow: boolean;
    fractionable: boolean;
    attributes: string[];
}
/**
 * Alpaca API client
 */
export declare class AlpacaClient {
    private client;
    private dataClient;
    private isDemoMode;
    private initialized;
    private initPromise;
    constructor();
    /**
     * Initialize the client with credentials (lazy loading)
     */
    private initialize;
    /**
     * Handle Alpaca API errors
     */
    private handleError;
    /**
     * Get account information
     */
    getAccount(): Promise<AlpacaAccount>;
    /**
     * Submit a market order
     */
    submitMarketOrder(symbol: string, side: OrderSide, quantity: number): Promise<AlpacaOrder>;
    /**
     * Submit a limit order
     */
    submitLimitOrder(symbol: string, side: OrderSide, quantity: number, limitPrice: number): Promise<AlpacaOrder>;
    /**
     * Submit a stop order
     */
    submitStopOrder(symbol: string, side: OrderSide, quantity: number, stopPrice: number): Promise<AlpacaOrder>;
    /**
     * Submit a stop-limit order
     */
    submitStopLimitOrder(symbol: string, side: OrderSide, quantity: number, stopPrice: number, limitPrice: number): Promise<AlpacaOrder>;
    /**
     * Get order by ID
     */
    getOrder(orderId: string): Promise<AlpacaOrder>;
    /**
     * Get all orders
     */
    getOrders(status?: 'open' | 'closed' | 'all'): Promise<AlpacaOrder[]>;
    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): Promise<void>;
    /**
     * Cancel all orders
     */
    cancelAllOrders(): Promise<void>;
    /**
     * Get all positions
     */
    getPositions(): Promise<AlpacaPosition[]>;
    /**
     * Get position for a symbol
     */
    getPosition(symbol: string): Promise<AlpacaPosition | null>;
    /**
     * Close a position
     */
    closePosition(symbol: string): Promise<AlpacaOrder>;
    /**
     * Close all positions
     */
    closeAllPositions(): Promise<AlpacaOrder[]>;
    /**
     * Get latest quote for a symbol
     */
    getLatestQuote(symbol: string): Promise<AlpacaQuote>;
    /**
     * Generate simulated quote for demo mode
     */
    private getSimulatedQuote;
    /**
     * Generate simulated order for demo mode
     */
    private getSimulatedOrder;
    /**
     * Get latest quotes for multiple symbols
     */
    getLatestQuotes(symbols: string[]): Promise<Record<string, AlpacaQuote>>;
    /**
     * Get all tradeable assets
     */
    getAssets(status?: 'active' | 'inactive'): Promise<AlpacaAsset[]>;
    /**
     * Map Alpaca order status to our OrderStatus
     */
    mapOrderStatus(alpacaStatus: string): OrderStatus;
}
export declare const alpacaClient: AlpacaClient;
//# sourceMappingURL=client.d.ts.map