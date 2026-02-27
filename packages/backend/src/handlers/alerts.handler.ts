/**
 * Alert API handlers
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AlertService } from '../services/alert.service.js';
import { getUserId, createApiResponse, parseBody, errorResponse } from '../utils/api.utils.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import type { PriceCondition } from '@stock-picker/shared';

const alertService = new AlertService();

// ============================================================================
// Validation Schemas
// ============================================================================

const createPriceAlertSchema = z.object({
  symbol: z.string().min(1).max(10),
  condition: z.enum(['above', 'below', 'percent_change']),
  targetPrice: z.number().positive().optional(),
  percentChange: z.number().optional(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  tradeAlerts: z.boolean().optional(),
  priceAlerts: z.boolean().optional(),
  strategyAlerts: z.boolean().optional(),
  riskAlerts: z.boolean().optional(),
});

// ============================================================================
// Alert Handlers
// ============================================================================

/**
 * Get alerts for user
 * GET /alerts
 */
export async function getAlerts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);

    const limit = event.queryStringParameters?.limit
      ? parseInt(event.queryStringParameters.limit, 10)
      : 50;
    const offset = event.queryStringParameters?.offset
      ? parseInt(event.queryStringParameters.offset, 10)
      : 0;
    const unreadOnly = event.queryStringParameters?.unreadOnly === 'true';

    const alerts = await alertService.getAlerts(userId, { limit, offset, unreadOnly });

    return createApiResponse(200, { alerts });
  } catch (err) {
    logger.error('Error getting alerts:', err);
    return errorResponse(err);
  }
}

/**
 * Get single alert
 * GET /alerts/:id
 */
export async function getAlert(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);
    const alertId = event.pathParameters?.id;

    if (!alertId) {
      return createApiResponse(400, { error: 'Alert ID is required' });
    }

    const alert = await alertService.getAlert(alertId);

    // Verify ownership
    if (alert.userId !== userId) {
      return createApiResponse(403, { error: 'Unauthorized' });
    }

    return createApiResponse(200,{ alert });
  } catch (err) {
    logger.error('Error getting alert:', err);
    return errorResponse(err);
  }
}

/**
 * Get unread count
 * GET /alerts/count/unread
 */
export async function getUnreadCount(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);

    const count = await alertService.countUnread(userId);

    return createApiResponse(200,{ count });
  } catch (err) {
    logger.error('Error getting unread count:', err);
    return errorResponse(err);
  }
}

/**
 * Mark alert as read
 * PUT /alerts/:id/read
 */
export async function markAlertAsRead(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);
    const alertId = event.pathParameters?.id;

    if (!alertId) {
      return createApiResponse(400, { error: 'Alert ID is required' });
    }

    // Verify ownership
    const alert = await alertService.getAlert(alertId);
    if (alert.userId !== userId) {
      return createApiResponse(403, { error: 'Unauthorized' });
    }

    await alertService.markAsRead(alertId);

    return createApiResponse(200,{ message: 'Alert marked as read' });
  } catch (err) {
    logger.error('Error marking alert as read:', err);
    return errorResponse(err);
  }
}

/**
 * Mark all alerts as read
 * PUT /alerts/read-all
 */
export async function markAllAlertsAsRead(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);

    await alertService.markAllAsRead(userId);

    return createApiResponse(200,{ message: 'All alerts marked as read' });
  } catch (err) {
    logger.error('Error marking all alerts as read:', err);
    return errorResponse(err);
  }
}

// ============================================================================
// Alert Preferences Handlers
// ============================================================================

/**
 * Get alert preferences
 * GET /alerts/preferences
 */
export async function getPreferences(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);

    const preferences = await alertService.getPreferences(userId);

    return createApiResponse(200,{ preferences });
  } catch (err) {
    logger.error('Error getting alert preferences:', err);
    return errorResponse(err);
  }
}

/**
 * Update alert preferences
 * PUT /alerts/preferences
 */
export async function updatePreferences(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);
    if (!event.body) {
      return createApiResponse(400, { error: 'Request body is required' });
    }
    const body = JSON.parse(event.body);

    const validated = updatePreferencesSchema.parse(body);

    const preferences = await alertService.updatePreferences(userId, validated);

    return createApiResponse(200,{ preferences });
  } catch (err) {
    logger.error('Error updating alert preferences:', err);
    return errorResponse(err);
  }
}

// ============================================================================
// Price Alert Handlers
// ============================================================================

/**
 * Get price alerts
 * GET /alerts/price-alerts
 */
export async function getPriceAlerts(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);

    const activeOnly = event.queryStringParameters?.activeOnly === 'true';

    const priceAlerts = await alertService.getPriceAlerts(userId, activeOnly);

    return createApiResponse(200,{ priceAlerts });
  } catch (err) {
    logger.error('Error getting price alerts:', err);
    return errorResponse(err);
  }
}

/**
 * Create price alert
 * POST /alerts/price-alerts
 */
export async function createPriceAlert(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);
    if (!event.body) {
      return createApiResponse(400, { error: 'Request body is required' });
    }
    const body = JSON.parse(event.body);

    const validated = createPriceAlertSchema.parse(body);

    const priceAlert = await alertService.createPriceAlert({
      userId,
      symbol: validated.symbol,
      condition: validated.condition as PriceCondition,
      targetPrice: validated.targetPrice,
      percentChange: validated.percentChange,
    });

    return createApiResponse(201, { priceAlert });
  } catch (err) {
    logger.error('Error creating price alert:', err);
    return errorResponse(err);
  }
}

/**
 * Deactivate price alert
 * DELETE /alerts/price-alerts/:id
 */
export async function deactivatePriceAlert(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = await getUserId(event);
    const alertId = event.pathParameters?.id;

    if (!alertId) {
      return createApiResponse(400, { error: 'Price alert ID is required' });
    }

    // Verify ownership
    const priceAlerts = await alertService.getPriceAlerts(userId, false);
    const priceAlert = priceAlerts.find(pa => pa.id === alertId);

    if (!priceAlert) {
      return createApiResponse(404, { error: 'Price alert not found' });
    }

    if (priceAlert.userId !== userId) {
      return createApiResponse(403, { error: 'Unauthorized' });
    }

    await alertService.deactivatePriceAlert(alertId);

    return createApiResponse(200,{ message: 'Price alert deactivated' });
  } catch (err) {
    logger.error('Error deactivating price alert:', err);
    return errorResponse(err);
  }
}
