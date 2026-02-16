/**
 * @stock-picker/algorithm-engine
 * Core algorithmic trading engine
 */

// Core abstractions
export { IFactor, BaseFactor } from './core/IFactor.js';
export { Strategy, MomentumStrategy } from './core/Strategy.js';

// Factor factory
export { FactorFactory } from './factors/FactorFactory.js';

// Technical factors
export { RSIFactor } from './factors/technical/RSIFactor.js';
export { MACDFactor } from './factors/technical/MACDFactor.js';
export { MovingAverageCrossoverFactor } from './factors/technical/MovingAverageCrossoverFactor.js';

// Technical indicators
export * from './indicators/technical.js';
