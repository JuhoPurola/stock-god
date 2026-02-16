/**
 * Strategy state management with Zustand
 */

import { create } from 'zustand';
import type {
  Strategy,
  CreateStrategyRequest,
  UpdateStrategyRequest,
  Signal,
} from '@stock-picker/shared';
import { apiClient } from '../lib/api-client';

interface StrategyState {
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  signals: Signal[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchStrategies: (portfolioId: string) => Promise<void>;
  selectStrategy: (id: string) => Promise<void>;
  createStrategy: (data: CreateStrategyRequest) => Promise<void>;
  updateStrategy: (id: string, data: UpdateStrategyRequest) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  toggleStrategy: (id: string) => Promise<void>;
  testStrategy: (id: string, symbol: string) => Promise<Signal>;
  executeStrategy: (id: string, executeTrades: boolean) => Promise<void>;
  clearError: () => void;
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  strategies: [],
  selectedStrategy: null,
  signals: [],
  loading: false,
  error: null,

  fetchStrategies: async (portfolioId: string) => {
    set({ loading: true, error: null });
    try {
      const strategies = await apiClient.getStrategies(portfolioId);
      set({ strategies, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch strategies',
        loading: false,
      });
    }
  },

  selectStrategy: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const strategy = await apiClient.getStrategy(id);
      set({ selectedStrategy: strategy, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch strategy',
        loading: false,
      });
    }
  },

  createStrategy: async (data: CreateStrategyRequest) => {
    set({ loading: true, error: null });
    try {
      await apiClient.createStrategy(data);
      await get().fetchStrategies(data.portfolioId);
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create strategy',
        loading: false,
      });
      throw error;
    }
  },

  updateStrategy: async (id: string, data: UpdateStrategyRequest) => {
    set({ loading: true, error: null });
    try {
      const strategy = await apiClient.updateStrategy(id, data);
      const strategies = get().strategies.map((s) =>
        s.id === id ? strategy : s
      );
      set({ strategies, loading: false });
      if (get().selectedStrategy?.id === id) {
        set({ selectedStrategy: strategy });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update strategy',
        loading: false,
      });
      throw error;
    }
  },

  deleteStrategy: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.deleteStrategy(id);
      const strategies = get().strategies.filter((s) => s.id !== id);
      set({ strategies, loading: false });
      if (get().selectedStrategy?.id === id) {
        set({ selectedStrategy: null });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete strategy',
        loading: false,
      });
      throw error;
    }
  },

  toggleStrategy: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const strategy = await apiClient.toggleStrategy(id);
      const strategies = get().strategies.map((s) =>
        s.id === id ? strategy : s
      );
      set({ strategies, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to toggle strategy',
        loading: false,
      });
      throw error;
    }
  },

  testStrategy: async (id: string, symbol: string) => {
    set({ loading: true, error: null });
    try {
      const signal = await apiClient.testStrategy(id, symbol);
      set({ loading: false });
      return signal;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to test strategy',
        loading: false,
      });
      throw error;
    }
  },

  executeStrategy: async (id: string, executeTrades: boolean) => {
    set({ loading: true, error: null });
    try {
      const result = await apiClient.executeStrategy(id, executeTrades);
      set({ signals: result.signals, loading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to execute strategy',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
