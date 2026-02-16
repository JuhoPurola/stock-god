/**
 * Base Strategy class for algorithmic trading
 */

import type {
  Signal,
  SignalType,
  FactorScore,
  EvaluationContext,
  Strategy as StrategyConfig,
} from '@stock-picker/shared';
import { SignalType as SignalTypeEnum } from '@stock-picker/shared';
import { combineFactorScores } from '@stock-picker/shared';
import type { IFactor } from './IFactor.js';
import { FactorFactory } from '../factors/FactorFactory.js';

/**
 * Base Strategy class that combines multiple factors to generate trading signals
 */
export abstract class Strategy {
  protected readonly config: StrategyConfig;
  protected readonly factors: IFactor[];

  constructor(config: StrategyConfig) {
    this.config = config;
    this.factors = this.initializeFactors();
  }

  /**
   * Initialize factors from configuration
   */
  private initializeFactors(): IFactor[] {
    return this.config.factors
      .filter((f) => f.enabled)
      .map((factorConfig) => FactorFactory.create(factorConfig));
  }

  /**
   * Generate trading signals for a list of symbols
   * @param symbols - Stock symbols to evaluate
   * @param contextProvider - Function to get evaluation context for a symbol
   * @returns Array of signals
   */
  async generateSignals(
    symbols: string[],
    contextProvider: (symbol: string) => Promise<EvaluationContext>
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const symbol of symbols) {
      try {
        const context = await contextProvider(symbol);
        const signal = await this.evaluateSymbol(context);
        signals.push(signal);
      } catch (error) {
        console.error(`Error evaluating ${symbol}:`, error);
        // Continue with other symbols even if one fails
      }
    }

    return signals;
  }

  /**
   * Evaluate a single symbol and generate a signal
   */
  private async evaluateSymbol(context: EvaluationContext): Promise<Signal> {
    // Evaluate all factors
    const factorScores = await Promise.all(
      this.factors.map((factor) => factor.evaluate(context))
    );

    // Combine factor scores
    const combinedScore = this.combineFactors(factorScores);

    // Determine signal type based on combined score
    const signalType = this.determineSignalType(combinedScore);

    // Calculate signal strength (absolute value of combined score)
    const strength = Math.abs(combinedScore);

    // Calculate target price, stop loss, take profit if applicable
    const metadata = this.calculateMetadata(
      context,
      combinedScore,
      signalType,
      factorScores
    );

    return {
      symbol: context.symbol,
      type: signalType,
      strength,
      timestamp: new Date(),
      factorScores,
      metadata,
    };
  }

  /**
   * Combine multiple factor scores into a single score
   * Uses weighted average by default
   */
  protected combineFactors(scores: FactorScore[]): number {
    if (scores.length === 0) return 0;

    const weightedScores = scores.map((s) => ({
      score: s.score * s.confidence, // Weight by confidence
      weight: this.factors.find((f) => f.name === s.factorName)?.weight ?? 1,
    }));

    return combineFactorScores(weightedScores);
  }

  /**
   * Determine signal type from combined score
   * Override this method for custom signal logic
   */
  protected determineSignalType(combinedScore: number): SignalType {
    const buyThreshold = 0.3; // Default: score > 0.3 = BUY
    const sellThreshold = -0.3; // Default: score < -0.3 = SELL

    if (combinedScore > buyThreshold) {
      return SignalTypeEnum.BUY;
    } else if (combinedScore < sellThreshold) {
      return SignalTypeEnum.SELL;
    } else {
      return SignalTypeEnum.HOLD;
    }
  }

  /**
   * Calculate signal metadata (target prices, reasoning, etc.)
   */
  protected calculateMetadata(
    context: EvaluationContext,
    combinedScore: number,
    signalType: SignalType,
    factorScores: FactorScore[]
  ): Signal['metadata'] {
    const { currentPrice } = context;
    const { stopLossPercent, takeProfitPercent } = this.config.riskManagement;

    const metadata: Signal['metadata'] = {
      reasoning: this.generateReasoning(factorScores, combinedScore),
    };

    // Calculate stop loss and take profit for BUY signals
    if (signalType === SignalTypeEnum.BUY) {
      metadata.stopLoss = currentPrice * (1 - stopLossPercent);
      if (takeProfitPercent) {
        metadata.takeProfit = currentPrice * (1 + takeProfitPercent);
      }
    }

    // Calculate stop loss and take profit for SELL signals
    if (signalType === SignalTypeEnum.SELL) {
      metadata.stopLoss = currentPrice * (1 + stopLossPercent);
      if (takeProfitPercent) {
        metadata.takeProfit = currentPrice * (1 - takeProfitPercent);
      }
    }

    return metadata;
  }

  /**
   * Generate human-readable reasoning for the signal
   */
  protected generateReasoning(
    factorScores: FactorScore[],
    combinedScore: number
  ): string {
    const topFactors = factorScores
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
      .slice(0, 3);

    const factorDescriptions = topFactors.map((f) => {
      const sentiment = f.score > 0 ? 'bullish' : 'bearish';
      const strength = Math.abs(f.score);
      return `${f.factorName} (${sentiment}, ${(strength * 100).toFixed(0)}%)`;
    });

    const overallSentiment = combinedScore > 0 ? 'bullish' : 'bearish';
    return `Overall ${overallSentiment} signal based on: ${factorDescriptions.join(', ')}`;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): StrategyConfig {
    return this.config;
  }

  /**
   * Get enabled factors
   */
  getFactors(): IFactor[] {
    return this.factors;
  }
}

/**
 * Default momentum-based strategy
 */
export class MomentumStrategy extends Strategy {
  constructor(config: StrategyConfig) {
    super(config);
  }

  /**
   * Momentum strategy uses slightly more aggressive thresholds
   */
  protected override determineSignalType(combinedScore: number): SignalType {
    const buyThreshold = 0.4;
    const sellThreshold = -0.4;

    if (combinedScore > buyThreshold) {
      return SignalTypeEnum.BUY;
    } else if (combinedScore < sellThreshold) {
      return SignalTypeEnum.SELL;
    } else {
      return SignalTypeEnum.HOLD;
    }
  }
}
