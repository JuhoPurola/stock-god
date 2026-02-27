/**
 * Small Cap Alpha Hunter Strategy
 * Multi-factor combined strategy optimized for small & micro cap stocks
 *
 * Uses 5 independent scoring factors:
 * 1. Momentum (20-day return)
 * 2. Value/Oversold (RSI)
 * 3. Volume Surge
 * 4. Trend Strength (MACD)
 * 5. Breakout (52-week range position)
 *
 * Stocks are scored 0-100 and signals generated based on total score
 */

import { Strategy } from '../core/Strategy.js';
import type {
  Signal,
  SignalType,
  EvaluationContext,
  Strategy as StrategyConfig,
  PriceBar,
} from '@stock-picker/shared';
import { SignalType as SignalTypeEnum } from '@stock-picker/shared';

export class SmallCapAlphaStrategy extends Strategy {
  // Score thresholds
  private readonly AGGRESSIVE_BUY_THRESHOLD = 75; // High conviction
  private readonly CONSERVATIVE_BUY_THRESHOLD = 85; // Very high conviction
  private readonly EXIT_THRESHOLD = 50; // Below this, consider exiting

  // Stage 1: Universe filter thresholds
  private readonly MIN_MARKET_CAP = 50_000_000; // $50M
  private readonly MAX_MARKET_CAP = 2_000_000_000; // $2B
  private readonly MIN_PRICE = 2.0; // Avoid penny stocks
  private readonly MIN_VOLUME = 50_000; // Daily average

  constructor(config: StrategyConfig) {
    super(config);
  }

  /**
   * Override signal generation to implement custom scoring logic
   */
  async generateSignals(
    symbols: string[],
    contextProvider: (symbol: string) => Promise<EvaluationContext>
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const symbol of symbols) {
      try {
        const context = await contextProvider(symbol);

        // Stage 1: Quality filter
        if (!this.passesQualityFilter(context)) {
          continue;
        }

        // Stage 2: Calculate multi-factor score
        const totalScore = await this.calculateTotalScore(context);

        // Stage 3: Generate signal based on score
        const signal = this.generateSignalFromScore(context, totalScore);
        signals.push(signal);
      } catch (error) {
        console.error(`Error evaluating ${symbol}:`, error);
      }
    }

    // Sort by strength (highest first) for portfolio construction
    return signals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Stage 1: Quality Filter
   * Eliminate junk, keep only tradeable stocks
   */
  private passesQualityFilter(context: EvaluationContext): boolean {
    const { fundamentals, currentPrice, historicalPrices } = context;

    // Market cap filter
    const marketCap = fundamentals?.marketCap;
    if (marketCap && (marketCap < this.MIN_MARKET_CAP || marketCap > this.MAX_MARKET_CAP)) {
      return false;
    }

    // Price filter (avoid penny stocks)
    if (currentPrice < this.MIN_PRICE) {
      return false;
    }

    // Volume filter (ensure liquidity)
    const currentVolume = historicalPrices[historicalPrices.length - 1]?.volume ?? 0;
    if (currentVolume < this.MIN_VOLUME) {
      return false;
    }

    // History filter (need enough data for indicators)
    if (historicalPrices.length < 100) {
      return false;
    }

    return true;
  }

  /**
   * Stage 2: Calculate total score (0-100) from 5 factors
   */
  private async calculateTotalScore(context: EvaluationContext): Promise<number> {
    const momentumScore = this.calculateMomentumScore(context);
    const valueScore = this.calculateValueScore(context);
    const volumeScore = this.calculateVolumeScore(context);
    const trendScore = this.calculateTrendScore(context);
    const breakoutScore = this.calculateBreakoutScore(context);

    return momentumScore + valueScore + volumeScore + trendScore + breakoutScore;
  }

  /**
   * Factor 1: Momentum Score (0-20 points)
   * Based on 20-day return
   */
  private calculateMomentumScore(context: EvaluationContext): number {
    const { historicalPrices, currentPrice } = context;

    if (historicalPrices.length < 20) return 0;

    const price20DaysAgo = historicalPrices[historicalPrices.length - 20]?.close;
    if (!price20DaysAgo) return 0;

    const return20Day = ((currentPrice - price20DaysAgo) / price20DaysAgo) * 100;

    if (return20Day > 20) return 20;
    if (return20Day > 15) return 15;
    if (return20Day > 10) return 10;
    if (return20Day > 5) return 5;
    return 0;
  }

