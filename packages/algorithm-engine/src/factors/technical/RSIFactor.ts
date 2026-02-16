/**
 * RSI (Relative Strength Index) Factor
 */

import { BaseFactor } from '../../core/IFactor.js';
import type { EvaluationContext, FactorScore } from '@stock-picker/shared';
import { calculateRSI, getLastValue } from '../../indicators/technical.js';
import { normalizeScore } from '@stock-picker/shared';

/**
 * RSI Factor - Momentum indicator
 * RSI < oversold (30) = bullish (buy signal)
 * RSI > overbought (70) = bearish (sell signal)
 */
export class RSIFactor extends BaseFactor {
  validateParams(params: Record<string, unknown>): true | string {
    const period = params.period as number;
    const oversold = params.oversold as number;
    const overbought = params.overbought as number;

    if (!period || period < 2 || period > 100) {
      return 'period must be between 2 and 100';
    }

    if (!oversold || oversold < 0 || oversold > 50) {
      return 'oversold must be between 0 and 50';
    }

    if (!overbought || overbought < 50 || overbought > 100) {
      return 'overbought must be between 50 and 100';
    }

    if (oversold >= overbought) {
      return 'oversold must be less than overbought';
    }

    return true;
  }

  async evaluate(context: EvaluationContext): Promise<FactorScore> {
    const period = this.getParam<number>('period');
    const oversold = this.getParam<number>('oversold');
    const overbought = this.getParam<number>('overbought');

    // Extract closing prices
    const closePrices = context.historicalPrices.map((bar) => bar.close);

    if (closePrices.length < period + 1) {
      return this.createScore(0, 0, {
        error: 'Insufficient historical data for RSI calculation',
      });
    }

    // Calculate RSI
    const rsiValues = calculateRSI(closePrices, period);
    const currentRSI = getLastValue(rsiValues);

    if (currentRSI === null) {
      return this.createScore(0, 0, {
        error: 'Unable to calculate RSI',
      });
    }

    // Calculate score based on RSI value
    let score: number;
    let confidence: number;

    if (currentRSI <= oversold) {
      // Oversold - bullish signal
      // More oversold = higher bullish score
      score = normalizeScore(currentRSI, 0, oversold);
      score = -score; // Invert so lower RSI = more positive score
      confidence = Math.min(1, (oversold - currentRSI) / oversold);
    } else if (currentRSI >= overbought) {
      // Overbought - bearish signal
      // More overbought = higher bearish score
      score = normalizeScore(currentRSI, overbought, 100);
      score = -score; // Negative score for bearish
      confidence = Math.min(1, (currentRSI - overbought) / (100 - overbought));
    } else {
      // Neutral zone
      // Slight bias towards direction
      const mid = (oversold + overbought) / 2;
      score = normalizeScore(currentRSI, oversold, overbought);
      score = (score - normalizeScore(mid, oversold, overbought)) * 0.5; // Dampen neutral signals
      confidence = 0.3; // Low confidence in neutral zone
    }

    return this.createScore(score, confidence, {
      rsi: currentRSI,
      period,
      oversold,
      overbought,
      interpretation:
        currentRSI <= oversold
          ? 'oversold'
          : currentRSI >= overbought
          ? 'overbought'
          : 'neutral',
    });
  }
}
