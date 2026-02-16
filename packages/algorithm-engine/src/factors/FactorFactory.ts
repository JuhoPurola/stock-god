/**
 * Factory for creating factor instances
 */

import type { FactorConfig } from '@stock-picker/shared';
import type { IFactor } from '../core/IFactor.js';
import { RSIFactor } from './technical/RSIFactor.js';
import { MACDFactor } from './technical/MACDFactor.js';
import { MovingAverageCrossoverFactor } from './technical/MovingAverageCrossoverFactor.js';

/**
 * Factory class for creating factor instances from configuration
 */
export class FactorFactory {
  private static readonly factorRegistry = new Map<
    string,
    new (config: FactorConfig) => IFactor
  >([
    ['RSI', RSIFactor],
    ['MACD', MACDFactor],
    ['MA_Crossover', MovingAverageCrossoverFactor],
    // Add more factors here as they are implemented
  ]);

  /**
   * Create a factor instance from configuration
   */
  static create(config: FactorConfig): IFactor {
    const FactorClass = this.factorRegistry.get(config.name);

    if (!FactorClass) {
      throw new Error(
        `Unknown factor type: ${config.name}. Available factors: ${Array.from(
          this.factorRegistry.keys()
        ).join(', ')}`
      );
    }

    return new FactorClass(config);
  }

  /**
   * Register a new factor type
   */
  static register(
    name: string,
    factorClass: new (config: FactorConfig) => IFactor
  ): void {
    this.factorRegistry.set(name, factorClass);
  }

  /**
   * Get list of available factor types
   */
  static getAvailableFactors(): string[] {
    return Array.from(this.factorRegistry.keys());
  }
}
