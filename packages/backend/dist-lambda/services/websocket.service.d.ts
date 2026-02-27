/**
 * WebSocket service for broadcasting real-time events to connected clients
 */
import type { PortfolioWithStats } from '@stock-picker/shared';
import type { Trade, Position, Alert, Signal } from '@stock-picker/shared';
/**
 * Send trade executed event
 */
export declare function sendTradeExecuted(portfolioId: string, trade: Trade): Promise<void>;
/**
 * Send position update event
 */
export declare function sendPositionUpdate(portfolioId: string, position: Position): Promise<void>;
/**
 * Send portfolio update event
 */
export declare function sendPortfolioUpdate(portfolio: PortfolioWithStats): Promise<void>;
/**
 * Send alert event
 */
export declare function sendAlert(userId: string, alert: Alert): Promise<void>;
/**
 * Send strategy signal event
 */
export declare function sendStrategySignal(strategyId: string, portfolioId: string, signal: Signal): Promise<void>;
/**
 * Send price update event
 */
export declare function sendPriceUpdate(symbol: string, price: number, change: number, changePercent: number, volume: number, userIds: string[]): Promise<void>;
/**
 * Health check for WebSocket service
 */
export declare function isWebSocketEnabled(): boolean;
//# sourceMappingURL=websocket.service.d.ts.map