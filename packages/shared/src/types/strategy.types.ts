/**
 * Core type definitions for the algorithmic trading engine
 */

// ============================================================================
// Enums
// ============================================================================

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',
}

export enum FactorType {
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  SENTIMENT = 'sentiment',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

export enum TradingMode {
  PAPER = 'paper',
  LIVE = 'live',
}

// ============================================================================
// Factor System
// ============================================================================

export interface FactorScore {
  factorName: string;
  factorType: FactorType;
  score: number; // -1 to +1: negative = bearish, positive = bullish
  confidence: number; // 0 to 1
  metadata?: Record<string, unknown>;
}

export interface FactorConfig {
  name: string;
  type: FactorType;
  weight: number; // Relative weight in strategy composition
  enabled: boolean;
  params: Record<string, unknown>; // Factor-specific parameters
}

export interface EvaluationContext {
  symbol: string;
  timestamp: Date;
  currentPrice: number;
  historicalPrices: PriceBar[];
  fundamentals?: FundamentalData;
  technicalIndicators?: Record<string, number[]>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Strategy
// ============================================================================

export interface Strategy {
  id: string;
  portfolioId: string;
  name: string;
  description?: string;
  factors: FactorConfig[];
  riskManagement: RiskManagementConfig;
  stockUniverse: string[]; // List of symbols to trade
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskManagementConfig {
  maxPositionSize: number; // Max % of portfolio per position
  maxPositions: number; // Max number of concurrent positions
  stopLossPercent: number; // Stop loss as % below entry price
  takeProfitPercent?: number; // Optional take profit target
  maxDailyLoss?: number; // Circuit breaker: max $ loss per day
  minCashReserve?: number; // Min cash to keep in portfolio
}

export interface Signal {
  symbol: string;
  type: SignalType;
  strength: number; // 0 to 1: confidence in the signal
  timestamp: Date;
  factorScores: FactorScore[];
  metadata?: {
    targetPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    reasoning?: string;
  };
}

// ============================================================================
// Portfolio & Positions
// ============================================================================

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  cashBalance: number;
  tradingMode: TradingMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Trading & Orders
// ============================================================================

export interface Trade {
  id: string;
  portfolioId: string;
  strategyId?: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  amount: number;
  orderType: OrderType;
  status: OrderStatus;
  signal?: Signal; // The signal that triggered this trade
  brokerOrderId?: string;
  executedAt?: Date;
  commission?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  portfolioId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number; // For limit orders
  stopPrice?: number; // For stop orders
  status: OrderStatus;
  filledQuantity: number;
  filledPrice?: number;
  brokerOrderId?: string; // External order ID (e.g., Alpaca)
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Market Data
// ============================================================================

export interface PriceBar {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  tradable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundamentalData {
  symbol: string;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  eps?: number;
  beta?: number;
  marketCap?: number;
  timestamp: Date;
}

// ============================================================================
// Performance & Analytics
// ============================================================================

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  timestamp: Date;
  totalValue: number;
  cashBalance: number;
  positionsValue: number;
  dailyReturn: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface StrategyPerformance {
  strategyId?: string;
  portfolioId?: string;
  totalTrades: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate: number;
  totalPnL?: number;
  totalReturn?: number; // For backtesting
  totalReturnPercent?: number; // For backtesting
  averageWin?: number;
  averageLoss?: number;
  avgTradeReturn?: number; // For backtesting
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  startDate?: Date;
  endDate?: Date;
}

// ============================================================================
// Backtesting
// ============================================================================

export interface BacktestConfig {
  strategyId: string;
  portfolioId?: string;
  startDate: string;
  endDate: string;
  initialCash: number;
  commission: number;
  slippage: number;
}

export interface BacktestResult {
  id: string;
  userId: string;
  config: BacktestConfig;
  status: 'running' | 'completed' | 'failed';
  performance?: StrategyPerformance;
  trades: BacktestTrade[];
  snapshots: PortfolioSnapshot[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BacktestTrade {
  id: string;
  backtestId: string;
  timestamp: Date;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  amount: number;
  signal: Signal;
  pnl: number | null;
  createdAt: Date;
}

// Backtest status enum
export enum BacktestStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Simpler backtest interface matching database schema
export interface Backtest {
  id: string;
  userId: string;
  name: string | null;
  config: {
    strategyId: string;
    portfolioId?: string;
    startDate: string;
    endDate: string;
    initialCash: number;
    commission: number;
    slippage: number;
  };
  status: BacktestStatus;
  performance: StrategyPerformance | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// Internal types for backtest execution
export interface BacktestPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface BacktestPortfolioState {
  cash: number;
  positions: Map<string, BacktestPosition>;
  totalValue: number;
  dailyReturns: number[];
  trades: Array<{
    symbol: string;
    side: OrderSide;
    quantity: number;
    price: number;
    date: string;
    pnl?: number;
  }>;
}

export interface BacktestSnapshot {
  date: Date | string;
  cash: number;
  positionsValue: number;
  totalValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
}

// ============================================================================
// Alerts & Notifications
// ============================================================================

export enum AlertType {
  TRADE_EXECUTED = 'trade_executed',
  TRADE_FAILED = 'trade_failed',
  STOP_LOSS_TRIGGERED = 'stop_loss_triggered',
  TAKE_PROFIT_TRIGGERED = 'take_profit_triggered',
  DAILY_LOSS_LIMIT = 'daily_loss_limit',
  PRICE_ALERT = 'price_alert',
  STRATEGY_ERROR = 'strategy_error',
}

export interface Alert {
  id: string;
  userId: string;
  portfolioId?: string;
  type: AlertType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// User
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
