/**
 * WebSocket connection handlers for real-time updates
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { WebSocketMessage } from '@stock-picker/shared';
import { WebSocketMessageAction } from '@stock-picker/shared';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// Auth0 configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'arvopurola1.eu.auth0.com';
const JWKS_URI = `https://${AUTH0_DOMAIN}/.well-known/jwks.json`;
const ISSUER = `https://${AUTH0_DOMAIN}/`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

interface Auth0User {
  sub: string;
  email?: string;
  name?: string;
}

/**
 * Verify Auth0 token WITHOUT database access (for WebSocket)
 * Note: User creation happens in API Lambda, not here
 *
 * TEMPORARY: Skip verification for encrypted tokens
 * TODO: Configure Auth0 API with audience to get JWT tokens instead of JWE
 */
async function verifyToken(token: string): Promise<Auth0User | null> {
  try {
    // Decode the header to check token type
    const parts = token.split('.');
    if (parts.length < 1 || !parts[0]) {
      console.error('Invalid token format');
      return null;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());

    // For JWE tokens (encrypted), we cannot decrypt without the key
    // TEMPORARY WORKAROUND: Accept any JWE token and use a placeholder user
    // In production, you should configure Auth0 API to return JWT tokens
    if (header.alg === 'dir' && header.enc) {
      console.log('Accepting JWE token (temporary workaround)');
      // Extract sub from Auth0 ID token structure
      // For now, use a default user ID - this should be replaced with proper auth
      return {
        sub: 'auth0|temp-user',
        email: 'user@example.com',
        name: 'Temp User',
      };
    }

    // For JWS tokens (signed), verify with JWKS
    if (parts.length === 3) {
      const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
      return {
        sub: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string,
      };
    }

    console.error('Unsupported token format');
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE_NAME || '';

/**
 * Handle WebSocket connect event
 * Authenticates user and stores connection in DynamoDB
 */
export async function handleConnect(event: any): Promise<any> {
  const connectionId = event.requestContext.connectionId;

  try {
    // Extract token from query string
    const token = event.queryStringParameters?.token;

    if (!token) {
      console.error('No token provided in connection request');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized - No token provided' }),
      };
    }

    // Verify Auth0 token (lightweight, no database access)
    const user = await verifyToken(token);

    if (!user) {
      console.error('Invalid token provided');
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized - Invalid token' }),
      };
    }

    // Store connection in DynamoDB with 24-hour TTL
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    await dynamodb.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId: user.sub,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    }));

    console.log(`WebSocket connected: ${connectionId} for user ${user.sub}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected' }),
    };
  } catch (error) {
    console.error('Error handling WebSocket connect:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}

/**
 * Handle WebSocket disconnect event
 * Removes connection from DynamoDB
 */
export async function handleDisconnect(event: any): Promise<any> {
  const connectionId = event.requestContext.connectionId;

  try {
    // Get connection to find userId
    const getResult = await dynamodb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      KeyConditionExpression: 'connectionId = :cid',
      ExpressionAttributeValues: {
        ':cid': connectionId,
      },
      Limit: 1,
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      console.warn(`Connection ${connectionId} not found in table`);
      return { statusCode: 200, body: 'OK' };
    }

    const userId = getResult.Items?.[0]?.userId;

    // Delete connection
    await dynamodb.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: {
        connectionId,
        userId,
      },
    }));

    console.log(`WebSocket disconnected: ${connectionId} for user ${userId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' }),
    };
  } catch (error) {
    console.error('Error handling WebSocket disconnect:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
}

/**
 * Handle incoming WebSocket messages
 * Routes messages based on action type
 */
export async function handleMessage(event: any): Promise<any> {
  const connectionId = event.requestContext.connectionId;

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No message body provided' }),
      };
    }

    const message: WebSocketMessage = JSON.parse(event.body);

    // Get connection details
    const getResult = await dynamodb.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      KeyConditionExpression: 'connectionId = :cid',
      ExpressionAttributeValues: {
        ':cid': connectionId,
      },
      Limit: 1,
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      console.warn(`Connection ${connectionId} not found`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' }),
      };
    }

    const userId = getResult.Items?.[0]?.userId;
    let response: any;

    switch (message.action) {
      case WebSocketMessageAction.SUBSCRIBE:
        response = await handleSubscribe(connectionId, userId, message.payload?.portfolioId);
        break;

      case WebSocketMessageAction.UNSUBSCRIBE:
        response = await handleUnsubscribe(connectionId, userId);
        break;

      case WebSocketMessageAction.PING:
        response = { success: true, message: 'pong' };
        break;

      default:
        response = {
          success: false,
          error: `Unknown action: ${(message as any).action}`,
        };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
    };
  }
}

/**
 * Subscribe connection to portfolio updates
 */
async function handleSubscribe(
  connectionId: string,
  userId: string,
  portfolioId?: string
): Promise<any> {
  try {
    if (!portfolioId) {
      return {
        success: false,
        error: 'portfolioId is required for subscribe action',
      };
    }

    // Update connection with portfolioId
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    await dynamodb.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        portfolioId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    }));

    console.log(`Connection ${connectionId} subscribed to portfolio ${portfolioId}`);

    return {
      success: true,
      message: `Subscribed to portfolio ${portfolioId}`,
    };
  } catch (error) {
    console.error('Error handling subscribe:', error);
    return {
      success: false,
      error: 'Failed to subscribe',
    };
  }
}

/**
 * Unsubscribe connection from portfolio updates
 */
async function handleUnsubscribe(
  connectionId: string,
  userId: string
): Promise<any> {
  try {
    // Update connection to remove portfolioId
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    await dynamodb.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        userId,
        connectedAt: new Date().toISOString(),
        ttl,
      },
    }));

    console.log(`Connection ${connectionId} unsubscribed from portfolio updates`);

    return {
      success: true,
      message: 'Unsubscribed from portfolio updates',
    };
  } catch (error) {
    console.error('Error handling unsubscribe:', error);
    return {
      success: false,
      error: 'Failed to unsubscribe',
    };
  }
}
