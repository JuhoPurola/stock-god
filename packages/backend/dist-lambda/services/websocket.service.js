/**
 * WebSocket service for broadcasting real-time events to connected clients
 */
import * as AWS from 'aws-sdk';
import { WebSocketEventType } from '@stock-picker/shared';
import { logger } from '../utils/logger.js';
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE_NAME || '';
const WEBSOCKET_API_ENDPOINT = process.env.WEBSOCKET_API_ENDPOINT || '';
const dynamodb = new AWS.DynamoDB.DocumentClient();
// API Gateway Management API client for sending messages
let apiGatewayClient = null;
function getApiGatewayClient() {
    if (!apiGatewayClient) {
        apiGatewayClient = new AWS.ApiGatewayManagementApi({
            endpoint: WEBSOCKET_API_ENDPOINT,
            region: process.env.AWS_REGION || 'eu-west-1',
        });
    }
    return apiGatewayClient;
}
/**
 * Send message to a specific WebSocket connection
 */
async function sendToConnection(connectionId, data) {
    try {
        const client = getApiGatewayClient();
        await client.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify(data),
        }).promise();
        return true;
    }
    catch (error) {
        // Connection is stale, remove it
        if (error.statusCode === 410) {
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
async function removeConnection(connectionId) {
    try {
        await dynamodb.delete({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId },
        }).promise();
    }
    catch (error) {
        logger.error(`Failed to remove connection ${connectionId}:`, error);
    }
}
/**
 * Get all connections for a specific user
 */
async function getUserConnections(userId) {
    try {
        const result = await dynamodb.query({
            TableName: CONNECTIONS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        }).promise();
        return (result.Items || []).map(item => item.connectionId);
    }
    catch (error) {
        logger.error(`Failed to get connections for user ${userId}:`, error);
        return [];
    }
}
/**
 * Get all connections for a specific portfolio
 */
async function getPortfolioConnections(portfolioId) {
    try {
        const result = await dynamodb.query({
            TableName: CONNECTIONS_TABLE,
            IndexName: 'PortfolioIdIndex',
            KeyConditionExpression: 'portfolioId = :portfolioId',
            ExpressionAttributeValues: {
                ':portfolioId': portfolioId,
            },
        }).promise();
        return (result.Items || []).map(item => item.connectionId);
    }
    catch (error) {
        logger.error(`Failed to get connections for portfolio ${portfolioId}:`, error);
        return [];
    }
}
/**
 * Broadcast event to all user connections
 */
async function broadcastToUser(userId, event) {
    const connectionIds = await getUserConnections(userId);
    if (connectionIds.length === 0) {
        logger.debug(`No active connections for user ${userId}`);
        return;
    }
    logger.info(`Broadcasting to ${connectionIds.length} connections for user ${userId}`);
    const promises = connectionIds.map(connectionId => sendToConnection(connectionId, event));
    await Promise.all(promises);
}
/**
 * Broadcast event to all portfolio subscribers
 */
async function broadcastToPortfolio(portfolioId, event) {
    const connectionIds = await getPortfolioConnections(portfolioId);
    if (connectionIds.length === 0) {
        logger.debug(`No active connections for portfolio ${portfolioId}`);
        return;
    }
    logger.info(`Broadcasting to ${connectionIds.length} connections for portfolio ${portfolioId}`);
    const promises = connectionIds.map(connectionId => sendToConnection(connectionId, event));
    await Promise.all(promises);
}
/**
 * Create WebSocket event wrapper
 */
function createEvent(type, data) {
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
export async function sendTradeExecuted(portfolioId, trade) {
    const eventData = {
        portfolioId,
        trade,
    };
    const event = createEvent(WebSocketEventType.TRADE_EXECUTED, eventData);
    await broadcastToPortfolio(portfolioId, event);
}
/**
 * Send position update event
 */
export async function sendPositionUpdate(portfolioId, position) {
    const eventData = {
        portfolioId,
        position,
    };
    const event = createEvent(WebSocketEventType.POSITION_UPDATE, eventData);
    await broadcastToPortfolio(portfolioId, event);
}
/**
 * Send portfolio update event
 */
export async function sendPortfolioUpdate(portfolio) {
    const eventData = {
        portfolio,
    };
    const event = createEvent(WebSocketEventType.PORTFOLIO_UPDATE, eventData);
    await broadcastToPortfolio(portfolio.id, event);
}
/**
 * Send alert event
 */
export async function sendAlert(userId, alert) {
    const eventData = {
        alert,
    };
    const event = createEvent(WebSocketEventType.ALERT, eventData);
    await broadcastToUser(userId, event);
}
/**
 * Send strategy signal event
 */
export async function sendStrategySignal(strategyId, portfolioId, signal) {
    const eventData = {
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
export async function sendPriceUpdate(symbol, price, change, changePercent, volume, userIds) {
    const eventData = {
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
 * Health check for WebSocket service
 */
export function isWebSocketEnabled() {
    return Boolean(WEBSOCKET_API_ENDPOINT && CONNECTIONS_TABLE);
}
//# sourceMappingURL=websocket.service.js.map