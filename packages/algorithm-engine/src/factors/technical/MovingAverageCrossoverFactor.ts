/**
 * Moving Average Crossover Factor
 */

import { BaseFactor } from '../../core/IFactor.js';
import type { EvaluationContext, FactorScore } from '@stock-picker/shared';
import { calculateSMA, getLastValue, getValue } from '../../indicators/technical.js';

/**
 * Moving Average Crossover Factor - Trend indicator
 * Short MA crossing above Long MA = bullish (golden cross)
 * Short MA crossing below Long MA = bearish (death cross)
 * Price above both MAs = uptrend
 * Price below both MAs = downtrend
 */
export class MovingAverageCrossoverFactor extends BaseFactor {
  validateParams(params: Record<string, unknown>): true | string {
    const short = params.short as number;
    const long = params.long as number;

    if (!short || short < 2 || short > 200) {
      return 'short must be between 2 and 200';
    }

    if (!long || long < 2 || long > 500) {
      return 'long must be between 2 and 500';
    }

    if (short >= long) {
      return 'short must be less than long';
    }

    return true;
  }

  async evaluate(context: EvaluationContext): Promise<FactorScore> {
    const shortPeriod = this.getParam<number>('short');
    const longPeriod = this.getParam<number>('long');

    // Extract closing prices
    const closePrices = context.historicalPrices.map((bar) => bar.close);

    if (closePrices.length < longPeriod) {
      return this.createScore(0, 0, {
        error: 'Insufficient historical data for MA calculation',
      });
    }

    // Calculate moving averages
    const shortMA = calculateSMA(closePrices, shortPeriod);
    const longMA = calculateSMA(closePrices, longPeriod);

    const currentShortMA = getLastValue(shortMA);
    const currentLongMA = getLastValue(longMA);
    const prevShortMA = getValue(shortMA, shortMA.length - 2);
    const prevLongMA = getValue(longMA, longMA.length - 2);
    const currentPrice = context.currentPrice;

    if (currentShortMA === null || currentLongMA === null) {
      return this.createScore(0, 0, {
        error: 'Unable to calculate moving averages',
      });
    }

    let score = 0;
    let confidence = 0.5;
    let crossover = 'none';

    // 1. Check for crossovers (strongest signal)
    if (prevShortMA !== null && prevLongMA !== null) {
      const wasBelow = prevShortMA <= prevLongMA;
      const isAbove = currentShortMA > currentLongMA;

      if (wasBelow && isAbove) {
        // Golden cross - bullish
        score = 0.9;
        confidence = 0.95;
        crossover = 'golden';
      } else if (!wasBelow && !isAbove) {
        // Death cross - bearish
        score = -0.9;
        confidence = 0.95;
        crossover = 'death';
      }
    }

    // 2. If no crossover, evaluate trend based on MA positions
    if (score === 0) {
      // Calculate percentage difference between MAs
      const maDiff = ((currentShortMA - currentLongMA) / currentLongMA) * 100;

      // Normalize to -1 to 1 range (assume max meaningful difference is 10%)
      score = Math.max(-1, Math.min(1, maDiff / 10));

      // Confidence based on how clear the trend is
      confidence = Math.min(0.8, Math.abs(maDiff) / 10);

      // 3. Adjust score based on price position relative to MAs
      const priceAboveShort = currentPrice > currentShortMA;
      const priceAboveLong = currentPrice > currentLongMA;

      if (priceAboveShort && priceAboveLong && score > 0) {
        // Strong uptrend confirmation
        score = Math.min(1, score * 1.2);
        confidence = Math.min(1, confidence * 1.1);
      } else if (!priceAboveShort && !priceAboveLong && score < 0) {
        // Strong downtrend confirmation
        score = Math.max(-1, score * 1.2);
        confidence = Math.min(1, confidence * 1.1);
      } else if (
        (priceAboveShort && !priceAboveLong) ||
        (!priceAboveShort && priceAboveLong)
      ) {
        // Mixed signals - reduce confidence
        confidence *= 0.7;
      }
    }

    return this.createScore(score, confidence, {
      shortMA: currentShortMA,
      longMA: currentLongMA,
      shortPeriod,
      longPeriod,
      maDiff: ((currentShortMA - currentLongMA) / currentLongMA) * 100,
      pricePosition:
        currentPrice > currentShortMA && currentPrice > currentLongMA
          ? 'above both'
          : currentPrice < currentShortMA && currentPrice < currentLongMA
          ? 'below both'
          : 'between',
      crossover,
      interpretation:
        crossover === 'golden'
          ? 'golden cross (bullish)'
          : crossover === 'death'
          ? 'death cross (bearish)'
          : currentShortMA > currentLongMA
          ? 'uptrend'
          : 'downtrend',
    });
  }
}
