/**
 * Alert service - business logic for alert management
 */

import { AlertRepository } from '../repositories/alert.repository.js';
import { EmailService } from './email.service.js';
import * as websocketService from './websocket.service.js';
import { logger } from '../utils/logger.js';
import {
  AlertType,
  type Alert,
  type Trade,
  type UserAlertPreferences,
  type PriceAlert,
  type PriceCondition,
} from '@stock-picker/shared';
import { query } from '../config/database.js';

export class AlertService {
  private alertRepository: AlertRepository;
  private emailService: EmailService;

  constructor() {
    this.alertRepository = new AlertRepository();
    this.emailService = new EmailService();
  }

  // ============================================================================
  // Alert CRUD
  // ============================================================================

  /**
   * Create and send alert
   */
  async createAlert(data: {
    userId: string;
    portfolioId?: string;
    type: AlertType;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    metadata?: Record<string, unknown>;
  }): Promise<Alert> {
    // Create alert in database
    const alert = await this.alertRepository.create(data);

    // Get user preferences and email
    const [preferences, userEmail] = await Promise.all([
      this.alertRepository.getPreferences(data.userId),
      this.getUserEmail(data.userId),
    ]);

    // Check if user wants this type of alert
    const shouldSend = this.shouldSendAlert(alert.type, preferences);

    if (shouldSend) {
      // Send browser notification via WebSocket (non-blocking)
      if (preferences.browserNotifications && websocketService.isWebSocketEnabled()) {
        websocketService.sendAlert(data.userId, alert).catch(err =>
          logger.error('Failed to send WebSocket alert:', err)
        );
      }

      // Send email notification (non-blocking)
      if (preferences.emailNotifications && userEmail) {
        this.emailService.sendAlertEmail(userEmail, alert).catch(err =>
          logger.error('Failed to send email alert:', err)
        );
      }
    }

    return alert;
  }