  /**
   * Factor 2: Value/Oversold Score (0-20 points)
   * Based on RSI (14-day)
   */
  private calculateValueScore(context: EvaluationContext): number {
    const rsi = this.calculateRSI(context.historicalPrices, 14);

    if (rsi < 30) return 20; // Very oversold
    if (rsi < 40) return 15; // Oversold
    if (rsi < 50) return 10; // Neutral-low
    if (rsi < 60) return 5;  // Neutral
    return 0;                // Overbought
  }

  /**
   * Factor 3: Volume Surge Score (0-20 points)
   * Current volume vs 20-day average
   */
  private calculateVolumeScore(context: EvaluationContext): number {
    const { historicalPrices } = context;

    if (historicalPrices.length < 20) return 0;

    const currentVolume = historicalPrices[historicalPrices.length - 1]?.volume ?? 0;
    const recentVolumes = historicalPrices.slice(-20).map((bar: PriceBar) => bar.volume);
    const avgVolume = recentVolumes.reduce((sum: number, v: number) => sum + v, 0) / recentVolumes.length;

    const volumeRatio = currentVolume / avgVolume;

    if (volumeRatio > 3) return 20;   // Major surge
    if (volumeRatio > 2) return 15;   // Strong surge
    if (volumeRatio > 1.5) return 10; // Moderate
    if (volumeRatio > 1) return 5;    // Slight increase
    return 0;                          // Below average
  }

  /**
   * Factor 4: Trend Strength Score (0-20 points)
   * Based on MACD
   */
  private calculateTrendScore(context: EvaluationContext): number {
    const macd = this.calculateMACD(context.historicalPrices);

    if (!macd) return 0;

    const { macdLine, signalLine, histogram } = macd;
    const prevHistogram = this.calculateMACD(context.historicalPrices.slice(0, -1))?.histogram ?? 0;

    // Histogram positive and increasing
    if (histogram > 0 && histogram > prevHistogram && macdLine > signalLine) {
      return 20;
    }

    // Line above signal, histogram positive
    if (macdLine > signalLine && histogram > 0) {
      return 15;
    }

    // Line above signal
    if (macdLine > signalLine) {
      return 10;
    }

    // Neutral (near zero)
    if (Math.abs(histogram) < 0.1) {
      return 5;
    }

    return 0; // Bearish
  }

  /**
   * Factor 5: Breakout Score (0-20 points)
   * Position in 52-week (260-day) range
   */
  private calculateBreakoutScore(context: EvaluationContext): number {
    const { historicalPrices, currentPrice } = context;

    const lookback = Math.min(260, historicalPrices.length);
    if (lookback < 100) return 0; // Not enough data

    const recentPrices = historicalPrices.slice(-lookback);
    const high52Week = Math.max(...recentPrices.map((bar: PriceBar) => bar.high));
    const low52Week = Math.min(...recentPrices.map((bar: PriceBar) => bar.low));
    const range = high52Week - low52Week;

    if (range === 0) return 0;

    const positionInRange = ((currentPrice - low52Week) / range) * 100;

    // At 52-week high (breakout)
    if (positionInRange >= 95) return 20;

    // Near high
    if (positionInRange >= 90) return 15;

    // Recovering from low (value bounce)
    if (positionInRange <= 30 && positionInRange >= 10) return 10;

    // Near 52-week low
    if (positionInRange < 10) return 5;

    // Middle of range (nowhere land)
    return 0;
  }

