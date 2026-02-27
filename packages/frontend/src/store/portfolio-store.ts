/**
 * Portfolio state management with Zustand
 */

import { create } from 'zustand';
import type {
  PortfolioWithStats,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  TradeExecutedEvent,
  PositionUpdateEvent,
  PortfolioUpdateEvent,
} from '@stock-picker/shared';
import { apiClient } from '../lib/api-client';

interface PortfolioState {
  portfolios: PortfolioWithStats[];
  selectedPortfolio: PortfolioWithStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPortfolios: () => Promise<void>;
  selectPortfolio: (id: string) => Promise<void>;
  createPortfolio: (data: CreatePortfolioRequest) => Promise<void>;
  updatePortfolio: (id: string, data: UpdatePortfolioRequest) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  clearError: () => void;

  // WebSocket event handlers
  handleTradeExecuted: (event: TradeExecutedEvent) => void;
  handlePositionUpdate: (event: PositionUpdateEvent) => void;
  handlePortfolioUpdate: (event: PortfolioUpdateEvent) => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolios: [],
  selectedPortfolio: null,
  loading: false,
  error: null,

  fetchPortfolios: async () => {
    set({ loading: true, error: null });
    try {
      const portfolios = await apiClient.getPortfolios();
      set({ portfolios, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch portfolios',
        loading: false,
      });
    }
  },

  selectPortfolio: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const portfolio = await apiClient.getPortfolio(id);
      set({ selectedPortfolio: portfolio, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch portfolio',
        loading: false,
      });
    }
  },

  createPortfolio: async (data: CreatePortfolioRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.createPortfolio(data);
      await get().fetchPortfolios();
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create portfolio',
        loading: false,
      });
      throw error;
    }
  },

  updatePortfolio: async (id: string, data: UpdatePortfolioRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.updatePortfolio(id, data);
      await get().fetchPortfolios();
      if (get().selectedPortfolio?.id === id) {
        await get().selectPortfolio(id);
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update portfolio',
        loading: false,
      });
      throw error;
    }
  },

  deletePortfolio: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.deletePortfolio(id);
      await get().fetchPortfolios();
      if (get().selectedPortfolio?.id === id) {
        set({ selectedPortfolio: null });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete portfolio',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  // WebSocket event handlers
  handleTradeExecuted: (event: TradeExecutedEvent) => {
    const { portfolioId, trade } = event;
    console.log('Trade executed event:', portfolioId, trade);

    // Refresh the portfolio to get updated stats
    if (get().selectedPortfolio?.id === portfolioId) {
      get().selectPortfolio(portfolioId);
    }

    // Update portfolio in list
    const portfolioIndex = get().portfolios.findIndex((p) => p.id === portfolioId);
    if (portfolioIndex !== -1) {
      // Refresh all portfolios to get updated stats
      get().fetchPortfolios();
    }
  },

  handlePositionUpdate: (event: PositionUpdateEvent) => {
    const { portfolioId } = event;
    console.log('Position update event:', portfolioId);

    // Refresh the portfolio to get updated positions
    if (get().selectedPortfolio?.id === portfolioId) {
      get().selectPortfolio(portfolioId);
    }
  },

  handlePortfolioUpdate: (event: PortfolioUpdateEvent) => {
    const { portfolio } = event;
    console.log('Portfolio update event:', portfolio.id);

    // Update selected portfolio if it matches
    if (get().selectedPortfolio?.id === portfolio.id) {
      set({ selectedPortfolio: portfolio });
    }

    // Update portfolio in list
    const portfolios = get().portfolios.map((p) =>
      p.id === portfolio.id ? portfolio : p
    );
    set({ portfolios });
  },
}));
