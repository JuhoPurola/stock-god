/**
 * MACD (Moving Average Convergence Divergence) Factor
 */

import { BaseFactor } from '../../core/IFactor.js';
import type { EvaluationContext, FactorScore } from '@stock-picker/shared';
import { calculateMACD, getLastValue, getValue } from '../../indicators/technical.js';

/**
 * MACD Factor - Momentum and trend indicator
 * MACD crossing above signal = bullish
 * MACD crossing below signal = bearish
 * Histogram > 0 = bullish momentum
 * Histogram < 0 = bearish momentum
 */
export class MACDFactor extends BaseFactor {
  validateParams(params: Record<string, unknown>): true | string {
    const fast = params.fast as number;
    const slow = params.slow as number;
    const signal = params.signal as number;

    if (!fast || fast < 2 || fast > 50) {
      return 'fast must be between 2 and 50';
    }

    if (!slow || slow < 2 || slow > 100) {
      return 'slow must be between 2 and 100';
    }

    if (!signal || signal < 2 || signal > 50) {
      return 'signal must be between 2 and 50';
    }

    if (fast >= slow) {
      return 'fast must be less than slow';
    }

    return true;
  }

  async evaluate(context: EvaluationContext): Promise<FactorScore> {
    const fast = this.getParam<number>('fast');
    const slow = this.getParam<number>('slow');
    const signal = this.getParam<number>('signal');

    // Extract closing prices
    const closePrices = context.historicalPrices.map((bar) => bar.close);

    if (closePrices.length < slow + signal) {
      return this.createScore(0, 0, {
        error: 'Insufficient historical data for MACD calculation',
      });
    }

    // Calculate MACD
    const macdResult = calculateMACD(closePrices, fast, slow, signal);
    const currentMACD = getLastValue(macdResult.macd);
    const currentSignal = getLastValue(macdResult.signal);
    const currentHistogram = getLastValue(macdResult.histogram);
    const prevHistogram = getValue(
      macdResult.histogram,
      macdResult.histogram.length - 2
    );

    if (
      currentMACD === null ||
      currentSignal === null ||
      currentHistogram === null
    ) {
      return this.createScore(0, 0, {
        error: 'Unable to calculate MACD',
      });
    }

    // Calculate score based on MACD signals
    let score = 0;
    let confidence = 0.5;

    // 1. Check for crossovers (strongest signal)
    if (prevHistogram !== null) {
      if (prevHistogram <= 0 && currentHistogram > 0) {
        // Bullish crossover
        score = 0.8;
        confidence = 0.9;
      } else if (prevHistogram >= 0 && currentHistogram < 0) {
        // Bearish crossover
        score = -0.8;
        confidence = 0.9;
      }
    }

    // 2. If no crossover, use histogram value
    if (score === 0) {
      // Normalize histogram to -1 to 1 range
      // Larger histogram = stronger signal
      const maxHistogram = Math.max(
        ...macdResult.histogram
          .filter((h) => !isNaN(h))
          .map((h) => Math.abs(h))
      );

      if (maxHistogram > 0) {
        score = currentHistogram / maxHistogram;
        confidence = Math.min(0.7, Math.abs(score));
      }
    }

    // 3. Adjust confidence based on MACD and signal line separation
    const separation = Math.abs(currentMACD - currentSignal);
    const avgPrice = closePrices.reduce((a, b) => a + b, 0) / closePrices.length;
    const normalizedSeparation = separation / avgPrice;
    confidence = Math.min(1, confidence + normalizedSeparation * 10);

    return this.createScore(score, confidence, {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram,
      interpretation:
        currentHistogram > 0
          ? 'bullish momentum'
          : currentHistogram < 0
          ? 'bearish momentum'
          : 'neutral',
      crossover:
        prevHistogram !== null && prevHistogram * currentHistogram < 0
          ? currentHistogram > 0
            ? 'bullish'
            : 'bearish'
          : 'none',
    });
  }
}
