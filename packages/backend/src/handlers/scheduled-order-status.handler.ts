/**
 * Order Status Poller Handler
 * Checks pending/submitted orders and updates when filled/cancelled
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { TradingService } from '../services/trading.service';
import { TradeRepository } from '../repositories/trade.repository';
import { OrderStatus } from '@stock-picker/shared';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Order status check job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  const shouldRun = await jobMonitoring.shouldJobRun('order_status_check');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('order_status_check');

  try {
    const tradeRepo = new TradeRepository();
    const tradingService = new TradingService();

    // Get all pending and submitted orders
    const pendingTrades = await tradeRepo.findPending();

    if (pendingTrades.length === 0) {
      logger.info('No pending orders to check');
      await jobMonitoring.logJobComplete(executionId, {
        ordersChecked: 0,
        ordersFilled: 0,
        ordersCancelled: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No pending orders to check',
          ordersChecked: 0,
        }),
      };
    }

    let ordersFilled = 0;
    let ordersCancelled = 0;
    let ordersRejected = 0;
    const errors: string[] = [];

    // Check status of each pending order
    for (const trade of pendingTrades) {
      try {
        logger.info('Checking order status', {
          tradeId: trade.id,
          symbol: trade.symbol,
          status: trade.status,
          brokerOrderId: trade.brokerOrderId,
        });

        const updatedTrade = await tradingService.checkOrderStatus(trade.id);

        // Count status changes
        if (updatedTrade.status === OrderStatus.FILLED && trade.status !== OrderStatus.FILLED) {
          ordersFilled++;
          logger.info('Order filled', {
            tradeId: trade.id,
            symbol: trade.symbol,
            executedPrice: updatedTrade.executedPrice,
          });
        } else if (
          updatedTrade.status === OrderStatus.CANCELLED &&
          trade.status !== OrderStatus.CANCELLED
        ) {
          ordersCancelled++;
          logger.info('Order cancelled', {
            tradeId: trade.id,
            symbol: trade.symbol,
          });
        } else if (
          updatedTrade.status === OrderStatus.REJECTED &&
          trade.status !== OrderStatus.REJECTED
        ) {
          ordersRejected++;
          logger.info('Order rejected', {
            tradeId: trade.id,
            symbol: trade.symbol,
          });
        }
      } catch (error: any) {
        const errorMsg = `Trade ${trade.id} (${trade.symbol}): ${error.message}`;
        errors.push(errorMsg);
        logger.error('Failed to check order status', {
          tradeId: trade.id,
          error,
        });
        // Continue with other orders
      }
    }

    const metadata = {
      ordersChecked: pendingTrades.length,
      ordersFilled,
      ordersCancelled,
      ordersRejected,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Order status check complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Order status check completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Order status check job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Order status check failed',
        error: error.message,
      }),
    };
  }
};