  /**
   * Stage 3: Generate signal from total score
   */
  private generateSignalFromScore(
    context: EvaluationContext,
    totalScore: number
  ): Signal {
    let signalType: SignalType;
    let positionSize: number;
    let stopLossPercent: number;

    if (totalScore >= this.CONSERVATIVE_BUY_THRESHOLD) {
      // Very high conviction
      signalType = SignalTypeEnum.BUY;
      positionSize = 0.15; // 15% of portfolio
      stopLossPercent = 0.10; // 10% stop loss
    } else if (totalScore >= this.AGGRESSIVE_BUY_THRESHOLD) {
      // High conviction
      signalType = SignalTypeEnum.BUY;
      positionSize = 0.12; // 12% of portfolio
      stopLossPercent = 0.12; // 12% stop loss
    } else if (totalScore < this.EXIT_THRESHOLD) {
      // Low score - consider exiting
      signalType = SignalTypeEnum.SELL;
      positionSize = 0;
      stopLossPercent = 0;
    } else {
      // Hold / no action
      signalType = SignalTypeEnum.HOLD;
      positionSize = 0;
      stopLossPercent = 0;
    }

    const strength = totalScore / 100; // Normalize to 0-1

    return {
      symbol: context.symbol,
      type: signalType,
      strength,
      timestamp: new Date(),
      factorScores: [], // Could populate with individual factor details
      metadata: {
        stopLoss: stopLossPercent > 0
          ? context.currentPrice * (1 - stopLossPercent)
          : undefined,
        takeProfit: stopLossPercent > 0 && totalScore >= this.CONSERVATIVE_BUY_THRESHOLD
          ? context.currentPrice * 1.30 // 30% take profit
          : undefined,
        reasoning: this.generateScoreReasoning(totalScore, signalType, positionSize),
      },
    };
  }

  /**
   * Generate human-readable reasoning based on score
   */
  private generateScoreReasoning(score: number, signalType: SignalType, positionSize: number): string {
    if (signalType === SignalTypeEnum.BUY) {
      if (score >= this.CONSERVATIVE_BUY_THRESHOLD) {
        return `Very strong multi-factor alignment (score: ${score}/100). High conviction buy with ${(positionSize * 100).toFixed(0)}% position size.`;
      } else {
        return `Strong multi-factor signals (score: ${score}/100). Medium conviction buy with ${(positionSize * 100).toFixed(0)}% position size.`;
      }
    } else if (signalType === SignalTypeEnum.SELL) {
      return `Weak multi-factor scores (${score}/100). Consider exiting position.`;
    } else {
      return `Neutral score (${score}/100). Holding position or waiting for clearer signals.`;
    }
  }

  /**
   * Helper: Calculate RSI
   */
  private calculateRSI(historicalPrices: PriceBar[], period: number = 14): number {
    if (historicalPrices.length < period + 1) return 50; // Default neutral

    const changes = [];
    for (let i = 1; i < historicalPrices.length; i++) {
      const current = historicalPrices[i]?.close;
      const previous = historicalPrices[i - 1]?.close;
      if (current !== undefined && previous !== undefined) {
        changes.push(current - previous);
      }
    }

    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(Math.abs);

    const avgGain = gains.length > 0
      ? gains.reduce((sum, g) => sum + g, 0) / period
      : 0;
    const avgLoss = losses.length > 0
      ? losses.reduce((sum, l) => sum + l, 0) / period
      : 0;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Helper: Calculate MACD
   */
  private calculateMACD(historicalPrices: PriceBar[]): {
    macdLine: number;
    signalLine: number;
    histogram: number;
  } | null {
    if (historicalPrices.length < 26) return null;

    const closes = historicalPrices.map(bar => bar.close);

    // Calculate EMAs
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macdLine = ema12 - ema26;

    // Calculate signal line (9-day EMA of MACD)
    // For simplicity, using last value approximation
    const signalLine = macdLine * 0.8; // Simplified
    const histogram = macdLine - signalLine;

    return { macdLine, signalLine, histogram };
  }

  /**
   * Helper: Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1] ?? 0;

    const multiplier = 2 / (period + 1);
    let ema = values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;

    for (let i = period; i < values.length; i++) {
      const value = values[i];
      if (value !== undefined) {
        ema = (value - ema) * multiplier + ema;
      }
    }

    return ema;
  }

  /**
   * Override: More aggressive thresholds for small caps
   */
  protected override determineSignalType(combinedScore: number): SignalType {
    // This method is overridden by generateSignalFromScore
    // Kept for compatibility with base class
    if (combinedScore > 0.75) return SignalTypeEnum.BUY;
    if (combinedScore < 0.50) return SignalTypeEnum.SELL;
    return SignalTypeEnum.HOLD;
  }
}
