/**
 * Strategy Execution Handler
 * Scheduled job that evaluates strategies and executes trades during market hours
 */

import { getDatabasePool } from '../config/scheduler';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { StrategyService } from '../services/strategy.service';
import { TradingService } from '../services/trading.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { logger } from '../utils/logger.js';

export const handler = async (event: any) => {
  logger.info('Strategy execution job triggered', { time: new Date().toISOString() });

  const pool = await getDatabasePool();
  const jobMonitoring = new JobMonitoringService(pool);

  // Check if job should run
  const shouldRun = await jobMonitoring.shouldJobRun('strategy_execution');
  if (!shouldRun) {
    logger.info('Job disabled or in error state, skipping execution');
    return { statusCode: 200, body: JSON.stringify({ message: 'Job disabled or in error state' }) };
  }

  const executionId = await jobMonitoring.logJobStart('strategy_execution');

  try {
    const portfolioRepo = new PortfolioRepository();
    const strategyService = new StrategyService();
    const tradingService = new TradingService();

    // Get all portfolios with enabled strategies
    const activePortfolios = await portfolioRepo.findActivePortfolios();

    if (activePortfolios.length === 0) {
      logger.info('No active portfolios with enabled strategies found');
      await jobMonitoring.logJobComplete(executionId, {
        portfoliosProcessed: 0,
        signalsGenerated: 0,
        tradesExecuted: 0,
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No active portfolios to process',
          portfoliosProcessed: 0,
        }),
      };
    }

    let totalSignalsGenerated = 0;
    let totalTradesExecuted = 0;
    const errors: string[] = [];

    // Process each portfolio
    for (const { portfolio, strategyIds } of activePortfolios) {
      try {
        logger.info('Processing portfolio', {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          strategyCount: strategyIds.length,
        });

        // Execute all strategies for this portfolio
        const strategyResults = await strategyService.executePortfolioStrategies(
          portfolio.id
        );

        // Process each strategy's signals
        for (const { strategyId, signals } of strategyResults) {
          totalSignalsGenerated += signals.length;

          // Filter for actionable signals (BUY/SELL)
          const actionableSignals = signals.filter(
            (s) => s.type === 'BUY' || s.type === 'SELL'
          );

          if (actionableSignals.length === 0) {
            logger.info('No actionable signals generated', { strategyId });
            continue;
          }

          logger.info('Executing signals', {
            strategyId,
            totalSignals: signals.length,
            actionableSignals: actionableSignals.length,
          });

          // Execute trades based on signals
          const trades = await tradingService.executeSignals(
            portfolio.id,
            strategyId,
            actionableSignals
          );

          totalTradesExecuted += trades.length;

          logger.info('Trades executed', {
            strategyId,
            tradesExecuted: trades.length,
            trades: trades.map((t) => ({
              symbol: t.symbol,
              side: t.side,
              quantity: t.quantity,
              status: t.status,
            })),
          });
        }
      } catch (error: any) {
        const errorMsg = `Portfolio ${portfolio.id} (${portfolio.name}): ${error.message}`;
        errors.push(errorMsg);
        logger.error('Failed to process portfolio', {
          portfolioId: portfolio.id,
          error,
        });
        // Continue with other portfolios
      }
    }

    const metadata = {
      portfoliosProcessed: activePortfolios.length,
      signalsGenerated: totalSignalsGenerated,
      tradesExecuted: totalTradesExecuted,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Strategy execution complete', metadata);

    await jobMonitoring.logJobComplete(executionId, metadata);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Strategy execution completed successfully',
        ...metadata,
      }),
    };
  } catch (error: any) {
    logger.error('Strategy execution job failed', error);
    await jobMonitoring.logJobError(executionId, error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Strategy execution failed',
        error: error.message,
      }),
    };
  }
};
