/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';
import {
  FactorType,
  OrderType,
  OrderSide,
  TradingMode,
} from './strategy.types.js';

// ============================================================================
// Common Schemas
// ============================================================================

export const uuidSchema = z.string().uuid();
export const symbolSchema = z.string().min(1).max(10).toUpperCase();
export const dateSchema = z.coerce.date();

// ============================================================================
// Factor & Strategy Schemas
// ============================================================================

export const factorConfigSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(FactorType),
  weight: z.number().min(0).max(1),
  enabled: z.boolean(),
  params: z.record(z.unknown()),
});

export const riskManagementConfigSchema = z.object({
  maxPositionSize: z.number().min(0).max(1),
  maxPositions: z.number().int().min(1),
  stopLossPercent: z.number().min(0).max(1),
  takeProfitPercent: z.number().min(0).optional(),
  maxDailyLoss: z.number().min(0).optional(),
  minCashReserve: z.number().min(0).optional(),
});

export const createStrategySchema = z.object({
  portfolioId: uuidSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  factors: z.array(factorConfigSchema).min(1),
  riskManagement: riskManagementConfigSchema,
  stockUniverse: z.array(symbolSchema).min(1),
  enabled: z.boolean(),
});

export const updateStrategySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  factors: z.array(factorConfigSchema).min(1).optional(),
  riskManagement: riskManagementConfigSchema.optional(),
  stockUniverse: z.array(symbolSchema).min(1).optional(),
  enabled: z.boolean().optional(),
});

// ============================================================================
// Portfolio Schemas
// ============================================================================

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  initialCash: z.number().min(0),
  tradingMode: z.nativeEnum(TradingMode),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tradingMode: z.nativeEnum(TradingMode).optional(),
});

// ============================================================================
// Trading Schemas
// ============================================================================

export const createOrderSchema = z.object({
  portfolioId: uuidSchema,
  symbol: symbolSchema,
  side: z.nativeEnum(OrderSide),
  type: z.nativeEnum(OrderType),
  quantity: z.number().int().min(1),
  price: z.number().min(0).optional(),
  stopPrice: z.number().min(0).optional(),
});

export const executeTradeSchema = z.object({
  portfolioId: uuidSchema,
  symbol: symbolSchema,
  side: z.nativeEnum(OrderSide),
  quantity: z.number().int().min(1),
  orderType: z.nativeEnum(OrderType).default(OrderType.MARKET),
  limitPrice: z.number().min(0).optional(),
});

// ============================================================================
// Backtesting Schemas
// ============================================================================

export const backtestConfigSchema = z.object({
  strategyId: uuidSchema,
  portfolioId: uuidSchema.optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initialCash: z.number().min(0),
  commission: z.number().min(0),
  slippage: z.number().min(0).max(1),
});

export const createBacktestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  config: backtestConfigSchema,
});

// ============================================================================
// Market Data Schemas
// ============================================================================

export const searchStocksSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const getPriceHistorySchema = z.object({
  symbol: symbolSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

// ============================================================================
// Performance Schemas
// ============================================================================

export const getPerformanceSchema = z.object({
  portfolioId: uuidSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type CreateStrategyInput = z.infer<typeof createStrategySchema>;
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ExecuteTradeInput = z.infer<typeof executeTradeSchema>;
export type BacktestConfigInput = z.infer<typeof backtestConfigSchema>;
export type CreateBacktestInput = z.infer<typeof createBacktestSchema>;
export type SearchStocksInput = z.infer<typeof searchStocksSchema>;
export type GetPriceHistoryInput = z.infer<typeof getPriceHistorySchema>;
export type GetPerformanceInput = z.infer<typeof getPerformanceSchema>;
