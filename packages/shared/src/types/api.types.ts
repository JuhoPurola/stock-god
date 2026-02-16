/**
 * API request and response type definitions
 */

import type {
  Portfolio,
  Position,
  Trade,
  Signal,
  BacktestResult,
  Alert,
  Stock,
  PriceBar,
  PortfolioSnapshot,
  OrderSide,
  OrderType,
  TradingMode,
  FactorConfig,
  RiskManagementConfig,
} from './strategy.types.js';

// ============================================================================
// API Response Wrapper
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// Portfolio Endpoints
// ============================================================================

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  initialCash: number;
  tradingMode: TradingMode;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
  tradingMode?: TradingMode;
}

export interface PortfolioWithStats extends Portfolio {
  totalValue: number;
  positionsValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  positionCount: number;
  dayReturn: number;
  dayReturnPercent: number;
}

// ============================================================================
// Strategy Endpoints
// ============================================================================

export interface CreateStrategyRequest {
  portfolioId: string;
  name: string;
  description?: string;
  factors: FactorConfig[];
  riskManagement: RiskManagementConfig;
  stockUniverse: string[];
  enabled: boolean;
}

export interface UpdateStrategyRequest {
  name?: string;
  description?: string;
  factors?: FactorConfig[];
  riskManagement?: RiskManagementConfig;
  stockUniverse?: string[];
  enabled?: boolean;
}

export interface TestStrategyRequest {
  strategyId: string;
  symbol: string;
}

export interface TestStrategyResponse {
  signal: Signal;
  currentPrice: number;
  wouldExecute: boolean;
  reason?: string;
}

// ============================================================================
// Trading Endpoints
// ============================================================================

export interface CreateOrderRequest {
  portfolioId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
}

export interface ExecuteTradeRequest {
  portfolioId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  orderType?: OrderType;
  limitPrice?: number;
}

export interface TradeWithDetails extends Trade {
  portfolioName: string;
  strategyName?: string;
  currentPrice?: number;
  pnl?: number;
}

// ============================================================================
// Position Endpoints
// ============================================================================

export interface PositionWithDetails extends Position {
  stock: Stock;
  dayChange: number;
  dayChangePercent: number;
}

// ============================================================================
// Stock & Market Data Endpoints
// ============================================================================

export interface SearchStocksRequest {
  query: string;
  limit?: number;
}

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  askPrice: number;
  bidPrice: number;
  timestamp: string;
}

export interface StockWithPrice extends Stock {
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export interface GetPriceHistoryRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  interval?: 'daily' | 'weekly' | 'monthly';
}

export interface GetPriceHistoryResponse {
  symbol: string;
  interval: string;
  bars: PriceBar[];
}

// ============================================================================
// Backtesting Endpoints
// ============================================================================

export interface CreateBacktestRequest {
  name?: string;
  config: {
    strategyId: string;
    portfolioId?: string;
    startDate: string;
    endDate: string;
    initialCash: number;
    commission: number;
    slippage: number;
  };
}

export interface BacktestResultWithSummary extends BacktestResult {
  summary: {
    totalReturn: number;
    totalReturnPercent: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
    averageTrade: number;
  };
}

// ============================================================================
// Performance & Analytics Endpoints
// ============================================================================

export interface GetPerformanceRequest {
  portfolioId: string;
  startDate?: string;
  endDate?: string;
  interval?: 'daily' | 'weekly' | 'monthly';
}

export interface PerformanceData {
  snapshots: PortfolioSnapshot[];
  summary: {
    totalReturn: number;
    totalReturnPercent: number;
    bestDay: number;
    worstDay: number;
    avgDailyReturn: number;
    volatility: number;
    sharpeRatio?: number;
  };
}

export interface PortfolioAllocation {
  symbol: string;
  stockName: string;
  value: number;
  percent: number;
  quantity: number;
  unrealizedPnL: number;
}

// ============================================================================
// Alert Endpoints
// ============================================================================

export interface GetAlertsRequest {
  portfolioId?: string;
  unreadOnly?: boolean;
  limit?: number;
}

export interface MarkAlertReadRequest {
  alertId: string;
}

// ============================================================================
// WebSocket Events
// ============================================================================

export enum WebSocketEventType {
  PRICE_UPDATE = 'price_update',
  TRADE_EXECUTED = 'trade_executed',
  POSITION_UPDATE = 'position_update',
  PORTFOLIO_UPDATE = 'portfolio_update',
  ALERT = 'alert',
  STRATEGY_SIGNAL = 'strategy_signal',
}

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  timestamp: string;
  data: T;
}

export interface PriceUpdateEvent {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface TradeExecutedEvent {
  portfolioId: string;
  trade: Trade;
}

export interface PositionUpdateEvent {
  portfolioId: string;
  position: Position;
}

export interface PortfolioUpdateEvent {
  portfolio: PortfolioWithStats;
}

export interface AlertEvent {
  alert: Alert;
}

export interface StrategySignalEvent {
  strategyId: string;
  portfolioId: string;
  signal: Signal;
}
