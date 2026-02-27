import { create } from 'zustand';
import type { Alert, UserAlertPreferences, PriceAlert } from '@stock-picker/shared';
import { apiClient } from '../lib/api-client';
import { playAlertSound, isSoundEnabled, setSoundEnabled } from '../utils/notification-sound';

interface AlertStore {
  // State
  alerts: Alert[];
  unreadCount: number;
  preferences: UserAlertPreferences | null;
  priceAlerts: PriceAlert[];
  loading: boolean;
  error: string | null;
  soundEnabled: boolean;

  // Actions
  fetchAlerts: (options?: { unreadOnly?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserAlertPreferences>) => Promise<void>;

  // Price Alerts
  fetchPriceAlerts: () => Promise<void>;
  createPriceAlert: (data: {
    symbol: string;
    condition: 'above' | 'below' | 'percent_change';
    targetPrice?: number;
    percentChange?: number;
  }) => Promise<void>;
  deactivatePriceAlert: (id: string) => Promise<void>;

  // Sound notifications
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;

  // Real-time updates
  addAlert: (alert: Alert) => void;
  incrementUnreadCount: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  // Initial state
  alerts: [],
  unreadCount: 0,
  preferences: null,
  priceAlerts: [],
  loading: false,
  error: null,
  soundEnabled: isSoundEnabled(),

  // Fetch alerts
  fetchAlerts: async (options = {}) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams();
      if (options.unreadOnly) {
        params.append('unreadOnly', 'true');
      }

      const response = await apiClient.get<{ alerts: Alert[] }>(
        `/alerts?${params.toString()}`
      );

      set({ alerts: response.alerts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ count: number }>('/alerts/count/unread');
      set({ unreadCount: response.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  // Mark alert as read
  markAsRead: async (alertId: string) => {
    try {
      await apiClient.put(`/alerts/${alertId}/read`, {});

      // Optimistic update
      set((state) => ({
        alerts: state.alerts.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      // Revert on error
      get().fetchAlerts();
      get().fetchUnreadCount();
      throw error;
    }
  },

  // Mark all alerts as read
  markAllAsRead: async () => {
    try {
      await apiClient.put('/alerts/read-all', {});

      // Optimistic update
      set((state) => ({
        alerts: state.alerts.map((alert) => ({ ...alert, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
      // Revert on error
      get().fetchAlerts();
      get().fetchUnreadCount();
      throw error;
    }
  },

  // Fetch preferences
  fetchPreferences: async () => {
    try {
      const response = await apiClient.get<{ preferences: UserAlertPreferences }>(
        '/alerts/preferences'
      );
      set({ preferences: response.preferences });
    } catch (error) {
      console.error('Failed to fetch alert preferences:', error);
      throw error;
    }
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<UserAlertPreferences>) => {
    try {
      const response = await apiClient.put<{ preferences: UserAlertPreferences }>(
        '/alerts/preferences',
        preferences
      );
      set({ preferences: response.preferences });
    } catch (error) {
      console.error('Failed to update alert preferences:', error);
      throw error;
    }
  },

  // Fetch price alerts
  fetchPriceAlerts: async () => {
    try {
      const response = await apiClient.get<{ priceAlerts: PriceAlert[] }>(
        '/alerts/price-alerts?activeOnly=true'
      );
      set({ priceAlerts: response.priceAlerts });
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
      throw error;
    }
  },

  // Create price alert
  createPriceAlert: async (data) => {
    try {
      const response = await apiClient.post<{ priceAlert: PriceAlert }>(
        '/alerts/price-alerts',
        data
      );

      set((state) => ({
        priceAlerts: [...state.priceAlerts, response.priceAlert],
      }));
    } catch (error) {
      console.error('Failed to create price alert:', error);
      throw error;
    }
  },

  // Deactivate price alert
  deactivatePriceAlert: async (id: string) => {
    try {
      await apiClient.delete(`/alerts/price-alerts/${id}`);

      // Optimistic update
      set((state) => ({
        priceAlerts: state.priceAlerts.filter((alert) => alert.id !== id),
      }));
    } catch (error) {
      console.error('Failed to deactivate price alert:', error);
      // Revert on error
      get().fetchPriceAlerts();
      throw error;
    }
  },

  // Sound notifications
  toggleSound: () => {
    const newState = !get().soundEnabled;
    setSoundEnabled(newState);
    set({ soundEnabled: newState });
  },

  setSoundEnabled: (enabled: boolean) => {
    setSoundEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  // Real-time updates (called from WebSocket)
  addAlert: (alert: Alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    }));

    // Play sound notification if enabled
    if (get().soundEnabled) {
      playAlertSound(alert.severity);
    }
  },

  incrementUnreadCount: () => {
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
