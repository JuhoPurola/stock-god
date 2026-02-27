/**
 * Technical indicators library for chart overlays
 *
 * This module provides a frontend-friendly interface to technical indicators
 * for use with TradingView Lightweight Charts.
 */

import { CandlestickData, Time } from 'lightweight-charts';

export interface IndicatorResult {
  time: Time;
  value: number;
}

export interface MultiLineIndicatorResult {
  time: Time;
  values: { [key: string]: number };
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(
  data: CandlestickData<Time>[],
  period: number,
  field: 'open' | 'high' | 'low' | 'close' = 'close'
): IndicatorResult[] {
  const prices = data.map(d => d[field]);
  const result: IndicatorResult[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ time: data[i]!.time, value: NaN });
      continue;
    }

    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push({
      time: data[i]!.time,
      value: sum / period
    });
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(
  data: CandlestickData<Time>[],
  period: number,
  field: 'open' | 'high' | 'low' | 'close' = 'close'
): IndicatorResult[] {
  const prices = data.map(d => d[field]);
  const result: IndicatorResult[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let prevEMA = sma;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ time: data[i]!.time, value: NaN });
    } else if (i === period - 1) {
      result.push({ time: data[i]!.time, value: sma });
    } else {
      const ema = (prices[i]! - prevEMA) * multiplier + prevEMA;
      result.push({ time: data[i]!.time, value: ema });
      prevEMA = ema;
    }
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(
  data: CandlestickData<Time>[],
  period: number = 14
): IndicatorResult[] {
  const prices = data.map(d => d.close);
  const result: IndicatorResult[] = [];

  if (data.length < period + 1) {
    return data.map(d => ({ time: d.time, value: NaN }));
  }

  // Fill initial period with NaN
  for (let i = 0; i < period; i++) {
    result.push({ time: data[i]!.time, value: NaN });
  }

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
  result.push({ time: data[period]!.time, value: 100 - 100 / (1 + rs) });

  // Calculate subsequent RSI values
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;

    const rs = avgGain / avgLoss;
    result.push({
      time: data[i + 1]!.time,
      value: 100 - 100 / (1 + rs)
    });
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export interface MACDResult {
  macd: IndicatorResult[];
  signal: IndicatorResult[];
  histogram: IndicatorResult[];
}

export function calculateMACD(
  data: CandlestickData<Time>[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macd = fastEMA.map((fast, i) => ({
    time: data[i]!.time,
    value: fast.value - slowEMA[i]!.value
  }));

  // Calculate signal line (EMA of MACD)
  const validMACDStart = slowPeriod - 1;
  const macdValues = macd.slice(validMACDStart).map(m => m.value);
  const signalEMA = calculateEMAFromValues(macdValues, signalPeriod);

  const signal: IndicatorResult[] = data.map((d, i) => {
    if (i < validMACDStart) {
      return { time: d.time, value: NaN };
    }
    return {
      time: d.time,
      value: signalEMA[i - validMACDStart] || NaN
    };
  });

  // Calculate histogram (MACD - Signal)
  const histogram = macd.map((m, i) => ({
    time: data[i]!.time,
    value: m.value - signal[i]!.value
  }));

  return { macd, signal, histogram };
}

/**
 * Helper function to calculate EMA from raw values
 */
function calculateEMAFromValues(values: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  const sma = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let prevEMA = sma;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(sma);
    } else {
      const ema = (values[i]! - prevEMA) * multiplier + prevEMA;
      result.push(ema);
      prevEMA = ema;
    }
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export interface BollingerBandsResult {
  upper: IndicatorResult[];
  middle: IndicatorResult[];
  lower: IndicatorResult[];
}

export function calculateBollingerBands(
  data: CandlestickData<Time>[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  const prices = data.map(d => d.close);
  const middle = calculateSMA(data, period);
  const upper: IndicatorResult[] = [];
  const lower: IndicatorResult[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push({ time: data[i]!.time, value: NaN });
      lower.push({ time: data[i]!.time, value: NaN });
      continue;
    }

    const slice = prices.slice(i - period + 1, i + 1);
    const avg = middle[i]!.value;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / period;
    const std = Math.sqrt(variance);

    upper.push({ time: data[i]!.time, value: avg + stdDev * std });
    lower.push({ time: data[i]!.time, value: avg - stdDev * std });
  }

  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(
  data: CandlestickData<Time>[],
  period: number = 14
): IndicatorResult[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const bar = data[i]!;

    if (i === 0) {
      trueRanges.push(bar.high - bar.low);
    } else {
      const prevClose = data[i - 1]!.close;
      const tr = Math.max(
        bar.high - bar.low,
        Math.abs(bar.high - prevClose),
        Math.abs(bar.low - prevClose)
      );
      trueRanges.push(tr);
    }
  }

  const atrValues = calculateEMAFromValues(trueRanges, period);
  return data.map((d, i) => ({
    time: d.time,
    value: atrValues[i] || NaN
  }));
}

/**
 * Calculate Stochastic Oscillator
 */
export interface StochasticResult {
  k: IndicatorResult[];
  d: IndicatorResult[];
}

export function calculateStochastic(
  data: CandlestickData<Time>[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  const k: IndicatorResult[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      k.push({ time: data[i]!.time, value: NaN });
      continue;
    }

    const slice = data.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(b => b.high));
    const low = Math.min(...slice.map(b => b.low));
    const close = data[i]!.close;

    const stoch = high === low ? 50 : ((close - low) / (high - low)) * 100;
    k.push({ time: data[i]!.time, value: stoch });
  }

  // Calculate %D (SMA of %K)
  const kValues = k.map(v => isNaN(v.value) ? 0 : v.value);
  const dValues = calculateSMAFromValues(kValues, dPeriod);

  const d = data.map((bar, i) => ({
    time: bar.time,
    value: isNaN(k[i]!.value) ? NaN : dValues[i]!
  }));

  return { k, d };
}

/**
 * Helper function to calculate SMA from raw values
 */
function calculateSMAFromValues(values: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }

    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }

  return result;
}
