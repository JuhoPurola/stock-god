/**
 * API client for backend communication
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  Portfolio,
  PortfolioWithStats,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  Strategy,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  PositionWithDetails,
  Trade,
  TradeWithDetails,
  ExecuteTradeRequest,
  Stock,
  StockQuote,
  PriceBar,
  Signal,
  Backtest,
  BacktestTrade,
  CreateBacktestRequest,
} from '@stock-picker/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '00000000-0000-0000-0000-000000000001', // Demo user for development
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Portfolios
  // ============================================================================

  async getPortfolios(): Promise<PortfolioWithStats[]> {
    const response = await this.client.get<{ portfolios: PortfolioWithStats[] }>(
      '/portfolios'
    );
    return response.data.portfolios;
  }

  async getPortfolio(id: string): Promise<PortfolioWithStats> {
    const response = await this.client.get<{ portfolio: PortfolioWithStats }>(
      `/portfolios/${id}`
    );
    return response.data.portfolio;
  }

  async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await this.client.post<{ portfolio: Portfolio }>(
      '/portfolios',
      data
    );
    return response.data.portfolio;
  }

  async updatePortfolio(
    id: string,
    data: UpdatePortfolioRequest
  ): Promise<Portfolio> {
    const response = await this.client.put<{ portfolio: Portfolio }>(
      `/portfolios/${id}`,
      data
    );
    return response.data.portfolio;
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.client.delete(`/portfolios/${id}`);
  }

  async getPortfolioPositions(id: string): Promise<PositionWithDetails[]> {
    const response = await this.client.get<{ positions: PositionWithDetails[] }>(
      `/portfolios/${id}/positions`
    );
    return response.data.positions;
  }

  async deletePosition(portfolioId: string, symbol: string): Promise<void> {
    await this.client.delete(`/portfolios/${portfolioId}/positions/${symbol}`);
  }

  // ============================================================================
  // Strategies
  // ============================================================================

  async getStrategies(portfolioId: string): Promise<Strategy[]> {
    const response = await this.client.get<{ strategies: Strategy[] }>(
      `/portfolios/${portfolioId}/strategies`
    );
    return response.data.strategies;
  }

  async getStrategy(id: string): Promise<Strategy> {
    const response = await this.client.get<{ strategy: Strategy }>(
      `/strategies/${id}`
    );
    return response.data.strategy;
  }

  async createStrategy(data: CreateStrategyRequest): Promise<Strategy> {
    const response = await this.client.post<{ strategy: Strategy }>(
      '/strategies',
      data
    );
    return response.data.strategy;
  }

  async updateStrategy(
    id: string,
    data: UpdateStrategyRequest
  ): Promise<Strategy> {
    const response = await this.client.put<{ strategy: Strategy }>(
      `/strategies/${id}`,
      data
    );
    return response.data.strategy;
  }

  async deleteStrategy(id: string): Promise<void> {
    await this.client.delete(`/strategies/${id}`);
  }

  async toggleStrategy(id: string): Promise<Strategy> {
    const response = await this.client.post<{ strategy: Strategy }>(
      `/strategies/${id}/toggle`
    );
    return response.data.strategy;
  }

  async testStrategy(id: string, symbol: string): Promise<Signal> {
    const response = await this.client.post<{ signal: Signal }>(
      `/strategies/${id}/test`,
      { symbol }
    );
    return response.data.signal;
  }

  async executeStrategy(
    id: string,
    executeTrades: boolean = false
  ): Promise<{ signals: Signal[]; trades?: Trade[] }> {
    const response = await this.client.post<{
      signals: Signal[];
      trades?: Trade[];
    }>(`/strategies/${id}/execute`, { executeTrades });
    return response.data;
  }

  // ============================================================================
  // Trades
  // ============================================================================

  async getTrades(portfolioId: string, limit?: number): Promise<TradeWithDetails[]> {
    const response = await this.client.get<{ trades: TradeWithDetails[] }>(
      `/portfolios/${portfolioId}/trades`,
      { params: { limit } }
    );
    return response.data.trades;
  }

  async getTrade(id: string): Promise<Trade> {
    const response = await this.client.get<{ trade: Trade }>(`/trades/${id}`);
    return response.data.trade;
  }

  async executeTrade(data: ExecuteTradeRequest): Promise<Trade> {
    const response = await this.client.post<{ trade: Trade }>('/trades', data);
    return response.data.trade;
  }

  async checkOrderStatus(id: string): Promise<Trade> {
    const response = await this.client.post<{ trade: Trade }>(
      `/trades/${id}/check-status`
    );
    return response.data.trade;
  }

  // ============================================================================
  // Stocks
  // ============================================================================

  async searchStocks(query: string, limit?: number): Promise<Stock[]> {
    const response = await this.client.get<{ stocks: Stock[] }>(
      '/stocks/search',
      { params: { q: query, limit } }
    );
    return response.data.stocks;
  }

  async getStock(symbol: string): Promise<Stock> {
    const response = await this.client.get<{ stock: Stock }>(
      `/stocks/${symbol}`
    );
    return response.data.stock;
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const response = await this.client.get<StockQuote>(
      `/stocks/${symbol}/quote`
    );
    return response.data;
  }

  async getPriceHistory(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<PriceBar[]> {
    const response = await this.client.get<{ prices: PriceBar[] }>(
      `/stocks/${symbol}/prices`,
      { params: { startDate, endDate } }
    );
    return response.data.prices;
  }

  // ============================================================================
  // Backtests
  // ============================================================================

  async getBacktests(limit?: number): Promise<Backtest[]> {
    const response = await this.client.get<{ backtests: Backtest[] }>(
      '/backtests',
      { params: { limit } }
    );
    return response.data.backtests;
  }

  async getBacktest(id: string): Promise<Backtest> {
    const response = await this.client.get<{ backtest: Backtest }>(
      `/backtests/${id}`
    );
    return response.data.backtest;
  }

  async createBacktest(data: CreateBacktestRequest): Promise<Backtest> {
    const response = await this.client.post<{ backtest: Backtest }>(
      '/backtests',
      data
    );
    return response.data.backtest;
  }

  async getBacktestTrades(id: string): Promise<BacktestTrade[]> {
    const response = await this.client.get<{ trades: BacktestTrade[] }>(
      `/backtests/${id}/trades`
    );
    return response.data.trades;
  }

  async deleteBacktest(id: string): Promise<void> {
    await this.client.delete(`/backtests/${id}`);
  }

  async getPortfolioBacktests(portfolioId: string): Promise<Backtest[]> {
    const response = await this.client.get<{ backtests: Backtest[] }>(
      `/portfolios/${portfolioId}/backtests`
    );
    return response.data.backtests;
  }
}

export const apiClient = new ApiClient();
