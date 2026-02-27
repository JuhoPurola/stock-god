/**
 * WebSocket service for broadcasting real-time events to connected clients
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand, GoneException } from '@aws-sdk/client-apigatewaymanagementapi';
import type {
  WebSocketEvent,
  TradeExecutedEvent,
  PositionUpdateEvent,
  PortfolioUpdateEvent,
  AlertEvent,
  StrategySignalEvent,
  PriceUpdateEvent,
  PortfolioWithStats,
} from '@stock-picker/shared';
import { WebSocketEventType } from '@stock-picker/shared';
import type { Trade, Position, Alert, Signal } from '@stock-picker/shared';
import { logger } from '../utils/logger.js';

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE_NAME || '';
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT || '';

// DynamoDB client (AWS SDK v3)
const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// API Gateway Management API client for sending messages
let apiGatewayClient: ApiGatewayManagementApiClient | null = null;

function getApiGatewayClient(): ApiGatewayManagementApiClient {
  if (!apiGatewayClient) {
    apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: WEBSOCKET_API_ENDPOINT,
      region: process.env.AWS_REGION || 'eu-west-1',
    });
  }
  return apiGatewayClient;
}

/**
 * Send message to a specific WebSocket connection
 */
async function sendToConnection(connectionId: string, data: any): Promise<boolean> {
  try {
    const client = getApiGatewayClient();

    await client.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data)),
    }));

    return true;
  } catch (error: any) {
    // Connection is stale, remove it (410 Gone)
    if (error instanceof GoneException || error.name === 'GoneException') {
      logger.warn(`Stale connection ${connectionId}, removing from table`);
      await removeConnection(connectionId);
      return false;
    }

    logger.error(`Failed to send message to connection ${connectionId}:`, error);
    return false;
  }
}

/**
 * Remove stale connection from DynamoDB
 */
async function removeConnection(connectionId: string): Promise<void> {
  try {
    await dynamodb.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    }));
  } catch (error) {
    logger.error(`Failed to remove connection ${connectionId}:`, error);
  }
}

/**
 * Get all connections for a specific user
 */
async function getUserConnections(userId: string): Promise<string[]> {
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    return (result.Items || []).map(item => item.connectionId as string);
  } catch (error) {
    logger.error(`Failed to get connections for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get all connections for a specific portfolio
 */
async function getPortfolioConnections(portfolioId: string): Promise<string[]> {
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'PortfolioIdIndex',
      KeyConditionExpression: 'portfolioId = :portfolioId',
      ExpressionAttributeValues: {
        ':portfolioId': portfolioId,
      },
    }));

    return (result.Items || []).map(item => item.connectionId as string);
  } catch (error) {
    logger.error(`Failed to get connections for portfolio ${portfolioId}:`, error);
    return [];
  }
}

/**
 * Broadcast event to all user connections
 */
async function broadcastToUser<T>(userId: string, event: WebSocketEvent<T>): Promise<void> {
  const connectionIds = await getUserConnections(userId);

  if (connectionIds.length === 0) {
    logger.debug(`No active connections for user ${userId}`);
    return;
  }

  logger.info(`Broadcasting to ${connectionIds.length} connections for user ${userId}`);

  const promises = connectionIds.map(connectionId =>
    sendToConnection(connectionId, event)
  );

  await Promise.all(promises);
}

/**
 * Broadcast event to all portfolio subscribers
 */
async function broadcastToPortfolio<T>(portfolioId: string, event: WebSocketEvent<T>): Promise<void> {
  const connectionIds = await getPortfolioConnections(portfolioId);

  if (connectionIds.length === 0) {
    logger.debug(`No active connections for portfolio ${portfolioId}`);
    return;
  }

  logger.info(`Broadcasting to ${connectionIds.length} connections for portfolio ${portfolioId}`);

  const promises = connectionIds.map(connectionId =>
    sendToConnection(connectionId, event)
  );

  await Promise.all(promises);
}

/**
 * Create WebSocket event wrapper
 */
function createEvent<T>(type: WebSocketEventType, data: T): WebSocketEvent<T> {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

// ============================================================================
// Public API - Event Broadcasting Functions
// ============================================================================

/**
 * Send trade executed event
 */
export async function sendTradeExecuted(portfolioId: string, trade: Trade): Promise<void> {
  const eventData: TradeExecutedEvent = {
    portfolioId,
    trade,
  };

  const event = createEvent(WebSocketEventType.TRADE_EXECUTED, eventData);
  await broadcastToPortfolio(portfolioId, event);
}

/**
 * Send position update event
 */
export async function sendPositionUpdate(portfolioId: string, position: Position): Promise<void> {
  const eventData: PositionUpdateEvent = {
    portfolioId,
    position,
  };

  const event = createEvent(WebSocketEventType.POSITION_UPDATE, eventData);
  await broadcastToPortfolio(portfolioId, event);
}

/**
 * Send portfolio update event
 */
export async function sendPortfolioUpdate(portfolio: PortfolioWithStats): Promise<void> {
  const eventData: PortfolioUpdateEvent = {
    portfolio,
  };

  const event = createEvent(WebSocketEventType.PORTFOLIO_UPDATE, eventData);
  await broadcastToPortfolio(portfolio.id, event);
}

/**
 * Send alert event
 */
export async function sendAlert(userId: string, alert: Alert): Promise<void> {
  const eventData: AlertEvent = {
    alert,
  };

  const event = createEvent(WebSocketEventType.ALERT, eventData);
  await broadcastToUser(userId, event);
}

/**
 * Send strategy signal event
 */
export async function sendStrategySignal(
  strategyId: string,
  portfolioId: string,
  signal: Signal
): Promise<void> {
  const eventData: StrategySignalEvent = {
    strategyId,
    portfolioId,
    signal,
  };

  const event = createEvent(WebSocketEventType.STRATEGY_SIGNAL, eventData);
  await broadcastToPortfolio(portfolioId, event);
}

/**
 * Send price update event
 */
export async function sendPriceUpdate(
  symbol: string,
  price: number,
  change: number,
  changePercent: number,
  volume: number,
  userIds: string[]
): Promise<void> {
  const eventData: PriceUpdateEvent = {
    symbol,
    price,
    change,
    changePercent,
    volume,
  };

  const event = createEvent(WebSocketEventType.PRICE_UPDATE, eventData);

  // Broadcast to all specified users
  const promises = userIds.map(userId => broadcastToUser(userId, event));
  await Promise.all(promises);
}

/**
 * Broadcast price update to all users with positions in this symbol
 */
export async function broadcastPriceUpdate(
  symbol: string,
  quote: { price: number; change: number; changePercent: number }
): Promise<void> {
  try {
    // Get all portfolios with positions in this symbol
    const result = await dynamodb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'SymbolIndex', // This index may not exist yet, fallback to scan
      // For now, broadcast to all connections
    }));

    if (!result.Items || result.Items.length === 0) {
      return;
    }

    const eventData: PriceUpdateEvent = {
      symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: 0, // Not provided in batch quotes
    };

    const event = createEvent(WebSocketEventType.PRICE_UPDATE, eventData);

    // Broadcast to all connections
    const promises = result.Items.map(item =>
      sendToConnection(item.connectionId, event)
    );

    await Promise.allSettled(promises);
  } catch (error) {
    logger.error('Failed to broadcast price update', { error, symbol });
  }
}

/**
 * Health check for WebSocket service
 */
export function isWebSocketEnabled(): boolean {
  return Boolean(WEBSOCKET_API_ENDPOINT && CONNECTIONS_TABLE);
}
