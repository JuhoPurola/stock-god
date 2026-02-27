/**
 * Alert repository - database access layer
 */

import type {
  Alert,
  AlertType,
  UserAlertPreferences,
  PriceAlert,
  PriceCondition,
} from '@stock-picker/shared';
import { query, transaction } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import type pg from 'pg';

export class AlertRepository {
  /**
   * Create a new alert
   */
  async create(data: {
    userId: string;
    portfolioId?: string;
    type: AlertType;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    metadata?: Record<string, unknown>;
  }): Promise<Alert> {
    const result = await query<any>(
      `INSERT INTO alerts (user_id, portfolio_id, type, title, message, severity, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.userId,
        data.portfolioId || null,
        data.type,
        data.title,
        data.message,
        data.severity,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create alert');
    }

    return this.mapToAlert(result.rows[0]);
  }

  /**
   * Find alert by ID
   */
  async findById(id: string): Promise<Alert | null> {
    const result = await query<any>(
      'SELECT * FROM alerts WHERE id = $1',
      [id]
    );

    return result.rows[0] ? this.mapToAlert(result.rows[0]) : null;
  }

  /**
   * Find alert by ID or throw
   */
  async findByIdOrThrow(id: string): Promise<Alert> {
    const alert = await this.findById(id);
    if (!alert) {
      throw new NotFoundError('Alert', id);
    }
    return alert;
  }

  /**
   * Find alerts by user ID
   */
  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Alert[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const unreadOnly = options?.unreadOnly || false;

    const whereClause = unreadOnly
      ? 'WHERE user_id = $1 AND read = false'
      : 'WHERE user_id = $1';

    const result = await query<any>(
      `SELECT * FROM alerts
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => this.mapToAlert(row));
  }

  /**
   * Count unread alerts for user
   */
  async countUnread(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM alerts WHERE user_id = $1 AND read = false',
      [userId]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Mark alert as read
   */
  async markAsRead(id: string): Promise<void> {
    await query(
      'UPDATE alerts SET read = true WHERE id = $1',
      [id]
    );
  }

  /**
   * Mark all alerts as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await query(
      'UPDATE alerts SET read = true WHERE user_id = $1 AND read = false',
      [userId]
    );
  }

  /**
   * Delete old alerts (older than 30 days)
   */
  async deleteOld(daysToKeep: number = 30): Promise<number> {
    const result = await query<any>(
      `DELETE FROM alerts
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`
    );

    return result.rowCount || 0;
  }

  // ============================================================================
  // Alert Preferences
  // ============================================================================

  /**
   * Get user alert preferences
   */
  async getPreferences(userId: string): Promise<UserAlertPreferences> {
    const result = await query<any>(
      'SELECT * FROM user_alert_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows[0]) {
      return this.mapToPreferences(result.rows[0]);
    }

    // Create default preferences if not exists
    return this.createDefaultPreferences(userId);
  }

  /**
   * Update user alert preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<UserAlertPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserAlertPreferences> {
    const fields: string[] = [];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (preferences.emailNotifications !== undefined) {
      fields.push(`email_notifications = $${paramIndex++}`);
      values.push(preferences.emailNotifications);
    }
    if (preferences.browserNotifications !== undefined) {
      fields.push(`browser_notifications = $${paramIndex++}`);
      values.push(preferences.browserNotifications);
    }
    if (preferences.tradeAlerts !== undefined) {
      fields.push(`trade_alerts = $${paramIndex++}`);
      values.push(preferences.tradeAlerts);
    }
    if (preferences.priceAlerts !== undefined) {
      fields.push(`price_alerts = $${paramIndex++}`);
      values.push(preferences.priceAlerts);
    }
    if (preferences.strategyAlerts !== undefined) {
      fields.push(`strategy_alerts = $${paramIndex++}`);
      values.push(preferences.strategyAlerts);
    }
    if (preferences.riskAlerts !== undefined) {
      fields.push(`risk_alerts = $${paramIndex++}`);
      values.push(preferences.riskAlerts);
    }

    if (fields.length === 0) {
      return this.getPreferences(userId);
    }

    fields.push(`updated_at = NOW()`);

    const result = await query<any>(
      `INSERT INTO user_alert_preferences (user_id, ${fields.map((_, i) => Object.keys(preferences)[i]).join(', ')})
       VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')})
       ON CONFLICT (user_id)
       DO UPDATE SET ${fields.join(', ')}
       RETURNING *`,
      values
    );

    return this.mapToPreferences(result.rows[0]);
  }

  /**
   * Create default alert preferences
   */
  private async createDefaultPreferences(userId: string): Promise<UserAlertPreferences> {
    const result = await query<any>(
      `INSERT INTO user_alert_preferences (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );

    return this.mapToPreferences(result.rows[0]);
  }

  // ============================================================================
  // Price Alerts
  // ============================================================================

  /**
   * Create price alert
   */
  async createPriceAlert(data: {
    userId: string;
    symbol: string;
    condition: PriceCondition;
    targetPrice?: number;
    percentChange?: number;
  }): Promise<PriceAlert> {
    const result = await query<any>(
      `INSERT INTO price_alerts (user_id, symbol, condition, target_price, percent_change)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.userId,
        data.symbol,
        data.condition,
        data.targetPrice || null,
        data.percentChange || null,
      ]
    );

    if (!result.rows[0]) {
      throw new Error('Failed to create price alert');
    }

    return this.mapToPriceAlert(result.rows[0]);
  }

