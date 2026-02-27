/**
 * WebSocket provider component
 * Manages WebSocket connection and routes events to appropriate stores
 */

import { ReactNode, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { usePortfolioStore } from '../store/portfolio-store';
import { useAlertStore } from '../store/alert-store';
import { useToast } from '../hooks/useToast';
import { useAuth0 } from '@auth0/auth0-react';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAuth0();
  const portfolioStore = usePortfolioStore();
  const alertStore = useAlertStore();
  const { showInfo } = useToast();
  const selectedPortfolioId = portfolioStore.selectedPortfolio?.id;

  // Initialize WebSocket with event handlers
  const { isConnected } = useWebSocket({
    enabled: isAuthenticated,
    portfolioId: selectedPortfolioId,
    handlers: {
      onTradeExecuted: (event) => {
        portfolioStore.handleTradeExecuted(event);
      },
      onPositionUpdate: (event) => {
        portfolioStore.handlePositionUpdate(event);
      },
      onPortfolioUpdate: (event) => {
        portfolioStore.handlePortfolioUpdate(event);
      },
      onAlert: (event) => {
        // Add alert to store
        alertStore.addAlert(event.alert);

        // Show toast notification
        showInfo(event.alert.title);

        console.log('Alert received:', event.alert);
      },
      onStrategySignal: (event) => {
        // TODO: Implement strategy signal handling
        console.log('Strategy signal received:', event);
      },
      onPriceUpdate: (event) => {
        // TODO: Implement price update handling
        console.log('Price update received:', event);
      },
    },
  });

  // Log connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log('✅ WebSocket connected - Real-time updates enabled');
    } else {
      console.log('🔴 WebSocket disconnected');
    }
  }, [isConnected]);

  return <>{children}</>;
}
