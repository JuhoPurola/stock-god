/**
 * Auth0 JWT validation middleware
 */

import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

const JWKS_URI = 'https://arvopuro1.eu.auth0.com/.well-known/jwks.json';
const ISSUER = 'https://arvopuro1.eu.auth0.com/';

const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

interface Auth0User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Extract and validate Auth0 JWT token from API Gateway event
 */
export async function validateAuth0Token(
  event: APIGatewayProxyEvent
): Promise<{ userId: string; user: Auth0User } | null> {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('No Authorization header found');
      return null;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      // No audience check - using standard Auth0 authentication
    });

    const user: Auth0User = {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
    };

    logger.info('Token validated', { userId: user.sub });

    // Auto-create user if doesn't exist
    await ensureUserExists(user);

    return { userId: user.sub, user };
  } catch (error) {
    logger.error('Token validation failed', error);
    return null;
  }
}

/**
 * Ensure user exists in database, create if not
 */
async function ensureUserExists(user: Auth0User): Promise<void> {
  try {
    const existingUser = await query(
      'SELECT id FROM users WHERE id = $1',
      [user.sub]
    );

    if (existingUser.rows.length === 0) {
      // Create new user
      await query(
        `INSERT INTO users (id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [user.sub, user.email || '', user.name || 'User']
      );
      logger.info('Created new user', { userId: user.sub, email: user.email });
    }
  } catch (error) {
    logger.error('Failed to ensure user exists', error);
    throw error;
  }
}

/**
 * Get user ID from event (supports both Auth0 and legacy x-user-id header)
 */
export async function getUserIdFromEvent(
  event: APIGatewayProxyEvent
): Promise<string | null> {
  // Try Auth0 token first
  const auth = await validateAuth0Token(event);
  if (auth) {
    return auth.userId;
  }

  // Fallback to x-user-id header for backward compatibility
  const userId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
  if (userId) {
    logger.info('Using x-user-id header', { userId });
    return userId;
  }

  logger.warn('No authentication found');
  return null;
}

/**
 * Verify Auth0 token from raw token string (for WebSocket connections)
 */
export async function verifyAuth0Token(token: string): Promise<Auth0User | null> {
  try {
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
    });

    const user: Auth0User = {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
    };

    logger.info('Token verified for WebSocket', { userId: user.sub });

    // Auto-create user if doesn't exist
    await ensureUserExists(user);

    return user;
  } catch (error) {
    logger.error('Token verification failed', error);
    return null;
  }
}
