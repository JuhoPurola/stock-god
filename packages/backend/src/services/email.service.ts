/**
 * Email service for sending notifications via AWS SES
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../utils/logger.js';
import type { Alert, Trade, PriceAlert } from '@stock-picker/shared';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@stockpicker.com';
const APP_URL = process.env.APP_URL || 'https://d18x5273m9nt2k.cloudfront.net';

export class EmailService {
  /**
   * Send email using AWS SES
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
  }): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [params.to],
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: params.htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: params.textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await sesClient.send(command);
      logger.info(`Email sent successfully to ${params.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail(email: string, alert: Alert): Promise<boolean> {
    const subject = `Stock Picker Alert: ${alert.title}`;
    const textBody = this.generateAlertTextBody(alert);
    const htmlBody = this.generateAlertHtmlBody(alert);

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send trade notification email
   */
  async sendTradeEmail(
    email: string,
    trade: Trade,
    success: boolean
  ): Promise<boolean> {
    const subject = success
      ? `Trade Executed: ${trade.side.toUpperCase()} ${trade.symbol}`
      : `Trade Failed: ${trade.side.toUpperCase()} ${trade.symbol}`;

    const textBody = this.generateTradeTextBody(trade, success);
    const htmlBody = this.generateTradeHtmlBody(trade, success);

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send price alert email
   */
  async sendPriceAlertEmail(
    email: string,
    priceAlert: PriceAlert,
    currentPrice: number
  ): Promise<boolean> {
    const subject = `Price Alert: ${priceAlert.symbol} ${priceAlert.condition}`;
    const textBody = this.generatePriceAlertTextBody(priceAlert, currentPrice);
    const htmlBody = this.generatePriceAlertHtmlBody(priceAlert, currentPrice);

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send daily portfolio summary email
   */
  async sendDailySummaryEmail(
    email: string,
    summary: {
      portfolioName: string;
      totalValue: number;
      dayChange: number;
      dayChangePercent: number;
      positionCount: number;
      tradeCount: number;
    }
  ): Promise<boolean> {
    const subject = `Daily Portfolio Summary: ${summary.portfolioName}`;
    const textBody = this.generateDailySummaryTextBody(summary);
    const htmlBody = this.generateDailySummaryHtmlBody(summary);

    return this.sendEmail({
      to: email,
      subject,
      htmlBody,
      textBody,
    });
  }

  // ============================================================================
  // HTML Templates
  // ============================================================================

  private generateAlertHtmlBody(alert: Alert): string {
    const severityColor = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
    }[alert.severity];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${alert.title}</h1>
          </div>
          <div class="content">
            <p>${alert.message}</p>
            ${alert.portfolioId ? `<p><strong>Portfolio:</strong> ${alert.portfolioId}</p>` : ''}
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}
            </p>
            <a href="${APP_URL}/alerts" class="button">View All Alerts</a>
          </div>
          <div class="footer">
            <p>Stock Picker - Algorithmic Trading Platform</p>
            <p>You're receiving this email because you have notifications enabled.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTradeHtmlBody(trade: Trade, success: boolean): string {
    const statusColor = success ? '#10b981' : '#ef4444';
    const statusText = success ? 'Executed Successfully' : 'Failed';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; }
          .trade-details { background-color: white; padding: 16px; border-radius: 6px; margin: 16px 0; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Trade ${statusText}</h1>
          </div>
          <div class="content">
            <div class="trade-details">
              <p><strong>Symbol:</strong> ${trade.symbol}</p>
              <p><strong>Side:</strong> ${trade.side.toUpperCase()}</p>
              <p><strong>Quantity:</strong> ${trade.quantity}</p>
              <p><strong>Price:</strong> $${trade.price.toFixed(2)}</p>
              <p><strong>Total:</strong> $${(trade.quantity * trade.price).toFixed(2)}</p>
              <p><strong>Status:</strong> ${trade.status}</p>
              ${trade.signal ? `<p><strong>Signal:</strong> ${trade.signal.type}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Time:</strong> ${new Date(trade.createdAt).toLocaleString()}
            </p>
          </div>
          <div class="footer">
            <p>Stock Picker - Algorithmic Trading Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePriceAlertHtmlBody(priceAlert: PriceAlert, currentPrice: number): string {
    let conditionText = '';
    if (priceAlert.condition === 'above' && priceAlert.targetPrice) {
      conditionText = `above $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'below' && priceAlert.targetPrice) {
      conditionText = `below $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'percent_change' && priceAlert.percentChange) {
      conditionText = `changed by ${priceAlert.percentChange}%`;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Price Alert Triggered</h1>
          </div>
          <div class="content">
            <p><strong>${priceAlert.symbol}</strong> has reached your target condition.</p>
            <p><strong>Condition:</strong> ${conditionText}</p>
            <p><strong>Current Price:</strong> $${currentPrice.toFixed(2)}</p>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Alert Created:</strong> ${new Date(priceAlert.createdAt).toLocaleString()}
            </p>
          </div>
          <div class="footer">
            <p>Stock Picker - Algorithmic Trading Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDailySummaryHtmlBody(summary: any): string {
    const changeColor = summary.dayChange >= 0 ? '#10b981' : '#ef4444';
    const changeSign = summary.dayChange >= 0 ? '+' : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
          .stat { background-color: white; padding: 16px; border-radius: 6px; text-align: center; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Daily Portfolio Summary</h1>
            <p style="margin: 8px 0 0 0;">${summary.portfolioName}</p>
          </div>
          <div class="content">
            <div class="stats">
              <div class="stat">
                <div style="font-size: 14px; color: #6b7280;">Total Value</div>
                <div style="font-size: 24px; font-weight: bold;">$${summary.totalValue.toFixed(2)}</div>
              </div>
              <div class="stat">
                <div style="font-size: 14px; color: #6b7280;">Day Change</div>
                <div style="font-size: 24px; font-weight: bold; color: ${changeColor};">
                  ${changeSign}$${summary.dayChange.toFixed(2)} (${changeSign}${summary.dayChangePercent.toFixed(2)}%)
                </div>
              </div>
              <div class="stat">
                <div style="font-size: 14px; color: #6b7280;">Positions</div>
                <div style="font-size: 24px; font-weight: bold;">${summary.positionCount}</div>
              </div>
              <div class="stat">
                <div style="font-size: 14px; color: #6b7280;">Trades Today</div>
                <div style="font-size: 24px; font-weight: bold;">${summary.tradeCount}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Stock Picker - Algorithmic Trading Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================================================
  // Text Templates
  // ============================================================================

  private generateAlertTextBody(alert: Alert): string {
    return `
Stock Picker Alert

${alert.title}

${alert.message}

${alert.portfolioId ? `Portfolio: ${alert.portfolioId}` : ''}
Time: ${new Date(alert.createdAt).toLocaleString()}

View all alerts: ${APP_URL}/alerts

---
Stock Picker - Algorithmic Trading Platform
    `.trim();
  }

  private generateTradeTextBody(trade: Trade, success: boolean): string {
    const status = success ? 'Executed Successfully' : 'Failed';
    return `
Stock Picker Trade ${status}

Symbol: ${trade.symbol}
Side: ${trade.side.toUpperCase()}
Quantity: ${trade.quantity}
Price: $${trade.price.toFixed(2)}
Total: $${(trade.quantity * trade.price).toFixed(2)}
Status: ${trade.status}
${trade.signal ? `Signal: ${trade.signal.type}` : ''}

Time: ${new Date(trade.createdAt).toLocaleString()}

---
Stock Picker - Algorithmic Trading Platform
    `.trim();
  }

  private generatePriceAlertTextBody(priceAlert: PriceAlert, currentPrice: number): string {
    let conditionText = '';
    if (priceAlert.condition === 'above' && priceAlert.targetPrice) {
      conditionText = `above $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'below' && priceAlert.targetPrice) {
      conditionText = `below $${priceAlert.targetPrice.toFixed(2)}`;
    } else if (priceAlert.condition === 'percent_change' && priceAlert.percentChange) {
      conditionText = `changed by ${priceAlert.percentChange}%`;
    }

    return `
Stock Picker Price Alert

${priceAlert.symbol} has reached your target condition.

Condition: ${conditionText}
Current Price: $${currentPrice.toFixed(2)}

Alert Created: ${new Date(priceAlert.createdAt).toLocaleString()}

---
Stock Picker - Algorithmic Trading Platform
    `.trim();
  }

  private generateDailySummaryTextBody(summary: any): string {
    const changeSign = summary.dayChange >= 0 ? '+' : '';
    return `
Stock Picker Daily Portfolio Summary

Portfolio: ${summary.portfolioName}

Total Value: $${summary.totalValue.toFixed(2)}
Day Change: ${changeSign}$${summary.dayChange.toFixed(2)} (${changeSign}${summary.dayChangePercent.toFixed(2)}%)
Positions: ${summary.positionCount}
Trades Today: ${summary.tradeCount}

---
Stock Picker - Algorithmic Trading Platform
    `.trim();
  }
}
