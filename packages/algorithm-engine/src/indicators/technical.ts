/**
 * Technical indicator calculations
 */

import type { PriceBar } from '@stock-picker/shared';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(sma);
    } else {
      const ema = (prices[i]! - result[i - 1]!) * multiplier + result[i - 1]!;
      result.push(ema);
    }
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) {
    return Array(prices.length).fill(NaN);
  }

  const result: number[] = Array(period).fill(NaN);
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i]! - prices[i - 1]!;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate first RSI
  const rs = avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;

    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Calculate MACD line
  const macd = fastEMA.map((fast, i) => fast - slowEMA[i]!);

  // Calculate signal line (EMA of MACD)
  const validMACDStart = slowPeriod - 1;
  const macdForSignal = macd.slice(validMACDStart);
  const signalEMA = calculateEMA(macdForSignal, signalPeriod);

  // Pad signal line with NaN to match length
  const signal = [
    ...Array(validMACDStart).fill(NaN),
    ...signalEMA,
  ];

  // Calculate histogram (MACD - Signal)
  const histogram = macd.map((m, i) => m - signal[i]!);

  return { macd, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    const slice = prices.slice(i - period + 1, i + 1);
    const avg = middle[i]!;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper.push(avg + stdDev * std);
    lower.push(avg - stdDev * std);
  }

  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(bars: PriceBar[], period: number = 14): number[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]!;

    if (i === 0) {
      trueRanges.push(bar.high - bar.low);
    } else {
      const prevClose = bars[i - 1]!.close;
      const tr = Math.max(
        bar.high - bar.low,
        Math.abs(bar.high - prevClose),
        Math.abs(bar.low - prevClose)
      );
      trueRanges.push(tr);
    }
  }

  return calculateEMA(trueRanges, period);
}

/**
 * Get the most recent non-NaN value from an array
 */
export function getLastValue(arr: number[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i]!)) {
      return arr[i]!;
    }
  }
  return null;
}

/**
 * Get the value at index, or null if NaN
 */
export function getValue(arr: number[], index: number): number | null {
  const value = arr[index];
  return value !== undefined && !isNaN(value) ? value : null;
}