  /**
   * Get alerts for user
   */
  async getAlerts(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<Alert[]> {
    return this.alertRepository.findByUserId(userId, options);
  }

  /**
   * Get alert by ID
   */
  async getAlert(id: string): Promise<Alert> {
    return this.alertRepository.findByIdOrThrow(id);
  }

  /**
   * Count unread alerts
   */
  async countUnread(userId: string): Promise<number> {
    return this.alertRepository.countUnread(userId);
  }

  /**
   * Mark alert as read
   */
  async markAsRead(id: string): Promise<void> {
    await this.alertRepository.markAsRead(id);
  }

  /**
   * Mark all alerts as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.alertRepository.markAllAsRead(userId);
  }

  // ============================================================================
  // Specific Alert Types
  // ============================================================================

  /**
   * Create trade executed alert
   */
  async createTradeAlert(trade: Trade, success: boolean): Promise<void> {
    // Get portfolio owner
    const userId = await this.getPortfolioOwner(trade.portfolioId);
    if (!userId) {
      logger.warn(`No user found for portfolio ${trade.portfolioId}`);
      return;
    }

    const type: AlertType = success ? AlertType.TRADE_EXECUTED : AlertType.TRADE_FAILED;
    const severity = success ? 'info' : 'error';
    const title = success
      ? `Trade Executed: ${trade.side.toUpperCase()} ${trade.symbol}`
      : `Trade Failed: ${trade.side.toUpperCase()} ${trade.symbol}`;
    const message = success
      ? `Successfully ${trade.side === 'buy' ? 'bought' : 'sold'} ${trade.quantity} shares of ${trade.symbol} at $${trade.price.toFixed(2)}`
      : `Failed to ${trade.side === 'buy' ? 'buy' : 'sell'} ${trade.quantity} shares of ${trade.symbol}`;

    await this.createAlert({
      userId,
      portfolioId: trade.portfolioId,
      type,
      title,
      message,
      severity,
      metadata: { tradeId: trade.id, symbol: trade.symbol },
    });

    // Also send dedicated trade email
    const [preferences, userEmail] = await Promise.all([
      this.alertRepository.getPreferences(userId),
      this.getUserEmail(userId),
    ]);

    if (preferences.tradeAlerts && preferences.emailNotifications && userEmail) {
      this.emailService.sendTradeEmail(userEmail, trade, success).catch(err =>
        logger.error('Failed to send trade email:', err)
      );
    }
  }

  /**
   * Create stop loss triggered alert
   */
  async createStopLossAlert(
    userId: string,
    portfolioId: string,
    symbol: string,
    quantity: number,
    stopPrice: number
  ): Promise<void> {
    await this.createAlert({
      userId,
      portfolioId,
      type: AlertType.STOP_LOSS_TRIGGERED,
      title: `Stop Loss Triggered: ${symbol}`,
      message: `Stop loss order triggered for ${quantity} shares of ${symbol} at $${stopPrice.toFixed(2)}`,
      severity: 'warning',
      metadata: { symbol, quantity, stopPrice },
    });
  }

  /**
   * Create take profit triggered alert
   */
  async createTakeProfitAlert(
    userId: string,
    portfolioId: string,
    symbol: string,
    quantity: number,
    targetPrice: number
  ): Promise<void> {
    await this.createAlert({
      userId,
      portfolioId,
      type: AlertType.TAKE_PROFIT_TRIGGERED,
      title: `Take Profit Triggered: ${symbol}`,
      message: `Take profit order triggered for ${quantity} shares of ${symbol} at $${targetPrice.toFixed(2)}`,
      severity: 'info',
      metadata: { symbol, quantity, targetPrice },
    });
  }

  /**
   * Create daily loss limit alert
   */
  async createDailyLossLimitAlert(
    userId: string,
    portfolioId: string,
    lossAmount: number,
    lossPercent: number
  ): Promise<void> {
    await this.createAlert({
      userId,
      portfolioId,
      type: AlertType.DAILY_LOSS_LIMIT,
      title: 'Daily Loss Limit Reached',
      message: `Portfolio has reached daily loss limit: -$${lossAmount.toFixed(2)} (${lossPercent.toFixed(2)}%). Trading halted for today.`,
      severity: 'error',
      metadata: { lossAmount, lossPercent },
    });
  }

  /**
   * Create strategy error alert
   */
  async createStrategyErrorAlert(
    userId: string,
    portfolioId: string,
    strategyId: string,
    strategyName: string,
    error: string
  ): Promise<void> {
    await this.createAlert({
      userId,
      portfolioId,
      type: AlertType.STRATEGY_ERROR,
      title: `Strategy Error: ${strategyName}`,
      message: `Error executing strategy: ${error}`,
      severity: 'error',
      metadata: { strategyId, strategyName, error },
    });
  }

  // ============================================================================
  // Alert Preferences
  // ============================================================================

  /**
   * Get user alert preferences
   */
  async getPreferences(userId: string): Promise<UserAlertPreferences> {
    return this.alertRepository.getPreferences(userId);
  }

  /**
   * Update user alert preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<Omit<UserAlertPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserAlertPreferences> {
    return this.alertRepository.updatePreferences(userId, preferences);
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
    // Validate
    if (data.condition === 'above' || data.condition === 'below') {
      if (!data.targetPrice) {
        throw new Error('Target price is required for above/below conditions');
      }
    } else if (data.condition === 'percent_change') {
      if (!data.percentChange) {
        throw new Error('Percent change is required for percent_change condition');
      }
    }

    return this.alertRepository.createPriceAlert(data);
  }

  /**
   * Get price alerts for user
   */
  async getPriceAlerts(userId: string, activeOnly: boolean = false): Promise<PriceAlert[]> {
    return this.alertRepository.findPriceAlertsByUserId(userId, activeOnly);
  }

  /**
   * Deactivate price alert
   */
  async deactivatePriceAlert(id: string): Promise<void> {
    await this.alertRepository.deactivatePriceAlert(id);
  }

  /**
   * Check price alerts for symbol
   * This should be called periodically for active symbols
   */
  async checkPriceAlerts(symbol: string, currentPrice: number, previousPrice: number): Promise<void> {
    const alerts = await this.alertRepository.findActivePriceAlertsBySymbol(symbol);

    for (const alert of alerts) {
      let shouldTrigger = false;

      if (alert.condition === 'above' && alert.targetPrice) {
        shouldTrigger = currentPrice >= alert.targetPrice;
      } else if (alert.condition === 'below' && alert.targetPrice) {
        shouldTrigger = currentPrice <= alert.targetPrice;
      } else if (alert.condition === 'percent_change' && alert.percentChange) {
        const change = ((currentPrice - previousPrice) / previousPrice) * 100;
        shouldTrigger = Math.abs(change) >= Math.abs(alert.percentChange);
      }

      if (shouldTrigger) {
        await this.triggerPriceAlert(alert, currentPrice);
      }
    }
  }

  /**
   * Trigger a price alert
   */
  private async triggerPriceAlert(priceAlert: PriceAlert, currentPrice: number): Promise<void> {
    // Mark as triggered
    await this.alertRepository.triggerPriceAlert(priceAlert.id);

    // Create alert notification
    let conditionText = '';
    if (priceAlert.condition === 'above' && priceAlert.targetPrice) {
      conditionText = `above $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'below' && priceAlert.targetPrice) {
      conditionText = `below $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'percent_change' && priceAlert.percentChange) {
      conditionText = `changed by ${priceAlert.percentChange}%`;
    }

    await this.createAlert({
      userId: priceAlert.userId,
      type: AlertType.PRICE_ALERT,
      title: `Price Alert: ${priceAlert.symbol}`,
      message: `${priceAlert.symbol} has reached your target (${conditionText}). Current price: $${currentPrice.toFixed(2)}`,
      severity: 'info',
      metadata: { priceAlertId: priceAlert.id, symbol: priceAlert.symbol, currentPrice },
    });

    // Send dedicated price alert email
    const [preferences, userEmail] = await Promise.all([
      this.alertRepository.getPreferences(priceAlert.userId),
      this.getUserEmail(priceAlert.userId),
    ]);

    if (preferences.priceAlerts && preferences.emailNotifications && userEmail) {
      this.emailService.sendPriceAlertEmail(userEmail, priceAlert, currentPrice).catch(err =>
        logger.error('Failed to send price alert email:', err)
      );
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if alert should be sent based on user preferences
   */
  private shouldSendAlert(type: AlertType, preferences: UserAlertPreferences): boolean {
    switch (type) {
      case AlertType.TRADE_EXECUTED:
      case AlertType.TRADE_FAILED:
        return preferences.tradeAlerts;
      case AlertType.PRICE_ALERT:
        return preferences.priceAlerts;
      case AlertType.STRATEGY_ERROR:
        return preferences.strategyAlerts;
      case AlertType.STOP_LOSS_TRIGGERED:
      case AlertType.TAKE_PROFIT_TRIGGERED:
      case AlertType.DAILY_LOSS_LIMIT:
        return preferences.riskAlerts;
      default:
        return true;
    }
  }

  /**
   * Get user email from database
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    const result = await query<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    return result.rows[0]?.email || null;
  }

  /**
   * Get portfolio owner user ID
   */
  private async getPortfolioOwner(portfolioId: string): Promise<string | null> {
    const result = await query<{ user_id: string }>(
      'SELECT user_id FROM portfolios WHERE id = $1',
      [portfolioId]
    );

    return result.rows[0]?.user_id || null;
  }
}
