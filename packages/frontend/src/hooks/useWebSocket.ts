/**
 * WebSocket hook for real-time updates
 * Handles connection, reconnection with exponential backoff, and event routing
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  WebSocketEventType,
  WebSocketMessageAction,
} from '@stock-picker/shared';
import type {
  WebSocketEvent,
  WebSocketMessage,
  TradeExecutedEvent,
  PositionUpdateEvent,
  PortfolioUpdateEvent,
  AlertEvent,
  StrategySignalEvent,
  PriceUpdateEvent,
} from '@stock-picker/shared';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://your-websocket-url';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const PING_INTERVAL = 30000; // 30 seconds

interface WebSocketEventHandlers {
  onTradeExecuted?: (event: TradeExecutedEvent) => void;
  onPositionUpdate?: (event: PositionUpdateEvent) => void;
  onPortfolioUpdate?: (event: PortfolioUpdateEvent) => void;
  onAlert?: (event: AlertEvent) => void;
  onStrategySignal?: (event: StrategySignalEvent) => void;
  onPriceUpdate?: (event: PriceUpdateEvent) => void;
}

interface UseWebSocketOptions {
  enabled?: boolean;
  portfolioId?: string;
  handlers: WebSocketEventHandlers;
}

export function useWebSocket({ enabled = true, portfolioId, handlers }: UseWebSocketOptions) {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const isConnectingRef = useRef(false);
  const subscribedPortfolioRef = useRef<string | null>(null);

  /**
   * Send message to WebSocket server
   */
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  /**
   * Subscribe to portfolio updates
   */
  const subscribeToPortfolio = useCallback((portfolioId: string) => {
    sendMessage({
      action: WebSocketMessageAction.SUBSCRIBE,
      payload: { portfolioId },
    });
    subscribedPortfolioRef.current = portfolioId;
  }, [sendMessage]);

  /**
   * Unsubscribe from portfolio updates
   */
  const unsubscribeFromPortfolio = useCallback(() => {
    sendMessage({
      action: WebSocketMessageAction.UNSUBSCRIBE,
    });
    subscribedPortfolioRef.current = null;
  }, [sendMessage]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketEvent = JSON.parse(event.data);

      console.log('WebSocket event received:', message.type);

      switch (message.type) {
        case WebSocketEventType.TRADE_EXECUTED:
          handlers.onTradeExecuted?.(message.data as TradeExecutedEvent);
          break;

        case WebSocketEventType.POSITION_UPDATE:
          handlers.onPositionUpdate?.(message.data as PositionUpdateEvent);
          break;

        case WebSocketEventType.PORTFOLIO_UPDATE:
          handlers.onPortfolioUpdate?.(message.data as PortfolioUpdateEvent);
          break;

        case WebSocketEventType.ALERT:
          handlers.onAlert?.(message.data as AlertEvent);
          break;

        case WebSocketEventType.STRATEGY_SIGNAL:
          handlers.onStrategySignal?.(message.data as StrategySignalEvent);
          break;

        case WebSocketEventType.PRICE_UPDATE:
          handlers.onPriceUpdate?.(message.data as PriceUpdateEvent);
          break;

        default:
          console.warn('Unknown WebSocket event type:', (message as any).type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [handlers]);

  /**
   * Start ping interval to keep connection alive
   */
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ action: WebSocketMessageAction.PING });
      }
    }, PING_INTERVAL);
  }, [sendMessage]);

  /**
   * Stop ping interval
   */
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    if (!enabled || !isAuthenticated || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    try {
      // Get access token for authentication
      const token = await getAccessTokenSilently();

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Create WebSocket connection with token
      const wsUrl = `${WEBSOCKET_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;

        // Start ping interval
        startPingInterval();

        // Re-subscribe to portfolio if we were subscribed before
        if (portfolioId) {
          subscribeToPortfolio(portfolioId);
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        isConnectingRef.current = false;
        stopPingInterval();

        // Attempt reconnection with exponential backoff
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            reconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_DELAY
          );

          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      isConnectingRef.current = false;
    }
  }, [
    enabled,
    isAuthenticated,
    getAccessTokenSilently,
    handleMessage,
    startPingInterval,
    stopPingInterval,
    portfolioId,
    subscribeToPortfolio,
  ]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopPingInterval();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, [stopPingInterval]);

  /**
   * Effect: Connect when enabled and authenticated
   */
  useEffect(() => {
    if (enabled && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, isAuthenticated]); // Only reconnect when these change

  /**
   * Effect: Subscribe to portfolio when portfolioId changes
   */
  useEffect(() => {
    if (!portfolioId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Unsubscribe from previous portfolio
    if (subscribedPortfolioRef.current && subscribedPortfolioRef.current !== portfolioId) {
      unsubscribeFromPortfolio();
    }

    // Subscribe to new portfolio
    if (subscribedPortfolioRef.current !== portfolioId) {
      subscribeToPortfolio(portfolioId);
    }
  }, [portfolioId, subscribeToPortfolio, unsubscribeFromPortfolio]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
  };
}
