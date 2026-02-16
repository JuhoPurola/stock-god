/**
 * Core factor interface for the algorithm engine
 */

import type {
  FactorScore,
  FactorType,
  EvaluationContext,
  FactorConfig,
} from '@stock-picker/shared';

/**
 * Base interface for all trading factors
 * Factors evaluate market conditions and return a score indicating bullish/bearish sentiment
 */
export interface IFactor {
  /** Unique name of the factor */
  readonly name: string;

  /** Type of factor (technical, fundamental, sentiment) */
  readonly type: FactorType;

  /** Weight of this factor in strategy composition (0-1) */
  readonly weight: number;

  /** Whether this factor is currently enabled */
  readonly enabled: boolean;

  /**
   * Evaluate the factor for a given context
   * @param context - Market data and indicators for evaluation
   * @returns Factor score with confidence level
   */
  evaluate(context: EvaluationContext): Promise<FactorScore>;

  /**
   * Validate factor configuration parameters
   * @param params - Factor-specific parameters
   * @returns true if valid, error message if invalid
   */
  validateParams(params: Record<string, unknown>): true | string;
}

/**
 * Abstract base class for factors
 * Provides common functionality and enforces interface contract
 */
export abstract class BaseFactor implements IFactor {
  public readonly name: string;
  public readonly type: FactorType;
  public readonly weight: number;
  public readonly enabled: boolean;
  protected readonly params: Record<string, unknown>;

  constructor(config: FactorConfig) {
    this.name = config.name;
    this.type = config.type;
    this.weight = config.weight;
    this.enabled = config.enabled;
    this.params = config.params;

    // Validate parameters during construction
    const validation = this.validateParams(config.params);
    if (validation !== true) {
      throw new Error(`Invalid factor configuration for ${this.name}: ${validation}`);
    }
  }

  /**
   * Template method for evaluation
   * Subclasses implement the specific evaluation logic
   */
  abstract evaluate(context: EvaluationContext): Promise<FactorScore>;

  /**
   * Validate parameters - subclasses should override
   */
  abstract validateParams(params: Record<string, unknown>): true | string;

  /**
   * Helper to create a factor score
   */
  protected createScore(
    score: number,
    confidence: number,
    metadata?: Record<string, unknown>
  ): FactorScore {
    // Clamp score to [-1, 1] range
    const clampedScore = Math.max(-1, Math.min(1, score));
    // Clamp confidence to [0, 1] range
    const clampedConfidence = Math.max(0, Math.min(1, confidence));

    return {
      factorName: this.name,
      factorType: this.type,
      score: clampedScore,
      confidence: clampedConfidence,
      metadata,
    };
  }

  /**
   * Helper to get a required parameter
   */
  protected getParam<T>(key: string): T {
    const value = this.params[key];
    if (value === undefined) {
      throw new Error(`Missing required parameter: ${key}`);
    }
    return value as T;
  }

  /**
   * Helper to get an optional parameter with default
   */
  protected getParamOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.params[key];
    return value !== undefined ? (value as T) : defaultValue;
  }
}