  /**
   * Find price alerts by user ID
   */
  async findPriceAlertsByUserId(userId: string, activeOnly: boolean = false): Promise<PriceAlert[]> {
    const whereClause = activeOnly
      ? 'WHERE user_id = $1 AND active = true'
      : 'WHERE user_id = $1';

    const result = await query<any>(
      `SELECT * FROM price_alerts
       ${whereClause}
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapToPriceAlert(row));
  }

  /**
   * Find active price alerts for symbol
   */
  async findActivePriceAlertsBySymbol(symbol: string): Promise<PriceAlert[]> {
    const result = await query<any>(
      `SELECT * FROM price_alerts
       WHERE symbol = $1 AND active = true AND triggered = false`,
      [symbol]
    );

    return result.rows.map(row => this.mapToPriceAlert(row));
  }

  /**
   * Trigger price alert
   */
  async triggerPriceAlert(id: string): Promise<void> {
    await query(
      `UPDATE price_alerts
       SET triggered = true, triggered_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Deactivate price alert
   */
  async deactivatePriceAlert(id: string): Promise<void> {
    await query(
      'UPDATE price_alerts SET active = false WHERE id = $1',
      [id]
    );
  }

  // ============================================================================
  // Mappers
  // ============================================================================

  private mapToAlert(row: any): Alert {
    return {
      id: row.id,
      userId: row.user_id,
      portfolioId: row.portfolio_id,
      type: row.type,
      title: row.title,
      message: row.message,
      severity: row.severity,
      read: row.read,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
    };
  }

  private mapToPreferences(row: any): UserAlertPreferences {
    return {
      userId: row.user_id,
      emailNotifications: row.email_notifications,
      browserNotifications: row.browser_notifications,
      tradeAlerts: row.trade_alerts,
      priceAlerts: row.price_alerts,
      strategyAlerts: row.strategy_alerts,
      riskAlerts: row.risk_alerts,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapToPriceAlert(row: any): PriceAlert {
    return {
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      condition: row.condition,
      targetPrice: row.target_price ? parseFloat(row.target_price) : undefined,
      percentChange: row.percent_change ? parseFloat(row.percent_change) : undefined,
      triggered: row.triggered,
      active: row.active,
      createdAt: new Date(row.created_at),
      triggeredAt: row.triggered_at ? new Date(row.triggered_at) : undefined,
    };
  }
}
